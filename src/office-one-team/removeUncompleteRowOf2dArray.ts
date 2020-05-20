function removeUncompleteRowOf2dArray(dataArray:[][]){
    let columns = dataArray[0].length;
    if (dataArray[dataArray.length-1].length<columns){
        dataArray.pop();
    }
}