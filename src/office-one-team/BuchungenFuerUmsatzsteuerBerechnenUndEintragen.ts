function BuchungenFuerUmsatzsteuerBerechnenUndEintragen(rootFolderId: string){
    let BM = new BusinessModel(rootFolderId);
    BM.umsatzsteuerJahresabrechnung();
    BM.save();
    var result = {
        serverFunction: ServerFunction.BuchungenFuerUmsatzsteuerBerechnenUndEintragen,
        testName:createUmsatzsteuerArray( BM.getImGeschaeftsjahrBezahlteEinnahmenRechnungen()),
        gutsch:createUmsatzsteuerArray( BM.getImGeschaeftsjahrBezahlteGutschriften()),
      }
      return JSON.stringify(result);
}


function createUmsatzsteuerArray(anlagenArray: Buchung[]) {
    var result:number[] = [];
    for (let index in anlagenArray) {
      result.push(anlagenArray[index].getBetrag());
    }
    return result;
  }