function getPreviousVersion() {
  let oooPreviousVersion = (parseInt(oooVersion, 10) - 1).toString();
  let nix = "";
  for (let nullen = 0; nullen < 4 - oooPreviousVersion.length; nullen++) {
    nix += "0";
  }
  oooPreviousVersion = nix + oooPreviousVersion;
  return oooPreviousVersion;
}

function updateDriveMaster(rootFolderId: string) {
  let oooPreviousVersion = getPreviousVersion();

  //copy DataTable Data
  for (let rangeName of Object.keys(DriveConnector.oooVersionsRangeFileMap[oooPreviousVersion])) {
    if (rangeName === "ElsterTransferD" || rangeName === "InstallationenD") {
      const dataOldVersion = DriveConnector.getNamedRangeData(rootFolderId, rangeName, oooPreviousVersion);
      const dataNewVersion = DriveConnector.getNamedRangeData(rootFolderId, rangeName, oooVersion);
      //Wenn die neue Tabelle mehr Spalten hat, dann werden die Daten spaltenweise kopiert
      if (dataOldVersion[0][0].length === dataNewVersion[0][0].length) DriveConnector.saveNamedRangeData(rootFolderId, rangeName, dataNewVersion[0].length, dataOldVersion[0], dataOldVersion[1], dataOldVersion[2], oooVersion);
      else importToBiggerTable(dataOldVersion, rootFolderId, rangeName);
    }
  }
  //read from all Tables from new version to make sure all new Spreadsheets get copied
  for (let rangeName of Object.keys(DriveConnector.oooVersionsRangeFileMap[oooVersion])) {
    if (rangeName === "ElsterTransferD" || rangeName === "InstallationenD") {
      DriveConnector.getNamedRangeData(rootFolderId, rangeName, oooVersion);
    }
  }
}

function updateDrive(rootFolderId: string) {

  let oooPreviousVersion = getPreviousVersion();

  //copy DataTable Data
  for (let rangeName of Object.keys(DriveConnector.oooVersionsRangeFileMap[oooPreviousVersion])) {
    if (rangeName !== "ElsterTransferD" && rangeName !== "InstallationenD") {
      const dataOldVersion = DriveConnector.getNamedRangeData(rootFolderId, rangeName, oooPreviousVersion);
      const dataNewVersion = DriveConnector.getNamedRangeData(rootFolderId, rangeName, oooVersion);
      //Wenn die neue Tabelle mehr Spalten hat, dann werden die Daten spaltenweise kopiert
      if (dataOldVersion[0][0].length === dataNewVersion[0][0].length) DriveConnector.saveNamedRangeData(rootFolderId, rangeName, dataNewVersion[0].length, dataOldVersion[0], dataOldVersion[1], dataOldVersion[2], oooVersion);
      else importToBiggerTable(dataOldVersion, rootFolderId, rangeName);
    }
  }
  //read from all Tables from new version to make sure all new Spreadsheets get copied
  for (let rangeName of Object.keys(DriveConnector.oooVersionsRangeFileMap[oooVersion])) {
    if (rangeName !== "ElsterTransferD" && rangeName !== "InstallationenD") {
      DriveConnector.getNamedRangeData(rootFolderId, rangeName, oooVersion);
    }
  }

  //copy value Data, except IDs of new spreadsheets!!!: 
  for (let valueName of Object.keys(DriveConnector.oooVersionValueFileMap[oooPreviousVersion])) {
    if (valueName !== "EMailID" && valueName !== "EinnahmenID" && valueName !== "AusgabenID" && valueName !== "BankkontenID" && valueName !== "LastschriftenID") {
      const dataOldVersion = DriveConnector.getValueByName(rootFolderId, valueName, oooPreviousVersion);
      DriveConnector.saveValueByName(rootFolderId, valueName, oooVersion, dataOldVersion)
    }
  }
  for (let valuesName of Object.keys(DriveConnector.oooVersionValuesFileMap[oooPreviousVersion])) {
    const dataOldVersion = DriveConnector.getValuesByName(rootFolderId, valuesName, oooPreviousVersion);
    DriveConnector.saveValuesByName(rootFolderId, valuesName, oooVersion, dataOldVersion)
  }

  //alte Tabellen in Archivordner verschieben
  const rootFolder = DriveApp.getFolderById(rootFolderId);
  const archivRoot = getOrCreateFolder(rootFolder, "9 Archiv")
  const archiv = getOrCreateFolder(archivRoot, "Version:" + oooPreviousVersion);

  try {
    const installationenSpreadsheet = rootFolder.getFilesByName("(1) Installationen - Version:" + oooPreviousVersion).next();
    archiv.addFile(installationenSpreadsheet);
    rootFolder.removeFile(installationenSpreadsheet);

    const elsterSpreadsheet = rootFolder.getFilesByName("(2) ElsterTransfer - Version:" + oooPreviousVersion).next();
    archiv.addFile(elsterSpreadsheet);
    rootFolder.removeFile(elsterSpreadsheet);

  } catch (e) {

  }

  //const eMailSpreadsheet = rootFolder.getFilesByName("0 E-Mail verschicken - Version:" + oooPreviousVersion).next();
  //archiv.addFile(eMailSpreadsheet);
  //rootFolder.removeFile(eMailSpreadsheet);

  const einnahmenSpreadsheet = rootFolder.getFilesByName("1 Rechnung schreiben - Version:" + oooPreviousVersion).next();
  archiv.addFile(einnahmenSpreadsheet);
  rootFolder.removeFile(einnahmenSpreadsheet);

  const ausgabenSpreadsheet = rootFolder.getFilesByName("2 Ausgaben erfassen - Version:" + oooPreviousVersion).next();
  archiv.addFile(ausgabenSpreadsheet);
  rootFolder.removeFile(ausgabenSpreadsheet);

  const bankSpreadsheet = rootFolder.getFilesByName("3 Bankbuchungen zuordnen - Version:" + oooPreviousVersion).next();
  archiv.addFile(bankSpreadsheet);
  rootFolder.removeFile(bankSpreadsheet);

  const bilanzSpreadsheet = rootFolder.getFilesByName("4 Bilanz, Gewinn und Steuererklärungen - Version:" + oooPreviousVersion).next();
  archiv.addFile(bilanzSpreadsheet);
  rootFolder.removeFile(bilanzSpreadsheet);

  //const lastschriftSpreadsheet = rootFolder.getFilesByName("5 SEPA - Lastschriftmandat - Version:" + oooPreviousVersion).next();
  //archiv.addFile(lastschriftSpreadsheet);
  //rootFolder.removeFile(lastschriftSpreadsheet);

  let oldOfficeRootFolderName = rootFolder.getName();
  let newOfficeRootFolderName = oldOfficeRootFolderName.slice(0, -4) + oooVersion;
  rootFolder.setName(newOfficeRootFolderName);

  //if the folder is linked into the users drive by shortcut, we need to update the name of the shortcut in "MyDrive"
  var shortcutIterator = DriveApp.getRootFolder().getFilesByType("application/vnd.google-apps.shortcut");
  while (shortcutIterator.hasNext()) {
    let sharedOfficeShortcut = shortcutIterator.next();
    if (sharedOfficeShortcut.getName().toString() === oldOfficeRootFolderName) {
      sharedOfficeShortcut.setName(newOfficeRootFolderName);
      var foldersHash = {};
      const version = newOfficeRootFolderName.slice(-4);
      foldersHash[rootFolder.getId()] = { name: newOfficeRootFolderName.slice(0, -5), version: version };
      var result = {
        serverFunction: ServerFunction.getOrCreateOfficeOneFolders,
        foldersArray: foldersHash
      }
      return JSON.stringify(result);
    }
  }

  return getOrCreateOfficeOneFolders();
  /* 
   var result = {
       serverFunction: ServerFunction.UStVAberechnen,
       UStVAD: BM.getUStVATableCache().getData(),
   }
     return JSON.stringify(result);
     */
}

function importToBiggerTable(dataOldVersion: any[][][], rootFolderId: string, rangeName: string) {
  const data: any[][] = dataOldVersion[0];
  const background: any[][] = dataOldVersion[1];
  const fomulas: any[][] = dataOldVersion[2];

  const tableColumnNames: string[] = data[0] as string[];

  const genericTableCache = new TableCache(rootFolderId, rangeName);
  for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
    const newTableRow = genericTableCache.createNewRow();
    for (let columIndex = 0; columIndex < tableColumnNames.length; columIndex++) {
      newTableRow.setValue(tableColumnNames[columIndex], data[rowIndex][columIndex]);
      newTableRow.setFormula(tableColumnNames[columIndex], fomulas[rowIndex][columIndex]);
      newTableRow.setBackground(tableColumnNames[columIndex], background[rowIndex][columIndex]);
    }
  }
  genericTableCache.save();
}
