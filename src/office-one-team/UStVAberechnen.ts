function UStVAberechnen(rootFolderId: string){
    let BM = new BusinessModel(rootFolderId);
    BM.kontoSummenAktualisieren();
    BM.save();
    var result = {
        serverFunction: ServerFunction.UStVAberechnen,
        BuchungenD: BM.getNormalisierteBuchungenTableCache().getData(),
    }
      return JSON.stringify(result);
}
