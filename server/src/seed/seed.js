const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Movie = require('../models/Movie');
const Cinema = require('../models/Cinema');
const { MCU_MOVIES, SAMPLE_CINEMAS } = require('./mcuData');
const { isTmdbConfigured, getTitleDetails } = require('../services/tmdbService');

async function fetchTmdbMetadata(item) {
  if (!isTmdbConfigured() || !item.tmdbId) {
    return null;
  }

  try {
    return await getTitleDetails(item.tmdbId, 'movie');
  } catch (err) {
    console.warn(`TMDB lookup skipped for "${item.title}": ${err.message}`);
    return null;
  }
}

async function seedDatabase() {
  const shouldReset = process.argv.includes('--reset');

  await connectDB();

  if (shouldReset) {
    console.log('Resetting existing movies and cinemas...');
    await Movie.deleteMany({});
    await Cinema.deleteMany({});
  }

  const useTmdb = isTmdbConfigured();
  console.log(
    useTmdb
      ? 'Seeding movies with TMDB metadata enrichment...'
      : 'TMDB_ACCESS_TOKEN not set; seeding movies with local fallback data...'
  );

  // Pass 1: Upsert all movies so every title has an ObjectId
  const titleToId = new Map();
  let tmdbEnrichedCount = 0;

  for (const item of MCU_MOVIES) {
    const tmdb = await fetchTmdbMetadata(item);
    if (tmdb) {
      tmdbEnrichedCount += 1;
    }

    const releaseYear =
      tmdb && Number.isInteger(tmdb.releaseYear) && tmdb.releaseYear >= 1888
        ? tmdb.releaseYear
        : item.releaseYear;

    const runtime =
      tmdb && Number.isInteger(tmdb.runtime) && tmdb.runtime >= 1 && tmdb.runtime <= 300
        ? tmdb.runtime
        : item.runtime;

    const doc = await Movie.findOneAndUpdate(
      { title: item.title },
      {
        $set: {
          title: item.title,
          releaseYear,
          runtime,
          tmdbId: item.tmdbId ?? null,
          mediaType: 'movie',
          posterUrl: tmdb?.posterUrl || '',
          overview: tmdb?.overview || '',
        },
        $setOnInsert: {
          watched: false,
          prerequisites: [],
        },
      },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );

    titleToId.set(item.title, doc._id);
  }

  // Pass 2: Link prerequisite ObjectIds
  for (const item of MCU_MOVIES) {
    const movieId = titleToId.get(item.title);
    const prereqIds = item.prerequisites
      .map((prereqTitle) => titleToId.get(prereqTitle))
      .filter(Boolean);

    await Movie.updateOne({ _id: movieId }, { $set: { prerequisites: prereqIds } });
  }

  // Pass 3: Upsert sample cinemas
  for (const cinema of SAMPLE_CINEMAS) {
    const sortedBundles = [...cinema.bundleSizes].sort((a, b) => a - b);
    await Cinema.findOneAndUpdate(
      { name: cinema.name },
      {
        $set: {
          name: cinema.name,
          bundleSizes: sortedBundles,
        },
      },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );
  }

  console.log(
    `Seed complete: ${MCU_MOVIES.length} movies (${tmdbEnrichedCount} enriched via TMDB), ${SAMPLE_CINEMAS.length} cinemas.`
  );
}

seedDatabase()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
