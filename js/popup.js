const COUNTRIES_URL = "https://disease.sh/v2/countries";

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
    }
  })

  countrySelect.addEventListener("change", async function() {
    await loadCountryData(countrySelect.value)
  }, false);
  
  loadBarGraph();
});

async function loadCountryData(country) {
  chrome.storage.sync.set({"selectedCountry": country});
  console.log(country);
  document.getElementById("loading").innerHTML = "Loading...";
  let response = await getCountryData(country);
  document.getElementById("loading").innerHTML = "";
  console.log(response);
  document.getElementById("flag").src = response.countryInfo.flag;
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
    return parsed;
  } catch (err) {
    console.log(err.message)
    return err.message;
  }
}

function loadBarGraph() {
  // Creating the bar graph using d3.js --- test
  var svg = d3.select("svg"),
        margin = 200,
        width = svg.attr("width") - margin,
        height = svg.attr("height") - margin

    svg.append("text")
       .attr("transform", "translate(100,0)")
       .attr("x", 50)
       .attr("y", 50)
       .attr("font-size", "24px")
       .text("XYZ Foods Stock Price")

    var xScale = d3.scaleBand().range([0, width]).padding(0.4),
        yScale = d3.scaleLinear().range([height, 0]);

    var g = svg.append("g")
               .attr("transform", "translate(" + 100 + "," + 100 + ")");

    console.log("Made it to right before .csv()");
    d3.csv("/js/XYZ.csv", function(error, data) {
        console.log("Made it into .csv()");
        if (error) {
            console.log("Threw an error in .csv()");
            throw error;
        }

        xScale.domain(data.map(function(d) { return d.year; }));
        console.log(xScale);
        yScale.domain([0, d3.max(data, function(d) { return d.value; })]);
        console.log(yScale);

        g.append("g")
         .attr("transform", "translate(0," + height + ")")
         .call(d3.axisBottom(xScale))
         .append("text")
         .attr("y", height - 250)
         .attr("x", width - 100)
         .attr("text-anchor", "end")
         .attr("stroke", "black")
         .text("Year");

        g.append("g")
         .call(d3.axisLeft(yScale).tickFormat(function(d){
             return "$" + d;
         })
         .ticks(10))
         .append("text")
         .attr("transform", "rotate(-90)")
         .attr("y", 6)
         .attr("dy", "-5.1em")
         .attr("text-anchor", "end")
         .attr("stroke", "black")
         .text("Stock Price");

        g.selectAll(".bar")
         .data(data)
         .enter().append("rect")
         .attr("class", "bar")
         .attr("x", function(d) { return xScale(d.year); })
         .attr("y", function(d) { return yScale(d.value); })
         .attr("width", xScale.bandwidth())
         .attr("height", function(d) { return height - yScale(d.value); });
    });
    console.log("End of loadBarGraph()");
}
