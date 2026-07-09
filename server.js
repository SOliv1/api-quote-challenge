require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const app = express();

const quotes = [
  {
    quote: 'The past is just a story we tell ourselves.',
    person: 'Unknown',
    category: 'cinematic'
  },
  {
    quote: 'Peace is the rhythm between breath and light.',
    person: 'Unknown',
    category: 'random'
  }
];

// Utility: pick a random item
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const categories = [...new Set(quotes.map((quote) => quote.category))].sort();

const getApiNinjasKey = () => process.env.API_NINJAS_KEY;

const fetchApiNinjas = async (path) => {
  const apiKey = getApiNinjasKey();

  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      body: { error: 'Missing API_NINJAS_KEY environment variable.' }
    };
  }

  try {
    const response = await fetch(`https://api.api-ninjas.com${path}`, {
      headers: {
        'X-Api-Key': apiKey
      }
    });

    const body = await response.json();
    return {
      ok: response.ok,
      status: response.status,
      body
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      body: { error: 'Unable to fetch data from API Ninjas at this time.' }
    };
  }
};

const PORT = process.env.PORT || 4000;

app.use(express.static('public'));

app.get('/api/quote/random', (req, res) => {
  res.send({
    quote: pick(quotes)
  });
});

app.get('/api/categories', (req, res) => {
  res.send({
    categories
  });
});

app.get('/api/v2/randomquotes', async (req, res) => {
  const apiResult = await fetchApiNinjas('/v1/quotes');
  if (!apiResult.ok) {
    return res.status(apiResult.status).send(apiResult.body);
  }

  const quotesFromApi = Array.isArray(apiResult.body) ? apiResult.body : [];
  const normalized = quotesFromApi.map((entry) => ({
    quote: entry.quote,
    person: entry.author || 'Unknown',
    category: entry.category || 'external-random'
  }));

  res.send({
    quotes: normalized
  });
});

app.get('/api/v2/quoteoftheday', async (req, res) => {
  const apiResult = await fetchApiNinjas('/v1/quotes');
  if (!apiResult.ok) {
    return res.status(apiResult.status).send(apiResult.body);
  }

  const quotesFromApi = Array.isArray(apiResult.body) ? apiResult.body : [];
  const quoteOfTheDay = quotesFromApi[0] || null;

  if (!quoteOfTheDay) {
    return res.send({ quote: null });
  }

  res.send({
    quote: {
      quote: quoteOfTheDay.quote,
      person: quoteOfTheDay.author || 'Unknown',
      category: quoteOfTheDay.category || 'external-daily'
    }
  });
});

app.get('/api/v2/quoteauthors', async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const apiResult = await fetchApiNinjas('/v1/quotes');
  if (!apiResult.ok) {
    return res.status(apiResult.status).send(apiResult.body);
  }

  const quotesFromApi = Array.isArray(apiResult.body) ? apiResult.body : [];
  const authors = [...new Set(quotesFromApi.map((entry) => entry.author).filter(Boolean))]
    .slice(0, Number.isFinite(limit) && limit > 0 ? limit : 20);

  res.send({
    authors
  });
});

app.get('/api/animals', async (req, res) => {
  const name = req.query.name ? String(req.query.name).trim() : '';
  const apiKey = getApiNinjasKey();

  if (!name) {
    return res.status(400).send({ error: 'Query parameter "name" is required.' });
  }

  if (!apiKey) {
    return res.status(500).send({
      error: 'Missing API_NINJAS_KEY environment variable.'
    });
  }

  try {
    const response = await fetch(`https://api.api-ninjas.com/v1/animals?name=${encodeURIComponent(name)}`, {
      headers: {
        'X-Api-Key': apiKey
      }
    });

    if (!response.ok) {
      return res.status(response.status).send({
        error: 'Failed to fetch animal data from API Ninjas.'
      });
    }

    const animals = await response.json();
    const animalQuotes = animals.map((animal) => ({
      quote: `${animal.name} lives in ${animal.locations ? animal.locations.join(', ') : 'various regions'} and has a lifespan of ${animal.characteristics && animal.characteristics.lifespan ? animal.characteristics.lifespan : 'unknown'}.`,
      person: animal.name,
      category: 'animal'
    }));

    res.send({
      quotes: animalQuotes
    });
  } catch (error) {
    res.status(500).send({
      error: 'Unable to fetch animal data at this time.'
    });
  }
});

app.get('/api/quotes', (req, res, next) => {
  const { person, category } = req.query;
  const normalizedPerson = person ? String(person).toLowerCase() : undefined;
  const normalizedCategory = category ? String(category).toLowerCase() : undefined;

  const filteredQuotes = quotes.filter((quote) => {
    const matchesPerson = normalizedPerson === undefined || quote.person.toLowerCase() === normalizedPerson;
    const matchesCategory = normalizedCategory === undefined || quote.category.toLowerCase() === normalizedCategory;
    return matchesPerson && matchesCategory;
  });

  res.send({
    quotes: filteredQuotes
  });
});

app.get('/api/quotes/:category', (req, res) => {
  const normalizedCategory = String(req.params.category).toLowerCase();
  const categoryQuotes = quotes.filter((quote) => quote.category.toLowerCase() === normalizedCategory);

  res.send({
    quotes: categoryQuotes
  });
});

app.post('/api/quotes', (req, res) => {
  const category = req.query.category ? String(req.query.category).toLowerCase() : 'general';

  const newQuote = {
    quote: req.query.quote,
    person: req.query.person,
    category
  };
  if (newQuote.quote && newQuote.person) {
    quotes.push(newQuote);
    res.send({ quote: newQuote });
  } else {
    res.status(400).send();
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`);
});

