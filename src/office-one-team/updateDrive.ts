function updateDrive(rootFolderId: string) {

  let oooPreviousVersion = (parseInt(oooVersion, 10) - 1).toString();
  let nix = "";
  for (let nullen = 0; nullen < 4 - oooPreviousVersion.length; nullen++) {
    nix += "0";
  }
  oooPreviousVersion = nix + oooPreviousVersion;

  for (let rangeName of Object.keys(DriveConnector.oooVersionsRangeFileMap[oooVersion])) {
    const dataOldVersion = DriveConnector.getNamedRangeData(rootFolderId, rangeName, oooPreviousVersion);
    const dataNewVersion = DriveConnector.getNamedRangeData(rootFolderId, rangeName, oooVersion);
    DriveConnector.saveNamedRangeData(rootFolderId, rangeName, dataNewVersion[0].length, dataOldVersion[0], dataOldVersion[1], dataOldVersion[2], oooVersion);
  }
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

  const rootFolder = DriveApp.getFolderById(rootFolderId);
  rootFolder.setName(rootFolder.getName().slice(0, -4) + oooVersion);

  return getOrCreateOfficeOneFolders();
  /* 
   var result = {
       serverFunction: ServerFunction.UStVAberechnen,
       UStVAD: BM.getUStVATableCache().getData(),
   }
     return JSON.stringify(result);
     */
}

