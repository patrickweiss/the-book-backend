function UStVAverschicken(rootFolderId: string, ustvaID: string) {
  let BM = new BusinessModel(rootFolderId);
  const ustva = BM.getUStVATableCache().getOrCreateRowById(ustvaID);

  let ustvaElster = {};
  const ustvaRangeData: Object[][] = DriveConnector.getNamedRangeData(rootFolderId, "ElsterUStVA", oooVersion)[0];
  for (let zeile of ustvaRangeData) {
    ustvaElster[zeile[0].toString()] = zeile[1];
  }

  const zeitraumMap = {
    "4. Quartal": "44",
    "3. Quartal": "43",
    "2. Quartal": "42",
    "1. Quartal": "41",
    "12 Dezember": "12",
    "11 November": "11",
    "10 Oktober": "10",
    "09 September": "09",
    "08 August": "08",
    "07 Juli": "07",
    "06 Juni": "06",
    "05 Mai": "05",
    "04 April": "04",
    "03 März": "03",
    "02 Februar": "02",
    "01 Januar": "01"
  }
  ustvaElster["zeitraum"]=zeitraumMap[ustva.getPeriodeundStatus()];
  ustvaElster["kz81"] = ustva.get81();
  ustvaElster["kz66"] = ustva.get66();
  ustvaElster["kz48"] = ustva.get48();
  ustvaElster["kz35"] = ustva.get35();
  ustvaElster["kz36"] = ustva.get36();
  ustvaElster["kz83"] = ustva.get83();
  
  MailApp.sendEmail("patrick.sbrzesny@saw-office.net", "UStVA verschicken", JSON.stringify(ustvaElster));

  var result = {
    serverFunction: ServerFunction.getNamedRangeData,
    rangeName: "UStVAD",
    namedRangeData: BM.getUStVATableCache().getData()
  }
  return JSON.stringify(result);
  /* 
   var result = {
       serverFunction: ServerFunction.UStVAberechnen,
       UStVAD: BM.getUStVATableCache().getData(),
   }
     return JSON.stringify(result);
     */
}
