const express = require('express');
const { url } = require('inspector');
const puppeteer = require('puppeteer-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth')();

const cors = require('cors');

["chrome.runtime", "navigator.languages"].forEach(a =>
    stealthPlugin.enabledEvasions.delete(a)
  );
  
  const app = express();
  app.use(cors());
  app.use(express.json());

  const port = 5000;


  app.post('/scrape', async (req, res) => {
    const { userLink, num_videos } = req.body;
    try {
      console.log("Start Scrapping")
      await scrapeTiktok(userLink, num_videos,res);
      res.send('Scraping completed!');
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred during scraping.');
    }
  });
  
  app.get('/', async (req, res) => {
      res.send('Tiktok scrapper is ready!!');
  });

  // Start the server
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  async function scrapeTiktok(userLink, num_videos,res) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
  
    await page.evaluateOnNewDocument(() => {
      delete navigator.__proto__.webdriver;
    });
    //We stop images and stylesheet to save data
    await page.setRequestInterception(true);
  
    page.on('request', (request) => {
      if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    })
  
    await page.goto(userLink); //change this to user url page
    // let username = page.url().slice(23,).replace(/[-:.\/*<>|?]/g, "");
    const startIndex = userLink.indexOf('@') + 1;
    const endIndex = userLink.indexOf('?');
    const username = userLink.slice(startIndex, endIndex);
  
    //scroll down until no more videos
    await autoScroll(page);
  
    const urls = await page.evaluate(() =>
      Array.from(document.querySelectorAll('div.tiktok-1qb12g8-DivThreeColumnContainer > div > div > div > div > div > a'), element => element.href));
  
    var videoDes = await page.evaluate(() => Array.from(document.querySelectorAll('div.tiktok-1qb12g8-DivThreeColumnContainer.eegew6e2 > div > div > div > a')).map((items) => items.innerText))
    
    
    for (var i = videoDes.length; i--;) {
      videoDes[i] = videoDes[i] + ' #shorts' + "\r\n";
    }; 
    const fs = require('fs');
  
    // fs.appendFile('names.txt', videoDes + '', function (err) {
    //   if (err) throw err;
    //   console.log('Descriptions Saved!');
    // });

    const max_videos = num_videos == 0 ? urls.length : num_videos;
    console.log(max_videos)
    console.log(num_videos)


    console.log('now it downloading ' + max_videos + ' video')

    for (var i = 0; i < max_videos; i++)
    {
      function getRandomNumber() {
        var random = Math.floor(Math.random() * (500 - 300 + 1)) + 300;
        return random;
      };
      function getHighNumber() {
        var random = Math.floor(Math.random() * (500 - 300 + 1)) + 1150;
        return random;
      };
      await page.waitForTimeout(getHighNumber());
      await page.goto('https://snaptik.app/');
      await page.waitForTimeout(getRandomNumber());
  
      await page.waitForSelector('input[name="url"]');
      await page.type('input[name="url"]', (urls[i]), { delay: 50 }); //type result of links
      let link = (urls[i]).slice(-19)
    
      await page.waitForTimeout(getRandomNumber());
      
      await page.click('.button-go');
      await page.waitForTimeout(getHighNumber());
      
      await page.waitForXPath('//*[@id="download"]/div/div[2]/a[1]');
      const featureArticle = (await page.$x('//*[@id="download"]/div/div[2]/a[1]'))[0];
  
      const text = await page.evaluate(el => {
        
        return el.href;
      }, featureArticle);
      var noWaterMark = text
      const content = decodeURIComponent(noWaterMark);
  
      const https = require('https');
      const ds = require('fs');
  
      const path = './' + username + '/'; 
      try {
        if (!ds.existsSync(path)) {
          ds.mkdirSync(path)
        }
      } catch (err) {
        console.error(err)
      }
      const request = https.get(content, function (response) {
        if (response.statusCode === 200) {
          var file = ds.createWriteStream(path + link + '.mp4');
          response.pipe(file);
          console.log(file.path + ' Saved!')
  
        }
  
      });
      ;
    };
  
  
    browser.close();
  }
  
  async function autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        var totalHeight = 0;
        var distance = 100;
        var timer = setInterval(() => {
          var scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
  
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }
