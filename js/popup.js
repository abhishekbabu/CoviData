const COUNTRY_DATA_URL = "https://api.covid19api.com/total/country";

document.addEventListener('DOMContentLoaded', function() {
  const countrySelect = document.getElementById("countrySel");

  chrome.storage.sync.get("countryList", function(data) {
    Object.keys(data.countryList).forEach(function(key) {
      countrySelect.add(new Option(key, data.countryList[key]));
    });
  });

  countrySelect.addEventListener("change", async function() {await loadCountryData(countrySelect.value)}, false);
});

async function loadCountryData(country) {
  chrome.storage.sync.set({"selectedCountry": country});
  console.log(country);
  let response = await GetCountryData(country);
  document.getElementById("cases").innerHTML = `Cases: ${response.Confirmed}`;
}

async function GetCountryData(country) {
  try {
    let response = await fetch(`${COUNTRY_DATA_URL}/` + country);
    let parsed = await response.json();
    console.log(parsed)
    return parsed[parsed.length-1];
  } catch (err) {
    console.log(err.message)
    return err.message;
  }
}
