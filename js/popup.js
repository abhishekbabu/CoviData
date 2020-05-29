const COUNTRIES_URL = "https://disease.sh/v2/countries";

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
  let response = await getCountryData(country);
  console.log(response);
  document.getElementById("active").innerHTML = `Active: ${response.active.toLocaleString()}`;
  document.getElementById("cases").innerHTML = `Cases: ${response.cases.toLocaleString()}`;
  document.getElementById("recovered").innerHTML = `Recovered: ${response.recovered.toLocaleString()}`;
  document.getElementById("deaths").innerHTML = `Deaths: ${response.deaths.toLocaleString()}`;
  document.getElementById("population").innerHTML = `Population: ${response.population.toLocaleString()}`;
}

async function getCountryData(country) {
  try {
    let response = await fetch(`${COUNTRIES_URL}/` + country);
    let parsed = await response.json();
    console.log(parsed)
    return parsed;
  } catch (err) {
    console.log(err.message)
    return err.message;
  }
}
