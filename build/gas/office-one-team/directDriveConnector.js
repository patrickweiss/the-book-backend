function getOrCreateOfficeOneFolders() {
    var ooRootFolderIterator = DriveApp.getRootFolder().getFolders();
    var foldersArray = [];
    while (ooRootFolderIterator.hasNext()) {
        var folder = ooRootFolderIterator.next();
        var folderName = folder.getName();
        if (folderName.toString().indexOf(".Office") !== -1) {
            foldersArray.push({ id: folder.getId(), name: folderName });
        }
    }
    var result = {
        serverFunction: ServerFunction.getOrCreateOfficeOneFolders,
        foldersArray: foldersArray
    };
    return JSON.stringify(result);
}
function getOrCreateRootFolder(ooRootFolderLabel, ooRootFolderVersion) {
    Logger.log("getOrCreateRootFolder aufgerufen");
    var ooRootFolderIterator = DriveApp.getRootFolder().getFoldersByName(ooRootFolderLabel);
    var ooRootFolder = null;
    if (ooRootFolderIterator.hasNext())
        ooRootFolder = ooRootFolderIterator.next();
    if (ooRootFolder === null) {
        ooRootFolder = DriveApp.createFolder(ooRootFolderLabel);
        ooRootFolder.setDescription("Version " + ooRootFolderVersion);
    }
    var result = {
        serverFunction: ServerFunction.getOrCreateRootFolder,
        id: ooRootFolder.getId(),
        name: ooRootFolder.getName()
    };
    return JSON.stringify(result);
}
function getOrCreateAusgabenFolder(rootFolderId) {
    var rootFolder = DriveApp.getFolderById(rootFolderId);
    var ausgabenFolder = getOrCreateFolder(rootFolder, "2 Ausgaben");
    var result = {
        serverFunction: ServerFunction.getOrCreateAusgabenFolder,
        ausgabenFolder: {
            '01': getOrCreateFolder(ausgabenFolder, '(01) Januar').getId(),
            '02': getOrCreateFolder(ausgabenFolder, '(02) Februar').getId(),
            '03': getOrCreateFolder(ausgabenFolder, '(03) März').getId(),
            '04': getOrCreateFolder(ausgabenFolder, '(04) April').getId(),
            '05': getOrCreateFolder(ausgabenFolder, '(05) Mai').getId(),
            '06': getOrCreateFolder(ausgabenFolder, '(06) Juni').getId(),
            '07': getOrCreateFolder(ausgabenFolder, '(07) Juli').getId(),
            '08': getOrCreateFolder(ausgabenFolder, '(08) August').getId(),
            '09': getOrCreateFolder(ausgabenFolder, '(09) September').getId(),
            '10': getOrCreateFolder(ausgabenFolder, '(10) Oktober').getId(),
            '11': getOrCreateFolder(ausgabenFolder, '(11) November').getId(),
            '12': getOrCreateFolder(ausgabenFolder, '(12) Dezember').getId()
        }
    };
    return JSON.stringify(result);
}
function getOrCreateGutschriftenFolder(rootFolderId) {
    var rootFolder = DriveApp.getFolderById(rootFolderId);
    var einnahmenFolder = getOrCreateFolder(rootFolder, "1 Einnahmen");
    var gutschriftenFolder = getOrCreateFolder(einnahmenFolder, "4 Gutschriften");
    var result = {
        serverFunction: ServerFunction.getOrCreateGutschriftenFolder,
        gutschriftenFolder: {
            '01': getOrCreateFolder(gutschriftenFolder, '(01) Januar').getId(),
            '02': getOrCreateFolder(gutschriftenFolder, '(02) Februar').getId(),
            '03': getOrCreateFolder(gutschriftenFolder, '(03) März').getId(),
            '04': getOrCreateFolder(gutschriftenFolder, '(04) April').getId(),
            '05': getOrCreateFolder(gutschriftenFolder, '(05) Mai').getId(),
            '06': getOrCreateFolder(gutschriftenFolder, '(06) Juni').getId(),
            '07': getOrCreateFolder(gutschriftenFolder, '(07) Juli').getId(),
            '08': getOrCreateFolder(gutschriftenFolder, '(08) August').getId(),
            '09': getOrCreateFolder(gutschriftenFolder, '(09) September').getId(),
            '10': getOrCreateFolder(gutschriftenFolder, '(10) Oktober').getId(),
            '11': getOrCreateFolder(gutschriftenFolder, '(11) November').getId(),
            '12': getOrCreateFolder(gutschriftenFolder, '(12) Dezember').getId()
        }
    };
    return JSON.stringify(result);
}
function getNamedRangeData(rootFolderId, rangeName, version) {
    var result = {
        serverFunction: ServerFunction.getNamedRangeData,
        rangeName: rangeName,
        namedRangeData: DriveConnector.getNamedRangeData(rootFolderId, rangeName, version)
    };
    return JSON.stringify(result);
}
function getSpreadsheetIdbyFolderIdAndName(rootFolderId, spreadsheetName) {
    var spreadsheetId = DriveApp.getFolderById(rootFolderId).getFilesByName(spreadsheetName).next().getId();
    var result = {
        serverFunction: ServerFunction.getSpreadsheetIdbyFolderIdAndName,
        id: spreadsheetId,
        name: spreadsheetName
    };
    return JSON.stringify(result);
}
function getOrCreateFolder(rootFolder, folderName) {
    var folderIterator = rootFolder.getFoldersByName(folderName);
    if (folderIterator.hasNext())
        return folderIterator.next();
    else
        return rootFolder.createFolder(folderName);
}
