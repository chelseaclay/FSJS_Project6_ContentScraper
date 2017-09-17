const fs = require('fs');
const scrapeIt = require("scrape-it");
const json2csv = require('json2csv');
const path = require('path');

const csvFileDirectory = "./data";
const completeShirtInfo = [];

let dt = new Date();
let timeStamp = dt.toUTCString();

const scrapeItOpts = {
  shirtList:{
    listItem: ".products li",
    data:{
      shirtLinks:{
          selector: 'a',
          attr: 'href'
      }
    }
  }
};

const scrapeItDetailsOpts = {
  shirtDetails: {
    listItem: "#content",
    data: {
      title: ".shirt-details h1",
      price: ".shirt-details .price",
      imageURL: {
        selector: ".shirt-picture img",
        attr: "src"
        }
      }
    }
  };

function scrapeItDetails (itemLink) {
  itemLink = itemLink.slice(9, 18);
  //scrape info details of each page
  scrapeIt(`http://shirts4mike.com/shirt.php${itemLink}`, scrapeItDetailsOpts, (err, page) => {
    // console.log(err || page);
    const shirtDetailsScrape = [];
    let pageTitle = page.shirtDetails[0].title;
    shirtDetailsScrape.Title = pageTitle.slice(4);
    shirtDetailsScrape.Price = page.shirtDetails[0].price;
    shirtDetailsScrape.ImageURL = page.shirtDetails[0].imageURL;
    shirtDetailsScrape.URL = `http://shirts4mike.com/shirt.php${itemLink}`;
    let dt = new Date();
    let utcDate = dt.toUTCString();
    shirtDetailsScrape.Time = utcDate;
    // console.log(shirtDetailsScrape);
    completeShirtInfo.push(shirtDetailsScrape);
    if (completeShirtInfo.length === 8) {
      csvFunction();
    }
  });
}

function csvFunction () {
  const fields = ['Title', 'Price', 'ImageURL', 'URL', 'Time'];
  const csv = json2csv({ data: completeShirtInfo, fields: fields });
  fs.writeFile(`./data/${timeStamp}.csv`, csv, function(err) {
    if (err) throw err;
    console.log('File saved successfully.');
  });
}

function errorFunction (error) {
  let errorMessage = '\n' + timeStamp + " " + error.message;
  fs.appendFile('scraper-error.log', errorMessage, (err) => {
    if (err) throw err;
    console.log('There was an issue with this file. Please check the error log.');
  });
}

const scrapeItCallback = (err, page) => {
  // console.log(err || page);
  try {
    for (var i = 0; i < page.shirtList.length; i++) {
      scrapeItDetails(page.shirtList[i].shirtLinks);
    }
  } catch (error) {
    errorFunction(error);
  }
};

// if data folder doesn’t exist
if (!fs.existsSync(csvFileDirectory)) {
  // create one
  fs.mkdirSync(csvFileDirectory);
} else {
  // remove old files
  fs.readdir(csvFileDirectory, (err, files) => {
    if (err) throw error;
    for (const file of files) {
      fs.unlink(path.join(csvFileDirectory, file), err => {
        if (err) throw error;
      });
    }
  });
}

// scrape info from entry page
try {
  scrapeIt("http://shirts4mike.com/shirts.php", scrapeItOpts, scrapeItCallback);
} catch (error) {
  errorFunction(error);
}
