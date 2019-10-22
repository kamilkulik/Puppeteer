const puppeteer = require('puppeteer');
const fs = require('fs') // fs - file system, node module required for saving things as files
const websiteURL = 'https://www.ceneo.pl/';
const query = 'Samsung Galaxy S10';
const http = require('http');
const url = require('url');

const scraper = async () => {
    const browser = await puppeteer.launch( {headless: true} );
    const page = await browser.newPage();
    
    await page.goto(websiteURL); // visit website defined in line 2 - CENEO. The rest of the code is CENEO specific
    await page.focus('#form-head-search-q'); // focus on the input field
    await page.keyboard.sendCharacter(query); // input your search query
    await page.keyboard.press('Enter'); // pressing Enter to initiate search
    await page.waitForNavigation(); // waiting for navigation i.e. until page loads

    const Listings = await page.$$('.category-list-body > div > div > .cat-prod-row-content > .cat-prod-row-desc'); // create array of listing results
    const ListingData = Listings.map( async offer => {
        const title = await offer.$eval('strong.cat-prod-row-name', el => el.innerText);
        const score = await offer.$eval('span.prod-review', el => el.innerText.slice(1,4));
        const opinions = await offer.$eval('span.prod-review', el => el.innerText.slice(10,13));
        /* TO-DO: consider edge cases:
            a. there's just 1 opinion
            b. there's more than several hundred opinions
            c. there are no opinions
        */
        
        return {
            title,
            score,
            opinions,
        }
    });

    const json = await Promise.all(ListingData);

    return json
};

scraper();

// JSON file save function
// const saveJSON = async () => {
//     const file = await scraper() 
//     fs.writeFileSync('file.json', file)
//     // console.log();
// }
// saveJSON();

// SERVER CREATION

const port = 4000;
const requestHandler = async (request, response) => {
    console.log(request.url);
    response.writeHead(200, { 'Content-Type': 'Application / JSON'});
    response.end(JSON.stringify(await scraper()));

    /* TO-DO:
    Make the server react to specific queries only IF, ELSE IF
    */
};

const server = http.createServer(requestHandler);

server.listen(port, err => {
    if (err) {
        return console.log('Congrats. You broke it!');
    }
    console.log(`Listening on port ${port}`);

});