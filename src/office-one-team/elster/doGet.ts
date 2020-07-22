function doGet(e) {

    if (e === undefined) e = {
        parameter: {
            email: "patrick.sbrzesny@saw-office.net",
            clientSecret: "fnkhnei7zj4g7k"
        }
    };

    //https://script.google.com/macros/s/AKfycbz_X-7g3LPVEG8ehzB3JWwLPLvRdzXh0Z-46LWvSCWyJgTP4Ks/exec?clientSecret=fnkhnei7zj4g7k&email=patrick.sbrzesny@saw-office.net
    var params = e.parameter;
    if (params.clientSecret != "fnkhnei7zj4g7k") return ContentService.createTextOutput(JSON.stringify({ message: "unauthorized request" }));

    if (params.email) {
        let ustvaMails = searchUStVA(params.email);
        if (ustvaMails.length === 0) return ContentService.createTextOutput(JSON.stringify({ message: "keine neue UStVA" }));

        let firstMail = ustvaMails[0];

        markProcessed(firstMail);
        const ustvaJSON = JSON.parse(firstMail.getMessages()[0].getPlainBody().replace(/(\r\n|\n|\r)/gm, ""));
        Logger.log(JSON.stringify(ustvaJSON));

        const elsterTransferTableCache = new ElsterTransferTableCache("1-b7eO9tjq4lZcpHDnhfcd4cUdBnRbXGt");
        const elsterTransferRow = elsterTransferTableCache.createNewRow();
        elsterTransferRow.setemail(params.email);
        elsterTransferRow.setdaten(JSON.stringify(ustvaJSON));
        elsterTransferRow.setdatum(new Date());
        elsterTransferTableCache.save();
        ustvaJSON.EtNr = elsterTransferRow.getId()
        return ContentService.createTextOutput(JSON.stringify(ustvaJSON));
    }
    if (params.transferTicket){
        const elsterTransferTableCache = new ElsterTransferTableCache("1-b7eO9tjq4lZcpHDnhfcd4cUdBnRbXGt");
        const elsterTransferRow = elsterTransferTableCache.getOrCreateRowById(params.EtNr);
        elsterTransferRow.settransferticket(params.transferTicket)
        elsterTransferTableCache.save();
   
    }

}

const PROCESSED_LABEL = "UStVA verschickt";

function searchUStVA(email: string): GoogleAppsScript.Gmail.GmailThread[] {


    let SEARCH_FROM_EMAIL = email;
    let SEARCH_SUBJECT = "UStVA verschicken";
    var SEARCH_STRING = `from:${SEARCH_FROM_EMAIL} AND (subject:"${SEARCH_SUBJECT}") AND NOT (label:"${PROCESSED_LABEL}")`;

    Logger.log("Suchstring für neue Movement Emails:" + SEARCH_STRING);

    return GmailApp.search(SEARCH_STRING);

}


function markProcessed(thread) {
    if (thread == null) {
        throw new Error("ERROR: No emails threads to process.");
    }
    var label = GmailApp.getUserLabelByName(PROCESSED_LABEL);
    if (label == null) {
        label = GmailApp.createLabel(PROCESSED_LABEL);
    }
    // Mark the email thread as PROCESSED
    label.addToThread(thread);
    // Mark the email thread as Read
    thread.markRead();
}