function businessModelBatchUpdate(rootFolderId: string,action:string){
    let BM = new BusinessModel(rootFolderId);
    let actionBatch:[] = JSON.parse(action) as [];
    actionBatch.forEach(action =>BM.handleAction(action));
    BM.save();
    var result = {
        serverFunction: ServerFunction.businessModelBatchUpdate,
        testName:"Zuordnungen gespeichert"
      }
    return JSON.stringify(result);
}