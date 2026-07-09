require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const Quote = require('./models/Quote');
const app = express();

const quotes = [
  ...require('./data/cinematic.json'),
  ...require('./data/nature.json'),
  ...require('./data/poetic.json'),
  ...require('./data/wildcard.json')
];

if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error(err));
} else {
  console.warn('MONGO_URI is not set. Using local in-memory quotes.');
}

// Utility: pick a random item
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const categories = [...new Set(quotes.map((quote) => quote.category))].sort();
const isMongoConnected = () => mongoose.connection.readyState === 1;
const normalizeQuote = (quote) => ({
  _id: quote._id,
  text: quote.text || quote.quote,
  quote: quote.quote || quote.text,
  person: quote.person,
  category: quote.category
});

const getStoredQuotes = async ({ person, category } = {}) => {
  const normalizedPerson = person ? String(person).toLowerCase() : undefined;
  const normalizedCategory = category ? String(category).toLowerCase() : undefined;

  if (isMongoConnected()) {
    const query = {};

    if (normalizedPerson) {
      query.person = new RegExp(`^${normalizedPerson.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    }

    if (normalizedCategory) {
      query.category = normalizedCategory;
    }

    const storedQuotes = await Quote.find(query).lean();
    return storedQuotes.map(normalizeQuote);
  }

  return quotes
    .filter((quote) => {
      const matchesPerson = normalizedPerson === undefined || quote.person.toLowerCase() === normalizedPerson;
      const matchesCategory = normalizedCategory === undefined || quote.category.toLowerCase() === normalizedCategory;
      return matchesPerson && matchesCategory;
    })
    .map(normalizeQuote);
};

const sendQuotes = async (req, res, next) => {
  try {
    const storedQuotes = await getStoredQuotes(req.query);
    res.send({
      quotes: storedQuotes
    });
  } catch (error) {
    next(error);
  }
};

const sendQuotesArray = async (req, res, next) => {
  try {
    const storedQuotes = await getStoredQuotes(req.query);
    res.json(storedQuotes);
  } catch (error) {
    next(error);
  }
};

const sendCategoryQuotes = async (req, res, next) => {
  try {
    const storedQuotes = await getStoredQuotes({ category: req.params.category });
    res.send({
      quotes: storedQuotes
    });
  } catch (error) {
    next(error);
  }
};

const sendCategoryQuotesArray = async (req, res, next) => {
  try {
    const storedQuotes = await getStoredQuotes({ category: req.params.category });
    res.json(storedQuotes);
  } catch (error) {
    next(error);
  }
};

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
app.use(express.json());

app.get('/api/quote/random', async (req, res, next) => {
  try {
    const storedQuotes = await getStoredQuotes();
    res.send({
      quote: pick(storedQuotes)
    });
  } catch (error) {
    next(error);
  }
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

app.get('/api/quotes', sendQuotes);
app.get('/api/quotes/:category', sendCategoryQuotes);
app.get('/quotes', sendQuotesArray);
app.get('/quotes/:category', sendCategoryQuotesArray);

app.post('/api/quotes', async (req, res, next) => {
  const source = Object.keys(req.body || {}).length > 0 ? req.body : req.query;
  const category = source.category ? String(source.category).toLowerCase() : 'random';

  const newQuote = {
    text: source.text || source.quote,
    person: source.person,
    category
  };

  if (!newQuote.text || !newQuote.person) {
    return res.status(400).send({
      error: 'Both text and person are required.'
    });
  }

  try {
    if (isMongoConnected()) {
      const createdQuote = await Quote.create(newQuote);
      return res.status(201).send({ quote: normalizeQuote(createdQuote.toObject()) });
    }

    quotes.push({
      quote: newQuote.text,
      person: newQuote.person,
      category: newQuote.category
    });

    return res.status(201).send({ quote: normalizeQuote(newQuote) });
  } catch (error) {
    return next(error);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send({
    error: 'Something went wrong.'
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`);
});

