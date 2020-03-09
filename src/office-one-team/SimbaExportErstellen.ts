function SimbaExportErstellen(rootFolderId: string) {
  var thisSpreadsheet = DriveConnector.getSpreadsheet(rootFolderId, "KontenD", oooVersion);
  // @ts-ignore
  var a = O1.getAgentForSpreadsheet(thisSpreadsheet, "csvExportAktualisieren");

  //  var agent = OfficeOne.createAgent(SpreadsheetApp.getActive());
  //var logrange = saw.logbeginn("Auswertungen aktualisieren");
  try {
    a.geschaeftsjahrString = thisSpreadsheet.getRangeByName("KontenJahr").getValue();
    a.geschaeftsjahr = new Date(a.geschaeftsjahrString, 0, 1);
    kontenSpaltenSetzen(a);

    //Alle Buchungen werden gelöscht
    // @ts-ignore
    a.csvCache = O1.loadTableCache(thisSpreadsheet.getId(), "CSVExport");
    a.csvCache.deleteData();
    // @ts-ignore
    a.kontenCache = O1.loadTableCache(thisSpreadsheet.getId(), "Konten");

    a.kontenHashTableRows = a.kontenCache.createHashTable("Konto");

    // Daten aus Tabellen mit Geschäftsvorfällen eintragen 
    ausgabenCSV(a);

    bewirtungsbelegeCSV(a);
    verpflegungsmehraufwendungenCSV(a);
    //gehaltsbuchungenEintragen(a);
    rechnungenCSV(a);
    gutschriftenCSV(a);
    //euRechnungenEintragen(a);
    umbuchungenCSV(a);
    bankbuchungenCSV(a);
    abschreibungenCSV(a);
    negativeBetraegeTransformierenCSV(a);
    kontenStammdatenErgaenzenCSV(a);


    //EB Buchungen fuer Simba anpassen
    for (var index in a.csvCache.dataArray) {
      var buchungRow = a.csvCache.getRowByIndex(index);
      if (buchungRow.getValue("Datum") < a.geschaeftsjahr) ebBuchungAnpassen(a, buchungRow);
    }

    //Buchungen in CSV-Dateien Exportieren

    var buchungenCSV = {};
    for (var index in a.csvCache.dataArray) {
      var csvRow = a.csvCache.getRowByIndex(index);
      if (csvRow.getValue("Exportgruppe") != "") {
        if (buchungenCSV[csvRow.getValue("Exportgruppe")] === undefined) buchungenCSV[csvRow.getValue("Exportgruppe")] = "Datum;Betrag;Konto (Soll);Gegenkonto (Haben);Buchungstext;Automatiksperre\n";
        var datum = isoDate(csvRow.getValue("Datum"));
        buchungenCSV[csvRow.getValue("Exportgruppe")] +=
          datum + ";" +
          formatBetrag(csvRow.getValue("Betrag")) + ";" +
          csvRow.getValue("SKR03 (Soll)") + ";" +
          csvRow.getValue("SKR03 (Haben)") + ";" +
          csvRow.getValue("Buchungstext") + ";1\n";
      }
    }

    for (var exportGruppe in buchungenCSV) {
      if (buchungenCSV.hasOwnProperty(exportGruppe)) {
        var exportCSV = buchungenCSV[exportGruppe];
        // @ts-ignore
        DriveApp.getFolderById(a.officeRootId()).createFile(new Date().toISOString() + ":" + exportGruppe + ".csv", exportCSV, MimeType.CSV);
      }
    }
    a.csvCache.save();
    a.logEnde();
    // saw.logende(logrange);
  } catch (e) {
    a.logError(e)
  }
  var result = {
    serverFunction: ServerFunction.BuchungenFuerUmsatzsteuerBerechnenUndEintragen,
  }
  return JSON.stringify(result);
}

function formatBetrag(betrag) {
  return betrag.toFixed(2).toString().replace(".", ",");
}

function isoDate(date) {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [day, month, year].join('.');
}
function ebBuchungAnpassen(a, csvRow) {
  csvRow.setValue("Exportgruppe", "EB-Werte");
  csvRow.setValue("Datum", a.geschaeftsjahr);
  if (parseInt(csvRow.getValue("SKR03 (Soll)")) >= 2000 && parseInt(csvRow.getValue("SKR03 (Soll)")) !== 2868) csvRow.setValue("SKR03 (Soll)", 9000);
  if (parseInt(csvRow.getValue("SKR03 (Haben)")) >= 2000) csvRow.setValue("SKR03 (Haben)", 9000);
  if (parseInt(csvRow.getValue("SKR03 (Soll)")) == 1766) csvRow.setValue("SKR03 (Soll)", 9000);
  if (parseInt(csvRow.getValue("SKR03 (Haben)")) == 1766) csvRow.setValue("SKR03 (Haben)", 9000);
}

function kontenSpaltenSetzen(a) {
  a.kontenSpalten = {
    "1": "Januar",
    "2": "Februar",
    "3": "März",
    "4": "April",
    "5": "Mai",
    "6": "Juni",
    "7": "Juli",
    "8": "August",
    "9": "September",
    "10": "Oktober",
    "11": "November",
    "12": "Dezember",
    "-1": (a.geschaeftsjahrString - 1).toString(),
    "-2": (a.geschaeftsjahrString - 2).toString(),
    "-3": (a.geschaeftsjahrString - 3).toString(),
    "-4": "Vorjahre",
    "13": (a.geschaeftsjahrString + 1).toString(),
  };
}
function ausgabenCSV(a) {
  var ausgabenID = a.spreadsheet.getRangeByName("AusgabenID").getValue();
  // @ts-ignore
  a.ausgabenLinkFormula = saw.linkFormula(ausgabenID);
  // @ts-ignore
  a.ausgabenCache = O1.loadTableCache(ausgabenID, "Ausgaben");
  if (a.ausgabenCache.getRowByIndex(0).getValue("Datum") == "") return;
  a.quelle = a.ausgabenLinkFormula;


  for (var index in a.ausgabenCache.dataArray) {
    var ausgabenRow = a.ausgabenCache.getRowByIndex(index);

    //Ausgabe hinzufügen ----------------------------------------------------------------
    if (ausgabenRow.getValue("netto Betrag") != 0) {
      //Der offene Posten aus der UStVA darf nicht nach Simba exportiert werden:
      if (!(ausgabenRow.getValue("Konto") === "UStVA" && ausgabenRow.getValue("Datum").getFullYear() === a.geschaeftsjahr.getFullYear() - 1)) {
        var neueBuchung = a.csvCache.newRow();
        neueBuchung.setValue("Datum", ausgabenRow.getValue("Datum"));

        neueBuchung.setValue("Betrag", ausgabenRow.getValue("netto Betrag"));
        neueBuchung.setValue("Konto (Soll)", ausgabenRow.getValue("Konto"));
        neueBuchung.setValue("Konto (Haben)", ausgabenRow.getValue("Gegenkonto"));
        neueBuchung.setValue("Buchungstext", ausgabenRow.getValue("Text"));
      }
    }

    //Vorsteuer hinzufügen ----------------------------------------------------------------
    if (ausgabenRow.getValue("Vorsteuer") != 0) {
      var neueBuchung = a.csvCache.newRow();
      neueBuchung.setValue("Datum", ausgabenRow.getValue("Datum"));

      neueBuchung.setValue("Betrag", ausgabenRow.getValue("Vorsteuer"));
      neueBuchung.setValue("Konto (Soll)", "Vorsteuer");
      neueBuchung.setValue("Konto (Haben)", ausgabenRow.getValue("Gegenkonto"));
      neueBuchung.setValue("Buchungstext", ausgabenRow.getValue("Text"));
    }
  }

}

function bewirtungsbelegeCSV(a) {
  var ausgabenID = a.spreadsheet.getRangeByName("AusgabenID").getValue();
  //  a.ausgabenLinkFormula = saw.linkFormula(ausgabenID);
  // @ts-ignore
  a.bewirtungsbelegeCache = O1.loadTableCache(ausgabenID, "Bewirtungsbelege");
  if (a.bewirtungsbelegeCache.getRowByIndex(0).getValue("Datum") == "") return;

  // @ts-ignore
  a.quelle = saw.linkFormula(ausgabenID);
  for (var index in a.bewirtungsbelegeCache.dataArray) {

    var buchungRow = a.bewirtungsbelegeCache.getRowByIndex(index);

    //abziehbare Bewirtungskosten hinzufügen 70% Bewirtung netto + Trinkgeld----------------------------------------------------------------
    var neueBuchung = a.csvCache.newRow();
    neueBuchung.setValue("Datum", buchungRow.getValue("Datum"));

    neueBuchung.setValue("Betrag", buchungRow.getValue("abziehbare Bewirtungskosten"));
    neueBuchung.setValue("Konto (Soll)", "abziehbare Bewirtungskosten");
    neueBuchung.setValue("Konto (Haben)", buchungRow.getValue("Gegenkonto"));
    neueBuchung.setValue("Buchungstext", buchungRow.getValue("Text"));


    //nicht abziehbare Bewirtungskosten hinzufügen 30% Bewirtung netto + Trinkgeld----------------------------------------------------------------
    var neueBuchung = a.csvCache.newRow();
    neueBuchung.setValue("Datum", buchungRow.getValue("Datum"));

    neueBuchung.setValue("Betrag", buchungRow.getValue("nicht abziehbare Bewirtungskosten"));
    neueBuchung.setValue("Konto (Soll)", "nicht abziehbare Bewirtungskosten");
    neueBuchung.setValue("Konto (Haben)", buchungRow.getValue("Gegenkonto"));
    neueBuchung.setValue("Buchungstext", buchungRow.getValue("Text"));


    //Vorsteuer hinzufügen Vorsteuer aus Bewirtung---------------------------------------------------------------
    if (buchungRow.getValue("Vorsteuer") != 0) {
      var neueBuchung = a.csvCache.newRow();
      neueBuchung.setValue("Datum", buchungRow.getValue("Datum"));

      neueBuchung.setValue("Betrag", buchungRow.getValue("Vorsteuer"));
      neueBuchung.setValue("Konto (Soll)", "Vorsteuer");
      neueBuchung.setValue("Konto (Haben)", buchungRow.getValue("Gegenkonto"));
      neueBuchung.setValue("Buchungstext", buchungRow.getValue("Text"));
    }
  }
}

function verpflegungsmehraufwendungenCSV(a) {
  var ausgabenID = a.spreadsheet.getRangeByName("AusgabenID").getValue();
  // a.ausgabenLinkFormula = saw.linkFormula(ausgabenID);
 // @ts-ignore
 a.verpflegungsmehraufwendungenCache = O1.loadTableCache(ausgabenID, "Verpflegungsmehraufwendungen");
  // @ts-ignore
  a.quelle = saw.linkFormula(ausgabenID);
  if (a.verpflegungsmehraufwendungenCache.getRowByIndex(0).getValue("Datum") == "") return;

  for (var index in a.verpflegungsmehraufwendungenCache.dataArray) {
    var buchungRow = a.verpflegungsmehraufwendungenCache.getRowByIndex(index);


    //Verpflegungsmehraufwendungen hinzufügen ----------------------------------------------------------------
    var betrag = buchungRow.getValue("Verpflegungsmehr-aufwendung");
    if (betrag != 0) {
      var neueBuchung = a.csvCache.newRow();
      neueBuchung.setValue("Datum", buchungRow.getValue("Datum"));

      neueBuchung.setValue("Betrag", betrag);
      neueBuchung.setValue("Konto (Soll)", "Verpflegungsmehraufwendung");
      neueBuchung.setValue("Konto (Haben)", "bar");
      neueBuchung.setValue("Buchungstext", buchungRow.getValue("Text"));
    }


  }
}

function rechnungenCSV(a) {
  var einnahmenID = a.spreadsheet.getRangeByName("EinnahmenID").getValue();
 // @ts-ignore
 a.einnahmenLinkFormula = saw.linkFormula(einnahmenID);
// @ts-ignore
a.rechnungenCache = O1.loadTableCache(einnahmenID, "Rechnungen");
  if (a.rechnungenCache.getRowByIndex(0).getValue("Datum") == "") return;


  for (var index in a.rechnungenCache.dataArray) {
    var buchungRow = a.rechnungenCache.getRowByIndex(index);

    // Netto Betrag auf Leistung buchen
    if (buchungRow.getValue("Summe netto") != 0) {
      var neueBuchung = a.csvCache.newRow();
      neueBuchung.setValue("Datum", buchungRow.getValue("Datum"));

      neueBuchung.setValue("Betrag", buchungRow.getValue("Summe netto"));
      neueBuchung.setValue("Konto (Soll)", buchungRow.getValue("Gegenkonto"));
      var kontoRow = getOrCreateKontoLeistungRow(a, buchungRow.getValue("Name"));
      Logger.log(kontoRow.getValue("Konto"));
      neueBuchung.setValue("Konto (Haben)", kontoRow.getValue("Konto"));
      neueBuchung.setValue("Buchungstext", buchungRow.getValue("Name") + " RgNr:" + buchungRow.getValue("Rechnungs-Nr"));
    }

    // "USt. in Rechnung gestellt" buchen
    var kontoRow = getOrCreateKontoRow(a, "USt. in Rechnung gestellt");
    if (buchungRow.getValue("Summe Umsatzsteuer") != 0) {
      var neueBuchung = a.csvCache.newRow();
      neueBuchung.setValue("Datum", buchungRow.getValue("Datum"));

      neueBuchung.setValue("Betrag", buchungRow.getValue("Summe Umsatzsteuer"));
      neueBuchung.setValue("Konto (Soll)", buchungRow.getValue("Gegenkonto"));
      neueBuchung.setValue("Konto (Haben)", "USt. in Rechnung gestellt");
      neueBuchung.setValue("Buchungstext", buchungRow.getValue("Name") + " RgNr:" + buchungRow.getValue("Rechnungs-Nr"));
    }
  }
}

function gutschriftenCSV(a) {
  var einnahmenID = a.spreadsheet.getRangeByName("EinnahmenID").getValue();
 // @ts-ignore
 a.einnahmenLinkFormula = saw.linkFormula(einnahmenID);
// @ts-ignore
a.gutschriftenCache = O1.loadTableCache(einnahmenID, "Gutschriften");
  if (a.gutschriftenCache.getRowByIndex(0).getValue("Datum") == "") return;


  for (var index in a.gutschriftenCache.dataArray) {
    var buchungRow = a.gutschriftenCache.getRowByIndex(index);

    // Netto Betrag auf Leistung buchen
    if (buchungRow.getValue("Summe netto") != 0) {
      var neueBuchung = a.csvCache.newRow();
      neueBuchung.setValue("Datum", buchungRow.getValue("Datum"));

      neueBuchung.setValue("Betrag", buchungRow.getValue("Summe netto"));
      neueBuchung.setValue("Konto (Soll)", buchungRow.getValue("Gegenkonto"));
      var kontoRow = getOrCreateKontoLeistungRow(a, "Gutschrift");
      Logger.log(kontoRow.getValue("Konto"));
      neueBuchung.setValue("Konto (Haben)", kontoRow.getValue("Konto"));
      neueBuchung.setValue("Buchungstext", "Gutschrift:" + buchungRow.getValue("Gutschrift-Nr"));
    }

    // "USt. in Rechnung gestellt" buchen
    var kontoRow = getOrCreateKontoRow(a, "USt. in Rechnung gestellt");
    if (buchungRow.getValue("Summe Umsatzsteuer") != 0) {
      var neueBuchung = a.csvCache.newRow();
      neueBuchung.setValue("Datum", buchungRow.getValue("Datum"));

      neueBuchung.setValue("Betrag", buchungRow.getValue("Summe Umsatzsteuer"));
      neueBuchung.setValue("Konto (Soll)", buchungRow.getValue("Gegenkonto"));
      neueBuchung.setValue("Konto (Haben)", "USt. in Rechnung gestellt");
      neueBuchung.setValue("Buchungstext", "Gutschrift:" + buchungRow.getValue("Gutschrift-Nr"));
    }
  }
}
function umbuchungenCSV(a) {
  var bankkontenID = a.spreadsheet.getRangeByName("BankkontenID").getValue();
  if (bankkontenID == "") return;

// @ts-ignore
a.bankkontenLinkFormula = saw.linkFormula(bankkontenID);
// @ts-ignore
a.umbuchungenCache = O1.loadTableCache(bankkontenID, "Umbuchungen");
  if (a.umbuchungenCache.getRowByIndex(0).getValue("Datum") == "") return;
  a.quelle = a.bankkontenLinkFormula;

  for (var index in a.umbuchungenCache.dataArray) {
    var buchungRow = a.umbuchungenCache.getRowByIndex(index);
    let umbId = buchungRow.getValue("ID");

    //Umbuchung hinzufügen  
    if (buchungRow.getValue("Betrag") != 0 &&
      umbId !== "mwstVorsteuerAufMwSt" &&
      umbId !== "mwstJahresmehrwertsteuerAusVerbindlichkeiten" &&
      umbId !== "mwstUStVAaufVerbindlichkeiten" &&
      umbId !== "EBustvaOffenePostenKorrekturVerbindlichkeitenUmsatzsteuer12" &&
      umbId !== "EBustvaOffenePostenKorrekturUStVa12"
    ) {
      var neueBuchung = a.csvCache.newRow();
      neueBuchung.setValue("Datum", buchungRow.getValue("Datum"));

      neueBuchung.setValue("Betrag", buchungRow.getValue("Betrag"));
      neueBuchung.setValue("Konto (Soll)", buchungRow.getValue("Konto"));
      neueBuchung.setValue("Konto (Haben)", buchungRow.getValue("Gegenkonto"));
      neueBuchung.setValue("Buchungstext", buchungRow.getValue("Text"));
    }


  }

}

function bankbuchungenCSV(a) {
  var bankkontenID = a.spreadsheet.getRangeByName("BankkontenID").getValue();
  if (bankkontenID == "") return;

 // @ts-ignore
 a.bankkontenLinkFormula = saw.linkFormula(bankkontenID);
// @ts-ignore
a.bankbuchungenCache = O1.loadTableCache(bankkontenID, "Bankbuchungen");
  if (a.bankbuchungenCache.getRowByIndex(0).getValue("Datum") == "") return;

  a.quelle = a.bankkontenLinkFormula;

  for (var index in a.bankbuchungenCache.dataArray) {
    var buchungRow = a.bankbuchungenCache.getRowByIndex(index);

    //Bankbuchung hinzufügen  
    if (buchungRow.getValue("Betrag") != 0) {
      var neueBuchung = a.csvCache.newRow();
      neueBuchung.setValue("Datum", buchungRow.getValue("Datum"));

      neueBuchung.setValue("Betrag", buchungRow.getValue("Betrag"));
      neueBuchung.setValue("Konto (Soll)", buchungRow.getValue("Bilanzkonto"));
      neueBuchung.setValue("Konto (Haben)", buchungRow.getValue("Gegenkonto"));
      neueBuchung.setValue("Buchungstext", buchungRow.getValue("Text"));

    }



  }
}

function abschreibungenCSV(a) {
  var ausgabenID = a.spreadsheet.getRangeByName("AusgabenID").getValue();
 // @ts-ignore
 a.ausgabenLinkFormula = saw.linkFormula(ausgabenID);
// @ts-ignore
a.abschreibungenCache = O1.loadTableCache(ausgabenID, "Abschreibungen");
  if (a.abschreibungenCache.getRowByIndex(0).getValue("Datum") == "") return;
  a.quelle = a.ausgabenLinkFormula;

  for (var index in a.abschreibungenCache.dataArray) {
    var buchungRow = a.abschreibungenCache.getRowByIndex(index);

    //Abschreibung hinzufügen  
    if (buchungRow.getValue("Betrag") != 0 && buchungRow.getValue("Datum").getFullYear() !== a.geschaeftsjahr.getFullYear()) {
      var neueBuchung = a.csvCache.newRow();
      neueBuchung.setValue("Datum", buchungRow.getValue("Datum"));

      neueBuchung.setValue("Betrag", buchungRow.getValue("Betrag"));
      neueBuchung.setValue("Konto (Soll)", buchungRow.getValue("Konto"));
      neueBuchung.setValue("Konto (Haben)", buchungRow.getValue("Gegenkonto"));
      neueBuchung.setValue("Buchungstext", buchungRow.getValue("Text"));
    }
  }
}
function negativeBetraegeTransformierenCSV(a) {
  for (var index in a.csvCache.dataArray) {
    negativenBetragTranformierenAusCSVExport(a.csvCache.getRowByIndex(index));
  }
}

function negativenBetragTranformierenAusCSVExport(csvRow) {
  if (csvRow.getValue("Betrag") < 0) {
    var altSoll = csvRow.getValue("Konto (Soll)");
    var altHaben = csvRow.getValue("Konto (Haben)");
    csvRow.setValue("Betrag", -csvRow.getValue("Betrag"));
    csvRow.setValue("Konto (Soll)", altHaben);
    csvRow.setValue("Konto (Haben)", altSoll);

  }
}
function kontenStammdatenErgaenzenCSV(a) {
  for (var index in a.csvCache.dataArray) {
    kontoStammdatenErgaenzenCSV(a, a.csvCache.getRowByIndex(index));
  }
}

function kontoStammdatenErgaenzenCSV(a, csvRow) {
  csvRow.setValue("SKR03 (Soll)", getSKR03ifConfigured(a, csvRow.getValue("Konto (Soll)")));
  csvRow.setValue("SKR03 (Haben)", getSKR03ifConfigured(a, csvRow.getValue("Konto (Haben)")));
  csvRow.setValue("Exportgruppe", "laufende Buchungen");
}

function getOrCreateKontoLeistungRow(a, kontoName) {

  kontoName = "Leistung:" + kontoName;
  var kontoRow = a.kontenHashTableRows[kontoName];

  //Wenn es das Konto noch nicht gibt, dann anlegen.
  if (kontoRow === undefined) {
    a.kontenHashTableRows[kontoName] = a.kontenCache.newRow();
    a.kontenHashTableRows[kontoName].setValue("Konto", kontoName);
    a.kontenHashTableRows[kontoName].setValue("Kontentyp", "GuV");
    a.kontenHashTableRows[kontoName].setValue("Subtyp", "Einnahme");
    a.kontenHashTableRows[kontoName].setValue("Beispiel", a.beispiel);
    a.kontenHashTableRows[kontoName].setValue("Quelle", a.einnahmenLinkFormula);
    //Wenn das Konto aus der Tabelle Ausgaben kommt, dann Kontentyp aus Kontentabelle übernehmen und Beispiel aus Ausgabentabelle

  }

  return a.kontenHashTableRows[kontoName];
}

function getOrCreateKontoRow(a, kontoName) {

  var kontoRow = a.kontenHashTableRows[kontoName];

  //Wenn es das Konto noch nicht gibt, dann anlegen.
  if (kontoRow === undefined) {
    a.kontenHashTableRows[kontoName] = a.kontenCache.newRow();

    switch (kontoName) {
      case "Vorsteuer":
        a.kontenHashTableRows[kontoName].setValue("Konto", kontoName);
        a.kontenHashTableRows[kontoName].setValue("Kontentyp", "Bilanz");
        a.kontenHashTableRows[kontoName].setValue("Subtyp", "Geld");
        a.kontenHashTableRows[kontoName].setValue("Gruppe", "Umsatzsteuer");
        a.kontenHashTableRows[kontoName].setValue("Beispiel", "");
        a.kontenHashTableRows[kontoName].setValue("Quelle", a.quelle);
        break;
      case "USt. in Rechnung gestellt":
        a.kontenHashTableRows[kontoName].setValue("Konto", kontoName);
        a.kontenHashTableRows[kontoName].setValue("Kontentyp", "Bilanz");
        a.kontenHashTableRows[kontoName].setValue("Subtyp", "Geld");
        a.kontenHashTableRows[kontoName].setValue("Gruppe", "Umsatzsteuer");
        a.kontenHashTableRows[kontoName].setValue("Beispiel", "");
        a.kontenHashTableRows[kontoName].setValue("Quelle", a.quelle);
        break;

      case "auf Rechnung":
        a.kontenHashTableRows[kontoName].setValue("Konto", kontoName);
        a.kontenHashTableRows[kontoName].setValue("Kontentyp", "Bilanz");
        a.kontenHashTableRows[kontoName].setValue("Subtyp", "Geld");
        a.kontenHashTableRows[kontoName].setValue("Gruppe", "Liquidität");
        a.kontenHashTableRows[kontoName].setValue("Beispiel", "");
        a.kontenHashTableRows[kontoName].setValue("Quelle", a.quelle);
        break;
      case "Saldenvorträge Sachkonten":
        a.kontenHashTableRows[kontoName].setValue("Konto", kontoName);
        a.kontenHashTableRows[kontoName].setValue("Kontentyp", "Bilanz");
        a.kontenHashTableRows[kontoName].setValue("Subtyp", "Geld");
        a.kontenHashTableRows[kontoName].setValue("Gruppe", "unbekannt");
        a.kontenHashTableRows[kontoName].setValue("Beispiel", "");
        a.kontenHashTableRows[kontoName].setValue("Quelle", a.quelle);
        break;
      case "Verpflegungsmehraufwendung":
        a.kontenHashTableRows[kontoName].setValue("Konto", kontoName);
        a.kontenHashTableRows[kontoName].setValue("Kontentyp", "GuV");
        a.kontenHashTableRows[kontoName].setValue("Subtyp", "Kosten");
        a.kontenHashTableRows[kontoName].setValue("Gruppe", "Dienstreisen");
        a.kontenHashTableRows[kontoName].setValue("Beispiel", "");
        a.kontenHashTableRows[kontoName].setValue("Quelle", a.quelle);
        break;
      case "nicht abziehbare Bewirtungskosten":
        a.kontenHashTableRows[kontoName].setValue("Konto", kontoName);
        a.kontenHashTableRows[kontoName].setValue("Kontentyp", "Privat");
        a.kontenHashTableRows[kontoName].setValue("Subtyp", "Kosten");
        a.kontenHashTableRows[kontoName].setValue("Gruppe", "Dienstreisen");
        a.kontenHashTableRows[kontoName].setValue("Beispiel", "");
        a.kontenHashTableRows[kontoName].setValue("Quelle", a.quelle);
        break;
      case "abziehbare Bewirtungskosten":
        a.kontenHashTableRows[kontoName].setValue("Konto", kontoName);
        a.kontenHashTableRows[kontoName].setValue("Kontentyp", "GuV Privat");
        a.kontenHashTableRows[kontoName].setValue("Subtyp", "Kosten");
        a.kontenHashTableRows[kontoName].setValue("Gruppe", "Dienstreisen");
        a.kontenHashTableRows[kontoName].setValue("Beispiel", "");
        a.kontenHashTableRows[kontoName].setValue("Quelle", a.quelle);
        break;
      case "Lohnsteuer":
        a.kontenHashTableRows[kontoName].setValue("Konto", kontoName);
        a.kontenHashTableRows[kontoName].setValue("Kontentyp", "GuV");
        a.kontenHashTableRows[kontoName].setValue("Subtyp", "Kosten");
        a.kontenHashTableRows[kontoName].setValue("Gruppe", "Personal");
        a.kontenHashTableRows[kontoName].setValue("Beispiel", "");
        a.kontenHashTableRows[kontoName].setValue("Quelle", a.quelle);
        break;


      default:
        a.kontenHashTableRows[kontoName].setValue("Konto", kontoName);
        a.kontenHashTableRows[kontoName].setValue("Beispiel", a.beispiel);
        a.kontenHashTableRows[kontoName].setValue("Quelle", a.quelle);
    }
  }

  return a.kontenHashTableRows[kontoName];
}

function getOrCreateKostenKontoRow(a, kontoName) {


  var kontoRow = a.kontenHashTableRows[kontoName];

  //Wenn es das Konto noch nicht gibt, dann anlegen.
  if (kontoRow === undefined) {
    a.kontenHashTableRows[kontoName] = a.kontenCache.newRow();
    a.kontenHashTableRows[kontoName].setValue("Konto", kontoName);
    a.kontenHashTableRows[kontoName].setValue("Kontentyp", "GuV");
    a.kontenHashTableRows[kontoName].setValue("Subtyp", "Kosten");
    a.kontenHashTableRows[kontoName].setValue("Beispiel", a.beispiel);
    a.kontenHashTableRows[kontoName].setValue("Quelle", a.quelle);


  }

  return a.kontenHashTableRows[kontoName];
}
function getSKR03ifConfigured(a, konto) {
  var kontoRow = getOrCreateKontoRow(a, konto);
  if (kontoRow.getValue("SKR03") != "") return kontoRow.getValue("SKR03"); else return konto;
}
