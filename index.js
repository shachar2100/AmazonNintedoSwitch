/**
 * Project: web_scraping_amazon
 * Email's if there is a price change in the price of 
 * "Nintendo Switch with Neon Blue and Neon Red Joy‑Con"
 * Programmer: Shachar Habusha
 * Start Date: 6/23/2022
 * Inspired by: https://www.youtube.com/watch?v=1d1YSYzuRzU 
 */



const puppeteer = require('puppeteer');
const cheerio = require('cheerio').default;
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');
let lowestPrice = 300;

const url = 'https://www.amazon.com/Nintendo-Switch-Neon-Blue-Joy%E2%80%91/dp/B07VGRJDFY/';

async function configureBrowser() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    return page;
}

async function checkPrice(page) {

    await page.reload();
    let html = await page.evaluate(() => document.body.innerHTML);
   
    cheerio('#corePrice_feature_div', html).each(function() {
        let dollarPrice = cheerio(this).text();
        var currentPrice = Number(dollarPrice.split("$")[1]);
        console.log(currentPrice);
        console.log(dollarPrice);

        if (currentPrice < lowestPrice) {
            lowestPrice = currentPrice;
            console.log("A crime not to buy :)");
            sendEmail(currentPrice);
        }
    })
    //corePrice_feature_div
}

/**
 * CronJob Note: (order of each *)
 * Seconds: 0-59Minutes: 0-59
 * Hours: 0-23
 * Day of Month: 1-31
 * Months: 0-11 (Jan-Dec)
 * Day of Week: 0-6 (Sun-Sat)
 * 
 */

async function startTracking() {
    const page = await configureBrowser();
    // Every fifteen seconds 
    let job = new CronJob('*/15 * * * * *', function() {
        checkPrice(page);
    }, null, true, null, null, true); 
    job.start();
}

async function sendEmail(price) {
    
    let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    
    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
        },
    });
    
    let textToSend = 'Price dropped to ' + price;
    let htmlText = `<a href=\"${url}\">Link</a>`;

    var mailOptions = {
        from: '"Price Tracker" <' + testAccount.user + '>',
        to: "" , //Place your email here :)
        subject: 'price drop nintendo switch',
        text: textToSend,
        html: htmlText
      };

   
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
    });
   
}
startTracking();

