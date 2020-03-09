const oooVersion = "0046";

class DriveConnector {

  static driveFolders = {};
  static spreadsheets = {};
  static rangeValues = {};

  static oooVersions = {
    "0046": {
      AusgabenD: "2 Ausgaben erfassen - Version:0046",
      AusgabenDatei: "2 Ausgaben erfassen - Version:0046",
      BewirtungsbelegeD: "2 Ausgaben erfassen - Version:0046",
      AbschreibungenD: "2 Ausgaben erfassen - Version:0046",
      "VerträgeD": "2 Ausgaben erfassen - Version:0046",
      KontenD: "4 Bilanz, Gewinn und Steuererklärungen - Version:0046",
      KontenJahr: "4 Bilanz, Gewinn und Steuererklärungen - Version:0046",
      BankbuchungenD: "3 Bankbuchungen zuordnen - Version:0046",
      UmbuchungenD: "3 Bankbuchungen zuordnen - Version:0046",
      RechnungenD: "1 Rechnung schreiben - Version:0046",
      GutschriftenD: "1 Rechnung schreiben - Version:0046",
      "1 Rechnung schreiben - Version:0046": "1gMKOOWWaS0VexbDWHBwfQQ72vKD0Qlp2I1NbdtkqoLw",
      "2 Ausgaben erfassen - Version:0046": "1a7oidzIl1hyBI7N6V7qImhEFH3T_U4gwFT3NZTOB_Fs",
      "3 Bankbuchungen zuordnen - Version:0046": "1Ahkhu-xkt8ooEydyBWRQSVAuTrIOmZEgr0Hi6boj6IA",
      "4 Bilanz, Gewinn und Steuererklärungen - Version:0046": "1nRModEjyPacjUY34P5VgcrO28z_WQS8KTg_f6UwMf0M"
    },
    "0045": {
      AusgabenD: "2 Ausgaben erfassen - Version:0045",
      AusgabenDatei: "2 Ausgaben erfassen - Version:0045",
      BewirtungsbelegeD: "2 Ausgaben erfassen - Version:0045",
      AbschreibungenD: "2 Ausgaben erfassen - Version:0045",
      "VerträgeD": "2 Ausgaben erfassen - Version:0045",
      KontenD: "4 Bilanz, Gewinn und Steuererklärungen - Version:0045",
      KontenJahr: "4 Bilanz, Gewinn und Steuererklärungen - Version:0045",
      BankbuchungenD: "3 Bankbuchungen zuordnen - Version:0045",
      UmbuchungenD: "3 Bankbuchungen zuordnen - Version:0045",
      RechnungenD: "1 Rechnung schreiben - Version:0045",
      GutschriftenD: "1 Rechnung schreiben - Version:0045",
      "1 Rechnung schreiben - Version:0045": "1aL3sLrI648cPHNZgKZfh4GQfY833db00EqVdDR9aeMw",
      "2 Ausgaben erfassen - Version:0045": "1UfWjg956Y9k26pwGxZJNJL7JeZb5rlPjskKVv_7d4rs",
      "3 Bankbuchungen zuordnen - Version:0045": "1pc5j_bYMvAYfo_fTO1OUyHzGCt7Zj4iFvgla1k1X688",
      "4 Bilanz, Gewinn und Steuererklärungen - Version:0045": "1VwAYJqmQZDyvAFriUHa9iIe8ff6TcvuJd-XHwyOdRTc"
    }
  }
  static getNamedRangeData(rootFolderId: string, rangeName: string, vers: string, ): [Object[][], string[][], string[][]] {
    let defaultVersion = "0042";
    Logger.log(rootFolderId + " " + rangeName + " " + vers);
    if (vers !== undefined) defaultVersion = vers;

    var spreadsheet = this.getSpreadsheet(rootFolderId, rangeName, defaultVersion);
    return [spreadsheet.getRangeByName(rangeName).getValues(),
    spreadsheet.getRangeByName(rangeName).getBackgrounds(),
    spreadsheet.getRangeByName(rangeName).getFormulasR1C1()];
  }

  static getRangeFileName(rangeName: string, version: string) {
    if (DriveConnector.oooVersions[version][rangeName] === undefined) throw new Error("Range:" + rangeName + " is not defined in DriveConnector");
    return DriveConnector.oooVersions[version][rangeName];
  }
  static getMasterFileID(rangeName: string, version: string) {
    if (DriveConnector.oooVersions[version][rangeName] === undefined) throw new Error("Range:" + rangeName + " is not defined in DriveConnector");
    return DriveConnector.oooVersions[version][DriveConnector.oooVersions[version][rangeName]];
  }
  static getValueByName(rootFolderId: string, rangeName: string, version: string) {
    let defaultVersion = "0042";
    if (version !== undefined) defaultVersion = version;
    let value = this.rangeValues[rootFolderId + rangeName];
    if (value === undefined) {
      value = this.getSpreadsheet(rootFolderId, rangeName, defaultVersion).getRangeByName(rangeName).getValue();
      this.rangeValues[rootFolderId + rangeName] = value;
    }
    return value;
  }
  static saveNamedRangeData(rootFolderId: string, rangeName: string, loadRowCount, dataArray: Object[][], backgroundArray: string[][], formulaArray: Object[][]) {
    var spreadsheet = this.getSpreadsheet(rootFolderId, rangeName, oooVersion);
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
    return spreadsheet;
  }
  private static copyAndInitializeSpreadsheet(rangeName: string, version: string, spreadsheetFolder: GoogleAppsScript.Drive.Folder) {
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
  let namedRange = "RechnungenD";
  let columnArray = DriveConnector.getNamedRangeData("1_qZ45ZztZAt1BfAgqIEEXglwIjmnAtp7", namedRange, "0043")[0][0];
  let getterAndSetter = "";
  columnArray.forEach(column => {
    let camelColumn = column.toString().replace(/ /g, "").replace(/-/g, "");
    getterAndSetter += "  public get" + camelColumn + "(){return this.getValue(\"" + column.toString() + "\");}\n";
    getterAndSetter += "  public set" + camelColumn + "(value){this.setValue(\"" + column.toString() + "\",value);}\n";

  })
  GmailApp.sendEmail("patrick.sbrzesny@saw-office.net", "dblib Template for:" + namedRange, getterAndSetter);
}