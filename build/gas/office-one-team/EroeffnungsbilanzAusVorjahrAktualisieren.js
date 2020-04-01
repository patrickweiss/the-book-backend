function EroeffnungsbilanzAusVorjahrAktualisieren(rootFolderId, rootFolderNameVorjahr) {
    Logger.log("RootFolderId:" + rootFolderId + ", rootFolderNameVorjahr:" + rootFolderNameVorjahr);
    var BMnow = new BusinessModel(rootFolderId);
    var rootFolderIdLastYear = DriveApp.getFoldersByName(rootFolderNameVorjahr).next().getId();
    var BMlastYear = new BusinessModel(rootFolderIdLastYear);
    KontenStammdatenAusVorjahrAktualisieren(BMlastYear, BMnow);
    AnlagenUndAbschreibungenAusVorjahrAktualisieren(BMlastYear, BMnow);
    OffenePostenAusVorjahrAktualisieren(BMlastYear, BMnow);
    AnfangsbestaendeVonKontenGruppeBestandAktualisieren(BMlastYear, BMnow);
    AnfangsbestandBankkontenAktualisieren(BMlastYear, BMnow);
    BMnow.save();
    var result = {
        serverFunction: ServerFunction.EroeffnungsbilanzAusVorjahrAktualisieren,
        testName: createObjectArray(BMlastYear.getBestandskontenArray())
    };
    return JSON.stringify(result);
}
function KontenStammdatenAusVorjahrAktualisieren(BMlastYear, BMnow) {
    BMlastYear.getKontenArray().forEach(function (element) {
        if (element.getKontentyp() === "Bilanz" || element.getKontentyp() === "GuV") {
            var aktuellesKonto = BMnow.getOrCreateKonto(element.getId());
            aktuellesKonto.setKontentyp(element.getKontentyp());
            aktuellesKonto.setSubtyp(element.getSubtyp());
            aktuellesKonto.setGruppe(element.getGruppe());
            aktuellesKonto.setSKR03(element.getSKR03());
            aktuellesKonto.setExportgruppe(element.getExportgruppe());
            aktuellesKonto.setFormular(element.getFormular());
            aktuellesKonto.setZN(element.getZN());
        }
    });
}
function AnlagenUndAbschreibungenAusVorjahrAktualisieren(BMlastYear, BMnow) {
    var VorsteuerAusVorjahren = 0;
    BMlastYear.getAnlagenAusAusgabenRechnungArray().forEach(function (vorjahrAnlage) {
        //Wenn die Anlage noch nicht bezahlt ist, dann wird sie als "offener Posten" aktualisiert.
        if (vorjahrAnlage.isBezahlt()) {
            AusgabeKopierenOhneBezahltAmZuUeberschreiben(vorjahrAnlage, BMnow, "Anlagen Vorjahre", "Anlage aus einem Vorjahr, die noch nicht verkauft wurde");
            VorsteuerAusVorjahren += vorjahrAnlage.getMehrwertsteuer();
        }
        BMlastYear.getAbschreibungenZuAnlageArray(vorjahrAnlage.getKonto()).forEach(function (vorjahrAbschreibung) {
            var aktuelleAbschreibung = BMnow.getOrCreateAbschreibung(vorjahrAbschreibung.getId());
            aktuelleAbschreibung.setLink(vorjahrAbschreibung.getLink());
            aktuelleAbschreibung.setDatum(vorjahrAbschreibung.getDatum());
            aktuelleAbschreibung.setKonto(vorjahrAbschreibung.getKonto());
            aktuelleAbschreibung.setBetrag(vorjahrAbschreibung.getBetrag());
            aktuelleAbschreibung.setGegenkonto(vorjahrAbschreibung.getGegenkonto());
            aktuelleAbschreibung.setText(vorjahrAbschreibung.getText());
        });
    });
    var vorsteuerKorrektur = BMnow.getOrCreateUmbuchung("EBvorsteuerAusAnlagenVorjahre");
    vorsteuerKorrektur.setDatum(BMlastYear.endOfYear());
    vorsteuerKorrektur.setBezahltAm(BMlastYear.endOfYear());
    vorsteuerKorrektur.setKonto("Vorsteuer");
    vorsteuerKorrektur.setBetrag(-VorsteuerAusVorjahren);
    vorsteuerKorrektur.setGegenkonto("Vorsteuer aus Anlagen Vorjahre");
    vorsteuerKorrektur.setText("Vorsteuer aus Anlagen die vor dem " + BMlastYear.endOfYear() + " bezahlt wurden.");
}
function OffenePostenAusVorjahrAktualisieren(BMlastYear, BMnow) {
    var VorsteuerAusVorjahren = 0;
    BMlastYear.getOffeneAusgabenRechnungArray().forEach(function (offeneAusgabeLastYear) {
        AusgabeKopierenOhneBezahltAmZuUeberschreiben(offeneAusgabeLastYear, BMnow, offeneAusgabeLastYear.getGegenkonto(), "nicht bezahlte Ausgabe aus dem Vorjahr (offener Posten)");
        VorsteuerAusVorjahren += offeneAusgabeLastYear.getMehrwertsteuer();
    });
    BMlastYear.getOffeneBewirtungsbelegeArray().forEach(function (offeneAusgabeLastYear) {
        BewirtungsbelegKopierenOhneBezahltAmZuUeberschreiben(offeneAusgabeLastYear, BMnow, offeneAusgabeLastYear.getGegenkonto(), "nicht bezahlte Ausgabe aus dem Vorjahr (offener Posten)");
        VorsteuerAusVorjahren += offeneAusgabeLastYear.getMehrwertsteuer();
    });
    var vorsteuerKorrektur = BMnow.getOrCreateUmbuchung("EBvorsteuerAusOffeneAusgabenVorjahre");
    vorsteuerKorrektur.setDatum(BMlastYear.endOfYear());
    vorsteuerKorrektur.setBezahltAm(BMlastYear.endOfYear());
    vorsteuerKorrektur.setKonto("Vorsteuer");
    vorsteuerKorrektur.setBetrag(-VorsteuerAusVorjahren);
    vorsteuerKorrektur.setGegenkonto("Vorsteuer Ausgabenrechnungen der Vorjahre");
    vorsteuerKorrektur.setText("Vorsteuer aus Ausgabenrechnung die vor dem " + BMlastYear.endOfYear() + " nicht bezahlt wurden.");
    BMlastYear.getOffeneEinnahmenRechnungArray().forEach(function (offeneRechnungLastYear) {
        RechnungKopierenOhneBezahltAmzuUeberschreiben(offeneRechnungLastYear, BMnow);
    });
    BMlastYear.getOffeneGutschriftenArray().forEach(function (offeneGutschrift) {
        var aktuelleGutschrift = BMnow.getOrCreateGutschrift(offeneGutschrift.getId());
        aktuelleGutschrift.setFileId(offeneGutschrift.getFileId());
        aktuelleGutschrift.setLink(offeneGutschrift.getLink());
        aktuelleGutschrift.setStatus("offener Posten");
        aktuelleGutschrift.setDatum(offeneGutschrift.getDatum());
        aktuelleGutschrift.setNettoBetrag(offeneGutschrift.getNettoBetrag());
        aktuelleGutschrift.setMehrwertsteuer(offeneGutschrift.getMehrwertsteuer());
        aktuelleGutschrift.setBetrag(offeneGutschrift.getBetrag());
        aktuelleGutschrift.setGegenkonto(offeneGutschrift.getGegenkonto());
        aktuelleGutschrift.setDokumententyp(offeneGutschrift.getDokumententyp());
        aktuelleGutschrift.setDateiTyp(offeneGutschrift.getDateiTyp());
    });
    BMlastYear.getOffeneUmbuchungenArray().forEach(function (offeneUmbuchung) {
        var aktuelleUmbuchung = BMnow.getOrCreateUmbuchung(offeneUmbuchung.getId());
        aktuelleUmbuchung.setFileId(offeneUmbuchung.getFileId());
        aktuelleUmbuchung.setLink(offeneUmbuchung.getLink());
        aktuelleUmbuchung.setDatum(offeneUmbuchung.getDatum());
        aktuelleUmbuchung.setKonto(offeneUmbuchung.getKonto());
        aktuelleUmbuchung.setBetrag(offeneUmbuchung.getBetrag());
        aktuelleUmbuchung.setGegenkonto(offeneUmbuchung.getGegenkonto());
        //bezahlt am wird nicht überschrieben
        aktuelleUmbuchung.setText("offener Posten aus Vorjahr");
    });
    //Wenn die letzte UStVA aus dem Vorjahr übernommen wird, weil sie noch nicht bezahlt ist, dann muss der Betrag 
    // von der UStVA wieder abgezogen werden (Bestandskonto mit Anfangesbestand 0)
    // und von den Verbindlichkeiten Umsatzsteuer auch, weil der Betrag dort schon enthalten ist.
    BMnow.getUStVAVorjahr().forEach(function (ustva) {
        var korrekturUStVA = BMnow.getOrCreateUmbuchung("EBustvaOffenePostenKorrekturUStVa" + (new Date(ustva.getDatum()).getMonth() + 1));
        korrekturUStVA.setDatum(BMlastYear.endOfYear());
        korrekturUStVA.setKonto("Geld Vorjahre");
        korrekturUStVA.setBetrag(ustva.getBetrag());
        korrekturUStVA.setGegenkonto("UStVA");
        korrekturUStVA.setBezahltAm(BMlastYear.endOfYear());
        korrekturUStVA.setText("Korrektur des Bestandsfehlers durch offenen UStVA Posten");
        var korrekturVerbindlichkeitenUmsatzsteuer = BMnow.getOrCreateUmbuchung("EBustvaOffenePostenKorrekturVerbindlichkeitenUmsatzsteuer" + (new Date(ustva.getDatum()).getMonth() + 1));
        korrekturVerbindlichkeitenUmsatzsteuer.setDatum(BMlastYear.endOfYear());
        korrekturVerbindlichkeitenUmsatzsteuer.setKonto("Geld Vorjahre");
        korrekturVerbindlichkeitenUmsatzsteuer.setBetrag(-ustva.getBetrag());
        korrekturVerbindlichkeitenUmsatzsteuer.setGegenkonto("Verbindlichkeiten Umsatzsteuer");
        korrekturVerbindlichkeitenUmsatzsteuer.setBezahltAm(BMlastYear.endOfYear());
        korrekturVerbindlichkeitenUmsatzsteuer.setText("Korrektur des Bestandsfehlers durch offenen UStVA Posten");
    });
}
function AnfangsbestaendeVonKontenGruppeBestandAktualisieren(BMlastYear, BMnow) {
    BMlastYear.getBestandskontenArray().forEach(function (bestandsKonto) {
        var anfangsbestandsbuchung = BMnow.getOrCreateUmbuchung("EBAnfangsbestand" + bestandsKonto.getId().toString().replace(/ /g, "-"));
        anfangsbestandsbuchung.setDatum(BMlastYear.endOfYear());
        anfangsbestandsbuchung.setKonto("Geld Vorjahre");
        anfangsbestandsbuchung.setBetrag(bestandsKonto.getSumme());
        anfangsbestandsbuchung.setGegenkonto(bestandsKonto.getId());
        anfangsbestandsbuchung.setBezahltAm(BMlastYear.endOfYear());
        anfangsbestandsbuchung.setText("Anfangsbestand");
    });
}
function AusgabeKopierenOhneBezahltAmZuUeberschreiben(vorjahrAusgabe, BMnow, gegenkonto, text) {
    var aktuelleAnlage = BMnow.getOrCreateAusgabenRechnung(vorjahrAusgabe.getId());
    aktuelleAnlage.setFileId(vorjahrAusgabe.getFileId());
    aktuelleAnlage.setLink(vorjahrAusgabe.getLink());
    aktuelleAnlage.setDatum(vorjahrAusgabe.getDatum());
    //Das bezahlt Datum wird nur übernommen, wenn die Ausgabe im Vorjahr bezahlt wurde. Ansonsten würde eine Bezahlung im aktuellen Jahr durch das Vorjahr überschrieben.
    if (vorjahrAusgabe.isBezahlt())
        aktuelleAnlage.setBezahltAm(vorjahrAusgabe.getBezahltAm());
    aktuelleAnlage.setKonto(vorjahrAusgabe.getKonto());
    aktuelleAnlage.setBetrag(vorjahrAusgabe.getBetrag());
    aktuelleAnlage.setNettoBetrag(vorjahrAusgabe.getNettoBetrag());
    aktuelleAnlage.setMehrwertsteuer(vorjahrAusgabe.getMehrwertsteuer());
    aktuelleAnlage.setGegenkonto(gegenkonto);
    aktuelleAnlage.setText(text);
    aktuelleAnlage.setDateiTyp(vorjahrAusgabe.getDateiTyp());
}
function BewirtungsbelegKopierenOhneBezahltAmZuUeberschreiben(vorjahrAusgabe, BMnow, gegenkonto, text) {
    var aktuellerBewirtungsbeleg = BMnow.getOrCreateBewirtungsbeleg(vorjahrAusgabe.getId());
    aktuellerBewirtungsbeleg.setFileId(vorjahrAusgabe.getFileId());
    aktuellerBewirtungsbeleg.setLink(vorjahrAusgabe.getLink());
    aktuellerBewirtungsbeleg.setDatum(vorjahrAusgabe.getDatum());
    //Das bezahlt Datum wird nur übernommen, wenn die Ausgabe im Vorjahr bezahlt wurde. Ansonsten würde eine Bezahlung im aktuellen Jahr durch das Vorjahr überschrieben.
    //if (vorjahrAusgabe.isBezahlt()) aktuelleAnlage.setBezahltAm(vorjahrAusgabe.getBezahltAm());
    aktuellerBewirtungsbeleg.setKonto(vorjahrAusgabe.getKonto());
    aktuellerBewirtungsbeleg.setBetrag(vorjahrAusgabe.getBetrag());
    aktuellerBewirtungsbeleg.setNettoBetrag(vorjahrAusgabe.getNettoBetrag());
    aktuellerBewirtungsbeleg.setMehrwertsteuer(vorjahrAusgabe.getMehrwertsteuer());
    aktuellerBewirtungsbeleg.setTrinkgeld(vorjahrAusgabe.getTrinkgeld());
    aktuellerBewirtungsbeleg.setAbziehbareBewirtungskosten(vorjahrAusgabe.getAbziehbareBewirtungskosten());
    aktuellerBewirtungsbeleg.setNichtAbziehbareBewirtungskosten(vorjahrAusgabe.getNichtAbziehbareBewirtungskosten());
    aktuellerBewirtungsbeleg.setGegenkonto(gegenkonto);
    aktuellerBewirtungsbeleg.setText(text);
    aktuellerBewirtungsbeleg.setDateiTyp(vorjahrAusgabe.getDateiTyp());
}
function RechnungKopierenOhneBezahltAmzuUeberschreiben(vorjahrRechnung, BMnow) {
    var aktuelleRechnung = BMnow.getOrCreateEinnahmenRechnung(vorjahrRechnung.getId());
    aktuelleRechnung.setFileId(vorjahrRechnung.getFileId());
    aktuelleRechnung.setLink(vorjahrRechnung.getLink());
    aktuelleRechnung.setStatus("offener Posten");
    aktuelleRechnung["setRechnungsNr"](vorjahrRechnung["getRechnungsNr"]());
    aktuelleRechnung.setName(vorjahrRechnung.getName());
    aktuelleRechnung.setGegenkonto(vorjahrRechnung.getGegenkonto());
    aktuelleRechnung.setDatum(vorjahrRechnung.getDatum());
    //bezahlt am wird nicht überschrieben
    aktuelleRechnung.setLeistungvon(vorjahrRechnung.getLeistungvon());
    aktuelleRechnung.setLeistungbis(vorjahrRechnung.getLeistungbis());
    aktuelleRechnung.setNettoBetrag(vorjahrRechnung.getNettoBetrag());
    aktuelleRechnung.setMehrwertsteuer(vorjahrRechnung.getMehrwertsteuer());
    aktuelleRechnung.setBetrag(vorjahrRechnung.getBetrag());
    aktuelleRechnung.setBestellnummer(vorjahrRechnung.getBestellnummer());
    aktuelleRechnung.setAdresszusatz(vorjahrRechnung.getAdresszusatz());
    aktuelleRechnung.setStrasse(vorjahrRechnung.getStrasse());
    aktuelleRechnung.setHausnummer(vorjahrRechnung.getHausnummer());
    aktuelleRechnung.setPLZ(vorjahrRechnung.getPLZ());
    aktuelleRechnung.setOrt(vorjahrRechnung.getOrt());
    aktuelleRechnung.setLand(vorjahrRechnung.getLand());
    aktuelleRechnung.setEMail(vorjahrRechnung.getEMail());
    aktuelleRechnung.setGruss(vorjahrRechnung.getGruss());
    aktuelleRechnung.setAnrede(vorjahrRechnung.getAnrede());
    aktuelleRechnung.setVorname(vorjahrRechnung.getVorname());
    aktuelleRechnung.setNachname(vorjahrRechnung.getNachname());
    aktuelleRechnung.setGeburtsdatum(vorjahrRechnung.getGeburtsdatum());
    aktuelleRechnung.setUStIdNr(vorjahrRechnung.getUStIdNr());
    aktuelleRechnung.setDateiTyp(vorjahrRechnung.getDateiTyp());
    aktuelleRechnung.setDokumententyp(vorjahrRechnung.getDokumententyp());
    aktuelleRechnung.setZahlungsziel(vorjahrRechnung.getZahlungsziel());
}
function AnfangsbestandBankkontenAktualisieren(BMlastYear, BMnow) {
    var bankkonten = BMlastYear.getKontenArray().filter(function (konto) { return konto.isBankkonto(); });
    bankkonten.forEach(function (bankkonto) {
        var bestand = BMlastYear.getBankbestand(bankkonto.getKonto());
        var ebBuchung = BMnow.getOrCreateBankbuchung("EB" + bankkonto.getKonto() + BMnow.endOfYear().getFullYear().toString());
        ebBuchung.setKonto(bankkonto.getKonto());
        ebBuchung.setNr("EB");
        ebBuchung.setDatum(new Date(BMnow.endOfYear().getFullYear(), 0, 1));
        ebBuchung.setBetrag(bestand);
        ebBuchung.setText("Anfangsbestand aus den Vorjahren");
        ebBuchung.setBelegID("keine");
        ebBuchung.setGegenkonto("Bankbestand Vorjahre");
    });
}
function createObjectArray(anlagenArray) {
    var result = [];
    for (var index in anlagenArray) {
        result.push(anlagenArray[index].getKonto());
    }
    return result;
}
