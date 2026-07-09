const cinematicQuotes = [
  {
    quote: 'The past is just a story we tell ourselves.',
    person: 'Unknown',
    category: 'cinematic'
  }
];

const randomQuotes = [
  {
    quote: 'Peace is the rhythm between breath and light.',
    person: 'Unknown',
    category: 'random'
  }
];

const allQuotes = [
  ...cinematicQuotes,
  ...randomQuotes
];

const quotes = allQuotes
  .filter((quote) => quote && quote.quote)
  .map((quote) => ({
    quote: quote.quote,
    person: quote.person || quote.author || 'Unknown',
    category: quote.category || 'general'
  }));

module.exports = {
  cinematicQuotes,
  randomQuotes,
  quotes
};
