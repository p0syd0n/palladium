import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { json } from 'body-parser';
import { getJson } from 'serpapi';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const use_serp = false;

const port = process.env.PORT;
const serp_api_key = process.env.SERP_API_KEY
const app = express();

async function collectSearchResults(query) {
  let googleJson, bingJson, yahooJson, yandexJson;
  if (use_serp) {
    getJson({
      q: query,
      location: "United States",
      hl: "en",
      gl: "us",
      google_domain: "google.com",
      api_key: serp_api_key
    }, (json) => {
      googleJson = json;
    });
  }
  return json; // {item: {url: url, name: name, description: description}}
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('views', path.join(__dirname, 'public', 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('main');
});

app.get('/search', (req, res) => {
  console.log(req.query.q);
  res.render('search_results')
});

app.listen(port, () => {
  console.log("started on port " + port);
});