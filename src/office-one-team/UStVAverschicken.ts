function UStVAverschicken(rootFolderId: string,ustvaID:string){
    let BM = new BusinessModel(rootFolderId);
    const ustva = BM.getUStVATableCache().getOrCreateRowById(ustvaID);
    
    MailApp.sendEmail("eins.stein@officeone.team",ustva.getPeriodeundStatus(),ustva.getDataArray().toString());

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
