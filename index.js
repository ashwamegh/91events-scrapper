// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");


let html = "<div> </div>";


// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('/events', function(request, response){
  /*  Initial fetch of the events page of 91 springboard */
onDataRequest("/?cur=eyJhbGciOiJIUzI1NiJ9.Mg.dndKdLWtEqScXqTns2wc48r6oIF1kTnFDwTZ0PnisjM", response);
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});


/* A recursive function to fetch more data if it exists, initially loads the initial data */
const onDataRequest = (query,apiResponse) => {
  const scrapeQuery = "https://events.91springboard.com" + query + "&json=true";
  axios
    .get(scrapeQuery)
    .then(response => {
      if (response.status === 200) {
        html += response.data.event_response.html;

        if (response.data.more_pages) {
          onDataRequest(response.data.load_more_url, apiResponse);
        } else {
          postProcessScrapedHTML(apiResponse);
        }
      } else {
        console.error("Error Encountered");
      }
    })
    .catch(error => console.error(error));
};


/* Function to Format the scraped HTML data and save it in the file */
const postProcessScrapedHTML = (apiResponse) => {
  const $ = cheerio.load(html);

  let eventsToList = [];

  // title, image_url, rsvp_link, desciption, location, date

  $(".material-card.Grey").each((i, element) => {
    eventsToList[i] = {
      title: $(element)
        .find("a.white")
        .text()
        .trim(),
      image_url: $(element)
        .find(".img-container")
        .css("background-image")
        .replace("url(", "")
        .replace(")", "")
        .replace(/\"/gi, ""),
      rsvp_link: $(element)
        .find("a.white")
        .attr("href")
        .trim(),
      description: $(element)
        .find(".mc-description p")
        .text(),
      map_location: $(element)
        .find(".mc-footer ul li:first-child a")
        .attr("href"),
      hub_location: $(element)
        .find(".mc-footer ul li:first-child a").text().trim(),
      date: $(element)
        .find(".mc-footer ul li:nth-child(2) a")
        .attr("href")
    };
  });

  const eventToListTrimmed = eventsToList.filter(n => n != undefined);
  
  apiResponse.send(JSON.stringify(eventToListTrimmed, null, 4));
  
  fs.writeFile(
    "events.json",
    JSON.stringify(eventToListTrimmed, null, 4),
    err => console.log("File written successfully")
  );
};