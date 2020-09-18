function doGetLastschriftmandat(e:GoogleAppsScript.Events.DoGet){
    let rootId=e.parameter["r"];
    let lmtc = new LastschriftmandatTableCache(rootId);
    let lmhash = lmtc.getOrCreateHashTable("Status");
    let lmtr = lmhash[e.parameter["uuid"]] as Lastschriftmandat;
    console.log(JSON.stringify(e.parameter)+lmtr.getKontoinhaber());
    if (lmtr.getEMailAdresse()===e.parameter["email"]){
        lmtr.setStatus("bestätigt");
        lmtc.save();
        return HtmlService.createHtmlOutput('<b>Lastschriftmandat erteilt</b>');
    } 
    return HtmlService.createHtmlOutput('<b>Fehler Lastschriftmandat nicht erteilt</b>');
}