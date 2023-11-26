import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

import cheerio from 'cheerio';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT;
const app = express();

async function duckDuckGo(query) {
    try {
        const response = await fetch(`https://html.duckduckgo.com/html/?q=${query}`);
        if (!response.ok) throw new Error(`Failed to fetch search results. Status: ${response.status}`);

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
  const duckDuckGoResults = await duckDuckGo(query);
  // Add more functions for other search engines or sources
  // const googleResults = await getGoogleResults(query);
  // const bingResults = await getBingResults(query);

  // Format results from different sources
  const formattedResults = [
      ...duckDuckGoResults.map(({ title, url, description }) => ({ title, url, description })),
      // Add formatted results for other sources
      // ...googleResults.map(({ title, url, description }) => ({ title, url, description })),
      // ...bingResults.map(({ title, url, description }) => ({ title, url, description })),
  ];

  return formattedResults;
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
  console.log(`Server started on port ${port}`);
});
