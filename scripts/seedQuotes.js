require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const Quote = require('../models/Quote');

const quoteFiles = [
  'cinematic.json',
  'nature.json',
  'poetic.json',
  'wildcard.json'
];

const readQuotes = async () => {
  const quoteGroups = await Promise.all(
    quoteFiles.map(async (fileName) => {
      const filePath = path.join(__dirname, '..', 'data', fileName);
      const fileContents = await fs.readFile(filePath, 'utf8');
      return JSON.parse(fileContents);
    })
  );

  return quoteGroups.flat().map((quote) => ({
    text: quote.text,
    person: quote.person || 'Unknown',
    category: quote.category || 'random'
  }));
};

const seedQuotes = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('Missing MONGO_URI environment variable.');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const quotes = await readQuotes();

  const result = await Quote.bulkWrite(
    quotes.map((quote) => ({
      updateOne: {
        filter: {
          text: quote.text,
          person: quote.person,
          category: quote.category
        },
        update: {
          $set: quote
        },
        upsert: true
      }
    }))
  );

  console.log(`Seed complete. Inserted: ${result.upsertedCount}. Updated: ${result.modifiedCount}. Matched existing: ${result.matchedCount}.`);
};

seedQuotes()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
