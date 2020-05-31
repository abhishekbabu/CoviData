const COUNTRIES_URL = "https://disease.sh/v2/countries";
const HISTORICAL_URL = "https://disease.sh/v2/historical"

document.addEventListener('DOMContentLoaded', function() {
  const countrySelect = document.getElementById("countrySel");

  chrome.storage.sync.get("countryList", function(data) {
    Object.keys(data.countryList).forEach(function(key) {
      countrySelect.add(new Option(key, data.countryList[key]));
    });
  });

  chrome.storage.sync.get("selectedCountry", function(data) {
    if (data.selectedCountry.length > 0) {
      countrySelect.value = data.selectedCountry;
      loadCountryData(countrySelect.value);
      loadHistoricalData(countrySelect.value);
    }
  })

  countrySelect.addEventListener("change", async function() {
    await loadCountryData(countrySelect.value)
    await loadHistoricalData(countrySelect.value)
  }, false);
});

Date.prototype.today = function () { 
  return ((this.getDate() < 10)?"0":"") + this.getDate() +"/"+(((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"/"+ this.getFullYear();
}

// For the time now
Date.prototype.timeNow = function () {
   return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
}

async function loadCountryData(country) {
  chrome.storage.sync.set({"selectedCountry": country});
  console.log(country);
  document.getElementById("loading").innerHTML = "Loading...";
  let response = await getCountryData(country);
  document.getElementById("flag").src = response.countryInfo.flag;
  document.getElementById("active").innerHTML = `Active: ${response.active.toLocaleString()}`;
  document.getElementById("cases").innerHTML = `Cases: ${response.cases.toLocaleString()}`;
  document.getElementById("recovered").innerHTML = `Recovered: ${response.recovered.toLocaleString()}`;
  document.getElementById("deaths").innerHTML = `Deaths: ${response.deaths.toLocaleString()}`;
  document.getElementById("population").innerHTML = `Population: ${response.population.toLocaleString()}`;
  var currDate = new Date();
  var lastSync = "Data last updated: " + currDate.today() + " at " + currDate.timeNow();
  document.getElementById("loading").innerHTML = `${lastSync}`;
}

async function getCountryData(country) {
  try {
    let response = await fetch(`${COUNTRIES_URL}/` + country);
    let parsed = await response.json();
    return parsed;
  } catch (err) {
    console.log(err.message)
    return err.message;
  }
}

async function getHistoricalData(country) {
  try {
    let response = await fetch(`${HISTORICAL_URL}/` + country + `?lastdays=30`);
    let parsed = await response.json();
    return parsed;
  } catch (err) {
    console.log(err.message);
    return err.message;
  }
}

async function loadHistoricalData(country) {
  // sample code from: https://www.d3-graph-gallery.com/intro_d3js.html

  let response = await getHistoricalData(country);
  console.log(response);

  // historical data not available
  if (response.hasOwnProperty('message')) {
    document.getElementById("loading").innerHTML += " - Historical data unavailabe for this country";
    d3.selectAll("svg > *").remove()
    return;
  }

  // get date boundaries
  let minDateString = Object.keys(response.timeline.cases)[0];
  let minDateValues = splitDateString(minDateString);
  let minDate = new Date(minDateValues[0], minDateValues[1], minDateValues[2]);
  console.log(minDate);

  let maxDateString = Object.keys(response.timeline.cases)[29];
  let maxDateValues = splitDateString(maxDateString);
  let maxDate = new Date(maxDateValues[0], maxDateValues[1], maxDateValues[2]);
  console.log(maxDate);

  // get max cases for y boundary
  let cases = Object.values(response.timeline.cases)
  let maxCases = Math.max.apply(Math, cases);
  let maxScale = (((maxCases -(maxCases % 1000)) / 1000) + 1) * 1000;

  // set the dimensions and margins of the graph
  var margin = {top: 10, right: 30, bottom: 50, left: 60},
  width = 500 - margin.left - margin.right,
  height = 350 - margin.top - margin.bottom;

  // clear graph to reload new axes
  d3.selectAll("svg > *").remove()

  // append the svg object to the body of the page
  var sVg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // X scale and Axis
  var xScale = d3.scaleTime()
    .domain([minDate, maxDate])
    .range([0, width]);
  sVg
    .append('g')
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %d")))
    .selectAll("text")	
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-65)");

  // Y scale and Axis
  var yScale = d3.scaleLinear()
    .domain([0, maxScale])
    .range([height, 0]);
  sVg
    .append('g')
    .call(d3.axisLeft(yScale));

  // code to plot data --  not working
  sVg.selectAll().data(response.timeline.cases)
    .enter().append("rect")
    .attr("x", function(d) {
      let date = splitDateString(d);
      return xScale(new Date(date[0], date[1], date[2]));
    })
    .attr("y", function(d) { return yScale(d.value) })
    .attr("height", function(d) { return height - yScale(d.value) });
}

// splits a date string and returns the year, month and date
function splitDateString(dateString) {
  let res = dateString.split("/");
  let month = parseInt(res[0]) - 1;
  let date = parseInt(res[1]);
  let year = parseInt("20" + res[2]);
  return [year, month, date];
}
