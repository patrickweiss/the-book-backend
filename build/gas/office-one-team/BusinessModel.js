var BelegTyp;
(function (BelegTyp) {
    BelegTyp["Ausgabe"] = "Ausgabe";
    BelegTyp["Bewirtungsbeleg"] = "Bewirtungsbeleg";
    BelegTyp["Rechnung"] = "Rechnung";
    BelegTyp["Gutschrift"] = "Gutschrift";
    BelegTyp["Umbuchung"] = "Umbuchung";
    BelegTyp["Vertrag"] = "Vertrag";
})(BelegTyp || (BelegTyp = {}));
var Type;
(function (Type) {
    Type["INIT"] = "@@INIT";
    Type["UpdateSigninStatus"] = "UpdateSigninStatus";
    Type["ChangeLeaf"] = "ChangeLeaf";
    Type["ChangeBuchungsperiode"] = "ChangeBuchungsperiode";
    Type["ChangeLeafContent"] = "ChangeLeafContent";
    Type["TypePressed"] = "TypePressed";
    Type["KontoSelected"] = "KontoSelected";
    Type["MwstSelected"] = "MwstSelected";
    Type["GegenkontoSelected"] = "GegenkontoSelected";
    Type["PhotoGemacht"] = "PhotoGemacht";
    Type["ServerCall"] = "ServerCall";
    Type["ServerResponse"] = "ServerResponse";
    Type["BelegSpeichern"] = "BelegSpeichern";
    Type["BelegZuBankbuchungZuordnen"] = "BelegZuBankbuchungZuordnen";
    Type["AusgabeBuchen"] = "AusgabeBuchen";
    Type["GutschriftBuchen"] = "GutschriftBuchen";
})(Type || (Type = {}));
var BusinessModel = /** @class */ (function () {
    //Server specific code
    function BusinessModel(rootfolderId) {
        this.rootFolderId = rootfolderId;
    }
    BusinessModel.prototype.endOfYear = function () { return new Date(parseInt(DriveConnector.getValueByName(this.rootFolderId, "KontenJahr", oooVersion).toString()), 11, 31); };
    BusinessModel.prototype.getRootFolderId = function () { return this.rootFolderId; };
    // Generic code for client and server identical 
    BusinessModel.prototype.handleAction = function (action) {
        if (action.type === Type.BelegZuBankbuchungZuordnen) {
            if (action.belegTyp === BelegTyp.Ausgabe)
                this.belegZuordnen(this.getOrCreateAusgabenRechnung(action.belegID), action);
            if (action.belegTyp === BelegTyp.Bewirtungsbeleg)
                this.belegZuordnen(this.getOrCreateBewirtungsbeleg(action.belegID), action);
            if (action.belegTyp === BelegTyp.Rechnung)
                this.belegZuordnen(this.getOrCreateEinnahmenRechnung(action.belegID), action);
            if (action.belegTyp === BelegTyp.Gutschrift)
                this.belegZuordnen(this.getOrCreateGutschrift(action.belegID), action);
            if (action.belegTyp === BelegTyp.Umbuchung)
                this.belegZuordnen(this.getOrCreateUmbuchung(action.belegID), action);
            if (action.belegTyp === BelegTyp.Vertrag)
                this.belegZuordnen(this.getOrCreateVertrag(action.belegID), action);
        }
        if (action.type === Type.AusgabeBuchen) {
            var neueAusgabe = this.createAusgabenRechnung();
            neueAusgabe.setFileId(action.id);
            neueAusgabe.createLink(action.id, action.name);
            neueAusgabe.setDatum(new Date(action.datum));
            if (action.gegenkonto === "bar")
                neueAusgabe.setBezahltAm(new Date(action.datum));
            neueAusgabe.setKonto(action.konto);
            neueAusgabe.setBetrag(action.betrag);
            neueAusgabe.setNettoBetrag(this.netto(action.betrag, action.mwst));
            neueAusgabe.setMehrwertsteuer(this.mehrwertsteuer(action.betrag, action.mwst));
            neueAusgabe.setGegenkonto(action.gegenkonto);
            neueAusgabe.setText(action.name);
            this.createKontoFromAusgabe(action, neueAusgabe);
        }
        if (action.type === Type.GutschriftBuchen) {
            var neueGutschrift = this.createGutschrift();
            neueGutschrift.setFileId(action.id);
            neueGutschrift.createLink(action.id, action.dateiname);
            neueGutschrift.setDatum(new Date(action.datum));
            neueGutschrift.setName(action.name);
            neueGutschrift.setBetrag(action.betrag);
            neueGutschrift.setNettoBetrag(action.betrag - action.mwst);
            neueGutschrift.setMehrwertsteuer(action.mwst);
            neueGutschrift.setGegenkonto(action.gegenkonto);
        }
    };
    BusinessModel.prototype.getEinnahmenRechnungArray = function () { return this.getEinnahmenRechnungTableCache().getRowArray(); };
    BusinessModel.prototype.getOrCreateEinnahmenRechnung = function (id) { return this.getEinnahmenRechnungTableCache().getOrCreateRowById(id); };
    BusinessModel.prototype.getOffeneEinnahmenRechnungArray = function () { return this.getEinnahmenRechnungArray().filter(function (rechnung) { return (rechnung.nichtBezahlt() && rechnung.getId() !== ""); }); };
    BusinessModel.prototype.getRechnungenFuerMonat = function (monat) {
        var _this = this;
        //kopiert aus "Ausgabe" und angepasst!!!
        return this.getEinnahmenRechnungArray().filter(function (ausgabe) {
            var ausgabeDatum = new Date(ausgabe.getDatum());
            return (ausgabeDatum.getFullYear() === _this.endOfYear().getFullYear() && ausgabeDatum.getMonth() === parseInt(monat) - 1);
        });
    };
    BusinessModel.prototype.getImGeschaeftsjahrBezahlteEinnahmenRechnungen = function () { return this.getEinnahmenRechnungArray().filter(function (rechnung) { return rechnung.isBezahlt(); }); };
    BusinessModel.prototype.getGutschriftenArray = function () { return this.getGutschriftenTableCache().getRowArray(); };
    BusinessModel.prototype.createGutschrift = function () { return this.getGutschriftenTableCache().createNewRow(); };
    BusinessModel.prototype.getOrCreateGutschrift = function (id) { return this.getGutschriftenTableCache().getOrCreateRowById(id); };
    BusinessModel.prototype.getOffeneGutschriftenArray = function () { return this.getGutschriftenArray().filter(function (gutschrift) { return (gutschrift.nichtBezahlt() && gutschrift.getId() !== ""); }); };
    BusinessModel.prototype.getGutschriftenFuerMonat = function (monat) {
        var _this = this;
        //kopiert aus "Ausgabe" und angepasst!!!
        return this.getGutschriftenArray().filter(function (ausgabe) {
            var ausgabeDatum = new Date(ausgabe.getDatum());
            return (ausgabeDatum.getFullYear() === _this.endOfYear().getFullYear() && ausgabeDatum.getMonth() === parseInt(monat) - 1);
        });
    };
    BusinessModel.prototype.getImGeschaeftsjahrBezahlteGutschriften = function () { return this.getGutschriftenArray().filter(function (gutschrift) { return gutschrift.isBezahlt(); }); };
    BusinessModel.prototype.getAusgabenRechnungArray = function () { return this.getAusgabenTableCache().getRowArray(); };
    BusinessModel.prototype.createAusgabenRechnung = function () { return this.getAusgabenTableCache().createNewRow(); };
    BusinessModel.prototype.getOrCreateAusgabenRechnung = function (id) { return this.getAusgabenTableCache().getOrCreateRowById(id); };
    BusinessModel.prototype.getOffeneAusgabenRechnungArray = function () { return this.getAusgabenRechnungArray().filter(function (ausgabe) { return (ausgabe.nichtBezahlt() && ausgabe.getId() !== ""); }); };
    BusinessModel.prototype.getAusgabenFuerMonat = function (monat) {
        var _this = this;
        return this.getAusgabenRechnungArray().filter(function (ausgabe) {
            var ausgabeDatum = new Date(ausgabe.getDatum());
            return (ausgabeDatum.getFullYear() === _this.endOfYear().getFullYear() && ausgabeDatum.getMonth() === parseInt(monat) - 1);
        });
    };
    BusinessModel.prototype.getAnlagenAusAusgabenRechnungArray = function () {
        var _this = this;
        var alleAnlagen = this.getAusgabenRechnungArray().filter(function (ausgabe) {
            var konto = _this.getKontenTableCache().getOrCreateRowById(ausgabe.getKonto());
            if (konto === undefined)
                return false;
            return konto.isAnlage();
        });
        return alleAnlagen;
    };
    BusinessModel.prototype.belegZuordnen = function (beleg, action) {
        if (action.bankbuchungID !== "") {
            var bankbuchung = this.getOrCreateBankbuchung(action.bankbuchungID);
            beleg.setBezahltAm(bankbuchung.getDatum());
            bankbuchung.setBelegID(beleg.getId());
            bankbuchung.setLink(beleg.getLink());
            bankbuchung.setGegenkonto(beleg.getGegenkonto());
            if (action.belegTyp != BelegTyp.Vertrag && Math.abs(bankbuchung.getBetrag() - beleg.getBetragMitVorzeichen()) > 0.001) {
                var splitBuchung = this.getBankbuchungenTableCache().createNewRow();
                //Wenn eine eine Zeile im Array erzeugt wird, wird die aktuelle bankbuchung nach unter verschoben
                //um weiterhin auf deren Daten zugreifen zu können, muss ein neuer Wrapper erzeugt werden
                bankbuchung = this.getOrCreateBankbuchung(action.bankbuchungID);
                splitBuchung.setKonto(beleg.getGegenkonto());
                splitBuchung.setNr(bankbuchung.getId());
                splitBuchung.setDatum(bankbuchung.getDatum());
                splitBuchung.setBetrag(bankbuchung.getBetrag() - beleg.getBetragMitVorzeichen());
                splitBuchung.setText(bankbuchung.getText());
                //todo ...
                //throw new Error("Betrag des Beleges stimmt nicht mit Bankbuchungsbetrag überein"); 
            }
        }
        else
            beleg.setBezahltAm(new Date(action.datum));
    };
    BusinessModel.prototype.getBewirtungsbelegeArray = function () { return this.getBewirtungsbelegeTableCache().getRowArray(); };
    BusinessModel.prototype.createBewirtungsbeleg = function () { return this.getBewirtungsbelegeTableCache().createNewRow(); };
    ;
    BusinessModel.prototype.getOrCreateBewirtungsbeleg = function (id) { return this.getBewirtungsbelegeTableCache().getOrCreateRowById(id); };
    BusinessModel.prototype.getOffeneBewirtungsbelegeArray = function () { return this.getBewirtungsbelegeArray().filter(function (bewirtung) { return (bewirtung.nichtBezahlt() && bewirtung.getId() !== ""); }); };
    BusinessModel.prototype.getAbschreibungenArray = function () { return this.getAbschreibungenTableCache().getRowArray(); };
    BusinessModel.prototype.getOrCreateAbschreibung = function (id) { return this.getAbschreibungenTableCache().getOrCreateRowById(id); };
    BusinessModel.prototype.getAbschreibungenZuAnlageArray = function (anlageKonto) {
        var abschreibungenZuAnlageKonto = this.getAbschreibungenArray().filter(function (abschreibung) {
            return abschreibung.getGegenkonto() === anlageKonto;
        });
        return abschreibungenZuAnlageKonto;
    };
    BusinessModel.prototype.getVertraegeArray = function () { return this.getVertraegeTableCache().getRowArray(); };
    BusinessModel.prototype.getOrCreateVertrag = function (id) { return this.getVertraegeTableCache().getOrCreateRowById(id); };
    BusinessModel.prototype.getOffeneVertraegeArray = function () { return this.getVertraegeArray(); };
    ;
    BusinessModel.prototype.getBankbuchungenArray = function () { return this.getBankbuchungenTableCache().getRowArray(); };
    BusinessModel.prototype.getOrCreateBankbuchung = function (id) { return this.getBankbuchungenTableCache().getOrCreateRowById(id); };
    ;
    BusinessModel.prototype.getBankbuchungenNichtZugeordnetArray = function () { return this.getBankbuchungenArray().filter(function (bankbuchung) { return bankbuchung.getId() !== "" && bankbuchung.getBelegID() === ""; }); };
    BusinessModel.prototype.createBankbuchung = function () { return this.getBankbuchungenTableCache().createNewRow(); };
    BusinessModel.prototype.getBankbestand = function (konto) {
        var bestand = 0;
        this.getBankbuchungenArray().filter(function (buchung) { return buchung.getKonto() === konto; }).forEach(function (buchung) { bestand += buchung.getBetrag(); });
        return bestand;
    };
    BusinessModel.prototype.getBankbuchungLatest = function (konto) {
        var latestEntry = undefined;
        this.getBankbuchungenArray().filter(function (buchung) { return buchung.getKonto() === konto && buchung.getNr() !== "EB"; }).forEach(function (buchung) {
            if (latestEntry === undefined)
                latestEntry = buchung;
            if (latestEntry.getId() < buchung.getId())
                latestEntry = buchung;
        });
        return latestEntry;
    };
    BusinessModel.prototype.getUmbuchungenArray = function () { return this.getUmbuchungenTableCache().getRowArray(); };
    BusinessModel.prototype.createUmbuchung = function () { return this.getUmbuchungenTableCache().createNewRow(); };
    ;
    BusinessModel.prototype.getOrCreateUmbuchung = function (id) { return this.getUmbuchungenTableCache().getOrCreateRowById(id); };
    BusinessModel.prototype.getOffeneUmbuchungenArray = function () { return this.getUmbuchungenArray().filter(function (ausgabe) { return (ausgabe.nichtBezahlt() && ausgabe.getId() !== ""); }); };
    BusinessModel.prototype.getKontenArray = function () { return this.getKontenTableCache().getRowArray(); };
    BusinessModel.prototype.getOrCreateKonto = function (id) { return this.getKontenTableCache().getOrCreateRowById(id); };
    BusinessModel.prototype.getBestandskontenArray = function () { return this.getKontenArray().filter(function (konto) { return konto.isBestandskonto(); }); };
    BusinessModel.prototype.getKontenAusgabe = function () { return this.getKontenArray().filter(function (konto) { return (konto.getGruppe().substr(0, 4) === "KoAu"); }); };
    BusinessModel.prototype.getBankkontenAusKontenArray = function () {
        throw new Error("Method not implemented.");
    };
    BusinessModel.prototype.createKontoFromAusgabe = function (action, ausgabe) {
        var konto = this.getOrCreateKonto(action.konto);
        if (konto.getGruppe() !== "")
            return;
        var kontoArt = "Au";
        if (action.kontoArt === "Anlagekonto")
            kontoArt = "An";
        var biggestNumber = 0;
        this.getKontenArray().forEach(function (konto) {
            if (konto.getGruppe().length < 8)
                return;
            if (konto.getGruppe().substr(0, 4) !== ("Ko" + kontoArt))
                return;
            var number = parseInt(konto.getGruppe().substr(4, 4));
            if (number > biggestNumber)
                biggestNumber = number;
        });
        konto.setGruppe("Ko" + kontoArt + padToFour(biggestNumber + 1) + "," + action.mwst);
        konto.setBeispiel(ausgabe.getLink());
        if (kontoArt === "Au") {
            konto.setKontentyp("GuV");
            konto.setSubtyp("Aufwand");
        }
        else {
            konto.setKontentyp("Bilanz");
            konto.setSubtyp("Anlage");
        }
    };
    BusinessModel.prototype.umsatzsteuerJahresabrechnung = function () {
        var _this = this;
        var fealligeUmsatzsteuer = 0;
        this.getImGeschaeftsjahrBezahlteEinnahmenRechnungen().forEach(function (rechnung) { fealligeUmsatzsteuer += rechnung.getMehrwertsteuer(); });
        this.getImGeschaeftsjahrBezahlteGutschriften().forEach(function (rechnung) { fealligeUmsatzsteuer += rechnung.getMehrwertsteuer(); });
        var faelligeMehrwertsteuerUmsatzsteuer = this.getOrCreateUmbuchung("mwstUmsatzsteuerFaelligAufMwSt");
        faelligeMehrwertsteuerUmsatzsteuer.setDatum(this.endOfYear());
        faelligeMehrwertsteuerUmsatzsteuer.setKonto("USt. in Rechnung gestellt");
        faelligeMehrwertsteuerUmsatzsteuer.setBetrag(fealligeUmsatzsteuer);
        faelligeMehrwertsteuerUmsatzsteuer.setGegenkonto("Jahresmehrwertsteuer");
        faelligeMehrwertsteuerUmsatzsteuer.setBezahltAm(this.endOfYear());
        faelligeMehrwertsteuerUmsatzsteuer.setText("Fällige UMSATZSTEUER - Vorsteuer = Fällige Jahresmehrwertsteuer");
        var vorsteuer = 0;
        //Summe der Vorsteuer aller im Geschäftsjahr ausgestellten Ausgaben Rechnungen
        this.getAusgabenRechnungArray().forEach(function (ausgabe) { if (new Date(ausgabe.getDatum()).getFullYear() === _this.endOfYear().getFullYear())
            vorsteuer += ausgabe.getMehrwertsteuer(); });
        //Summe der Vorsteuer aller im Geschäftsjahr ausgestellten Bewirtungs Rechnungen
        this.getBewirtungsbelegeArray().forEach(function (ausgabe) { if (new Date(ausgabe.getDatum()).getFullYear() === _this.endOfYear().getFullYear())
            vorsteuer += ausgabe.getMehrwertsteuer(); });
        var faelligeMehrwertsteuerVorsteuer = this.getOrCreateUmbuchung("mwstVorsteuerAufMwSt");
        faelligeMehrwertsteuerVorsteuer.setDatum(this.endOfYear());
        faelligeMehrwertsteuerVorsteuer.setKonto("Vorsteuer");
        faelligeMehrwertsteuerVorsteuer.setBetrag(-vorsteuer);
        faelligeMehrwertsteuerVorsteuer.setGegenkonto("Jahresmehrwertsteuer");
        faelligeMehrwertsteuerVorsteuer.setBezahltAm(this.endOfYear());
        faelligeMehrwertsteuerVorsteuer.setText("Fällige Umsatzsteuer - VORSTEUER = Fällige Jahresmehrwertsteuer");
        //jahresumsatzsteuer auf Verbindlichkeiten Umsatzsteuer buchen
        var mwstAufVerbindlichkeiten = this.getOrCreateUmbuchung("mwstJahresmehrwertsteuerAusVerbindlichkeiten");
        mwstAufVerbindlichkeiten.setDatum(this.endOfYear());
        mwstAufVerbindlichkeiten.setKonto("Jahresmehrwertsteuer");
        mwstAufVerbindlichkeiten.setBetrag(fealligeUmsatzsteuer - vorsteuer);
        mwstAufVerbindlichkeiten.setGegenkonto("Verbindlichkeiten Umsatzsteuer");
        mwstAufVerbindlichkeiten.setBezahltAm(this.endOfYear());
        mwstAufVerbindlichkeiten.setText("Jahresmehrwertsteuer auf Verbindlichkeiten Umsatzsteuer buchen");
        //UStVA auf Verbindlichekeiten Umsatzsteuer buchen
        var ustva = 0;
        this.getAusgabenRechnungArray().forEach(function (ausgabe) {
            if (new Date(ausgabe.getDatum()).getFullYear() === _this.endOfYear().getFullYear() &&
                ausgabe.getKonto() === "UStVA")
                ustva += ausgabe.getBetrag();
        });
        var mwstUStVAaufVerbindlichkeiten = this.getOrCreateUmbuchung("mwstUStVAaufVerbindlichkeiten");
        mwstUStVAaufVerbindlichkeiten.setDatum(this.endOfYear());
        mwstUStVAaufVerbindlichkeiten.setKonto("UStVA");
        mwstUStVAaufVerbindlichkeiten.setBetrag(-ustva);
        mwstUStVAaufVerbindlichkeiten.setGegenkonto("Verbindlichkeiten Umsatzsteuer");
        mwstUStVAaufVerbindlichkeiten.setBezahltAm(this.endOfYear());
        mwstUStVAaufVerbindlichkeiten.setText("UStVs auf Verbindlichkeiten Umsatzsteuer buchen");
        //SimbaIstUmsatz
        var simbaIstUmsatz = fealligeUmsatzsteuer / 19 * 100;
        var simbaIstUmsatzBuchung = this.getOrCreateUmbuchung("simbaIstUmsatzBuchung");
        simbaIstUmsatzBuchung.setDatum(this.endOfYear());
        simbaIstUmsatzBuchung.setKonto("9310");
        simbaIstUmsatzBuchung.setBetrag(simbaIstUmsatz);
        simbaIstUmsatzBuchung.setGegenkonto("9313");
        simbaIstUmsatzBuchung.setBezahltAm(this.endOfYear());
        simbaIstUmsatzBuchung.setText("Bezahlter Umsatz im Geschaeftsjahr damit Simba Umsatzsteuerautomatik funktioniert");
    };
    BusinessModel.prototype.getUStVAVorjahr = function () {
        var _this = this;
        return this.getAusgabenRechnungArray().filter(function (ausgabe) {
            return (ausgabe.getKonto() === "UStVA" && new Date(ausgabe.getDatum()).getFullYear() === (_this.endOfYear().getFullYear() - 1));
        });
    };
    BusinessModel.prototype.save = function () {
        if (this.ausgabenTableCache !== undefined)
            this.ausgabenTableCache.save();
        if (this.bewirtungsbelegeTableCache !== undefined)
            this.bewirtungsbelegeTableCache.save();
        if (this.kontenTableCache !== undefined)
            this.kontenTableCache.save();
        if (this.abschreibungenTableCache !== undefined)
            this.abschreibungenTableCache.save();
        if (this.bankbuchungenTableCache !== undefined)
            this.bankbuchungenTableCache.save();
        if (this.umbuchungenTableCache !== undefined)
            this.umbuchungenTableCache.save();
        if (this.einnahmenRechnungTableCache !== undefined)
            this.einnahmenRechnungTableCache.save();
        if (this.gutschriftenTableCache !== undefined)
            this.gutschriftenTableCache.save();
        if (this.vertraegeTableCache !== undefined)
            this.vertraegeTableCache.save();
    };
    BusinessModel.prototype.getEinnahmenRechnungTableCache = function () {
        if (this.einnahmenRechnungTableCache === undefined)
            this.einnahmenRechnungTableCache = new EinnahmenRechnungTableCache(this.getRootFolderId());
        return this.einnahmenRechnungTableCache;
    };
    BusinessModel.prototype.getGutschriftenTableCache = function () {
        if (this.gutschriftenTableCache === undefined)
            this.gutschriftenTableCache = new GutschriftenTableCache(this.getRootFolderId());
        return this.gutschriftenTableCache;
    };
    BusinessModel.prototype.getAusgabenTableCache = function () {
        if (this.ausgabenTableCache === undefined)
            this.ausgabenTableCache = new AusgabenTableCache(this.getRootFolderId());
        return this.ausgabenTableCache;
    };
    BusinessModel.prototype.getBewirtungsbelegeTableCache = function () {
        if (this.bewirtungsbelegeTableCache === undefined)
            this.bewirtungsbelegeTableCache = new BewirtungsbelegeTableCache(this.getRootFolderId());
        return this.bewirtungsbelegeTableCache;
    };
    BusinessModel.prototype.getAbschreibungenTableCache = function () {
        if (this.abschreibungenTableCache === undefined)
            this.abschreibungenTableCache = new AbschreibungenTableCache(this.getRootFolderId());
        return this.abschreibungenTableCache;
    };
    BusinessModel.prototype.getVertraegeTableCache = function () {
        if (this.vertraegeTableCache === undefined)
            this.vertraegeTableCache = new VertraegeTableCache(this.getRootFolderId());
        return this.vertraegeTableCache;
    };
    BusinessModel.prototype.getBankbuchungenTableCache = function () {
        if (this.bankbuchungenTableCache === undefined)
            this.bankbuchungenTableCache = new BankbuchungenTableCache(this.getRootFolderId());
        return this.bankbuchungenTableCache;
    };
    BusinessModel.prototype.getUmbuchungenTableCache = function () {
        if (this.umbuchungenTableCache === undefined)
            this.umbuchungenTableCache = new UmbuchungenTableCache(this.getRootFolderId());
        return this.umbuchungenTableCache;
    };
    BusinessModel.prototype.getKontenTableCache = function () {
        if (this.kontenTableCache === undefined)
            this.kontenTableCache = new KontenTableCache(this.getRootFolderId());
        return this.kontenTableCache;
    };
    BusinessModel.prototype.netto = function (brutto, prozent) {
        if (prozent == "19%")
            return Math.round(brutto / 1.19 * 100) / 100;
        if (prozent == "7%")
            return Math.round(brutto / 1.07 * 100) / 100;
        if (prozent == "0%")
            return brutto;
        return brutto;
    };
    BusinessModel.prototype.mehrwertsteuer = function (brutto, prozent) {
        return brutto - this.netto(brutto, prozent);
    };
    BusinessModel.prototype.germanDate = function (datum) { return datum.getDate() + "." + (datum.getMonth() + 1) + "." + datum.getFullYear(); };
    return BusinessModel;
}());
function padToFour(number) { return ("000" + number).slice(-4); }
function moneyString(number) { return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number); }
