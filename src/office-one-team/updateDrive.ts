function updateDrive(rootFolderId: string) {

  let oooPreviousVersion = (parseInt(oooVersion, 10) - 1).toString();
  let nix = "";
  for (let nullen = 0; nullen < 4 - oooPreviousVersion.length; nullen++) {
    nix += "0";
  }
  oooPreviousVersion = nix + oooPreviousVersion;

  //copy DataTable Data
  for (let rangeName of Object.keys(DriveConnector.oooVersionsRangeFileMap[oooVersion])) {
    if (rangeName !== "ElsterTransferD") {
      const dataOldVersion = DriveConnector.getNamedRangeData(rootFolderId, rangeName, oooPreviousVersion);
      const dataNewVersion = DriveConnector.getNamedRangeData(rootFolderId, rangeName, oooVersion);
      DriveConnector.saveNamedRangeData(rootFolderId, rangeName, dataNewVersion[0].length, dataOldVersion[0], dataOldVersion[1], dataOldVersion[2], oooVersion);
    }
  }
  //copy value Data: 
  for (let valueName of Object.keys(DriveConnector.oooVersionValueFileMap[oooVersion])) {
    if (valueName !== "EinnahmenID" && valueName !== "AusgabenID" && valueName !== "BankkontenID") {
      const dataOldVersion = DriveConnector.getValueByName(rootFolderId, valueName, oooPreviousVersion);
      DriveConnector.saveValueByName(rootFolderId, valueName, oooVersion, dataOldVersion)
    }
  }
  for (let valuesName of Object.keys(DriveConnector.oooVersionValuesFileMap[oooVersion])) {
    const dataOldVersion = DriveConnector.getValuesByName(rootFolderId, valuesName, oooPreviousVersion);
    DriveConnector.saveValuesByName(rootFolderId, valuesName, oooVersion, dataOldVersion)
  }
  //alte Tabellen in Archivordner verschieben
  const rootFolder = DriveApp.getFolderById(rootFolderId);
  const archivRoot = getOrCreateFolder(rootFolder, "9 Archiv")
  const archiv = getOrCreateFolder(archivRoot, "Version:" + oooPreviousVersion);
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

  let oldOfficeRootFolderName = rootFolder.getName();
  let newOfficeRootFolderName = oldOfficeRootFolderName.slice(0, -4) + oooVersion;
  rootFolder.setName(newOfficeRootFolderName);

  //if the folder is owned by eins.stein, we need to update the name of the shortcut in "MyDrive"
  var shortcutIterator = DriveApp.getRootFolder().getFilesByType("application/vnd.google-apps.shortcut");
  while (shortcutIterator.hasNext()) {
    let sharedOfficeShortcut = shortcutIterator.next();
    if (sharedOfficeShortcut.getName().toString() === oldOfficeRootFolderName) {
      sharedOfficeShortcut.setName(newOfficeRootFolderName);
      var foldersHash = {};
      const version = newOfficeRootFolderName.slice(-4);
      foldersHash[rootFolder.getId()]={ name: newOfficeRootFolderName.slice(0,-5), version:version };
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

