import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT;
const app = express();
const headers = {
  'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:84.0) Gecko/20100101 Firefox/84.0",
  'X-Forwarded-For': "cheesemoose"
}

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
  return array
}

async function searx(query) {
  const response = await fetch(`https://wai.137900.xyz/search?q=${query}`, {headers: headers});
  if (!response.ok) console.error(`Failed to fetch search results. Status: ${response.status}`);

  const html = await response.text();

  // Load the HTML content into Cheerio
  const $ = cheerio.load(html);

  const results = [];

  // Iterate over each article element
  $('article.result').each((index, element) => {
    const url = $(element).find('a.url_wrapper').attr('href').trim();
    const title = $(element).find('h3 a').text().trim();
    const description = $(element).find('p.content').text().trim();

    results.push({
      url,
      title,
      description,
    });
  });

  return results;
}

async function bing(query) {
  const response = await fetch(`https://www.bing.com/search?q=${query}&qs=n}`, {headers: headers});
  if (!response.ok) console.error(`Failed to fetch search results. Status: ${response.status}`);

  const html = await response.text();

  // Load the HTML content into Cheerio
  const $ = cheerio.load(html);

  // Select all elements with class "b_algo"
  const bAlgoElements = $('.b_algo');

  // Create an array to store the extracted data
  const resultArray = [];

  // Iterate through each b_algo element
  bAlgoElements.each((index, bAlgoElement) => {
    // Extract relevant information from the element
    const title = $(bAlgoElement).find('h2 a').text();
    const url = $(bAlgoElement).find('h2 a').attr('href');
    const description = $(bAlgoElement).find('.b_caption p').text().substring(3);

    // Push the extracted data as an object to the result array
    resultArray.push({ title, url, description });
  });

  return resultArray;
}

async function duckDuckGo(query) {
    try {
        const response = await fetch(`https://html.duckduckgo.com/html/?q=${query}/`, {headers: headers});
        if (!response.ok) console.error(`Failed to fetch search results. Status: ${response.status}`);

        const html = await response.text();
        const $ = cheerio.load(html);

        const results = $('.result.results_links.results_links_deep.web-result');
        const topResults = [];

        results.slice(0, 20).each((index, element) => {
            const title = $(element).find('.result__title a').text();
            const url = $(element).find('.result__url').text().trim();
            const description = $(element).find('.result__snippet').text();
            topResults.push({ title, url, description });
        });

        return topResults;
    } catch (error) {
        console.error('Error fetching DuckDuckGo search results:', error.message);
        throw error;
    }
}

async function collectSearchResults(query) {
  try {
    const [duckDuckGoResults, bingResults, searxResults] = await Promise.all([
      duckDuckGo(query),
      bing(query),
      searx(query),
    ]);

    // Format results from different sources
    const formattedResults = [
      ...duckDuckGoResults.map(({ title, url, description }) => ({ title, url, description, engine: 'Duck Duck Go' })),
      ...bingResults.map(({ title, url, description }) => ({ title, url, description, engine: 'Bing' })),
      ...searxResults.map(({ title, url, description }) => ({ title, url, description, engine: 
      'Searx' })),
    ];

    return shuffleArray(formattedResults);
  } catch (error) {
    console.error('Error collecting search results:', error.message);
    throw error;
  }
}


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('views', path.join(__dirname, 'public', 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('main');
});

app.get('/search', async (req, res) => {
    try {
        const results = await collectSearchResults(req.query.q);
        res.render('search_results', { results, query: req.query.q });
    } catch (error) {
        console.error('Error collecting search results:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, async () => {
  //let duck = await searx('test');
  //let text = await duck.text();
  //console.log(duck);
  
  // fs.writeFile('searx.html', text, (err) => {
  //    if (err) {
  //        console.error('Error writing file', err);
  //    } else {
  //        console.log('File has been saved!');
  //    }
  // });
  
  console.log(`Server started on port ${port}`);
});
//https://wai.137900.xyz/search?q=test