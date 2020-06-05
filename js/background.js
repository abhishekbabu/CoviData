const COUNTRIES_URL = "https://disease.sh/v2/countries";

let problematic = ["CIV", "LAO"];

chrome.runtime.onInstalled.addListener(() => {
  console.log("installed");
  GetCountryList();
});

async function GetCountryList() {
  try {
    let response = await fetch(COUNTRIES_URL);
    let parsed = await response.json();
    console.log(parsed);
    let unsorted = {};
    for (const model in parsed) {
      if (parsed[model].countryInfo.iso3 !== null && !problematic.includes(parsed[model].countryInfo.iso3)) {
        unsorted[parsed[model].country] = parsed[model].countryInfo.iso3;
      }
    }

    var keys = Object.keys(unsorted);
    keys.sort();

    var countryList = {};

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var value = unsorted[key];
      countryList[key] = value;
    }
    
    console.log(countryList);
    chrome.storage.sync.set({"countryList": countryList});
  } catch (err) {
    console.log(err.message)
  }
}
