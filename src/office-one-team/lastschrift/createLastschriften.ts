function createLastschriften(rootId){
    let lm = new LastschriftmandatTableCache(rootId);
    let lmArray = lm.getRowArray() as Lastschriftmandat[];
    let lp = new LastschriftproduktTableCache(rootId);
    let lpHash = lp.getOrCreateHashTable("Formularname");
    let lstc = new LastschriftenTableCache(rootId);
    lmArray.filter(lm => lm.getStatus()==="bestätigt").forEach(lm => {
        let ls = lstc.createNewRow();
        ls.setLm(lm.getId());
        let lp = lpHash[lm.getProdukt()] as Lastschriftprodukt;
        ls.setBetrag(lp.getPreis());
        ls.setVerwendungszweck(lp.getVerwendungszweck());
        ls.setDatum(new Date());
        ls.setStatus("geplant");
    }); 
    lstc.save();
}