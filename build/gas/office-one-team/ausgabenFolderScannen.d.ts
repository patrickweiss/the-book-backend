declare function ausgabenFolderScannen(rootFolderId: string, month: string): string;
declare function wennBelegNeuIstEintragen(beleg: any, datum: any, BM: BusinessModel): void;
declare function updateNameFromDataAndTemplate(ausgabeRow: Buchung, template: string): void;
declare function neuenBewirtungsbelegEintragen(beleg: any, belegWoerter: any, monat: any, BM: BusinessModel): void;
declare function round2Fixed(value: any): number;
declare function neueAusgabeEintragen(beleg: any, belegWoerter: any, datum: any, BM: BusinessModel): void;
declare function netto(brutto: any, prozent: any): any;
declare function vorsteuer(brutto: any, prozent: any): number;
