function saveDataArray(name: string, dataArray: any[][], archivFolder: GoogleAppsScript.Drive.Folder) {
    var debugSpreadsheet = SpreadsheetApp.create(name);
    var tempFile = DriveApp.getFileById(debugSpreadsheet.getId());
    archivFolder.addFile(tempFile);
    DriveApp.getRootFolder().removeFile(tempFile)
    debugSpreadsheet.getActiveSheet().getRange(1, 1, dataArray.length, dataArray[0].length).setValues(dataArray);
   /*
    var typen = new Array();
    for (var row in dataArray) {
        var typeArray = [];
        for (var column in dataArray[row]) {
            typeArray.push(typeof dataArray[row][column]);
        }
        typen.push(typeArray);
    }
    debugSpreadsheet.insertSheet().getRange(1, 1, dataArray.length, dataArray[0].length).setValues(typen);
*/
}
