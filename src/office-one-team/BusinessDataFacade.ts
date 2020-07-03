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
  private rowArray;
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
  public getData(){
    return[this.dataArray,this.backgroundArray,this.formulaArray];
  }
  protected getRowHashTable() {
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
  public getOrCreateHashTable(columnName: string):Object {
    if (this.columnHashTable[columnName] === undefined) {
      this.columnHashTable[columnName] = {};
      for (let index in this.dataArray) {
        if (index !== "0") {
          let tableRow = this.getRowByIndex(index);
          this.columnHashTable[columnName][tableRow.getValue(columnName)] = tableRow;
        }
      }
    }
    return  this.columnHashTable[columnName]
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
    this.columnHashTable={};
    if (this.rowArray) delete this.rowArray;
    this.getRowHashTable();
    this.dataArray[0][0] = this.dataArray[0][0].toString().substr(0, 6) + padToFive(parseInt(this.dataArray[0][0].toString().substr(6, 5),10) + 1);
    return tableRow;
  }
  public getOrCreateRowById(id: string): TableRow {
    if (id === "") throw new Error("Empty string is not allowed as id:"+ this.tableName+ new Error().stack);
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
  public deleteAll(){
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
    if (value instanceof Date){
      return this.getDateString(new Date(value));
    }
    return  value.toFixed(2).replace(".",",");
  }
  protected setValue(columnName: string, value: string | number | Date) {
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
  public createNewRow():Bankbuchung {return super.createNewRow() as Bankbuchung; }
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
  constructor(rootId: string) {
    super(rootId, "KontenD");
  }
  public getRowByIndex(rowIndex: string): Konto {
    return new Konto(this, rowIndex) as Konto;
  }
  public getOrCreateRowById(kontoName: string): Konto {
    return super.getOrCreateRowById(kontoName) as Konto;
  }

}
class NormalisierteBuchungenTableCache extends TableCache{
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
}
//Abstrakte Fassaden für Buchungssätze
class FinanzAction extends TableRow {
  public getBetrag(): number { return this.getValue("Betrag"); }
  public setBetrag(value: number) { this.setValue("Betrag", value); }
  public getDatum() { return new Date(this.getValue("Datum")); }
  public setDatum(value: any) { this.setValue("Datum", value); }
  public getKonto():string { return this.getValue("Konto") }
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
}
class Umbuchung extends Buchung {
  public getFileId() { return this.getValue("ID"); }
  public setFileId(value: string) { this.setValue("ID", value); }
  public getBezahltAm() { return this.getValue("bezahlt am"); }
  public setBezahltAm(datum: Date) { this.setValue("bezahlt am", datum); }
  public nichtBezahlt(): boolean { return this.getBezahltAm() === ""; }
  public isBezahlt(): boolean { return !this.nichtBezahlt(); }
  public getBetragMitVorzeichen() { return -this.getBetrag() };
}
class Rechnung extends Umbuchung {
  public getBezahltAm() { return this.getValue("bezahlt am"); }
  public setBezahltAm(datum: Date) { this.setValue("bezahlt am", datum); }
  public nichtBezahlt(): boolean { return this.getBezahltAm() === ""; }
  public isBezahlt(): boolean { return !this.nichtBezahlt(); }
  public getBetrag() { return this.getValue("brutto Betrag"); }
  public setBetrag(value: any) { this.setValue("brutto Betrag", value); }
  public getBetragMitVorzeichen() { return this.getBetrag() };
  public getNettoBetrag() { return this.getValue("netto Betrag"); }
  public setNettoBetrag(betrag: number) { this.setValue("netto Betrag", betrag); }
  public getMehrwertsteuer() { return this.getValue("Summe Umsatzsteuer"); }
  public setMehrwertsteuer(value: any) { this.setValue("Summe Umsatzsteuer", value); }
  public getDateiTyp() { return this.getValue("Dateityp"); }
  public setDateiTyp(dateityp: string) { this.setValue("Dateityp", dateityp); }
}
//Fassade der Tabellen in Einnahmen
class EinnahmenRechnung extends Rechnung {
  public getKonto(){return "Debitor:"+this.getValue("Name");}
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

}
class Gutschrift extends Rechnung {
  public getKonto(){return "Debitor:"+this.getValue("Name");}
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
}
//Fassade der Tabellen in Ausgaben
class AusgabenRechnung extends Rechnung {
  public getMehrwertsteuer() { return this.getValue("Vorsteuer"); }
  public setMehrwertsteuer(betrag: number) { this.setValue("Vorsteuer", betrag); }
  public getBetragMitVorzeichen() { return -this.getBetrag() };
}
class Bewirtungsbeleg extends AusgabenRechnung {
  public getFileId() { return this.getValue("ID"); }
  public setFileId(value: string) { this.setValue("ID", value); }
  public getTrinkgeld() { return this.getValue("Trinkgeld"); }
  public setTrinkgeld(betrag: number) { this.setValue("Trinkgeld", betrag); }
  public getAbziehbareBewirtungskosten() { return this.getValue("abziehbare Bewirtungskosten"); }
  public setAbziehbareBewirtungskosten(value: any) { this.setValue("abziehbare Bewirtungskosten", value); }
  public getNichtAbziehbareBewirtungskosten() { return this.getValue("nicht abziehbare Bewirtungskosten"); }
  public setNichtAbziehbareBewirtungskosten(value: any) { this.setValue("nicht abziehbare Bewirtungskosten", value); }
}
class Abschreibung extends Buchung { }
//Fassade der Tabellen in Bankbuchungen
class Vertrag extends Umbuchung {
  public getBezahltAm() { return ""; }
  public setBezahltAm(datum: Date) { this.setValue("Zahlungsdatum", this.getValue("Zahlungsdatum").toString() + "," + datum.toString()); }
  public nichtBezahlt(): boolean { return this.getBezahltAm() === ""; }
  public isBezahlt(): boolean { return !this.nichtBezahlt(); }
  public getGegenkonto() { return this.getValue("Konto") };
}
class Bankbuchung extends Buchung {
  public getKonto() { return this.getValue("Bilanzkonto") }
  public setKonto(value: string) { this.setValue("Bilanzkonto", value); }
  public getNr() { return this.getValue("Nr") }
  public setNr(value: string) { this.setValue("Nr", value); }
  public getBelegID() { return this.getValue("BelegID") }
  public setBelegID(value: string) { this.setValue("BelegID", value); }
  public getGegenkontoBank() { return this.getValue("GegenkontoBank") }
  public setGegenkontoBank(value: string) { this.setValue("GegenkontoBank", value); }
}
//Umbuchung gibt's schon
//Fassade der Tabellen in Bilanz und GuV
class Konto extends TableRow {
  public getId() { return this.getValue("Konto").toString(); }
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

class NormalisierteBuchung extends TableRow{
  public getFileId() { return this.getValue("ID"); }
  public setFileId(value: string) { this.setValue("ID", value); }
  public getLink(): string { return this.getFormula("Link"); }
  public setLink(link: string) { this.setFormula("Link", link); }
  public getDatum(){return this.getValue("Datum");}
  public setDatum(value){this.setValue("Datum",value);}
  public getbezahltam(){return this.getValue("bezahlt am");}
  public setbezahltam(value){this.setValue("bezahlt am",value);}
  public getBetrag(){return this.getValue("Betrag");}
  public setBetrag(value){this.setValue("Betrag",value);}
  public getText(){return this.getValue("Text");}
  public setText(value){this.setValue("Text",value);}
  public getMonat(){return this.getValue("Monat");}
  public setMonat(value){this.setValue("Monat",value);}
  public getMonatbezahlt(){return this.getValue("Monat bezahlt");}
  public setMonatbezahlt(value){this.setValue("Monat bezahlt",value);}
  public getKontentyp(){return this.getValue("Kontentyp");}
  public setKontentyp(value){this.setValue("Kontentyp",value);}
  public getSubtyp(){return this.getValue("Subtyp");}
  public setSubtyp(value){this.setValue("Subtyp",value);}
  public getGruppe(){return this.getValue("Gruppe");}
  public setGruppe(value){this.setValue("Gruppe",value);}
  public getGegenkonto(){return this.getValue("Gegenkonto");}
  public setGegenkonto(value){this.setValue("Gegenkonto",value);}
  public getSKR03(){return this.getValue("SKR03");}
  public setSKR03(value){this.setValue("SKR03",value);}
  public getFormular(){return this.getValue("Formular");}
  public setFormular(value){this.setValue("Formular",value);}
  public getZN(){return this.getValue("ZN");}
  public setZN(value){this.setValue("ZN",value);}
  public getQuelltabelle(){return this.getValue("Quelltabelle");}
  public setQuelltabelle(value){this.setValue("Quelltabelle",value);}
}

function uid() { return Math.random.toString() }

