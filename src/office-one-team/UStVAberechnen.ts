function UStVAberechnen(rootFolderId: string){
    let BM = new BusinessModel(rootFolderId);
    BM.kontoSummenAktualisieren();
    BM.save();

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

