declare enum BelegTyp {
    Ausgabe = "Ausgabe",
    Bewirtungsbeleg = "Bewirtungsbeleg",
    Rechnung = "Rechnung",
    Gutschrift = "Gutschrift",
    Umbuchung = "Umbuchung",
    Vertrag = "Vertrag"
}
declare enum Type {
    INIT = "@@INIT",
    UpdateSigninStatus = "UpdateSigninStatus",
    ChangeLeaf = "ChangeLeaf",
    ChangeBuchungsperiode = "ChangeBuchungsperiode",
    ChangeLeafContent = "ChangeLeafContent",
    TypePressed = "TypePressed",
    KontoSelected = "KontoSelected",
    MwstSelected = "MwstSelected",
    GegenkontoSelected = "GegenkontoSelected",
    PhotoGemacht = "PhotoGemacht",
    ServerCall = "ServerCall",
    ServerResponse = "ServerResponse",
    BelegSpeichern = "BelegSpeichern",
    BelegZuBankbuchungZuordnen = "BelegZuBankbuchungZuordnen",
    AusgabeBuchen = "AusgabeBuchen",
    GutschriftBuchen = "GutschriftBuchen"
}
interface IAction {
    type: Type;
}
interface IBelegZuBankbuchungZuordnen extends IAction {
    belegTyp: BelegTyp;
    belegID: string;
    bankbuchungID: string;
    datum: Date;
}
declare class BusinessModel {
    private rootFolderId;
    private einnahmenRechnungTableCache;
    private gutschriftenTableCache;
    private ausgabenTableCache;
    private bewirtungsbelegeTableCache;
    private abschreibungenTableCache;
    private vertraegeTableCache;
    private bankbuchungenTableCache;
    private umbuchungenTableCache;
    private kontenTableCache;
    constructor(rootfolderId: string);
    endOfYear(): Date;
    getRootFolderId(): string;
    handleAction(action: any): void;
    getEinnahmenRechnungArray(): EinnahmenRechnung[];
    getOrCreateEinnahmenRechnung(id: string): EinnahmenRechnung;
    getOffeneEinnahmenRechnungArray(): EinnahmenRechnung[];
    getRechnungenFuerMonat(monat: string): EinnahmenRechnung[];
    getImGeschaeftsjahrBezahlteEinnahmenRechnungen(): EinnahmenRechnung[];
    getGutschriftenArray(): Gutschrift[];
    createGutschrift(): Gutschrift;
    getOrCreateGutschrift(id: string): Gutschrift;
    getOffeneGutschriftenArray(): Gutschrift[];
    getGutschriftenFuerMonat(monat: string): Gutschrift[];
    getImGeschaeftsjahrBezahlteGutschriften(): Gutschrift[];
    getAusgabenRechnungArray(): AusgabenRechnung[];
    createAusgabenRechnung(): AusgabenRechnung;
    getOrCreateAusgabenRechnung(id: string): AusgabenRechnung;
    getOffeneAusgabenRechnungArray(): AusgabenRechnung[];
    getAusgabenFuerMonat(monat: string): AusgabenRechnung[];
    getAnlagenAusAusgabenRechnungArray(): AusgabenRechnung[];
    private belegZuordnen;
    getBewirtungsbelegeArray(): Bewirtungsbeleg[];
    createBewirtungsbeleg(): Bewirtungsbeleg;
    getOrCreateBewirtungsbeleg(id: string): Bewirtungsbeleg;
    getOffeneBewirtungsbelegeArray(): Bewirtungsbeleg[];
    getAbschreibungenArray(): Abschreibung[];
    getOrCreateAbschreibung(id: string): Abschreibung;
    getAbschreibungenZuAnlageArray(anlageKonto: string): Abschreibung[];
    getVertraegeArray(): Vertrag[];
    getOrCreateVertrag(id: string): Vertrag;
    getOffeneVertraegeArray(): Vertrag[];
    getBankbuchungenArray(): Bankbuchung[];
    getOrCreateBankbuchung(id: string): Bankbuchung;
    getBankbuchungenNichtZugeordnetArray(): Bankbuchung[];
    createBankbuchung(): Bankbuchung;
    getBankbestand(konto: string): number;
    getBankbuchungLatest(konto: string): Bankbuchung;
    getUmbuchungenArray(): Umbuchung[];
    createUmbuchung(): Umbuchung;
    getOrCreateUmbuchung(id: string): Umbuchung;
    getOffeneUmbuchungenArray(): Umbuchung[];
    getKontenArray(): Konto[];
    getOrCreateKonto(id: string): Konto;
    getBestandskontenArray(): Konto[];
    getKontenAusgabe(): Konto[];
    getBankkontenAusKontenArray(): Konto[];
    private createKontoFromAusgabe;
    umsatzsteuerJahresabrechnung(): void;
    getUStVAVorjahr(): AusgabenRechnung[];
    save(): void;
    private getEinnahmenRechnungTableCache;
    private getGutschriftenTableCache;
    getAusgabenTableCache(): AusgabenTableCache;
    getBewirtungsbelegeTableCache(): BewirtungsbelegeTableCache;
    private getAbschreibungenTableCache;
    private getVertraegeTableCache;
    getBankbuchungenTableCache(): BankbuchungenTableCache;
    private getUmbuchungenTableCache;
    private getKontenTableCache;
    netto(brutto: number, prozent: string): number;
    mehrwertsteuer(brutto: number, prozent: string): number;
    germanDate(datum: Date): string;
}
declare function padToFour(number: number): string;
declare function moneyString(number: number): string;
