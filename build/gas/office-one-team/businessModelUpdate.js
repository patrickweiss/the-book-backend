function businessModelUpdate(rootFolderId, action) {
    var BM = new BusinessModel(rootFolderId);
    BM.handleAction(JSON.parse(action));
    BM.save();
    var result = {
        serverFunction: ServerFunction.businessModelUpdate,
        testName: "Zuordnung gespeichert"
    };
    return JSON.stringify(result);
}
