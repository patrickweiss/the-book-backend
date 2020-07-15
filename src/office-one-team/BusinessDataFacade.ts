class TableCache {
  dataArray: Object[][];
  backgroundArray: string[][];
  formulaArray: string[][];
  columnIndex: {};
  private loadRowCount: number;
  private rootId: string;
  private tableName: string;
  private rowHashTable;
  private columnHashTable = {};
  private rowArray: TableRow[];
  constructor(rootId: string, tableName: string) {
    const data = DriveConnector.getNamedRangeData(rootId, tableName, oooVersion);
    this.dataArray = data[0];
    this.backgroundArray = data[1];
    this.formulaArray = data[2];
    this.columnIndex = this.getColumnIndex(this.dataArray[0]);
    this.loadRowCount = this.dataArray.length;
    this.rootId = rootId;
    this.tableName = tableName;
  }
  public getData() {
    return [this.dataArray, this.backgroundArray, this.formulaArray];
  }
  public getRowHashTable() {
    if (this.rowHashTable === undefined) {
      this.rowHashTable = {};
      for (var index in this.dataArray) {
        if (index !== "0" && this.getRowByIndex(index).getId() !== "") {
          this.addRowToHash(this.getRowByIndex(index))
        }
      }
    }
    return this.rowHashTable;
  }
  public getOrCreateHashTable(columnName: string): Object {
    if (this.columnHashTable[columnName] === undefined) {
      this.columnHashTable[columnName] = {};
      for (let index in this.dataArray) {
        if (index !== "0") {
          let tableRow = this.getRowByIndex(index);
          this.columnHashTable[columnName][tableRow.getValue(columnName)] = tableRow;
        }
      }
    }
    return this.columnHashTable[columnName]
  }
  protected addRowToHash(tableRow: TableRow) {
    this.rowHashTable[tableRow.getId()] = tableRow;
  }
  public getRowArray() {
    if (this.rowArray === undefined) {
      this.rowArray = [];
      for (var index in this.dataArray) {
        if (index !== "0") this.rowArray.push(this.getRowByIndex(index));
      }
    }
    return this.rowArray;
  }
  public getRowByIndex(rowIndex: string): TableRow {
    return new TableRow(this, rowIndex);
  }
  public createNewRow() {
    let newDataArray = Array.apply(null, Array(this.dataArray[0].length)).map(String.prototype.valueOf, "")
    let newFormulaArray = new Array(this.formulaArray[0].length);
    let newBackgroundArray = Array.apply(null, Array(this.backgroundArray[0].length)).map(String.prototype.valueOf, "white");
    this.dataArray.splice(1, 0, newDataArray);
    this.formulaArray.splice(1, 0, newFormulaArray);
    this.backgroundArray.splice(1, 0, newBackgroundArray);
    let tableRow = this.getRowByIndex("1");
    tableRow.setId(this.dataArray[0][0].toString());
    delete this.rowHashTable;
    delete this.columnHashTable;
    this.columnHashTable = {};
    if (this.rowArray) delete this.rowArray;
    this.getRowHashTable();
    this.dataArray[0][0] = this.dataArray[0][0].toString().substr(0, 6) + padToFive(parseInt(this.dataArray[0][0].toString().substr(6, 5), 10) + 1);
    return tableRow;
  }
  public getOrCreateRowById(id: string): TableRow {
    if (id === "") throw new Error("Empty string is not allowed as id:" + this.tableName + new Error().stack);
    let tableRow = this.getRowHashTable()[id];
    if (tableRow === undefined) {
      let newDataArray = Array.apply(null, Array(this.dataArray[0].length)).map(String.prototype.valueOf, "")
      let newFormulaArray = new Array(this.formulaArray[0].length);
      let newBackgroundArray = Array.apply(null, Array(this.backgroundArray[0].length)).map(String.prototype.valueOf, "white");
      this.dataArray.splice(1, 0, newDataArray);
      this.formulaArray.splice(1, 0, newFormulaArray);
      this.backgroundArray.splice(1, 0, newBackgroundArray);
      tableRow = this.getRowByIndex("1");
      tableRow.setId(id);
      delete this.rowHashTable;
      if (this.rowArray) delete this.rowArray;
      this.getRowHashTable();
    }
    return tableRow;
  }
  public save() {
    DriveConnector.saveNamedRangeData(this.rootId, this.tableName, this.loadRowCount, this.dataArray, this.backgroundArray, this.formulaArray);
  }
  public deleteAll() {
    this.dataArray = [this.dataArray[0]];
    this.formulaArray = [this.formulaArray[0]];
    this.backgroundArray = [this.backgroundArray[0]];
  }
  private getColumnIndex(dataColumnNames) {
    var spalte = {};
    for (var index in dataColumnNames) {
      spalte[dataColumnNames[index]] = index;
    }
    return spalte;
  }
}
// Generic code for client and server identical
function padToFive(number: number) { return ("0000" + number).slice(-5); }
//Abstrakte Basisklasse fuer Tabellenzeilen
class TableRow {
  private tableCache: TableCache;
  private index: string;
  constructor(tableCache: TableCache, tableCacheIndex: string) {
    if (tableCacheIndex == "0") throw new Error("TableRow with index 0 contains column names, no data");
    this.tableCache = tableCache;
    this.index = tableCacheIndex;
  }
  public getId() { return this.getDataArray()[0].toString(); }
  public setId(value: string) { this.getDataArray()[0] = value; }
  public getTitlesArray() { return this.tableCache.dataArray[0]; }
  public getDataArray() { return this.tableCache.dataArray[this.index]; }
  public getTitle(columnName: string) { return this.tableCache.dataArray[0][this.tableCache.columnIndex[columnName]].toString(); }
  public getValueStringOrNumber(columnName: string) {
    const value = this.tableCache.dataArray[this.index][this.tableCache.columnIndex[columnName]];
    if (typeof value === "string") {
      let a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
      if (a) {
        return this.getDateString(new Date(value));
      } else if (columnName === "ID" || columnName === "Nr") return value.substr(0, 5); else return value.substr(0, 20);
    }
    if (value instanceof Date) {
      return this.getDateString(new Date(value));
    }
    return value.toFixed(2).replace(".", ",");
  }
  public setValue(columnName: string, value: string | number | Date) {
    this.tableCache.dataArray[this.index][this.tableCache.columnIndex[columnName]] = value;
  }
  public getValue(columnName: string) {
    return this.tableCache.dataArray[this.index][this.tableCache.columnIndex[columnName]];
  }
  protected setFormula(columnName: string, value: string) {
    this.tableCache.formulaArray[this.index][this.tableCache.columnIndex[columnName]] = value;
  }
  protected getFormula(columnName: string) {
    return this.tableCache.formulaArray[this.index][this.tableCache.columnIndex[columnName]];
  }
  protected getDateString(date: Date) {
    var mm = date.getMonth() + 1; // getMonth() is zero-based
    var dd = date.getDate();

    return [date.getFullYear(),
    (mm > 9 ? '' : '0') + mm,
    (dd > 9 ? '' : '0') + dd
    ].join('')
  }
}
//Caches der Tabellen Daten
class AusgabenTableCache extends TableCache {
  constructor(rootId: string) { super(rootId, "AusgabenD"); }
  public createNewRow(): AusgabenRechnung { return super.createNewRow() as AusgabenRechnung; }
  public getRowByIndex(rowIndex: string): AusgabenRechnung { return new AusgabenRechnung(this, rowIndex); }
  public getOrCreateRowById(id: string): AusgabenRechnung { return super.getOrCreateRowById(id) as AusgabenRechnung; }
}
class VertraegeTableCache extends TableCache {
  constructor(rootId: string) {
    super(rootId, "VerträgeD");
  }
  public getRowByIndex(rowIndex: string): Vertrag {
    return new Vertrag(this, rowIndex);
  }
  public getOrCreateRowById(id: string): Vertrag {
    return super.getOrCreateRowById(id) as Vertrag;
  }
}
class BewirtungsbelegeTableCache extends TableCache {
  constructor(rootId: string) {
    super(rootId, "BewirtungsbelegeD");
  }
  public createNewRow(): Bewirtungsbeleg { return super.createNewRow() as Bewirtungsbeleg; }
  public getRowByIndex(rowIndex: string): Bewirtungsbeleg {
    return new Bewirtungsbeleg(this, rowIndex);
  }
  public getOrCreateRowById(id: string): Bewirtungsbeleg {
    return super.getOrCreateRowById(id) as Bewirtungsbeleg;
  }

}
class AbschreibungenTableCache extends TableCache {
  constructor(rootId: string) {
    super(rootId, "AbschreibungenD");
  }
  public getRowByIndex(rowIndex: string): Abschreibung {
    return new Abschreibung(this, rowIndex) as Abschreibung;
  }
  public getOrCreateRowById(id: string): Abschreibung {
    return super.getOrCreateRowById(id) as Abschreibung;
  }
}
class VerpflegungsmehraufwendungenTableCache extends TableCache {
  constructor(rootId: string) {
    super(rootId, "VerpflegungsmehraufwendungenD");
  }
  public getRowByIndex(rowIndex: string): Verpflegungsmehraufwendung {
    return new Verpflegungsmehraufwendung(this, rowIndex) as Verpflegungsmehraufwendung;
  }
  public getOrCreateRowById(id: string): Verpflegungsmehraufwendung {
    return super.getOrCreateRowById(id) as Verpflegungsmehraufwendung;
  }
}
class EinnahmenRechnungTableCache extends TableCache {
  constructor(rootId: string) {
    super(rootId, "RechnungenD");
  }
  public getRowByIndex(rowIndex: string): EinnahmenRechnung {
    return new EinnahmenRechnung(this, rowIndex);
  }
  public getOrCreateRowById(id: string): EinnahmenRechnung {
    return super.getOrCreateRowById(id) as EinnahmenRechnung;
  }
}
class EURechnungTableCache extends TableCache {
  constructor(rootId: string) {
    super(rootId, "EURechnungenD");
  }
  public getRowByIndex(rowIndex: string): EURechnung {
    return new EURechnung(this, rowIndex);
  }
  public getOrCreateRowById(id: string): EURechnung {
    return super.getOrCreateRowById(id) as EURechnung;
  }
}
class GutschriftenTableCache extends TableCache {
  constructor(rootId: string) {
    super(rootId, "GutschriftenD");
  }
  public createNewRow(): Gutschrift { return super.createNewRow() as Gutschrift; }

  public getRowByIndex(rowIndex: string): Gutschrift {
    return new Gutschrift(this, rowIndex);
  }
  public getOrCreateRowById(id: string): Gutschrift {
    return super.getOrCreateRowById(id) as Gutschrift;
  }
}
class BankbuchungenTableCache extends TableCache {
  constructor(rootId: string) {
    super(rootId, "BankbuchungenD");
  }
  public createNewRow(): Bankbuchung { return super.createNewRow() as Bankbuchung; }
  public getRowByIndex(rowIndex: string): Bankbuchung {
    return new Bankbuchung(this, rowIndex) as Bankbuchung;
  }
  public getOrCreateRowById(id: string): Bankbuchung {
    return super.getOrCreateRowById(id) as Bankbuchung;
  }
}
class UmbuchungenTableCache extends TableCache {
  constructor(rootId: string) {
    super(rootId, "UmbuchungenD");
  }
  public createNewRow(): Umbuchung { return super.createNewRow() as Umbuchung; }
  public getRowByIndex(rowIndex: string): Umbuchung {
    return new Umbuchung(this, rowIndex) as Umbuchung;
  }
  public getOrCreateRowById(id: string): Umbuchung {
    return super.getOrCreateRowById(id) as Umbuchung;
  }
}
class KontenTableCache extends TableCache {
  private kontenSpalten: Object;
  constructor(rootId: string) {
    super(rootId, "KontenD");
  }
  public getRowByIndex(rowIndex: string): Konto {
    return new Konto(this, rowIndex) as Konto;
  }
  public getOrCreateRowById(kontoName: string): Konto {
    return super.getOrCreateRowById(kontoName) as Konto;
  }
  public setKontenSpalten(geschaeftsjahr: number) {
    this.kontenSpalten = {
      "1": "Januar",
      "2": "Februar",
      "3": "März",
      "4": "April",
      "5": "Mai",
      "6": "Juni",
      "7": "Juli",
      "8": "August",
      "9": "September",
      "10": "Oktober",
      "11": "November",
      "12": "Dezember",
      "-1": (geschaeftsjahr - 1).toString(),
      "-2": (geschaeftsjahr - 2).toString(),
      "-3": (geschaeftsjahr - 3).toString(),
      "-4": "Vorjahre",
      "13": (geschaeftsjahr + 1).toString(),
    };
  }
  public getKontenSpalten(): Object {
    return this.kontenSpalten;
  }
  public bilanzSummenAktualisieren(normalisierteBuchungen: NormalisierteBuchung[]) {
    //Alle Kontensummen und -daten löschen
    for (let zeile in this.dataArray) {
      if (zeile !== "0") {
        let konto = this.getRowByIndex(zeile);
        konto.setValue("Erste Buchung", "-");
        konto.setValue("Betrag", "-");
        konto.setValue("Vorjahre", "-");
        for (let spalte in this.getKontenSpalten()) {
          konto.setValue(this.getKontenSpalten()[spalte], "-");
        }
        konto.setValue("Summe", "-");
      }
    }

    //Kontenspalte befüllen
    for (let buchungRow of normalisierteBuchungen) {
      let kontoRow = this.getOrCreateRowById(buchungRow.getKonto());
      if (kontoRow.getQuelle() === "") kontoRow.setQuelle(buchungRow.getQuelltabelle());
      if (kontoRow.getBeispiel() === "") kontoRow.setBeispiel(buchungRow.getLink());
      //Kontenspalte befüllen
      let monat: string = buchungRow.getMonat().toString();
      let kontenSpalte = this.getKontenSpalten()[monat];
      //Beträge summieren
      var aktuellerBetrag = Number(buchungRow.getValue("Betrag"));
      var aktuelleSumme = Number(kontoRow.getValue(kontenSpalte));
      if (isNaN(aktuelleSumme)) aktuelleSumme = 0;
      kontoRow.setValue(kontenSpalte, aktuellerBetrag + aktuelleSumme);
      var gesamtSumme = Number(kontoRow.getValue("Summe"));
      if (isNaN(gesamtSumme)) gesamtSumme = 0;
      //für GuV Konten werden nur die Monate 1-12 in der Summe berücksichtigt
      if (kontoRow.getValue("Kontentyp") == "GuV") {
        if (parseInt(monat) > 0 && parseInt(monat) < 13 && monat != "") kontoRow.setValue("Summe", aktuellerBetrag + gesamtSumme);
      } else
        if (monat != "13") kontoRow.setValue("Summe", aktuellerBetrag + gesamtSumme);
    }

  }
}
class UStVATableCache extends TableCache {
  constructor(rootId: string) {
    super(rootId, "UStVAD");
  }
  public createNewRow(): UStVA { return super.createNewRow() as UStVA; }
  public getRowByIndex(rowIndex: string): UStVA { return new UStVA(this, rowIndex); }
  public getOrCreateRowById(id: string): UStVA { return super.getOrCreateRowById(id) as UStVA; }
  public UStVASummenAktualisieren(normalisierteBuchungen: NormalisierteBuchung[], beginnOfYear: Date) {
    this.deleteAll();
    //ZN spalte befüllen


    // alle Eintrage mit Status "aktuelle Daten" neu generieren
    //Stati: "aktuelle Daten", "verschickt","bestätigt", "berichtigt"  


    let periodeUndStatusMonatlich = {
      "1": "01 Januar",
      "2": "02 Februar",
      "3": "03 März",
      "4": "04 April",
      "5": "05 Mai",
      "6": "06 Juni",
      "7": "07 Juli",
      "8": "08 August",
      "9": "09 September",
      "10": "10 Oktober",
      "11": "11 November",
      "12": "12 Dezember"
    }
    let periodeUndStatusProQuartal = {
      "1": "1. Quartal",
      "2": "1. Quartal",
      "3": "1. Quartal",
      "4": "2. Quartal",
      "5": "2. Quartal",
      "6": "2. Quartal",
      "7": "3. Quartal",
      "8": "3. Quartal",
      "9": "3. Quartal",
      "10": "4. Quartal",
      "11": "4. Quartal",
      "12": "4. Quartal"
    }

    //let periodenHash = periodeUndStatusProQuartal;
    this.aktualisieren(periodeUndStatusMonatlich, normalisierteBuchungen, beginnOfYear);
    this.aktualisieren(periodeUndStatusProQuartal, normalisierteBuchungen, beginnOfYear);
  }
  private aktualisieren(periodenHash: Object, normalisierteBuchungen: NormalisierteBuchung[], beginnOfYear: Date) {
    let summenHash = this.getOrCreateHashTable("Periode und Status");
    //alle Perioden initialisieren------------------------------------------------------------------------------------------------------
    for (var index in periodenHash) {
      let periode = periodenHash[index];
      let ustvaRow = summenHash[periode] as UStVA;
      if (ustvaRow == undefined) {
        ustvaRow = this.createNewRow();
        ustvaRow.setValue("Periode und Status", periode);
        summenHash = this.getOrCreateHashTable("Periode und Status");
        ustvaRow.setDatum(
          new Date( beginnOfYear.getFullYear() , parseInt(index)-1 )
        );
      }
      ustvaRow.setValue("erstellt am", new Date());
      ustvaRow.setValue("21", 0);
      ustvaRow.setValue("81", 0);
      ustvaRow.setValue("66", 0);
      ustvaRow.setValue("83", 0);
    }

    //Summen für Formularfelder aus Buchungen berechnen---------------------------------------------------------------------------------
    for (let buchungRow of normalisierteBuchungen) {
      if (buchungRow.getValue("Text") !== "Umsatzsteuer = Umsatzsteuer 19% - Vorsteuer") {
        switch (buchungRow.getValue("Gegenkonto")) {
          case "USt. in Rechnung gestellt":
            var monat = buchungRow.getValue("Monat bezahlt").toString();
            if (monat == "") break;//wenn nicht bezahlt wurde, muss bei Ist-Versteuerung keine Mehrwertsteuer bezahlt werden
            var periode = periodenHash[monat];
            if (periode == undefined) break;
            var ustvaRow = summenHash[periode];
            var aktuellerBetrag = Number(buchungRow.getValue("Betrag")) / 0.19;
            var aktuelleSumme = ustvaRow.getValue("81");
            ustvaRow.setValue("81", aktuellerBetrag + aktuelleSumme);
            break;
          case "Vorsteuer":
            var monat = buchungRow.getValue("Monat").toString();
            var periode = periodenHash[monat];
            if (periode == undefined) break;
            var ustvaRow = summenHash[periode];
            var aktuellerBetrag = -Number(buchungRow.getValue("Betrag"));
            var aktuelleSumme = ustvaRow.getValue("66");
            ustvaRow.setValue("66", aktuellerBetrag + aktuelleSumme);
            break;
          default:
            break;
        }
      }
    }
    //Feld 81 runden Feld 83 berechnen
    for (var index in periodenHash) {
      var periode = periodenHash[index];
      ustvaRow = summenHash[periode];
      ustvaRow.setValue("81", Math.floor(ustvaRow.getValue("81")));
      ustvaRow.setValue("83", ustvaRow.getValue("81") * 0.19 - ustvaRow.getValue("66"));
    }
  }
}
class EURTableCache extends TableCache {
  private kontenSpalten: Object;
  constructor(rootId: string) {
    super(rootId, "EÜRD");
  }
  public getRowByIndex(rowIndex: string): EUR {
    return new EUR(this, rowIndex) as EUR;
  }
  public getOrCreateRowById(ZN: string): EUR {
    return super.getOrCreateRowById(ZN) as EUR;
  }
  public setKontenSpalten(geschaeftsjahr: number) {
    this.kontenSpalten = {
      "1": "Januar",
      "2": "Februar",
      "3": "März",
      "4": "April",
      "5": "Mai",
      "6": "Juni",
      "7": "Juli",
      "8": "August",
      "9": "September",
      "10": "Oktober",
      "11": "November",
      "12": "Dezember",
      "-1": (geschaeftsjahr - 1).toString(),
      "-2": (geschaeftsjahr - 2).toString(),
      "-3": (geschaeftsjahr - 3).toString(),
      "-4": "Vorjahre",
      "13": (geschaeftsjahr + 1).toString(),
    };
  }
  public getKontenSpalten(): Object {
    return this.kontenSpalten;
  }
  public eurSummenAktualisieren(normalisierteBuchungen: NormalisierteBuchung[]) {
    this.deleteAll();
    //ZN spalte befüllen
    for (let buchungRow of normalisierteBuchungen) {
      let zn = buchungRow.getZN();
      if (buchungRow.getZN() === "") zn = "keine ZN";
      let znRow = this.getOrCreateRowById(zn);
      //Kontenspalte befüllen
      let monat: string = buchungRow.getMonatbezahlt().toString();
      if (monat !== "") {
        let kontenSpalte = this.getKontenSpalten()[monat];
        //Beträge summieren
        let aktuellerBetrag = Number(buchungRow.getValue("Betrag"));
        let aktuelleSumme = Number(znRow.getValue(kontenSpalte));
        if (isNaN(aktuelleSumme)) aktuelleSumme = 0;
        znRow.setValue(kontenSpalte, aktuellerBetrag + aktuelleSumme);
        let gesamtSumme = Number(znRow.getValue("Summe"));
        if (isNaN(gesamtSumme)) gesamtSumme = 0;
        if (parseInt(monat) > 0 && parseInt(monat) < 13) znRow.setValue("Summe", aktuellerBetrag + gesamtSumme);
      }
    }
  }
}
class NormalisierteBuchungenTableCache extends TableCache {
  constructor(rootId: string) {
    super(rootId, "BuchungenD");
  }
  public createNewRow(): NormalisierteBuchung { return super.createNewRow() as NormalisierteBuchung; }
  public getRowByIndex(rowIndex: string): NormalisierteBuchung {
    return new NormalisierteBuchung(this, rowIndex) as NormalisierteBuchung;
  }
  public getOrCreateRowById(id: string): NormalisierteBuchung {
    return super.getOrCreateRowById(id) as NormalisierteBuchung;
  }
  public kontenStammdatenAktualisieren(kontenTableCache: KontenTableCache) {
    const buchungen = this.getRowArray() as NormalisierteBuchung[];
    buchungen.forEach(buchung => {
      let konto: Konto = kontenTableCache.getRowHashTable()[buchung.getKonto()] as Konto;
      if (!konto) konto = kontenTableCache.getOrCreateRowById(buchung.getKonto());
      buchung.setKontentyp(konto.getKontentyp());
      buchung.setSubtyp(konto.getSubtyp());
      buchung.setGruppe(konto.getGruppe());
      buchung.setSKR03(konto.getSKR03());
      buchung.setFormular(konto.getFormular());
      buchung.setZN(konto.getZN());
    })
  }
}
//Abstrakte Fassaden für Buchungssätze ---------------------------------------------------------------------------------
class FinanzAction extends TableRow {
  public getBetrag(): number { return this.getValue("Betrag"); }
  public setBetrag(value: number) { this.setValue("Betrag", value); }
  public getDatum() { return new Date(this.getValue("Datum")); }
  public setDatum(value: any) { this.setValue("Datum", value); }
  public getKonto(): string { return this.getValue("Konto") }
  public setKonto(value: string) { this.setValue("Konto", value); }
  public getText() { return this.getValue("Text"); }
  public setText(text: string) { this.setValue("Text", text); }
}
class Buchung extends FinanzAction {
  public getGegenkonto() { return this.getValue("Gegenkonto"); }
  public setGegenkonto(konto: string) { this.setValue("Gegenkonto", konto); }
  public getLink(): string { return this.getFormula("Link"); }
  public setLink(link: string) { this.setFormula("Link", link); }
  public createLink(id: string, name: string) { this.setFormula("Link", "=HYPERLINK(\"https://drive.google.com/file/d/" + id + "\";\"" + name + "\")"); }
  protected monat: number;
  protected monatBezahlt: Number | "offen" = "offen";

}
class Umbuchung extends Buchung {
  public getNettoBetragMitVorzeichen() { return this.getBetragMitVorzeichen() };
  public getBetragMitVorzeichen() { return -this.getBetrag() };
  public getFileId() { return this.getValue("ID"); }
  public setFileId(value: string) { this.setValue("ID", value); }
  public getBezahltAm() { return this.getValue("bezahlt am"); }
  public setBezahltAm(datum: Date) { this.setValue("bezahlt am", datum); }
  public nichtBezahlt(): boolean { return this.getBezahltAm() === ""; }
  public isBezahlt(): boolean { return !this.nichtBezahlt(); }
  public addToTableCache(tableCache: NormalisierteBuchungenTableCache, geschaeftsjahr: Date, quellTabelle: string) {
    this.monat = belegMonat(geschaeftsjahr, this.getValue("Datum"));
    if (this.monat === null) this.monat = Number.NaN;
    if (this.getBezahltAm() !== "offen") this.monatBezahlt = bezahltMonat(geschaeftsjahr, this.getBezahltAm());

    //Buchung auf Konto
    let normBuchung = tableCache.createNewRow();
    this.copyFields(quellTabelle, normBuchung);
    normBuchung.setBetrag(this.getNettoBetragMitVorzeichen());
    normBuchung.setKonto(this.getKonto());

    //Buchung auf Gegenkonto
    normBuchung = tableCache.createNewRow();
    this.copyFields(quellTabelle, normBuchung);
    //Vorzeichen wechseln
    normBuchung.setBetrag(-this.getNettoBetragMitVorzeichen());
    //Konto wechseln
    normBuchung.setKonto(this.getGegenkonto());

  }
  protected copyFields(quellTabelle: string, normBuchung: NormalisierteBuchung) {
    normBuchung.setFileId(this.getId());
    normBuchung.setLink(this.getLink());
    normBuchung.setDatum(this.getDatum());
    normBuchung.setbezahltam(this.getBezahltAm());
    normBuchung.setText(this.getText());
    normBuchung.setMonat(this.monat);
    normBuchung.setMonatbezahlt(this.monatBezahlt);
    normBuchung.setQuelltabelle(quellTabelle);
  }
}
class Rechnung extends Umbuchung {
  public getBezahltAm() { return this.getValue("bezahlt am"); }
  public setBezahltAm(datum: Date) { this.setValue("bezahlt am", datum); }
  public nichtBezahlt(): boolean { return this.getBezahltAm() === ""; }
  public isBezahlt(): boolean { return !this.nichtBezahlt(); }
  public getBetrag() { return this.getValue("brutto Betrag"); }
  public setBetrag(value: any) { this.setValue("brutto Betrag", value); }
  public getBetragMitVorzeichen() { return this.getBetrag() };
  public getNettoBetragMitVorzeichen() { return this.getNettoBetrag() };
  public getNettoBetrag() { return this.getValue("netto Betrag"); }
  public setNettoBetrag(betrag: number) { this.setValue("netto Betrag", betrag); }
  public getMehrwertsteuer() { return this.getValue("Summe Umsatzsteuer"); }
  public setMehrwertsteuer(value: any) { this.setValue("Summe Umsatzsteuer", value); }
  public getDateiTyp() { return this.getValue("Dateityp"); }
  public setDateiTyp(dateityp: string) { this.setValue("Dateityp", dateityp); }
}
//Fassade der Tabellen in Einnahmen
class EinnahmenRechnung extends Rechnung {
  public getText() { return this.getKonto() + " " + this.getNettoBetragMitVorzeichen() + " €" }
  public getKonto() { return "Leistung:" + this.getValue("Name"); }
  public getStatus() { return this.getValue("Status"); }
  public setStatus(value: any) { this.setValue("Status", value); }
  public getRechnungsNr() { return this.getValue("Rechnungs-Nr"); }
  public setRechnungsNr(value: any) { this.setValue("Rechnungs-Nr", value); }
  public getName() { return this.getValue("Name"); }
  public setName(value: any) { this.setValue("Name", value); }
  public getLeistungvon() { return this.getValue("Leistung von"); }
  public setLeistungvon(value: any) { this.setValue("Leistung von", value); }
  public getLeistungbis() { return this.getValue("Leistung bis"); }
  public setLeistungbis(value: any) { this.setValue("Leistung bis", value); }
  public getNettoBetrag() { return this.getValue("Summe netto"); }
  public setNettoBetrag(value: any) { this.setValue("Summe netto", value); }
  public getBetrag() { return this.getValue("Rechnungsbetrag"); }
  public setBetrag(value: any) { this.setValue("Rechnungsbetrag", value); }
  public getBestellnummer() { return this.getValue("Bestellnummer"); }
  public setBestellnummer(value: any) { this.setValue("Bestellnummer", value); }
  public getAdresszusatz() { return this.getValue("Adresszusatz"); }
  public setAdresszusatz(value: any) { this.setValue("Adresszusatz", value); }
  public getStrasse() { return this.getValue("Strasse"); }
  public setStrasse(value: any) { this.setValue("Strasse", value); }
  public getHausnummer() { return this.getValue("Hausnummer"); }
  public setHausnummer(value: any) { this.setValue("Hausnummer", value); }
  public getPLZ() { return this.getValue("PLZ"); }
  public setPLZ(value: any) { this.setValue("PLZ", value); }
  public getOrt() { return this.getValue("Ort"); }
  public setOrt(value: any) { this.setValue("Ort", value); }
  public getLand() { return this.getValue("Land"); }
  public setLand(value: any) { this.setValue("Land", value); }
  public getEMail() { return this.getValue("E-Mail"); }
  public setEMail(value: any) { this.setValue("E-Mail", value); }
  public getGruss() { return this.getValue("Gruß"); }
  public setGruss(value: any) { this.setValue("Gruß", value); }
  public getAnrede() { return this.getValue("Anrede"); }
  public setAnrede(value: any) { this.setValue("Anrede", value); }
  public getVorname() { return this.getValue("Vorname"); }
  public setVorname(value: any) { this.setValue("Vorname", value); }
  public getNachname() { return this.getValue("Nachname"); }
  public setNachname(value: any) { this.setValue("Nachname", value); }
  public getGeburtsdatum() { return this.getValue("Geburtsdatum"); }
  public setGeburtsdatum(value: any) { this.setValue("Geburtsdatum", value); }
  public getUStIdNr() { return this.getValue("USt-IdNr"); }
  public setUStIdNr(value: any) { this.setValue("USt-IdNr", value); }
  public getDokumententyp() { return this.getValue("Dokumententyp"); }
  public setDokumententyp(value: any) { this.setValue("Dokumententyp", value); }
  public getZahlungsziel() { return this.getValue("Zahlungsziel"); }
  public setZahlungsziel(value: any) { this.setValue("Zahlungsziel", value); }
  public addToTableCache(tableCache: NormalisierteBuchungenTableCache, geschaeftsjahr: Date) {
    const quellTabelle = "Rechnung";
    super.addToTableCache(tableCache, geschaeftsjahr, quellTabelle);

    //Buchung Mehrwertsteuer auf USt. in Rechnung gestellt
    let normBuchung = tableCache.createNewRow();
    this.copyFields(quellTabelle, normBuchung);
    normBuchung.setBetrag(this.getMehrwertsteuer());
    //Kontenstammdaten werden später ergänzt
    normBuchung.setKonto("USt. in Rechnung gestellt");

    //Buchung Mehrwertsteuer auf Bilanzkonto
    normBuchung = tableCache.createNewRow();
    this.copyFields(quellTabelle, normBuchung);
    //Vorzeichen wechseln
    normBuchung.setBetrag(-this.getMehrwertsteuer());
    //Konto wechseln
    normBuchung.setKonto(this.getGegenkonto());

  }

}
class Gutschrift extends Rechnung {
  public getText() { return this.getKonto() + " " + this.getNettoBetragMitVorzeichen() + " €" }
  public getKonto() { return "Leistung:" + this.getValue("Name"); }
  public getName() { return this.getValue("Name"); }
  public setName(value: string) { this.setValue("Name", value); }
  public getStatus() { return this.getValue("Status"); }
  public setStatus(value: any) { this.setValue("Status", value); }
  public getNettoBetrag() { return this.getValue("Summe netto"); }
  public setNettoBetrag(value: any) { this.setValue("Summe netto", value); }
  public getBetrag() { return this.getValue("Gutschriftbetrag"); }
  public setBetrag(value: any) { this.setValue("Gutschriftbetrag", value); }
  public getDokumententyp() { return this.getValue("Dokumententyp"); }
  public setDokumententyp(value: any) { this.setValue("Dokumententyp", value); }
  public addToTableCache(tableCache: NormalisierteBuchungenTableCache, geschaeftsjahr: Date) {
    const quellTabelle = "Gutschrift";
    super.addToTableCache(tableCache, geschaeftsjahr, quellTabelle);

    //Buchung Mehrwertsteuer auf USt. in Rechnung gestellt
    let normBuchung = tableCache.createNewRow();
    this.copyFields(quellTabelle, normBuchung);
    normBuchung.setBetrag(this.getMehrwertsteuer());
    //Kontenstammdaten werden später ergänzt
    normBuchung.setKonto("USt. in Rechnung gestellt");

    //Buchung Mehrwertsteuer auf Bilanzkonto
    normBuchung = tableCache.createNewRow();
    this.copyFields(quellTabelle, normBuchung);
    //Vorzeichen wechseln
    normBuchung.setBetrag(-this.getMehrwertsteuer());
    //Konto wechseln
    normBuchung.setKonto(this.getGegenkonto());

  }

}
class EURechnung extends Umbuchung {
  public getBetragMitVorzeichen() { return this.getBetrag() };
  public getBetrag() { return this.getValue("Rechnungsbetrag"); }
  public getText() { return this.getKonto() + " " + this.getNettoBetragMitVorzeichen() + " €" }
  public getKonto() { return "Leistung:" + this.getValue("USt-IdNr"); }

  public addToTableCache(tableCache: NormalisierteBuchungenTableCache, geschaeftsjahr: Date) {
    const quellTabelle = "EURechnung";
    this.monat = belegMonat(geschaeftsjahr, this.getValue("Datum"));
    if (this.monat === null) this.monat = Number.NaN;
    if (this.getBezahltAm() !== "offen") this.monatBezahlt = bezahltMonat(geschaeftsjahr, this.getBezahltAm());

    //Buchung auf Konto
    let normBuchung = tableCache.createNewRow();
    this.copyFields(quellTabelle, normBuchung);
    normBuchung.setBetrag(this.getNettoBetragMitVorzeichen());
    normBuchung.setKonto(this.getKonto());

    //Buchung auf Gegenkonto
    normBuchung = tableCache.createNewRow();
    this.copyFields(quellTabelle, normBuchung);
    //Vorzeichen wechseln
    normBuchung.setBetrag(-this.getNettoBetragMitVorzeichen());
    //Konto wechseln
    normBuchung.setKonto(this.getGegenkonto());

  }

}
//Fassade der Tabellen in Ausgaben
class AusgabenRechnung extends Rechnung {
  public getMehrwertsteuer() { return this.getValue("Vorsteuer"); }
  public setMehrwertsteuer(betrag: number) { this.setValue("Vorsteuer", betrag); }
  public getBetragMitVorzeichen() { return -this.getBetrag() };
  public getNettoBetragMitVorzeichen() { return -this.getNettoBetrag() };
  public addToTableCache(tableCache: NormalisierteBuchungenTableCache, geschaeftsjahr: Date) {
    const quellTabelle = "Ausgabe";
    super.addToTableCache(tableCache, geschaeftsjahr, quellTabelle);

    //Buchung Vorsteuer auf Vorsteuer
    let normBuchung = tableCache.createNewRow();
    this.copyFields(quellTabelle, normBuchung);
    normBuchung.setBetrag(-this.getMehrwertsteuer());
    //Kontenstammdaten werden später ergänzt
    normBuchung.setKonto("Vorsteuer");

    //Buchung Vorsteuer auf Bilanzkonto
    normBuchung = tableCache.createNewRow();
    this.copyFields(quellTabelle, normBuchung);
    //Vorzeichen wechseln
    normBuchung.setBetrag(this.getMehrwertsteuer());
    //Kontenstammdaten werden später ergänzt
    //Konto wechseln
    normBuchung.setKonto(this.getGegenkonto());

  }

}
class Bewirtungsbeleg extends AusgabenRechnung {
  public getFileId() { return this.getValue("ID"); }
  public setFileId(value: string) { this.setValue("ID", value); }
  public getKonto() { return "abziehbare Bewirtungskosten" };
  public getNettoBetragMitVorzeichen() { return -this.getAbziehbareBewirtungskosten() };

  public getTrinkgeld() { return this.getValue("Trinkgeld"); }
  public setTrinkgeld(betrag: number) { this.setValue("Trinkgeld", betrag); }
  public getAbziehbareBewirtungskosten() { return this.getValue("abziehbare Bewirtungskosten"); }
  public setAbziehbareBewirtungskosten(value: any) { this.setValue("abziehbare Bewirtungskosten", value); }
  public getNichtAbziehbareBewirtungskosten() { return this.getValue("nicht abziehbare Bewirtungskosten"); }
  public setNichtAbziehbareBewirtungskosten(value: any) { this.setValue("nicht abziehbare Bewirtungskosten", value); }
  public addToTableCache(tableCache: NormalisierteBuchungenTableCache, geschaeftsjahr: Date) {
    super.addToTableCache(tableCache, geschaeftsjahr);

    //Buchung nicht abziehbare Bewirtungskosten
    let normBuchung = tableCache.createNewRow();
    this.copyFields("Bewirtungsbeleg", normBuchung);
    normBuchung.setBetrag(-this.getNichtAbziehbareBewirtungskosten());
    //Kontenstammdaten werden später ergänzt
    normBuchung.setKonto("nicht abziehbare Bewirtungskosten");

    //Buchung nicht abziehbare Bewirtungskosten auf Bilanzkonto
    normBuchung = tableCache.createNewRow();
    this.copyFields("Bewirtungsbeleg", normBuchung);
    //Vorzeichen wechseln
    normBuchung.setBetrag(this.getNichtAbziehbareBewirtungskosten());
    //Kontenstammdaten werden später ergänzt
    //Konto wechseln
    normBuchung.setKonto(this.getGegenkonto());

  }

}
class Abschreibung extends Umbuchung {
  public getBezahltAm() { return this.getDatum() };
  public addToTableCache(tableCache: NormalisierteBuchungenTableCache, geschaeftsjahr: Date) {
    const quellTabelle = "Abschreibung";
    this.monat = belegMonat(geschaeftsjahr, this.getValue("Datum"));
    this.monatBezahlt = bezahltMonat(geschaeftsjahr, this.getDatum());

    //Buchung auf Konto
    let normBuchung = tableCache.createNewRow();
    this.copyFields(quellTabelle, normBuchung);
    normBuchung.setBetrag(-this.getBetrag());
    normBuchung.setKonto(this.getKonto());

    //Buchung auf Gegenkonto
    normBuchung = tableCache.createNewRow();
    this.copyFields(quellTabelle, normBuchung);
    //Vorzeichen wechseln
    normBuchung.setBetrag(this.getBetrag());
    //Konto wechseln
    normBuchung.setKonto(this.getGegenkonto());
  }
}
class Verpflegungsmehraufwendung extends Umbuchung {
  public getBezahltAm() { return this.getDatum() };
  public getBetrag() { return this.getValue("Verpflegungsmehr-aufwendung"); }
  public getKonto() { return "Verpflegungsmehraufwendung" };
  public getGegenkonto() { return "bar" };
  public addToTableCache(tableCache: NormalisierteBuchungenTableCache, geschaeftsjahr: Date) {
    const quellTabelle = "Verpflegungsmehraufwendung";
    this.monat = belegMonat(geschaeftsjahr, this.getValue("Datum"));
    this.monatBezahlt = bezahltMonat(geschaeftsjahr, this.getDatum());

    //Buchung auf Konto
    let normBuchung = tableCache.createNewRow();
    this.copyFields(quellTabelle, normBuchung);
    normBuchung.setBetrag(-this.getBetrag());
    normBuchung.setKonto(this.getKonto());

    //Buchung auf Gegenkonto
    normBuchung = tableCache.createNewRow();
    this.copyFields(quellTabelle, normBuchung);
    //Vorzeichen wechseln
    normBuchung.setBetrag(this.getBetrag());
    //Konto wechseln
    normBuchung.setKonto(this.getGegenkonto());
  }
}
class Vertrag extends Umbuchung {
  public getBezahltAm() { return ""; }
  public setBezahltAm(datum: Date) { this.setValue("Zahlungsdatum", this.getValue("Zahlungsdatum").toString() + "," + datum.toString()); }
  public nichtBezahlt(): boolean { return this.getBezahltAm() === ""; }
  public isBezahlt(): boolean { return !this.nichtBezahlt(); }
  public getGegenkonto() { return this.getValue("Konto") };
}
//Fassade der Tabellen in Bankbuchungen
class Bankbuchung extends Umbuchung {
  public getKonto() { return this.getValue("Bilanzkonto") }
  public setKonto(value: string) { this.setValue("Bilanzkonto", value); }
  public getGegenkonto() {
    let gegenkonto = super.getGegenkonto();
    if (gegenkonto === "") gegenkonto = "nicht zugeordnet";
    return gegenkonto;
  }
  public getBezahltAm() { return this.getDatum() };
  public getNr() { return this.getValue("Nr") }
  public setNr(value: string) { this.setValue("Nr", value); }
  public getBelegID() { return this.getValue("BelegID") }
  public setBelegID(value: string) { this.setValue("BelegID", value); }
  public getGegenkontoBank() { return this.getValue("GegenkontoBank") }
  public setGegenkontoBank(value: string) { this.setValue("GegenkontoBank", value); }
  public addToTableCache(tableCache: NormalisierteBuchungenTableCache, geschaeftsjahr: Date) {
    const quellTabelle = "Bankbuchung";
    this.monat = belegMonat(geschaeftsjahr, this.getValue("Datum"));
    this.monatBezahlt = bezahltMonat(geschaeftsjahr, this.getDatum());

    //Buchung auf Konto
    let normBuchung = tableCache.createNewRow();
    this.copyFields(quellTabelle, normBuchung);
    normBuchung.setBetrag(-this.getBetrag());
    normBuchung.setKonto(this.getKonto());

    //Buchung auf Gegenkonto
    normBuchung = tableCache.createNewRow();
    this.copyFields(quellTabelle, normBuchung);
    //Vorzeichen wechseln
    normBuchung.setBetrag(this.getBetrag());
    //Konto wechseln
    normBuchung.setKonto(this.getGegenkonto());

  }
  protected copyFields(quellTabelle: string, normBuchung: NormalisierteBuchung) {
    let id = this.getBelegID();
    if (id === "") id = this.getId();
    normBuchung.setFileId(id);
    normBuchung.setLink(this.getLink());
    normBuchung.setDatum(this.getDatum());
    normBuchung.setbezahltam(this.getDatum());
    normBuchung.setText(this.getText());
    normBuchung.setMonat(this.monat);
    normBuchung.setMonatbezahlt(this.monatBezahlt);
    normBuchung.setQuelltabelle(quellTabelle);
  }

}
//Fassade der Tabellen in Steuern EÜR
//Fassade der Tabellen in Bilanz und GuV
class Konto extends TableRow {
  public getId() { return this.getValue("Konto"); }
  public setId(value: string) { this.setValue("Konto", value); }
  public getKontentyp() { return this.getValue("Kontentyp"); }
  public setKontentyp(value: any) { this.setValue("Kontentyp", value); }
  public getSubtyp(): string { return this.getValue("Subtyp").toString(); }
  public setSubtyp(value: any) { this.setValue("Subtyp", value); }
  public getGruppe() { return this.getValue("Gruppe"); }
  public setGruppe(value: any) { this.setValue("Gruppe", value); }
  public getKonto() { return this.getValue("Konto"); }
  public setKonto(value: any) { this.setValue("Konto", value); }
  public getSKR03() { return this.getValue("SKR03"); }
  public setSKR03(value: any) { this.setValue("SKR03", value); }
  public getExportgruppe() { return this.getValue("Exportgruppe"); }
  public setExportgruppe(value: any) { this.setValue("Exportgruppe", value); }
  public getBeispiel() { return this.getValue("Beispiel"); }
  public setBeispiel(value: any) { this.setValue("Beispiel", value); }
  public getQuelle() { return this.getValue("Quelle"); }
  public setQuelle(value: any) { this.setValue("Quelle", value); }
  public getFormular() { return this.getValue("Formular"); }
  public setFormular(value: any) { this.setValue("Formular", value); }
  public getZN() { return this.getValue("ZN"); }
  public setZN(value: any) { this.setValue("ZN", value); }
  public isAnlage(): boolean { return this.getGruppe() === "Anlage"; }
  public isBestandskonto(): boolean { return this.getGruppe() === "Bestand"; }
  public isBankkonto(): boolean { return this.getGruppe() === "Bankkonto"; }
  public getSumme() { return this.getValue("Summe"); }
  public getDefaultMwSt() { return this.getGruppe().split(",")[1]; }

}
class UStVA extends TableRow {
  public getFileId() { return this.getValue("ID"); }
  public setFileId(value: string) { this.setValue("ID", value); }
  public getLink() { return this.getValue("Link"); }
  public setLink(value) { this.setValue("Link", value); }
  public getDatum() { return this.getValue("Datum"); }
  public setDatum(value) { this.setValue("Datum", value); }
  public getKonto() { return this.getValue("Konto"); }
  public setKonto(value) { this.setValue("Konto", value); }
  public getBetrag() { return this.getValue("Betrag"); }
  public setBetrag(value) { this.setValue("Betrag", value); }
  public getGegenkonto() { return this.getValue("Gegenkonto"); }
  public setGegenkonto(value) { this.setValue("Gegenkonto", value); }
  public getbezahltam() { return this.getValue("bezahlt am"); }
  public setbezahltam(value) { this.setValue("bezahlt am", value); }
  public getPeriodeundStatus() { return this.getValue("Periode und Status"); }
  public setPeriodeundStatus(value) { this.setValue("Periode und Status", value); }
  public geterstelltam() { return this.getValue("erstellt am"); }
  public seterstelltam(value) { this.setValue("erstellt am", value); }
  public get21() { return this.getValue("21"); }
  public set21(value) { this.setValue("21", value); }
  public get81() { return this.getValue("81"); }
  public set81(value) { this.setValue("81", value); }
  public get66() { return this.getValue("66"); }
  public set66(value) { this.setValue("66", value); }
  public get83() { return this.getValue("83"); }
  public set83(value) { this.setValue("83", value); }
}
class EUR extends TableRow {
  public getId() { return this.getValue("ZN"); }
  public setId(value: string) { this.setValue("ZN", value); }
  public getZN() { return this.getValue("ZN"); }
  public setZN(value) { this.setValue("ZN", value); }
  public getSumme() { return this.getValue("Summe"); }
  public setSumme(value) { this.setValue("Summe", value); }
}
class NormalisierteBuchung extends FinanzAction {
  public getFileId() { return this.getValue("ID"); }
  public setFileId(value: string) { this.setValue("ID", value); }
  public getLink(): string { return this.getFormula("Link"); }
  public setLink(link: string) { this.setFormula("Link", link); }
  //public getDatum(){return this.getValue("Datum");}
  //public setDatum(value){this.setValue("Datum",value);}
  public getbezahltam() { return this.getValue("bezahlt am"); }
  public setbezahltam(value) { this.setValue("bezahlt am", value); }
  //public getBetrag(){return this.getValue("Betrag");}
  //public setBetrag(value){this.setValue("Betrag",value);}
  //public getText(){return this.getValue("Text");}
  //public setText(value){this.setValue("Text",value);}
  public getMonat() { return this.getValue("Monat"); }
  public setMonat(value) { this.setValue("Monat", value); }
  public getMonatbezahlt() { return this.getValue("Monat bezahlt"); }
  public setMonatbezahlt(value) { this.setValue("Monat bezahlt", value); }
  public getKontentyp() { return this.getValue("Kontentyp"); }
  public setKontentyp(value) { this.setValue("Kontentyp", value); }
  public getSubtyp() { return this.getValue("Subtyp"); }
  public setSubtyp(value) { this.setValue("Subtyp", value); }
  public getGruppe() { return this.getValue("Gruppe"); }
  public setGruppe(value) { this.setValue("Gruppe", value); }
  //Das ist wahrscheinlich falsch, Tabellenspalte muss semantisch "Konto" heißen
  //kann ich umstellen, wenn der ganze Code auf TS migriert ist
  public getKonto() { return this.getValue("Gegenkonto"); }
  public setKonto(value) { this.setValue("Gegenkonto", value); }
  public getSKR03() { return this.getValue("SKR03"); }
  public setSKR03(value) { this.setValue("SKR03", value); }
  public getFormular() { return this.getValue("Formular"); }
  public setFormular(value) { this.setValue("Formular", value); }
  public getZN() { return this.getValue("ZN"); }
  public setZN(value) { this.setValue("ZN", value); }
  public getQuelltabelle() { return this.getValue("Quelltabelle"); }
  public setQuelltabelle(value) { this.setValue("Quelltabelle", value); }
}

//Hilfsfunktionen für noremalisierte Buchungen
function belegMonat(geschaeftsjahr: Date, belegDatum: Date) {
  if (belegDatum < geschaeftsjahr) {
    var result = belegDatum.getFullYear() - geschaeftsjahr.getFullYear();
    if (result < -4) result = -4;
    return result;
  } else {
    if (belegDatum.getFullYear() - geschaeftsjahr.getFullYear() > 0) return 13;
    return belegDatum.getMonth() + 1;
  }

}

function bezahltMonat(geschaeftsjahr: Date, bezahltDatum: Date) {
  if (bezahltDatum == undefined) return "offen";
  if (!(bezahltDatum instanceof Date)) return "offen";
  if (bezahltDatum < geschaeftsjahr) {
    var result = bezahltDatum.getFullYear() - geschaeftsjahr.getFullYear();
    if (result < -4) result = -4;
    return result;
  }
  else {
    if (bezahltDatum.getFullYear() - geschaeftsjahr.getFullYear() > 0) return 13;
    return bezahltDatum.getMonth() + 1;
  }
}

function uid() { return Math.random.toString() }

