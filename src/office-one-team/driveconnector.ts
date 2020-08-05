const oooVersion = "0050";

class DriveConnector {

  static driveFolders = {};
  static spreadsheets = {};
  static rangeValues = {};

  static oooVersionsFileNameIdMap = {
    "0050": {
      "1 Rechnung schreiben - Version:0050": "1bbRiVXLCzPdfWvgFJQofcKjBDiF5k4oKVzyBlCFg_BU",
      "2 Ausgaben erfassen - Version:0050": "16w5bq7ggLtCPcgxzAj8IU6TGfrMb1Wrrt5Ir9jApCd0",
      "3 Bankbuchungen zuordnen - Version:0050": "1R8wWOwcNzrp6NRddRj78AHFATaDK_xfBulYna9-d5Z4",
      "4 Bilanz, Gewinn und Steuererklärungen - Version:0050": "1GsfpXmORZ0AfNVET0VZ7KVYYhMui4ylQE_rL0SyjDSQ",
      "5 ElsterTransfer -Version:0049": "1-LAQ6bfwmRkZKgx6zasZi6x_WIi4DdTb7p5GD86Zsqc"
    },
    "0049": {
      "1 Rechnung schreiben - Version:0049": "11ooB8tyVlX6dy8ypC9teZBJOywEh1VE2at2BEvk4MO4g",
      "2 Ausgaben erfassen - Version:0049": "1WozzCsuQI77mOC7AZqSGLyoaptwZBzqTbDSV2PYS0DM",
      "3 Bankbuchungen zuordnen - Version:0049": "1SIVUZZUgOErIdjjwvfVHXFU-WIx2fUFAVRk57UU3f-w",
      "4 Bilanz, Gewinn und Steuererklärungen - Version:0049": "1-FP1NQ3p1n6xxxk0iUnBpNVDbpd-ESALo-c7osB2-Vs",
      "5 ElsterTransfer -Version:0049": "1-LAQ6bfwmRkZKgx6zasZi6x_WIi4DdTb7p5GD86Zsqc"
    }
  }
  static oooVersionValuesFileMap = {
    "0050": {
      ElsterUStVA: "4 Bilanz, Gewinn und Steuererklärungen - Version:0050",
    },
    "0049": {
      ElsterUStVA: "4 Bilanz, Gewinn und Steuererklärungen - Version:0049",
    }
  }
  static oooVersionValueFileMap = {
    "0050": {
      AusgabenDatei: "2 Ausgaben erfassen - Version:0050",
      KontenJahr: "4 Bilanz, Gewinn und Steuererklärungen - Version:0050",
      UStVAPeriode: "4 Bilanz, Gewinn und Steuererklärungen - Version:0050",
      GutschriftenDatei: "1 Rechnung schreiben - Version:0050"
    },
    "0049": {
      AusgabenDatei: "2 Ausgaben erfassen - Version:0049",
      KontenJahr: "4 Bilanz, Gewinn und Steuererklärungen - Version:0049",
      UStVAPeriode: "4 Bilanz, Gewinn und Steuererklärungen - Version:0049",
      GutschriftenDatei: "1 Rechnung schreiben - Version:0049"
    }
  }
  static oooVersionsRangeFileMap = {
    "0050": {
      AusgabenD: "2 Ausgaben erfassen - Version:0050",
      BewirtungsbelegeD: "2 Ausgaben erfassen - Version:0050",
      AbschreibungenD: "2 Ausgaben erfassen - Version:0050",
      VerpflegungsmehraufwendungenD: "2 Ausgaben erfassen - Version:0050",
      "VerträgeD": "2 Ausgaben erfassen - Version:0050",
      KontenD: "4 Bilanz, Gewinn und Steuererklärungen - Version:0050",
      UStVAD: "4 Bilanz, Gewinn und Steuererklärungen - Version:0050",
      EÜRD: "4 Bilanz, Gewinn und Steuererklärungen - Version:0050",
      BuchungenD: "4 Bilanz, Gewinn und Steuererklärungen - Version:0050",
      BankbuchungenD: "3 Bankbuchungen zuordnen - Version:0050",
      UmbuchungenD: "3 Bankbuchungen zuordnen - Version:0050",
      RechnungenD: "1 Rechnung schreiben - Version:0050",
      EURechnungenD: "1 Rechnung schreiben - Version:0050",
      GutschriftenD: "1 Rechnung schreiben - Version:0050",
      ElsterTransferD: "5 ElsterTransfer -Version:0049"
    },
    "0049": {
      AusgabenD: "2 Ausgaben erfassen - Version:0049",
      BewirtungsbelegeD: "2 Ausgaben erfassen - Version:0049",
      AbschreibungenD: "2 Ausgaben erfassen - Version:0049",
      VerpflegungsmehraufwendungenD: "2 Ausgaben erfassen - Version:0049",
      "VerträgeD": "2 Ausgaben erfassen - Version:0049",
      KontenD: "4 Bilanz, Gewinn und Steuererklärungen - Version:0049",
      UStVAD: "4 Bilanz, Gewinn und Steuererklärungen - Version:0049",
      EÜRD: "4 Bilanz, Gewinn und Steuererklärungen - Version:0049",
      BuchungenD: "4 Bilanz, Gewinn und Steuererklärungen - Version:0049",
      BankbuchungenD: "3 Bankbuchungen zuordnen - Version:0049",
      UmbuchungenD: "3 Bankbuchungen zuordnen - Version:0049",
      RechnungenD: "1 Rechnung schreiben - Version:0049",
      EURechnungenD: "1 Rechnung schreiben - Version:0049",
      GutschriftenD: "1 Rechnung schreiben - Version:0049",
      ElsterTransferD: "5 ElsterTransfer -Version:0049",
    }
  }
  static getNamedRangeData(rootFolderId: string, rangeName: string, version: string): [Object[][], string[][], string[][]] {
    Logger.log(`getNamedRangeData(${rootFolderId},${rangeName},${version}`)

    var spreadsheet = this.getSpreadsheet(rootFolderId, rangeName, version);
    return [spreadsheet.getRangeByName(rangeName).getValues(),
    spreadsheet.getRangeByName(rangeName).getBackgrounds(),
    spreadsheet.getRangeByName(rangeName).getFormulasR1C1()];
  }

  static getRangeFileName(rangeName: string, version: string) {
    let fileName = DriveConnector.oooVersionsRangeFileMap[version][rangeName];
    if (fileName === undefined) fileName = DriveConnector.oooVersionValueFileMap[version][rangeName];
    if (fileName === undefined) fileName = DriveConnector.oooVersionValuesFileMap[version][rangeName];
    if (fileName === undefined) throw new Error("Range:" + rangeName + " is not defined in DriveConnector");
    return fileName;
  }
  static getMasterFileID(rangeName: string, version: string) {
    if (DriveConnector.oooVersionsFileNameIdMap[version][DriveConnector.oooVersionsRangeFileMap[version][rangeName]] === undefined) throw new Error("File for:" + rangeName + " is not defined in DriveConnector");
    return DriveConnector.oooVersionsFileNameIdMap[version][DriveConnector.oooVersionsRangeFileMap[version][rangeName]];
  }
  static getValueByName(rootFolderId: string, rangeName: string, version: string) {
    let value = this.rangeValues[rootFolderId + rangeName];
    if (value === undefined) {
      value = this.getSpreadsheet(rootFolderId, rangeName, version).getRangeByName(rangeName).getValue();
      this.rangeValues[rootFolderId + rangeName] = value;
    }
    return value;
  }
  static getValuesByName(rootFolderId: string, rangeName: string, version: string) {
    let value = this.rangeValues[rootFolderId + rangeName];
    if (value === undefined) {
      value = this.getSpreadsheet(rootFolderId, rangeName, version).getRangeByName(rangeName).getValues();
      this.rangeValues[rootFolderId + rangeName] = value;
    }
    return value;
  }
  static saveValueByName(rootFolderId: string, rangeName: string, version: string, value: any) {
    this.getSpreadsheet(rootFolderId, rangeName, version).getRangeByName(rangeName).setValue(value);
  }
  static saveValuesByName(rootFolderId: string, rangeName: string, version: string, value: any) {
    this.getSpreadsheet(rootFolderId, rangeName, version).getRangeByName(rangeName).setValues(value);
  }

  static saveNamedRangeData(rootFolderId: string, rangeName: string, loadRowCount, dataArray: Object[][], backgroundArray: string[][], formulaArray: Object[][], version: string) {
    var spreadsheet = this.getSpreadsheet(rootFolderId, rangeName, version);
    let dataRange = spreadsheet.getRangeByName(rangeName);
    // wenn nötig Zeilen einfügen oder löschen
    var rowDifference = dataArray.length - loadRowCount;
    if (rowDifference > 0) dataRange.getSheet().insertRowsBefore(dataRange.getRow() + 1, rowDifference);

    //Range erzeugen um Daten einzufügen und DataRange neu setzen
    var currentSheet = dataRange.getSheet();


    //Wenn es keine Daten gibt muss trotzdem eine Zeile stehen bleiben und deren inhalt muss gelöscht werden
    if (dataArray.length < 2) {
      if ((-rowDifference - 1) != 0) currentSheet.deleteRows(dataRange.getRow() + 1, -rowDifference - 1);
      currentSheet.getRange(dataRange.getRow() + 1, dataRange.getColumn(), 1, dataRange.getNumColumns()).clearContent();
      return;
    }
    else
      if (rowDifference < 0) dataRange.getSheet().deleteRows(dataRange.getRow() + 1, -rowDifference);

    //DataRange aktualisieren
    dataRange = spreadsheet.getRangeByName(rangeName);

    //alle vorhandenen Formeln in das DataArray kopieren um "setFormulas" nach setValues zu sparen

    for (var zeilen in dataArray) {
      for (var spalten in dataArray[zeilen]) {
        if (formulaArray[zeilen][spalten] != "" && formulaArray[zeilen][spalten] != undefined) {
          dataArray[zeilen][spalten] = formulaArray[zeilen][spalten];
        }
      }
    }
    dataRange.setValues(dataArray);
    dataRange.setBackgrounds(backgroundArray).setBorder(true, true, true, true, true, true, "#b7b7b7", SpreadsheetApp.BorderStyle.SOLID);
  }
  public static getSpreadsheet(rootFolderId: string, rangeName: string, version: string) {
    let spreadsheetFolder: GoogleAppsScript.Drive.Folder = this.driveFolders[rootFolderId];
    if (spreadsheetFolder === undefined) {
      spreadsheetFolder = DriveApp.getFolderById(rootFolderId);
      this.driveFolders[rootFolderId] = spreadsheetFolder;
    }
    let spreadsheet = this.spreadsheets[rootFolderId + this.getRangeFileName(rangeName, version)];
    if (spreadsheet === undefined) {
      var spreadsheetId = "";
      if (!spreadsheetFolder.getFilesByName(this.getRangeFileName(rangeName, version)).hasNext()) {
        spreadsheetId = this.copyAndInitializeSpreadsheet(rangeName, oooVersion, spreadsheetFolder);
      } else spreadsheetId = spreadsheetFolder.getFilesByName(this.getRangeFileName(rangeName, version)).next().getId();
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      this.spreadsheets[rootFolderId + this.getRangeFileName(rangeName, version)] = spreadsheet;
    }
    return spreadsheet as GoogleAppsScript.Spreadsheet.Spreadsheet;
  }
  private static copyAndInitializeSpreadsheet(rangeName: string, version: string, spreadsheetFolder: GoogleAppsScript.Drive.Folder) {
    //throw new Error("Update needed to Version: "+oooVersion); 
    let spreadsheetId = DriveApp.getFileById(this.getMasterFileID(rangeName, version)).makeCopy(this.getRangeFileName(rangeName, version), spreadsheetFolder).getId();
    let spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    spreadsheet.getRangeByName("OfficeRootID").setValue(spreadsheetFolder.getId());
    if (this.getRangeFileName(rangeName, version) === "4 Bilanz, Gewinn und Steuererklärungen - Version:" + oooVersion) {
      spreadsheet.getRangeByName("EinnahmenID").setValue("");
      spreadsheet.getRangeByName("AusgabenID").setValue("");
      spreadsheet.getRangeByName("BankkontenID").setValue("");
    }
    return spreadsheetId;
  }
}



function generateAndMailTableRow() {
  let namedRange = "ElsterTransferD";
  let columnArray = DriveConnector.getNamedRangeData("1-b7eO9tjq4lZcpHDnhfcd4cUdBnRbXGt", namedRange, oooVersion)[0][0];
  let getterAndSetter = "";
  columnArray.forEach(column => {
    let camelColumn = column.toString().replace(/ /g, "").replace(/-/g, "");
    getterAndSetter += "  public get" + camelColumn + "(){return this.getValue(\"" + column.toString() + "\");}\n";
    getterAndSetter += "  public set" + camelColumn + "(value){this.setValue(\"" + column.toString() + "\",value);}\n";

  })
  GmailApp.sendEmail("patrick.sbrzesny@saw-office.net", "dblib Template for:" + namedRange, getterAndSetter);
}