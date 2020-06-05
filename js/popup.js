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
    if (data.selectedCountry !== undefined && data.selectedCountry.length > 0) {
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

async function loadCountryData(country) {
  chrome.storage.sync.set({"selectedCountry": country});
  console.log(country);
  document.getElementById("loading").innerHTML = "Loading...";
  let response = await getCountryData(country);
  if (response.hasOwnProperty('message')) {
    return;
  }
  document.getElementById("flag").src = response.countryInfo.flag;
  document.getElementById("active").innerHTML = `${response.active.toLocaleString()}`;
  document.getElementById("cases").innerHTML = `${response.cases.toLocaleString()}`;
  document.getElementById("recovered").innerHTML = `${response.recovered.toLocaleString()}`;
  document.getElementById("deaths").innerHTML = `${response.deaths.toLocaleString()}`;
  document.getElementById("population").innerHTML = `${response.population.toLocaleString()}`;
  document.getElementById("loading").innerHTML = "Data last updated: " + new Date().toLocaleString();;
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
  let response = await getHistoricalData(country);
  console.log(response);

  // historical data not available
  if (response.hasOwnProperty('message')) {
    d3.selectAll("svg > *").remove()

    var svg = d3.select("#chart");
    var text = svg.append("text")
      .attr("x", 275)
      .attr("y", 175)
      .style("font-size", "36px")
      .style("text-anchor", "middle");
    
      text.text("Historical data unavailable");
    return;
  }

  // get date boundaries
  let minDateString = Object.keys(response.timeline.cases)[0];
  let minDate = getDate(minDateString);

  let maxDateString = Object.keys(response.timeline.cases)[29];
  let maxDate = getDate(maxDateString);

  // get max cases for y boundary
  let cases = Object.values(response.timeline.cases)
  let maxCases = Math.max.apply(Math, cases);
  let maxScale = (((maxCases -(maxCases % 1000)) / 1000) + 1) * 1000;

  // set the dimensions and margins of the graph
  var margin = {top: 10, right: 30, bottom: 50, left: 60},
  width = 550 - margin.left - margin.right,
  height = 300 - margin.top - margin.bottom;

  // clear graph to reload new axes
  d3.selectAll("svg > *").remove()

  // append the svg object to the body of the page
  var sVg = d3.select("#chart")
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

  historicalData = [];
  for (var i = 0; i < Object.keys(response.timeline.cases).length; i++) {
    let dataPoint = {};
    dataPoint.date = Object.keys(response.timeline.cases)[i];
    dataPoint.cases = Object.values(response.timeline.cases)[i];
    historicalData.push(dataPoint);
  }
  console.log(historicalData)

  // add the tooltip area to the webpage
  var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)

  // code to plot data 
  sVg.selectAll("svg").data(historicalData)
    .enter().append("circle")
    .attr("class", "point")
    .attr("cx", function(d) { return xScale(getDate(d.date)) })
    .attr("cy", function(d) { return yScale(d.cases) })
    .attr("r", 4)
    .on("mouseover", function(d) {
      d3.select(this).attr("class", "highlight");
      tooltip.transition()
        .duration(100)
        .style("opacity", 1);
      tooltip.html("Date: " + d.date + "<br>" + "Cases: " + d.cases)
        .style("left", (d3.event.pageX - 66) + "px")
        .style("top", (d3.event.pageY - 50) + "px")
    })
    .on("mouseout", function(d) {
      d3.select(this).attr("class", "point");
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    })
}

// splits a date string and returns the year, month and date
function getDate(dateString) {
  let res = dateString.split("/");
  let month = parseInt(res[0]) - 1;
  let date = parseInt(res[1]);
  let year = parseInt("20" + res[2]);
  return new Date(year, month, date);
}
