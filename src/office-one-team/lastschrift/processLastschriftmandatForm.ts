const httpEndpoint = "https://script.google.com/macros/s/AKfycbzofWRoZOPDdS8IUMVkAOv4W_TJICjpzpm--PCwZUPUdWHEKxc/exec"
function processLastschriftmandatForm(event:GoogleAppsScript.Events.FormsOnSubmit,rootId){
    let lmtc = new LastschriftmandatTableCache(rootId);
    let mandat = lmtc.createNewRow();
    mandat.setZeitstempel(event.namedValues["Zeitstempel"])
    mandat.setEMailAdresse(event.namedValues["E-Mail-Adresse"]);
    mandat.setKontoinhaber(event.namedValues["Kontoinhaber"]);
    mandat.setStraßeundHausnummer(event.namedValues["Straße und Hausnummer"]);
    mandat.setPostleitzahl(event.namedValues["Postleitzahl"]);
    mandat.setOrt(event.namedValues["Ort"]);
    mandat.setIBAN(event.namedValues["IBAN"]);
    mandat.setBIC(event.namedValues["BIC"]);
    mandat.setNamederBank(event.namedValues["Name der Bank"]);
    mandat.setVorname(event.namedValues["Vorname"]);
    mandat.setNachname(event.namedValues["Nachname"]);
    mandat.setErteilung(event.namedValues["Erteilung"]);
    mandat.setStatus(uuidv4());
    let mailBody = `${JSON.stringify(event.namedValues)}
    Bestätigungslink: ${httpEndpoint}?email=${mandat.getEMailAdresse()}&r=${rootId}&uuid=${mandat.getStatus()}`

    GmailApp.sendEmail(mandat.getEMailAdresse(),"Lastschriftmandat",mailBody);
    lmtc.save();
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }