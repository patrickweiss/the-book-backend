var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var TableCache = /** @class */ (function () {
    function TableCache(rootId, tableName) {
        this.columnHashTable = {};
        var data = DriveConnector.getNamedRangeData(rootId, tableName, oooVersion);
        this.dataArray = data[0];
        this.backgroundArray = data[1];
        this.formulaArray = data[2];
        this.columnIndex = this.getColumnIndex(this.dataArray[0]);
        this.loadRowCount = this.dataArray.length;
        this.rootId = rootId;
        this.tableName = tableName;
    }
    TableCache.prototype.getData = function () {
        return [this.dataArray, this.backgroundArray, this.formulaArray];
    };
    TableCache.prototype.getRowHashTable = function () {
        if (this.rowHashTable === undefined) {
            this.rowHashTable = {};
            for (var index in this.dataArray) {
                if (index !== "0" && this.getRowByIndex(index).getId() !== "") {
                    this.addRowToHash(this.getRowByIndex(index));
                }
            }
        }
        return this.rowHashTable;
    };
    TableCache.prototype.getOrCreateHashTable = function (columnName) {
        if (this.columnHashTable[columnName] === undefined) {
            this.columnHashTable[columnName] = {};
            for (var index in this.dataArray) {
                if (index !== "0") {
                    var tableRow = this.getRowByIndex(index);
                    this.columnHashTable[columnName][tableRow.getValue(columnName)] = tableRow;
                }
            }
        }
        return this.columnHashTable[columnName];
    };
    TableCache.prototype.addRowToHash = function (tableRow) {
        this.rowHashTable[tableRow.getId()] = tableRow;
    };
    TableCache.prototype.getRowArray = function () {
        if (this.rowArray === undefined) {
            this.rowArray = [];
            for (var index in this.dataArray) {
                if (index !== "0")
                    this.rowArray.push(this.getRowByIndex(index));
            }
        }
        return this.rowArray;
    };
    TableCache.prototype.getRowByIndex = function (rowIndex) {
        return new TableRow(this, rowIndex);
    };
    TableCache.prototype.createNewRow = function () {
        var newDataArray = Array.apply(null, Array(this.dataArray[0].length)).map(String.prototype.valueOf, "");
        var newFormulaArray = new Array(this.formulaArray[0].length);
        var newBackgroundArray = Array.apply(null, Array(this.backgroundArray[0].length)).map(String.prototype.valueOf, "white");
        this.dataArray.splice(1, 0, newDataArray);
        this.formulaArray.splice(1, 0, newFormulaArray);
        this.backgroundArray.splice(1, 0, newBackgroundArray);
        var tableRow = this.getRowByIndex("1");
        tableRow.setId(this.dataArray[0][0].toString());
        delete this.rowHashTable;
        delete this.columnHashTable;
        this.columnHashTable = {};
        if (this.rowArray)
            delete this.rowArray;
        this.getRowHashTable();
        this.dataArray[0][0] = this.dataArray[0][0].toString().substr(0, 6) + padToFive(parseInt(this.dataArray[0][0].toString().substr(6, 5), 10) + 1);
        return tableRow;
    };
    TableCache.prototype.getOrCreateRowById = function (id) {
        if (id === "")
            throw new Error("Empty string is not allowed as id:" + this.tableName + new Error().stack);
        var tableRow = this.getRowHashTable()[id];
        if (tableRow === undefined) {
            var newDataArray = Array.apply(null, Array(this.dataArray[0].length)).map(String.prototype.valueOf, "");
            var newFormulaArray = new Array(this.formulaArray[0].length);
            var newBackgroundArray = Array.apply(null, Array(this.backgroundArray[0].length)).map(String.prototype.valueOf, "white");
            this.dataArray.splice(1, 0, newDataArray);
            this.formulaArray.splice(1, 0, newFormulaArray);
            this.backgroundArray.splice(1, 0, newBackgroundArray);
            tableRow = this.getRowByIndex("1");
            tableRow.setId(id);
            delete this.rowHashTable;
            if (this.rowArray)
                delete this.rowArray;
            this.getRowHashTable();
        }
        return tableRow;
    };
    TableCache.prototype.save = function () {
        DriveConnector.saveNamedRangeData(this.rootId, this.tableName, this.loadRowCount, this.dataArray, this.backgroundArray, this.formulaArray);
    };
    TableCache.prototype.getColumnIndex = function (dataColumnNames) {
        var spalte = {};
        for (var index in dataColumnNames) {
            spalte[dataColumnNames[index]] = index;
        }
        return spalte;
    };
    return TableCache;
}());
// Generic code for client and server identical
function padToFive(number) { return ("0000" + number).slice(-5); }
//Abstrakte Basisklasse fuer Tabellenzeilen
var TableRow = /** @class */ (function () {
    function TableRow(tableCache, tableCacheIndex) {
        if (tableCacheIndex == "0")
            throw new Error("TableRow with index 0 contains column names, no data");
        this.tableCache = tableCache;
        this.index = tableCacheIndex;
    }
    TableRow.prototype.getId = function () { return this.getDataArray()[0].toString(); };
    TableRow.prototype.setId = function (value) { this.getDataArray()[0] = value; };
    TableRow.prototype.getTitlesArray = function () { return this.tableCache.dataArray[0]; };
    TableRow.prototype.getDataArray = function () { return this.tableCache.dataArray[this.index]; };
    TableRow.prototype.getTitle = function (columnName) { return this.tableCache.dataArray[0][this.tableCache.columnIndex[columnName]].toString(); };
    TableRow.prototype.getValueStringOrNumber = function (columnName) {
        var value = this.tableCache.dataArray[this.index][this.tableCache.columnIndex[columnName]];
        if (typeof value === "string") {
            var a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
            if (a) {
                return this.getDateString(new Date(value));
            }
            else if (columnName === "ID" || columnName === "Nr")
                return value.substr(0, 5);
            else
                return value.substr(0, 20);
        }
        if (value instanceof Date) {
            return this.getDateString(new Date(value));
        }
        return value.toFixed(2).replace(".", ",");
    };
    TableRow.prototype.setValue = function (columnName, value) {
        this.tableCache.dataArray[this.index][this.tableCache.columnIndex[columnName]] = value;
    };
    TableRow.prototype.getValue = function (columnName) {
        return this.tableCache.dataArray[this.index][this.tableCache.columnIndex[columnName]];
    };
    TableRow.prototype.setFormula = function (columnName, value) {
        this.tableCache.formulaArray[this.index][this.tableCache.columnIndex[columnName]] = value;
    };
    TableRow.prototype.getFormula = function (columnName) {
        return this.tableCache.formulaArray[this.index][this.tableCache.columnIndex[columnName]];
    };
    TableRow.prototype.getDateString = function (date) {
        var mm = date.getMonth() + 1; // getMonth() is zero-based
        var dd = date.getDate();
        return [date.getFullYear(),
            (mm > 9 ? '' : '0') + mm,
            (dd > 9 ? '' : '0') + dd
        ].join('');
    };
    return TableRow;
}());
//Caches der Tabellen Daten
var AusgabenTableCache = /** @class */ (function (_super) {
    __extends(AusgabenTableCache, _super);
    function AusgabenTableCache(rootId) {
        return _super.call(this, rootId, "AusgabenD") || this;
    }
    AusgabenTableCache.prototype.createNewRow = function () { return _super.prototype.createNewRow.call(this); };
    AusgabenTableCache.prototype.getRowByIndex = function (rowIndex) { return new AusgabenRechnung(this, rowIndex); };
    AusgabenTableCache.prototype.getOrCreateRowById = function (id) { return _super.prototype.getOrCreateRowById.call(this, id); };
    return AusgabenTableCache;
}(TableCache));
var VertraegeTableCache = /** @class */ (function (_super) {
    __extends(VertraegeTableCache, _super);
    function VertraegeTableCache(rootId) {
        return _super.call(this, rootId, "VerträgeD") || this;
    }
    VertraegeTableCache.prototype.getRowByIndex = function (rowIndex) {
        return new Vertrag(this, rowIndex);
    };
    VertraegeTableCache.prototype.getOrCreateRowById = function (id) {
        return _super.prototype.getOrCreateRowById.call(this, id);
    };
    return VertraegeTableCache;
}(TableCache));
var BewirtungsbelegeTableCache = /** @class */ (function (_super) {
    __extends(BewirtungsbelegeTableCache, _super);
    function BewirtungsbelegeTableCache(rootId) {
        return _super.call(this, rootId, "BewirtungsbelegeD") || this;
    }
    BewirtungsbelegeTableCache.prototype.createNewRow = function () { return _super.prototype.createNewRow.call(this); };
    BewirtungsbelegeTableCache.prototype.getRowByIndex = function (rowIndex) {
        return new Bewirtungsbeleg(this, rowIndex);
    };
    BewirtungsbelegeTableCache.prototype.getOrCreateRowById = function (id) {
        return _super.prototype.getOrCreateRowById.call(this, id);
    };
    return BewirtungsbelegeTableCache;
}(TableCache));
var AbschreibungenTableCache = /** @class */ (function (_super) {
    __extends(AbschreibungenTableCache, _super);
    function AbschreibungenTableCache(rootId) {
        return _super.call(this, rootId, "AbschreibungenD") || this;
    }
    AbschreibungenTableCache.prototype.getRowByIndex = function (rowIndex) {
        return new Abschreibung(this, rowIndex);
    };
    AbschreibungenTableCache.prototype.getOrCreateRowById = function (id) {
        return _super.prototype.getOrCreateRowById.call(this, id);
    };
    return AbschreibungenTableCache;
}(TableCache));
var EinnahmenRechnungTableCache = /** @class */ (function (_super) {
    __extends(EinnahmenRechnungTableCache, _super);
    function EinnahmenRechnungTableCache(rootId) {
        return _super.call(this, rootId, "RechnungenD") || this;
    }
    EinnahmenRechnungTableCache.prototype.getRowByIndex = function (rowIndex) {
        return new EinnahmenRechnung(this, rowIndex);
    };
    EinnahmenRechnungTableCache.prototype.getOrCreateRowById = function (id) {
        return _super.prototype.getOrCreateRowById.call(this, id);
    };
    return EinnahmenRechnungTableCache;
}(TableCache));
var GutschriftenTableCache = /** @class */ (function (_super) {
    __extends(GutschriftenTableCache, _super);
    function GutschriftenTableCache(rootId) {
        return _super.call(this, rootId, "GutschriftenD") || this;
    }
    GutschriftenTableCache.prototype.createNewRow = function () { return _super.prototype.createNewRow.call(this); };
    GutschriftenTableCache.prototype.getRowByIndex = function (rowIndex) {
        return new Gutschrift(this, rowIndex);
    };
    GutschriftenTableCache.prototype.getOrCreateRowById = function (id) {
        return _super.prototype.getOrCreateRowById.call(this, id);
    };
    return GutschriftenTableCache;
}(TableCache));
var BankbuchungenTableCache = /** @class */ (function (_super) {
    __extends(BankbuchungenTableCache, _super);
    function BankbuchungenTableCache(rootId) {
        return _super.call(this, rootId, "BankbuchungenD") || this;
    }
    BankbuchungenTableCache.prototype.createNewRow = function () { return _super.prototype.createNewRow.call(this); };
    BankbuchungenTableCache.prototype.getRowByIndex = function (rowIndex) {
        return new Bankbuchung(this, rowIndex);
    };
    BankbuchungenTableCache.prototype.getOrCreateRowById = function (id) {
        return _super.prototype.getOrCreateRowById.call(this, id);
    };
    return BankbuchungenTableCache;
}(TableCache));
var UmbuchungenTableCache = /** @class */ (function (_super) {
    __extends(UmbuchungenTableCache, _super);
    function UmbuchungenTableCache(rootId) {
        return _super.call(this, rootId, "UmbuchungenD") || this;
    }
    UmbuchungenTableCache.prototype.createNewRow = function () { return _super.prototype.createNewRow.call(this); };
    UmbuchungenTableCache.prototype.getRowByIndex = function (rowIndex) {
        return new Umbuchung(this, rowIndex);
    };
    UmbuchungenTableCache.prototype.getOrCreateRowById = function (id) {
        return _super.prototype.getOrCreateRowById.call(this, id);
    };
    return UmbuchungenTableCache;
}(TableCache));
var KontenTableCache = /** @class */ (function (_super) {
    __extends(KontenTableCache, _super);
    function KontenTableCache(rootId) {
        return _super.call(this, rootId, "KontenD") || this;
    }
    KontenTableCache.prototype.getRowByIndex = function (rowIndex) {
        return new Konto(this, rowIndex);
    };
    KontenTableCache.prototype.getOrCreateRowById = function (kontoName) {
        return _super.prototype.getOrCreateRowById.call(this, kontoName);
    };
    return KontenTableCache;
}(TableCache));
//Abstrakte Fassaden für Buchungssätze
var FinanzAction = /** @class */ (function (_super) {
    __extends(FinanzAction, _super);
    function FinanzAction() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FinanzAction.prototype.getBetrag = function () { return this.getValue("Betrag"); };
    FinanzAction.prototype.setBetrag = function (value) { this.setValue("Betrag", value); };
    FinanzAction.prototype.getDatum = function () { return new Date(this.getValue("Datum")); };
    FinanzAction.prototype.setDatum = function (value) { this.setValue("Datum", value); };
    FinanzAction.prototype.getKonto = function () { return this.getValue("Konto"); };
    FinanzAction.prototype.setKonto = function (value) { this.setValue("Konto", value); };
    FinanzAction.prototype.getText = function () { return this.getValue("Text"); };
    FinanzAction.prototype.setText = function (text) { this.setValue("Text", text); };
    return FinanzAction;
}(TableRow));
var Buchung = /** @class */ (function (_super) {
    __extends(Buchung, _super);
    function Buchung() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Buchung.prototype.getGegenkonto = function () { return this.getValue("Gegenkonto"); };
    Buchung.prototype.setGegenkonto = function (konto) { this.setValue("Gegenkonto", konto); };
    Buchung.prototype.getLink = function () { return this.getFormula("Link"); };
    Buchung.prototype.setLink = function (link) { this.setFormula("Link", link); };
    Buchung.prototype.createLink = function (id, name) { this.setFormula("Link", "=HYPERLINK(\"https://drive.google.com/file/d/" + id + "\";\"" + name + "\")"); };
    return Buchung;
}(FinanzAction));
var Umbuchung = /** @class */ (function (_super) {
    __extends(Umbuchung, _super);
    function Umbuchung() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Umbuchung.prototype.getFileId = function () { return this.getValue("ID"); };
    Umbuchung.prototype.setFileId = function (value) { this.setValue("ID", value); };
    Umbuchung.prototype.getBezahltAm = function () { return this.getValue("bezahlt am"); };
    Umbuchung.prototype.setBezahltAm = function (datum) { this.setValue("bezahlt am", datum); };
    Umbuchung.prototype.nichtBezahlt = function () { return this.getBezahltAm() === ""; };
    Umbuchung.prototype.isBezahlt = function () { return !this.nichtBezahlt(); };
    Umbuchung.prototype.getBetragMitVorzeichen = function () { return -this.getBetrag(); };
    ;
    return Umbuchung;
}(Buchung));
var Rechnung = /** @class */ (function (_super) {
    __extends(Rechnung, _super);
    function Rechnung() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rechnung.prototype.getBezahltAm = function () { return this.getValue("bezahlt am"); };
    Rechnung.prototype.setBezahltAm = function (datum) { this.setValue("bezahlt am", datum); };
    Rechnung.prototype.nichtBezahlt = function () { return this.getBezahltAm() === ""; };
    Rechnung.prototype.isBezahlt = function () { return !this.nichtBezahlt(); };
    Rechnung.prototype.getBetrag = function () { return this.getValue("brutto Betrag"); };
    Rechnung.prototype.setBetrag = function (value) { this.setValue("brutto Betrag", value); };
    Rechnung.prototype.getBetragMitVorzeichen = function () { return this.getBetrag(); };
    ;
    Rechnung.prototype.getNettoBetrag = function () { return this.getValue("netto Betrag"); };
    Rechnung.prototype.setNettoBetrag = function (betrag) { this.setValue("netto Betrag", betrag); };
    Rechnung.prototype.getMehrwertsteuer = function () { return this.getValue("Summe Umsatzsteuer"); };
    Rechnung.prototype.setMehrwertsteuer = function (value) { this.setValue("Summe Umsatzsteuer", value); };
    Rechnung.prototype.getDateiTyp = function () { return this.getValue("Dateityp"); };
    Rechnung.prototype.setDateiTyp = function (dateityp) { this.setValue("Dateityp", dateityp); };
    return Rechnung;
}(Umbuchung));
//Fassade der Tabellen in Einnahmen
var EinnahmenRechnung = /** @class */ (function (_super) {
    __extends(EinnahmenRechnung, _super);
    function EinnahmenRechnung() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EinnahmenRechnung.prototype.getKonto = function () { return "Debitor:" + this.getValue("Name"); };
    EinnahmenRechnung.prototype.getStatus = function () { return this.getValue("Status"); };
    EinnahmenRechnung.prototype.setStatus = function (value) { this.setValue("Status", value); };
    EinnahmenRechnung.prototype.getRechnungsNr = function () { return this.getValue("Rechnungs-Nr"); };
    EinnahmenRechnung.prototype.setRechnungsNr = function (value) { this.setValue("Rechnungs-Nr", value); };
    EinnahmenRechnung.prototype.getName = function () { return this.getValue("Name"); };
    EinnahmenRechnung.prototype.setName = function (value) { this.setValue("Name", value); };
    EinnahmenRechnung.prototype.getLeistungvon = function () { return this.getValue("Leistung von"); };
    EinnahmenRechnung.prototype.setLeistungvon = function (value) { this.setValue("Leistung von", value); };
    EinnahmenRechnung.prototype.getLeistungbis = function () { return this.getValue("Leistung bis"); };
    EinnahmenRechnung.prototype.setLeistungbis = function (value) { this.setValue("Leistung bis", value); };
    EinnahmenRechnung.prototype.getNettoBetrag = function () { return this.getValue("Summe netto"); };
    EinnahmenRechnung.prototype.setNettoBetrag = function (value) { this.setValue("Summe netto", value); };
    EinnahmenRechnung.prototype.getBetrag = function () { return this.getValue("Rechnungsbetrag"); };
    EinnahmenRechnung.prototype.setBetrag = function (value) { this.setValue("Rechnungsbetrag", value); };
    EinnahmenRechnung.prototype.getBestellnummer = function () { return this.getValue("Bestellnummer"); };
    EinnahmenRechnung.prototype.setBestellnummer = function (value) { this.setValue("Bestellnummer", value); };
    EinnahmenRechnung.prototype.getAdresszusatz = function () { return this.getValue("Adresszusatz"); };
    EinnahmenRechnung.prototype.setAdresszusatz = function (value) { this.setValue("Adresszusatz", value); };
    EinnahmenRechnung.prototype.getStrasse = function () { return this.getValue("Strasse"); };
    EinnahmenRechnung.prototype.setStrasse = function (value) { this.setValue("Strasse", value); };
    EinnahmenRechnung.prototype.getHausnummer = function () { return this.getValue("Hausnummer"); };
    EinnahmenRechnung.prototype.setHausnummer = function (value) { this.setValue("Hausnummer", value); };
    EinnahmenRechnung.prototype.getPLZ = function () { return this.getValue("PLZ"); };
    EinnahmenRechnung.prototype.setPLZ = function (value) { this.setValue("PLZ", value); };
    EinnahmenRechnung.prototype.getOrt = function () { return this.getValue("Ort"); };
    EinnahmenRechnung.prototype.setOrt = function (value) { this.setValue("Ort", value); };
    EinnahmenRechnung.prototype.getLand = function () { return this.getValue("Land"); };
    EinnahmenRechnung.prototype.setLand = function (value) { this.setValue("Land", value); };
    EinnahmenRechnung.prototype.getEMail = function () { return this.getValue("E-Mail"); };
    EinnahmenRechnung.prototype.setEMail = function (value) { this.setValue("E-Mail", value); };
    EinnahmenRechnung.prototype.getGruss = function () { return this.getValue("Gruß"); };
    EinnahmenRechnung.prototype.setGruss = function (value) { this.setValue("Gruß", value); };
    EinnahmenRechnung.prototype.getAnrede = function () { return this.getValue("Anrede"); };
    EinnahmenRechnung.prototype.setAnrede = function (value) { this.setValue("Anrede", value); };
    EinnahmenRechnung.prototype.getVorname = function () { return this.getValue("Vorname"); };
    EinnahmenRechnung.prototype.setVorname = function (value) { this.setValue("Vorname", value); };
    EinnahmenRechnung.prototype.getNachname = function () { return this.getValue("Nachname"); };
    EinnahmenRechnung.prototype.setNachname = function (value) { this.setValue("Nachname", value); };
    EinnahmenRechnung.prototype.getGeburtsdatum = function () { return this.getValue("Geburtsdatum"); };
    EinnahmenRechnung.prototype.setGeburtsdatum = function (value) { this.setValue("Geburtsdatum", value); };
    EinnahmenRechnung.prototype.getUStIdNr = function () { return this.getValue("USt-IdNr"); };
    EinnahmenRechnung.prototype.setUStIdNr = function (value) { this.setValue("USt-IdNr", value); };
    EinnahmenRechnung.prototype.getDokumententyp = function () { return this.getValue("Dokumententyp"); };
    EinnahmenRechnung.prototype.setDokumententyp = function (value) { this.setValue("Dokumententyp", value); };
    EinnahmenRechnung.prototype.getZahlungsziel = function () { return this.getValue("Zahlungsziel"); };
    EinnahmenRechnung.prototype.setZahlungsziel = function (value) { this.setValue("Zahlungsziel", value); };
    return EinnahmenRechnung;
}(Rechnung));
var Gutschrift = /** @class */ (function (_super) {
    __extends(Gutschrift, _super);
    function Gutschrift() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Gutschrift.prototype.getKonto = function () { return "Debitor:" + this.getValue("Name"); };
    Gutschrift.prototype.getName = function () { return this.getValue("Name"); };
    Gutschrift.prototype.setName = function (value) { this.setValue("Name", value); };
    Gutschrift.prototype.getStatus = function () { return this.getValue("Status"); };
    Gutschrift.prototype.setStatus = function (value) { this.setValue("Status", value); };
    Gutschrift.prototype.getNettoBetrag = function () { return this.getValue("Summe netto"); };
    Gutschrift.prototype.setNettoBetrag = function (value) { this.setValue("Summe netto", value); };
    Gutschrift.prototype.getBetrag = function () { return this.getValue("Gutschriftbetrag"); };
    Gutschrift.prototype.setBetrag = function (value) { this.setValue("Gutschriftbetrag", value); };
    Gutschrift.prototype.getDokumententyp = function () { return this.getValue("Dokumententyp"); };
    Gutschrift.prototype.setDokumententyp = function (value) { this.setValue("Dokumententyp", value); };
    return Gutschrift;
}(Rechnung));
//Fassade der Tabellen in Ausgaben
var AusgabenRechnung = /** @class */ (function (_super) {
    __extends(AusgabenRechnung, _super);
    function AusgabenRechnung() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AusgabenRechnung.prototype.getMehrwertsteuer = function () { return this.getValue("Vorsteuer"); };
    AusgabenRechnung.prototype.setMehrwertsteuer = function (betrag) { this.setValue("Vorsteuer", betrag); };
    AusgabenRechnung.prototype.getBetragMitVorzeichen = function () { return -this.getBetrag(); };
    ;
    return AusgabenRechnung;
}(Rechnung));
var Bewirtungsbeleg = /** @class */ (function (_super) {
    __extends(Bewirtungsbeleg, _super);
    function Bewirtungsbeleg() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Bewirtungsbeleg.prototype.getFileId = function () { return this.getValue("ID"); };
    Bewirtungsbeleg.prototype.setFileId = function (value) { this.setValue("ID", value); };
    Bewirtungsbeleg.prototype.getTrinkgeld = function () { return this.getValue("Trinkgeld"); };
    Bewirtungsbeleg.prototype.setTrinkgeld = function (betrag) { this.setValue("Trinkgeld", betrag); };
    Bewirtungsbeleg.prototype.getAbziehbareBewirtungskosten = function () { return this.getValue("abziehbare Bewirtungskosten"); };
    Bewirtungsbeleg.prototype.setAbziehbareBewirtungskosten = function (value) { this.setValue("abziehbare Bewirtungskosten", value); };
    Bewirtungsbeleg.prototype.getNichtAbziehbareBewirtungskosten = function () { return this.getValue("nicht abziehbare Bewirtungskosten"); };
    Bewirtungsbeleg.prototype.setNichtAbziehbareBewirtungskosten = function (value) { this.setValue("nicht abziehbare Bewirtungskosten", value); };
    return Bewirtungsbeleg;
}(AusgabenRechnung));
var Abschreibung = /** @class */ (function (_super) {
    __extends(Abschreibung, _super);
    function Abschreibung() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Abschreibung;
}(Buchung));
//Fassade der Tabellen in Bankbuchungen
var Vertrag = /** @class */ (function (_super) {
    __extends(Vertrag, _super);
    function Vertrag() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Vertrag.prototype.getBezahltAm = function () { return ""; };
    Vertrag.prototype.setBezahltAm = function (datum) { this.setValue("Zahlungsdatum", this.getValue("Zahlungsdatum").toString() + "," + datum.toString()); };
    Vertrag.prototype.nichtBezahlt = function () { return this.getBezahltAm() === ""; };
    Vertrag.prototype.isBezahlt = function () { return !this.nichtBezahlt(); };
    Vertrag.prototype.getGegenkonto = function () { return this.getValue("Konto"); };
    ;
    return Vertrag;
}(Umbuchung));
var Bankbuchung = /** @class */ (function (_super) {
    __extends(Bankbuchung, _super);
    function Bankbuchung() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Bankbuchung.prototype.getKonto = function () { return this.getValue("Bilanzkonto"); };
    Bankbuchung.prototype.setKonto = function (value) { this.setValue("Bilanzkonto", value); };
    Bankbuchung.prototype.getNr = function () { return this.getValue("Nr"); };
    Bankbuchung.prototype.setNr = function (value) { this.setValue("Nr", value); };
    Bankbuchung.prototype.getBelegID = function () { return this.getValue("BelegID"); };
    Bankbuchung.prototype.setBelegID = function (value) { this.setValue("BelegID", value); };
    Bankbuchung.prototype.getGegenkontoBank = function () { return this.getValue("GegenkontoBank"); };
    Bankbuchung.prototype.setGegenkontoBank = function (value) { this.setValue("GegenkontoBank", value); };
    return Bankbuchung;
}(Buchung));
//Umbuchung gibt's schon
//Fassade der Tabellen in Bilanz und GuV
var Konto = /** @class */ (function (_super) {
    __extends(Konto, _super);
    function Konto() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Konto.prototype.getId = function () { return this.getValue("Konto").toString(); };
    Konto.prototype.setId = function (value) { this.setValue("Konto", value); };
    Konto.prototype.getKontentyp = function () { return this.getValue("Kontentyp"); };
    Konto.prototype.setKontentyp = function (value) { this.setValue("Kontentyp", value); };
    Konto.prototype.getSubtyp = function () { return this.getValue("Subtyp").toString(); };
    Konto.prototype.setSubtyp = function (value) { this.setValue("Subtyp", value); };
    Konto.prototype.getGruppe = function () { return this.getValue("Gruppe"); };
    Konto.prototype.setGruppe = function (value) { this.setValue("Gruppe", value); };
    Konto.prototype.getKonto = function () { return this.getValue("Konto"); };
    Konto.prototype.setKonto = function (value) { this.setValue("Konto", value); };
    Konto.prototype.getSKR03 = function () { return this.getValue("SKR03"); };
    Konto.prototype.setSKR03 = function (value) { this.setValue("SKR03", value); };
    Konto.prototype.getExportgruppe = function () { return this.getValue("Exportgruppe"); };
    Konto.prototype.setExportgruppe = function (value) { this.setValue("Exportgruppe", value); };
    Konto.prototype.getBeispiel = function () { return this.getValue("Beispiel"); };
    Konto.prototype.setBeispiel = function (value) { this.setValue("Beispiel", value); };
    Konto.prototype.getQuelle = function () { return this.getValue("Quelle"); };
    Konto.prototype.setQuelle = function (value) { this.setValue("Quelle", value); };
    Konto.prototype.getFormular = function () { return this.getValue("Formular"); };
    Konto.prototype.setFormular = function (value) { this.setValue("Formular", value); };
    Konto.prototype.getZN = function () { return this.getValue("ZN"); };
    Konto.prototype.setZN = function (value) { this.setValue("ZN", value); };
    Konto.prototype.isAnlage = function () { return this.getGruppe() === "Anlage"; };
    Konto.prototype.isBestandskonto = function () { return this.getGruppe() === "Bestand"; };
    Konto.prototype.isBankkonto = function () { return this.getGruppe() === "Bankkonto"; };
    Konto.prototype.getSumme = function () { return this.getValue("Summe"); };
    Konto.prototype.getDefaultMwSt = function () { return this.getGruppe().split(",")[1]; };
    return Konto;
}(TableRow));
function uid() { return Math.random.toString(); }
