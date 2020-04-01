/// <reference types="google-apps-script" />
declare function getOrCreateOfficeOneFolders(): string;
declare function getOrCreateRootFolder(ooRootFolderLabel: any, ooRootFolderVersion: any): string;
declare function getOrCreateAusgabenFolder(rootFolderId: any): string;
declare function getOrCreateGutschriftenFolder(rootFolderId: any): string;
declare function getNamedRangeData(rootFolderId: any, rangeName: any, version: any): string;
declare function getSpreadsheetIdbyFolderIdAndName(rootFolderId: any, spreadsheetName: any): string;
declare function getOrCreateFolder(rootFolder: GoogleAppsScript.Drive.Folder, folderName: string): GoogleAppsScript.Drive.Folder;
