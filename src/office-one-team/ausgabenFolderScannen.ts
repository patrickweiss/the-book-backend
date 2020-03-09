function ausgabenFolderScannen(rootFolderId: string, month: string) {
    Logger.log("ausgabenFolderScannen,rootFolderID:" + rootFolderId + " monat:" + month);
    let BM = new BusinessModel(rootFolderId);
    let geschaeftsjahr = BM.endOfYear().getFullYear();
    let ausgabenFolderNames = {
        '01': '(01) Januar',
        '02': '(02) Februar',
        '03': '(03) März',
        '04': '(04) April',
        '05': '(05) Mai',
        '06': '(06) Juni',
        '07': '(07) Juli',
        '08': '(08) August',
        '09': '(09) September',
        '10': '(10) Oktober',
        '11': '(11) November',
        '12': '(12) Dezember'
    }
    var datumZuOrdner = {
        "01": new Date(geschaeftsjahr, 0, 1),
        "02": new Date(geschaeftsjahr, 1, 1),
        "03": new Date(geschaeftsjahr, 2, 1),
        "04": new Date(geschaeftsjahr, 3, 1),
        "05": new Date(geschaeftsjahr, 4, 1),
        "06": new Date(geschaeftsjahr, 5, 1),
        "07": new Date(geschaeftsjahr, 6, 1),
        "08": new Date(geschaeftsjahr, 7, 1),
        "09": new Date(geschaeftsjahr, 8, 1),
        "10": new Date(geschaeftsjahr, 9, 1),
        "11": new Date(geschaeftsjahr, 10, 1),
        "12": new Date(geschaeftsjahr, 11, 1),
    }
    var rootFolder = DriveApp.getFolderById(rootFolderId);
    var ausgabenFolder = getOrCreateFolder(rootFolder, "2 Ausgaben");
    var monatsOrdner = getOrCreateFolder(ausgabenFolder, ausgabenFolderNames[month]);
    var belegIterator = monatsOrdner.getFiles();
    while (belegIterator.hasNext()) {
        var beleg = belegIterator.next();
        Logger.log(beleg.getName);
        wennBelegNeuIstEintragen(beleg, datumZuOrdner[month], BM);
    }

    BM.save();
    var result = {
        serverFunction: ServerFunction.ausgabenFolderScannen,
        AusgabenD: BM.getAusgabenTableCache().getData(),
        BewirtungsbelegeD: BM.getBewirtungsbelegeTableCache().getData()
    }
    return JSON.stringify(result);

}

function wennBelegNeuIstEintragen(beleg, datum, BM: BusinessModel) {
    Logger.log("belegID" + beleg.getId);
    //Ist Beleg schon in Ausgabetabelle eingetragen?
    var ausgabeDaten = BM.getAusgabenTableCache().getOrCreateHashTable("ID")[beleg.getId()];
    if (ausgabeDaten != null) {
        return;
    }


    //Ist Beleg schon in Bewirtungsbelegetabelle eingetragen?
    var bewirtungsbelegDaten = BM.getBewirtungsbelegeTableCache().getOrCreateHashTable("ID")[beleg.getId()];
    if (bewirtungsbelegDaten != null) {
        return;
    }


    //Versuch per Sprache umbenannten Beleg zu parsen (Bewirtungsbeleg oder Ausgabe)
    let belegWoerter = beleg.getName().split(" ");
    if (belegWoerter.length > 2) {
        if (belegWoerter[0] == "Bewirtungsbeleg" || belegWoerter[0] == "Geschäftsessen") {
            neuenBewirtungsbelegEintragen(beleg, belegWoerter, datum, BM);
            return;
        }

        //neuen Ausgabebeleg eintragen
        neueAusgabeEintragen(beleg, belegWoerter, datum, BM);
        return;
    }

    //neuen, nicht umbenannten Beleg eintragen
    //   var neueAusgabeRow = a.ausgabenCache.newRow();
    let neueAusgabeRow = BM.createAusgabenRechnung();
    neueAusgabeRow.setFileId(beleg.getId());
    neueAusgabeRow.createLink(beleg.getId(), beleg.getName());
    neueAusgabeRow.setDatum(datum);
    neueAusgabeRow.setBezahltAm(datum);
    neueAusgabeRow.setKonto("nicht zugeordnet");
    neueAusgabeRow.setText(beleg.getName());
    return;
}

function updateNameFromDataAndTemplate(ausgabeRow:Buchung, template:string) {

    var columnArray = template.split("_");
    var dateiName = "✔_";
    var variableText;

    for (var index in columnArray) {
        //var dataCell = ausgabeDaten.getValue(columnArray[index]);
        var spaltenName = columnArray[index].split(".")[0]
        variableText = ausgabeRow.getValueStringOrNumber(spaltenName);
        dateiName += variableText + "_";
    }
    dateiName = dateiName.slice(0, -1);
    var alterName = ausgabeRow.getLink().split("\"")[3];

    if (alterName !== dateiName) {
        var datei = DriveApp.getFileById(ausgabeRow.getValue("ID"));
        datei.setName(dateiName);
        ausgabeRow.createLink(ausgabeRow.getValue("ID"),dateiName);
        var datum = new Date();
        datei.setDescription(datei.getDescription() + " " + datum.getFullYear() + "." + (datum.getMonth() + 1) + "." + datum.getDay() + ":" + alterName);
    }
}



function neuenBewirtungsbelegEintragen(beleg, belegWoerter, monat, BM: BusinessModel) {


    if (belegWoerter.length > 2) {
        let neuerBewirtungsbelegRow = BM.createBewirtungsbeleg();
        neuerBewirtungsbelegRow.setFileId(beleg.getId());
        neuerBewirtungsbelegRow.setDatum(monat);
        neuerBewirtungsbelegRow.setBezahltAm(monat);

        var index = 1;
        var konto = "";
        while (isNaN(belegWoerter[index].charAt(0))) index++;

        neuerBewirtungsbelegRow.setBetrag(parseFloat(belegWoerter[index].replace(".", "").replace(",", ".")));
        konto = belegWoerter[0];

        while (index > 1) {
            index--;
            konto += " " + belegWoerter[index];
        }

        neuerBewirtungsbelegRow.setKonto(konto);
        neuerBewirtungsbelegRow.setGegenkonto('bar');
        neuerBewirtungsbelegRow.setText(beleg.getName());
        neuerBewirtungsbelegRow.setNettoBetrag(round2Fixed(neuerBewirtungsbelegRow.getValue("brutto Betrag") / 1.19));
        neuerBewirtungsbelegRow.setMehrwertsteuer(neuerBewirtungsbelegRow.getValue("brutto Betrag") - neuerBewirtungsbelegRow.getValue("netto Betrag"));
        neuerBewirtungsbelegRow.setAbziehbareBewirtungskosten(round2Fixed(neuerBewirtungsbelegRow.getValue("netto Betrag") * 0.7));
        neuerBewirtungsbelegRow.setNichtAbziehbareBewirtungskosten(neuerBewirtungsbelegRow.getValue("netto Betrag") - neuerBewirtungsbelegRow.getValue("abziehbare Bewirtungskosten"));


        var neuerDateiname = "✔ " + beleg.getName();
        beleg.setName(neuerDateiname.replace(" ", "_"));
        neuerBewirtungsbelegRow.createLink(beleg.getId, neuerDateiname.replace(" ", "_"));
    }

}

function round2Fixed(value) {
    value = +value;

    if (isNaN(value))
        return NaN;

    // Shift
    value = value.toString().split('e');
    value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + 2) : 2)));

    // Shift back
    value = value.toString().split('e');
    return Number((+(value[0] + 'e' + (value[1] ? (+value[1] - 2) : -2))).toFixed(2));
}

function neueAusgabeEintragen(beleg, belegWoerter, datum, BM: BusinessModel) {

    let neueAusgabeRow = BM.createAusgabenRechnung();
    neueAusgabeRow.setFileId(beleg.getId());
    neueAusgabeRow.createLink(beleg.getId(), beleg.getName());
    neueAusgabeRow.setDatum(datum);


    if (belegWoerter.length > 2) {
        //Wenn die Datei nicht umbenannt wurde, wird sie mit aktuellem Dateinamen und richtigem Monat abgelegt
        var index = 1;
        var konto = belegWoerter[0];
        Logger.log("BelegWoerter:" + belegWoerter);
        while (isNaN(belegWoerter[index].charAt(0)) && belegWoerter[index].charAt(0) != "-") {
            konto += " " + belegWoerter[index];
            index++;
        }
        neueAusgabeRow.setBetrag(parseFloat(belegWoerter[index].replace(".", "").replace(",", ".")));
        var prozent = "0%";
        var belegName = beleg.getName();
        Logger.log("Index 19%" + belegName.indexOf("19%"));
        if (belegName.indexOf("19%") != -1) prozent = "19%";
        if (belegName.indexOf("7%") != -1) prozent = "7%";
        Logger.log("Prozent:" + prozent);

        neueAusgabeRow.setNettoBetrag(netto(neueAusgabeRow.getValue("brutto Betrag"), prozent));
        neueAusgabeRow.setMehrwertsteuer(vorsteuer(neueAusgabeRow.getValue("brutto Betrag"), prozent));

        neueAusgabeRow.setKonto(konto);

        var gegenkonto = 'bar';
        var bezahltAm = datum;
        if (belegName.indexOf("bar") != -1 || belegName.indexOf("Bar") != -1) gegenkonto = "bar";
        if (belegName.indexOf("auf Rechnung") != -1 || belegName.indexOf("Auf Rechnung") != -1) { gegenkonto = "auf Rechnung"; bezahltAm = ""; }
        if (belegName.indexOf("mit Karte") != -1 || belegName.indexOf("Mit Karte") != -1) { gegenkonto = "mit Karte"; bezahltAm = ""; }
        if (belegName.indexOf("Verbindlichkeiten Umsatzsteuer") != -1 ) { gegenkonto = "Verbindlichkeiten Umsatzsteuer"; bezahltAm = ""; }
        

        neueAusgabeRow.setBezahltAm(bezahltAm);

        neueAusgabeRow.setGegenkonto(gegenkonto);
        var ausgabeText = beleg.getName();

        neueAusgabeRow.setText(ausgabeText);
        updateNameFromDataAndTemplate(neueAusgabeRow,DriveConnector.getValueByName(BM.getRootFolderId(),"AusgabenDatei",oooVersion));
    }
}

function netto(brutto, prozent) {
    if (prozent == "19%") return Math.round(brutto / 1.19 * 100) / 100;
    if (prozent == "7%") return Math.round(brutto / 1.07 * 100) / 100;
    if (prozent == "0%") return brutto;
    return brutto;
}
function vorsteuer(brutto, prozent) {
    return brutto - netto(brutto, prozent);
}


