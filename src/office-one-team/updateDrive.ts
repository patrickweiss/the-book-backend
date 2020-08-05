function updateDrive(rootFolderId: string){

    let previousVersion = (parseInt(oooVersion,10)-1).toString();
    let nix = "";
    for (let nullen = 0; nullen<4-previousVersion.length;nullen++){
      nix+="0";
    }
    previousVersion = nix+previousVersion;

    for (let rangeName of Object.keys(DriveConnector.oooVersionsRangeFileMap[oooVersion]))
    {
      const dataOldVersion = DriveConnector.getNamedRangeData(rootFolderId,rangeName,previousVersion);
      const dataNewVersion =  DriveConnector.getNamedRangeData(rootFolderId,rangeName,oooVersion);
      DriveConnector.saveNamedRangeData(rootFolderId,rangeName,dataNewVersion[0].length,dataOldVersion[0],dataOldVersion[1],dataOldVersion[2],oooVersion);
    }
    for (let valueName of Object.keys(DriveConnector.oooVersionValueFileMap[oooVersion]))
    {
      const dataOldVersion = DriveConnector.getValueByName(rootFolderId,valueName,previousVersion);
      DriveConnector.saveValueByName(rootFolderId,valueName,oooVersion,dataOldVersion)
    }
    for (let valuesName of Object.keys(DriveConnector.oooVersionValuesFileMap[oooVersion]))
    {
      const dataOldVersion = DriveConnector.getValuesByName(rootFolderId,valuesName,previousVersion);
      DriveConnector.saveValuesByName(rootFolderId,valuesName,oooVersion,dataOldVersion)
    }

    const rootFolder = DriveApp.getFolderById(rootFolderId);
    rootFolder.setName(rootFolder.getName().slice(0,-4)+oooVersion);

      return getOrCreateOfficeOneFolders();
   /* 
    var result = {
        serverFunction: ServerFunction.UStVAberechnen,
        UStVAD: BM.getUStVATableCache().getData(),
    }
      return JSON.stringify(result);
      */
}

