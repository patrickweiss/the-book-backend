function gutschriftenFolderScannen(rootFolderId: string, month: string) {
    Logger.log("gutschriftenFolderScannen,rootFolderID:" + rootFolderId + " monat:" + month);
    let BM = new BusinessModel(rootFolderId);
    let geschaeftsjahr = BM.endOfYear().getFullYear();
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
    var gutschriftenFolder = getOrCreateFolder(getOrCreateFolder(rootFolder, "1 Einnahmen"),"4 Gutschriften");
    var monatsOrdner = getOrCreateFolder(gutschriftenFolder, monatsFolderNames[month]);
    var belegIterator = monatsOrdner.getFiles();
    while (belegIterator.hasNext()) {
        var beleg = belegIterator.next();
        Logger.log(beleg.getName);
        wennGutschriftNeuIstEintragen(beleg, datumZuOrdner[month], BM);
    }

    BM.save();
    var result = {
        serverFunction: ServerFunction.gutschriftenFolderScannen,
        GutschriftenD: BM.getGutschriftenTableCache().getData()
    }
    return JSON.stringify(result);

}

function wennGutschriftNeuIstEintragen(beleg, datum, BM: BusinessModel) {
    Logger.log("belegID" + beleg.getId);
    //Ist Beleg schon in Gutschriftentabelle eingetragen?
    var gutschriftInTabellenDaten = BM.getGutschriftenTableCache().getOrCreateHashTable("ID")[beleg.getId()];
    if (gutschriftInTabellenDaten != null) {
        return;
    }

    //Versuch per Sprache umbenannten Beleg zu parsen (Bewirtungsbeleg oder Ausgabe)
    let belegWoerter = beleg.getName().split(" ");

        //neuen Ausgabebeleg eintragen
    neueGutschriftEintragen(beleg, belegWoerter, datum, BM);
    

    return;
}

function neueGutschriftEintragen(beleg, belegWoerter, datum, BM: BusinessModel) {

    let neueGutschriftRow = BM.createGutschrift();
    
    neueGutschriftRow.setFileId(beleg.getId());
    neueGutschriftRow.createLink(beleg.getId(), beleg.getName());
    neueGutschriftRow.setDatum(datum);


    if (belegWoerter.length > 2) {
        //Wenn die Datei nicht umbenannt wurde, wird sie mit aktuellem Dateinamen und richtigem Monat abgelegt
        var index = 1;
        var konto = belegWoerter[0];
        Logger.log("BelegWoerter:" + belegWoerter);
        while (isNaN(belegWoerter[index].charAt(0)) && belegWoerter[index].charAt(0) != "-") {
            konto += " " + belegWoerter[index];
            index++;
        }
        neueGutschriftRow.setBetrag(parseFloat(belegWoerter[index].replace(".", "").replace(",", ".")));
        var prozent = "0%";
        var belegName = beleg.getName();
        Logger.log("Index 19%" + belegName.indexOf("19%"));
        if (belegName.indexOf("19%") != -1) prozent = "19%";
        if (belegName.indexOf("7%") != -1) prozent = "7%";
        if (belegName.indexOf("16%") != -1) prozent = "16%";
        if (belegName.indexOf("5%") != -1) prozent = "5%";
        Logger.log("Prozent:" + prozent);

        neueGutschriftRow.setNettoBetrag(netto(neueGutschriftRow.getBetrag(), prozent));
        neueGutschriftRow.setMehrwertsteuer(vorsteuer(neueGutschriftRow.getBetrag(), prozent));
        neueGutschriftRow.setName(konto);
        var gegenkonto = 'offene Forderung';    
        neueGutschriftRow.setGegenkonto(gegenkonto);
        checkParsedFile(neueGutschriftRow);
        //updateNameFromDataAndTemplate(neueGutschriftRow,DriveConnector.getValueByName(BM.getRootFolderId(),"GutschriftenDatei",oooVersion));
    }
}



