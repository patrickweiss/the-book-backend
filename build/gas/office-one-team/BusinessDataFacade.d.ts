declare class TableCache {
    dataArray: Object[][];
    backgroundArray: string[][];
    formulaArray: string[][];
    columnIndex: {};
    private loadRowCount;
    private rootId;
    private tableName;
    private rowHashTable;
    private columnHashTable;
    private rowArray;
    constructor(rootId: string, tableName: string);
    getData(): Object[][][];
    protected getRowHashTable(): any;
    getOrCreateHashTable(columnName: string): any;
    protected addRowToHash(tableRow: TableRow): void;
    getRowArray(): any;
    getRowByIndex(rowIndex: string): TableRow;
    createNewRow(): TableRow;
    getOrCreateRowById(id: string): TableRow;
    save(): void;
    private getColumnIndex;
}
declare function padToFive(number: number): string;
declare class TableRow {
    private tableCache;
    private index;
    constructor(tableCache: TableCache, tableCacheIndex: string);
    getId(): any;
    setId(value: string): void;
    getTitlesArray(): Object[];
    getDataArray(): any;
    getTitle(columnName: string): string;
    getValueStringOrNumber(columnName: string): any;
    protected setValue(columnName: string, value: string | number | Date): void;
    getValue(columnName: string): any;
    protected setFormula(columnName: string, value: string): void;
    protected getFormula(columnName: string): any;
    protected getDateString(date: Date): string;
}
declare class AusgabenTableCache extends TableCache {
    constructor(rootId: string);
    createNewRow(): AusgabenRechnung;
    getRowByIndex(rowIndex: string): AusgabenRechnung;
    getOrCreateRowById(id: string): AusgabenRechnung;
}
declare class VertraegeTableCache extends TableCache {
    constructor(rootId: string);
    getRowByIndex(rowIndex: string): Vertrag;
    getOrCreateRowById(id: string): Vertrag;
}
declare class BewirtungsbelegeTableCache extends TableCache {
    constructor(rootId: string);
    createNewRow(): Bewirtungsbeleg;
    getRowByIndex(rowIndex: string): Bewirtungsbeleg;
    getOrCreateRowById(id: string): Bewirtungsbeleg;
}
declare class AbschreibungenTableCache extends TableCache {
    constructor(rootId: string);
    getRowByIndex(rowIndex: string): Abschreibung;
    getOrCreateRowById(id: string): Abschreibung;
}
declare class EinnahmenRechnungTableCache extends TableCache {
    constructor(rootId: string);
    getRowByIndex(rowIndex: string): EinnahmenRechnung;
    getOrCreateRowById(id: string): EinnahmenRechnung;
}
declare class GutschriftenTableCache extends TableCache {
    constructor(rootId: string);
    createNewRow(): Gutschrift;
    getRowByIndex(rowIndex: string): Gutschrift;
    getOrCreateRowById(id: string): Gutschrift;
}
declare class BankbuchungenTableCache extends TableCache {
    constructor(rootId: string);
    createNewRow(): Bankbuchung;
    getRowByIndex(rowIndex: string): Bankbuchung;
    getOrCreateRowById(id: string): Bankbuchung;
}
declare class UmbuchungenTableCache extends TableCache {
    constructor(rootId: string);
    createNewRow(): Umbuchung;
    getRowByIndex(rowIndex: string): Umbuchung;
    getOrCreateRowById(id: string): Umbuchung;
}
declare class KontenTableCache extends TableCache {
    constructor(rootId: string);
    getRowByIndex(rowIndex: string): Konto;
    getOrCreateRowById(kontoName: string): Konto;
}
declare class FinanzAction extends TableRow {
    getBetrag(): number;
    setBetrag(value: number): void;
    getDatum(): Date;
    setDatum(value: any): void;
    getKonto(): string;
    setKonto(value: string): void;
    getText(): any;
    setText(text: string): void;
}
declare class Buchung extends FinanzAction {
    getGegenkonto(): any;
    setGegenkonto(konto: string): void;
    getLink(): string;
    setLink(link: string): void;
    createLink(id: string, name: string): void;
}
declare class Umbuchung extends Buchung {
    getFileId(): any;
    setFileId(value: string): void;
    getBezahltAm(): any;
    setBezahltAm(datum: Date): void;
    nichtBezahlt(): boolean;
    isBezahlt(): boolean;
    getBetragMitVorzeichen(): number;
}
declare class Rechnung extends Umbuchung {
    getBezahltAm(): any;
    setBezahltAm(datum: Date): void;
    nichtBezahlt(): boolean;
    isBezahlt(): boolean;
    getBetrag(): any;
    setBetrag(value: any): void;
    getBetragMitVorzeichen(): any;
    getNettoBetrag(): any;
    setNettoBetrag(betrag: number): void;
    getMehrwertsteuer(): any;
    setMehrwertsteuer(value: any): void;
    getDateiTyp(): any;
    setDateiTyp(dateityp: string): void;
}
declare class EinnahmenRechnung extends Rechnung {
    getKonto(): string;
    getStatus(): any;
    setStatus(value: any): void;
    getRechnungsNr(): any;
    setRechnungsNr(value: any): void;
    getName(): any;
    setName(value: any): void;
    getLeistungvon(): any;
    setLeistungvon(value: any): void;
    getLeistungbis(): any;
    setLeistungbis(value: any): void;
    getNettoBetrag(): any;
    setNettoBetrag(value: any): void;
    getBetrag(): any;
    setBetrag(value: any): void;
    getBestellnummer(): any;
    setBestellnummer(value: any): void;
    getAdresszusatz(): any;
    setAdresszusatz(value: any): void;
    getStrasse(): any;
    setStrasse(value: any): void;
    getHausnummer(): any;
    setHausnummer(value: any): void;
    getPLZ(): any;
    setPLZ(value: any): void;
    getOrt(): any;
    setOrt(value: any): void;
    getLand(): any;
    setLand(value: any): void;
    getEMail(): any;
    setEMail(value: any): void;
    getGruss(): any;
    setGruss(value: any): void;
    getAnrede(): any;
    setAnrede(value: any): void;
    getVorname(): any;
    setVorname(value: any): void;
    getNachname(): any;
    setNachname(value: any): void;
    getGeburtsdatum(): any;
    setGeburtsdatum(value: any): void;
    getUStIdNr(): any;
    setUStIdNr(value: any): void;
    getDokumententyp(): any;
    setDokumententyp(value: any): void;
    getZahlungsziel(): any;
    setZahlungsziel(value: any): void;
}
declare class Gutschrift extends Rechnung {
    getKonto(): string;
    getName(): any;
    setName(value: string): void;
    getStatus(): any;
    setStatus(value: any): void;
    getNettoBetrag(): any;
    setNettoBetrag(value: any): void;
    getBetrag(): any;
    setBetrag(value: any): void;
    getDokumententyp(): any;
    setDokumententyp(value: any): void;
}
declare class AusgabenRechnung extends Rechnung {
    getMehrwertsteuer(): any;
    setMehrwertsteuer(betrag: number): void;
    getBetragMitVorzeichen(): number;
}
declare class Bewirtungsbeleg extends AusgabenRechnung {
    getFileId(): any;
    setFileId(value: string): void;
    getTrinkgeld(): any;
    setTrinkgeld(betrag: number): void;
    getAbziehbareBewirtungskosten(): any;
    setAbziehbareBewirtungskosten(value: any): void;
    getNichtAbziehbareBewirtungskosten(): any;
    setNichtAbziehbareBewirtungskosten(value: any): void;
}
declare class Abschreibung extends Buchung {
}
declare class Vertrag extends Umbuchung {
    getBezahltAm(): string;
    setBezahltAm(datum: Date): void;
    nichtBezahlt(): boolean;
    isBezahlt(): boolean;
    getGegenkonto(): any;
}
declare class Bankbuchung extends Buchung {
    getKonto(): any;
    setKonto(value: string): void;
    getNr(): any;
    setNr(value: string): void;
    getBelegID(): any;
    setBelegID(value: string): void;
    getGegenkontoBank(): any;
    setGegenkontoBank(value: string): void;
}
declare class Konto extends TableRow {
    getId(): any;
    setId(value: string): void;
    getKontentyp(): any;
    setKontentyp(value: any): void;
    getSubtyp(): string;
    setSubtyp(value: any): void;
    getGruppe(): any;
    setGruppe(value: any): void;
    getKonto(): any;
    setKonto(value: any): void;
    getSKR03(): any;
    setSKR03(value: any): void;
    getExportgruppe(): any;
    setExportgruppe(value: any): void;
    getBeispiel(): any;
    setBeispiel(value: any): void;
    getQuelle(): any;
    setQuelle(value: any): void;
    getFormular(): any;
    setFormular(value: any): void;
    getZN(): any;
    setZN(value: any): void;
    isAnlage(): boolean;
    isBestandskonto(): boolean;
    isBankkonto(): boolean;
    getSumme(): any;
    getDefaultMwSt(): any;
}
declare function uid(): string;
