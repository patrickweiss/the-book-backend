//This Enum is a copy of the WebApp ServerProxy.tsx enum, all these functions have to be implemented
//202002
//from the TypeScript GAS Boilerplate
//Client Version 0046.03
enum ServerFunction {
    getOrCreateRootFolder = "getOrCreateRootFolder",
    getOrCreateAusgabenFolder = "getOrCreateAusgabenFolder",
    getNamedRangeData = "getNamedRangeData",
    getSpreadsheetIdbyFolderIdAndName = "getSpreadsheetIdbyFolderIdAndName",
    EroeffnungsbilanzAusVorjahrAktualisieren = "EroeffnungsbilanzAusVorjahrAktualisieren",
    BuchungenFuerUmsatzsteuerBerechnenUndEintragen = "BuchungenFuerUmsatzsteuerBerechnenUndEintragen",
    businessModelUpdate = "businessModelUpdate",
    getOrCreateOfficeOneFolders = "getOrCreateOfficeOneFolders",
    SimbaExportErstellen = "SimbaExportErstellen",
    getOrCreateGutschriftenFolder = "getOrCreateGutschriftenFolder",
    gutschriftenFolderScannen ="gutschriftenFolderScannen",
    ausgabenFolderScannen = "ausgabenFolderScannen",
    bankbuchungenFolderScannen = "bankbuchungenFolderScannen",
    UStVAberechnen="UStVAberechnen"
}

const months = {
    '01': '(01) Januar',
    '02': '(02) Februar',
    '03': '(03) März',
    '04': '(04) April',
    '05': '(05) Mai',
    '06': '(06) Juni',
    '07': '(07) Juli',
    '08': '(08) August',
    '09': '(09) September',
    '10': '(10) Oktober',
    '11': '(11) November',
    '12': '(12) Dezember'
}
