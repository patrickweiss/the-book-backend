function doGet(e:GoogleAppsScript.Events.DoGet){
    if (e.parameter["clientSecret"])return doGetElster(e);
    if (e.parameters["email"])return doGetLastschriftmandat(e);
}