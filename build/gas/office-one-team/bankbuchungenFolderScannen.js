function bankbuchungenFolderScannen(rootFolderId, month) {
    Logger.log("bankbuchungenFolderScannen,rootFolderID:" + rootFolderId + " monat:" + month);
    var BM = new BusinessModel(rootFolderId);
    var rootFolder = DriveApp.getFolderById(rootFolderId);
    var bankkontenFolder = getOrCreateFolder(rootFolder, "3 Bankkonten");
    var monthFolder = getOrCreateFolder(bankkontenFolder, months[month]);
    var belegIterator = monthFolder.getFiles();
    var vorgemerkteBuchungen = {}; //das macht natürlich gar keinen Sinn als Rückgabewert!!! bei Refactoring umbauen
    while (belegIterator.hasNext()) {
        var beleg = belegIterator.next();
        Logger.log(beleg.getName());
        var belegDaten = beleg.getName().split("_");
        if (belegDaten[0] !== "✔") {
            var konto = belegDaten[0];
            if (konto === "Bank1" || konto === "Bank2" || konto === "Kreditkarte1") {
                vorgemerkteBuchungen[beleg.getName()] = bankbuchungenImportieren(beleg, BM);
            }
            else
                vorgemerkteBuchungen[beleg.getName()] = gehaltsbuchungenImportieren(beleg, BM);
        }
    }
    BM.save();
    var result = {
        serverFunction: ServerFunction.bankbuchungenFolderScannen,
        BankbuchungenD: BM.getBankbuchungenTableCache().getData(),
        vorgemerkteBuchungen: vorgemerkteBuchungen
    };
    return JSON.stringify(result);
}
function gehaltsbuchungenImportieren(beleg, BM) {
    // let belegDaten = beleg.getName().split("_");
    // let konto = belegDaten[0];
    var datenString = beleg.getBlob().getDataAsString("ISO-8859-1");
    // @ts-ignore
    var buchungenArray = O1.CSVToArray(datenString, ";");
    var gehaltskonten = {
        "3790": "Gehaltsverbindlichkeiten",
        "6027": "Bruttogehalt Vorstand",
        "3730": "Lohnsteuer",
        "3720": "netto Gehalt Vorstand"
    };
    buchungenArray.forEach(function (element) {
        if (element[0] !== "MDNr" && element[6] !== undefined && element[7] !== "6027") {
            var neueUmbuchung = BM.createUmbuchung();
            neueUmbuchung.setFileId(beleg.getId());
            neueUmbuchung.createLink(beleg.getId(), beleg.getName());
            neueUmbuchung.setDatum(parseDateFromCSVString(element[15]));
            neueUmbuchung.setKonto(gehaltskonten[element[8]]);
            neueUmbuchung.setBetrag(parseFloat(element[6].replace(",", ".")));
            neueUmbuchung.setGegenkonto(gehaltskonten[element[7]]);
            neueUmbuchung.setText(element[4]);
        }
    });
    beleg.setName("✔_" + beleg.getName());
    return "Gehaltsbuchungen";
}
function bankbuchungenImportieren(beleg, BM) {
    var geschaeftsjahr = BM.endOfYear().getFullYear();
    var belegDaten = beleg.getName().split("_");
    if (belegDaten[0] === "✔")
        return;
    var konto = belegDaten[0];
    Logger.log("Datei:" + beleg.getName());
    var datenString = beleg.getBlob().getDataAsString("ISO-8859-1");
    var neuerBankbestand = parseFloat(beleg.getName().split("_")[1].replace(".", "").replace(",", "."));
    var alterBankbestand = BM.getBankbestand(konto);
    var aktuellerBankbestand = alterBankbestand;
    Logger.log("alter Bankbestand:" + alterBankbestand);
    // @ts-ignore
    var datenArray = O1.CSVToArray(datenString, ";");
    var transactionArray = datenArray.map(function (element) {
        return new CSVTransaction(element, konto, geschaeftsjahr);
    });
    if (konto === "Kreditkarte1")
        transactionArray.reverse();
    Logger.log("erste Transaktion, Betrag:" + transactionArray[0].Betrag + " Datum:" + transactionArray[0].WertstellungsDatum + " Text:" + transactionArray[0].Buchungstext + " Valid:" + transactionArray[0].isValid);
    //Rausfinden bis zu welcher Buchung importiert werden muss. 
    //1. Bedingung: neuer Bankbestand stimmt
    //2. Bedingung: die nächste Buchung, welche nach der Buchung kommt nach der der Bankbestand stimmt, muss schon vorhanden sein
    //Vorsicht: damit ist nur ziemlich sicher, aber nicht 100% sicher, dass alle neuen Buchungen importiert wurden! 
    //Aus reinem Zufall kann es immer sein, dass der Bankbestand stimmt und an demselben Tag können 2 Buchungen komplett identisch sein!!! 
    var letzteBuchung = BM.getBankbuchungLatest(konto);
    //durch das Array iterieren:
    var index = "";
    var vorgemerkteBuchungen = 0;
    if (letzteBuchung !== undefined) {
        Logger.log("letzte Buchung Id:" + letzteBuchung.getId());
        var foundFlag = false;
        for (index in transactionArray) {
            var transaction = transactionArray[index];
            var betrag = 0;
            //Wenn die beiden Datumsspalten und die Umsatzart leer sind, dann ist der Umsatz nur vorgemerkt und nicht gebucht. 
            //Um den Endbestand zu bestimmen, muss die Buchung berücksichtigt werden, aber gebucht werden darf sie nicht (Datum fehlt, und vielleicht wird sie nie gebucht)
            if (transaction.isPlanned) {
                betrag = transaction.Betrag;
                vorgemerkteBuchungen += betrag;
            }
            if (transaction.isValid) {
                var datumNeu = transaction.WertstellungsDatum;
                var buchungsText = transaction.Buchungstext;
                betrag = transaction.Betrag;
                //Wenn der Bestand nach der vorigen Buchung stimmt und die aktuelle Buchung identisch zur letzten gespeicherten Buchung ist, dann gehe ich davon aus,
                //dass die aktuelle Buchung und die zuletzt gespeicherte identisch sind
                Logger.log(index + "Datum:" + datumNeu + " Betrag:" + betrag + " Saldendifferenz:" + Math.abs(aktuellerBankbestand - neuerBankbestand));
                Logger.log((Math.abs(aktuellerBankbestand - neuerBankbestand) < 0.0001).toString() + " " +
                    (datumNeu.toString() === new Date(letzteBuchung.getDatum()).toString()) + " " +
                    (betrag === letzteBuchung.getBetrag()).toString() + " " +
                    (buchungsText === letzteBuchung.getText()).toString());
                if ((Math.abs(aktuellerBankbestand - neuerBankbestand) < 0.0001) && datumNeu.toString() == new Date(letzteBuchung.getDatum()).toString() && betrag === letzteBuchung.getBetrag() && buchungsText === letzteBuchung.getText()) {
                    foundFlag = true;
                    break;
                }
            }
            aktuellerBankbestand += betrag;
        }
        //Wenn die erste Buchung aus dem Vorjahr ist, dann kann die letzte importierte Buchung nicht gefunden werden (ist im aktuellen Jahr nicht vorhanden)
        //Wenn der der Betrag stimmt, ist trotzdem alles ok
        if ((Math.abs(aktuellerBankbestand - neuerBankbestand) < 0.0001) &&
            transactionArray[transactionArray.length - 2].WertstellungsDatum.getFullYear() < geschaeftsjahr)
            foundFlag = true;
        //bei Kreditkarte zunaechst keine Prüfung auf letzte Buchung
        // if (konto==="Kreditkarte1")foundFlag=true;
        //falls alle Buchungen eingelesen wurden, die letzte Buchung aber nicht identifiziert werden konnte ...
        if (foundFlag === false)
            throw new Error("Die Buchungen der CSV-Datei " + beleg.getName() +
                "führen nicht zum Endbestand von " + neuerBankbestand +
                "sondern: " + aktuellerBankbestand +
                "Datum erste Banktransaktion" + transactionArray[transactionArray.length - 2].datumString +
                "Geschäftsjahr" + geschaeftsjahr);
    }
    else {
        //Dieses Konto wurde noch nie importiert
        //Die erste Buchung erfolgt daher mit dem aus dem Endbestand berechneten Anfangsbestand
        var anfangsbestand = neuerBankbestand;
        var erstesDatum = void 0;
        for (index in transactionArray) {
            var transaction = transactionArray[index];
            if (transaction.isValid) {
                var datumNeu = transaction.WertstellungsDatum;
                erstesDatum = datumNeu;
                var betrag = transaction.Betrag;
                anfangsbestand -= betrag;
            }
        }
        var bankbuchung = BM.createBankbuchung();
        bankbuchung.setKonto(konto);
        bankbuchung.setNr(new Date().toISOString());
        bankbuchung.setDatum(erstesDatum);
        bankbuchung.setBetrag(anfangsbestand);
        bankbuchung.setText("Anfangsbestand");
        bankbuchung.setGegenkontoBank("Anfangsbestand");
        bankbuchung.setBelegID("Anfangsbestand");
        bankbuchung.setLink("Anfangsbestand");
        bankbuchung.setGegenkonto("Anfangsbestand");
    }
    //jetzt werden die neuen Buchungen rueckwaerts hinzugefuegt, damit die neueste Buchung am Ende oben steht
    var elementIndex = parseInt(index) - 1;
    while (elementIndex > 0) {
        var transaction = transactionArray[elementIndex];
        if (transaction.isValid) {
            var datumNeu = transaction.WertstellungsDatum;
            var bankbuchung = BM.createBankbuchung();
            bankbuchung.setKonto(konto);
            bankbuchung.setNr(new Date().toISOString());
            bankbuchung.setDatum(datumNeu);
            bankbuchung.setBetrag(transaction.Betrag);
            bankbuchung.setText(transaction.Buchungstext);
            bankbuchung.setGegenkontoBank("");
        }
        elementIndex--;
    }
    beleg.setName("✔_" + beleg.getName());
    return vorgemerkteBuchungen;
}
var CSVTransaction = /** @class */ (function () {
    function CSVTransaction(element, konto, geschaeftsjahr) {
        var datumString = "";
        if (konto === "Bank1" || konto === "Bank2") {
            this.isValid = (element[1] != "" && element[1] != "Wertstellung" && element[1] != undefined);
            this.isPlanned = element[0] === "" && element[1] === "" && element[2] === "" && element[4] !== "";
            if (this.isPlanned || this.isValid)
                this.Betrag = parseFloat(element[4].replace(",", "."));
            if (this.isValid) {
                datumString = element[1];
                this.Buchungstext = element[3];
            }
        }
        else {
            Logger.log(element[0] + " " + element[5]);
            this.isValid = (element[1] != "" && element[1] != "Kaufdatum" && element[1] != undefined && element[5] != undefined);
            this.isPlanned = false;
            if (this.isValid) {
                this.Betrag = parseFloat(element[5].replace(",", "."));
                datumString = element[1];
                if (element[6] === "S")
                    this.Betrag = -this.Betrag;
                this.Buchungstext = element[3];
            }
        }
        var datum = datumString.split(".");
        this.datumString = datumString;
        this.WertstellungsDatum = new Date(parseInt(datum[2], 10), parseInt(datum[1], 10) - 1, parseInt(datum[0], 10));
        //prüfen, ob Transaktion im aktuellen Geschäftsjahr ist
        if (geschaeftsjahr !== this.WertstellungsDatum.getFullYear()) {
            this.isValid = false;
            this.isPlanned = false;
        }
    }
    return CSVTransaction;
}());
function parseDateFromCSVString(date) {
    var datum = date.split(".");
    return new Date(parseInt(datum[2], 10), parseInt(datum[1], 10) - 1, parseInt(datum[0], 10));
}
