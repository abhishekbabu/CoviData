const testUrl = "https://disease.sh/v2/nyt/usa";

chrome.runtime.onInstalled.addListener(() => {
  console.log("installed");
  testRequest();
});

async function testRequest() {
  const response = await fetch(testUrl);
  const data = await response.json();
  console.log(data);
}