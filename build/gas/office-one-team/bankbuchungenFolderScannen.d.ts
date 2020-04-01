declare function bankbuchungenFolderScannen(rootFolderId: string, month: string): string;
declare function gehaltsbuchungenImportieren(beleg: any, BM: BusinessModel): string;
declare function bankbuchungenImportieren(beleg: any, BM: BusinessModel): number;
declare class CSVTransaction {
    WertstellungsDatum: Date;
    Betrag: number;
    Buchungstext: string;
    isValid: boolean;
    isPlanned: boolean;
    datumString: string;
    constructor(element: any, konto: any, geschaeftsjahr: any);
}
declare function parseDateFromCSVString(date: string): Date;
