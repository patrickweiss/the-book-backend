declare const oooVersion = "0046";
declare class DriveConnector {
    static driveFolders: {};
    static spreadsheets: {};
    static rangeValues: {};
    static oooVersions: {
        "0046": {
            AusgabenD: string;
            AusgabenDatei: string;
            BewirtungsbelegeD: string;
            AbschreibungenD: string;
            "VerträgeD": string;
            KontenD: string;
            KontenJahr: string;
            BankbuchungenD: string;
            UmbuchungenD: string;
            RechnungenD: string;
            GutschriftenD: string;
            "1 Rechnung schreiben - Version:0046": string;
            "2 Ausgaben erfassen - Version:0046": string;
            "3 Bankbuchungen zuordnen - Version:0046": string;
            "4 Bilanz, Gewinn und Steuererklärungen - Version:0046": string;
        };
        "0045": {
            AusgabenD: string;
            AusgabenDatei: string;
            BewirtungsbelegeD: string;
            AbschreibungenD: string;
            "VerträgeD": string;
            KontenD: string;
            KontenJahr: string;
            BankbuchungenD: string;
            UmbuchungenD: string;
            RechnungenD: string;
            GutschriftenD: string;
            "1 Rechnung schreiben - Version:0045": string;
            "2 Ausgaben erfassen - Version:0045": string;
            "3 Bankbuchungen zuordnen - Version:0045": string;
            "4 Bilanz, Gewinn und Steuererklärungen - Version:0045": string;
        };
    };
    static getNamedRangeData(rootFolderId: string, rangeName: string, vers: string): [Object[][], string[][], string[][]];
    static getRangeFileName(rangeName: string, version: string): any;
    static getMasterFileID(rangeName: string, version: string): any;
    static getValueByName(rootFolderId: string, rangeName: string, version: string): any;
    static saveNamedRangeData(rootFolderId: string, rangeName: string, loadRowCount: any, dataArray: Object[][], backgroundArray: string[][], formulaArray: Object[][]): void;
    static getSpreadsheet(rootFolderId: string, rangeName: string, version: string): any;
    private static copyAndInitializeSpreadsheet;
}
declare function generateAndMailTableRow(): void;
