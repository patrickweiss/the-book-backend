function doPost(e){

    const receipt = JSON.parse(e.postData.contents);


    const elsterTransferTableCache = new ElsterTransferTableCache(elsterSpreadsheetId);
    const elsterTransferTicketHash = elsterTransferTableCache.getOrCreateHashTable("transferticket");
    const etr = elsterTransferTicketHash[receipt.ticket] as ElsterTransfer;
    etr.setBelegDatum(receipt.receipt);
    MailApp.sendEmail({
        to: etr.getemail(),
        subject: "UStVA Elster Beleg",
        htmlBody: etr.getBelegDatum()
      });
    elsterTransferTableCache.save();
    return ContentService.createTextOutput("Beleg verschickt");
}
