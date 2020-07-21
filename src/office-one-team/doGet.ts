function doGet(e) {

    if (e === undefined) e = {
        parameter: { email: "patrick.sbrzesny@saw-office.net" }
    };

    //https://script.google.com/macros/s/AKfycbz_X-7g3LPVEG8ehzB3JWwLPLvRdzXh0Z-46LWvSCWyJgTP4Ks/exec?clientSecret=fnkhnei7zj4g7k&email=patrick.sbrzesny@saw-office.net
    var params = e.parameter;
    if (params.clientSecret != "fnkhnei7zj4g7k") return ContentService.createTextOutput("unauthorized request");

    let ustvaMails = searchUStVA(params.email);
    if (ustvaMails.length === 0) return ContentService.createTextOutput("keine neue UStVA");

    let firstMail = ustvaMails[0];

    markProcessed(firstMail);
    const ustvaJSON = firstMail.getMessages()[0].getPlainBody();
    Logger.log(ustvaJSON) 

    return ContentService.createTextOutput(ustvaJSON);
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