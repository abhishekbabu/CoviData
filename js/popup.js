chrome.storage.sync.get("countryList", function(data) {
    const sel = document.getElementById("countrySel");
    Object.keys(data.countryList.sort()).map(key => sel.add(new Option(data.countryList[key], key)));
});
// {
//     "1" : "United States",
//     "2" : "Canada",
//     "3" : "Spain"
// }



