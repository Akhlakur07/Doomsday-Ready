const Movie = require('../models/Movie');
const { AppError } = require('../middleware/errorHandler');
const {
  wouldCreateCycle,
  computeRewatchOrder,
} = require('../algorithms/rewatchOrder');

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isValidObjectId(id) {
  return typeof id === 'string' && OBJECT_ID_REGEX.test(id);
}

function serializeMovie(doc) {
  return {
    _id: String(doc._id),
    title: doc.title,
    releaseYear: doc.releaseYear,
    runtime: doc.runtime,
    prerequisites: (doc.prerequisites || []).map(String),
    watched: Boolean(doc.watched),
    tmdbId: doc.tmdbId ?? null,
    mediaType: doc.mediaType || 'movie',
    posterUrl: doc.posterUrl || '',
    overview: doc.overview || '',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function validateAndDeduplicatePrereqs(prerequisites) {
  if (!Array.isArray(prerequisites)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'prerequisites must be an array of movie IDs.');
  }

  const uniqueIds = [];
  const seen = new Set();

  for (const rawId of prerequisites) {
    const id = String(rawId);
    if (!isValidObjectId(id)) {
      throw new AppError(400, 'INVALID_PREREQUISITE', `Invalid prerequisite movie ID: ${id}`);
    }
    if (!seen.has(id)) {
      seen.add(id);
      uniqueIds.push(id);
    }
  }

  return uniqueIds;
}

async function ensurePrerequisitesExist(prereqIds) {
  if (prereqIds.length === 0) {
    return;
  }

  const foundCount = await Movie.countDocuments({ _id: { $in: prereqIds } });
  if (foundCount !== prereqIds.length) {
    throw new AppError(
      400,
      'INVALID_PREREQUISITE',
      'One or more prerequisite movie IDs do not exist.'
    );
  }
}

function validateTitle(title) {
  if (typeof title !== 'string' || !title.trim()) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Title is required.');
  }
  return title.trim();
}

function validateReleaseYear(releaseYear) {
  if (!Number.isInteger(releaseYear) || releaseYear < 1888 || releaseYear > 2100) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Release year must be a whole number between 1888 and 2100.'
    );
  }
  return releaseYear;
}

function validateRuntime(runtime) {
  if (!Number.isInteger(runtime) || runtime < 1 || runtime > 300) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Runtime must be a whole number between 1 and 300 minutes.'
    );
  }
  return runtime;
}

async function listMovies(req, res) {
  const movies = await Movie.find().sort({ releaseYear: 1, title: 1 }).lean();
  res.json(movies.map(serializeMovie));
}

async function createMovie(req, res) {
  const {
    title,
    releaseYear,
    runtime,
    prerequisites = [],
    watched = false,
    tmdbId = null,
    mediaType = 'movie',
    posterUrl = '',
    overview = '',
  } = req.body || {};

  const cleanTitle = validateTitle(title);
  const cleanYear = validateReleaseYear(releaseYear);
  const cleanRuntime = validateRuntime(runtime);

  if (typeof watched !== 'boolean') {
    throw new AppError(400, 'VALIDATION_ERROR', 'watched must be a boolean.');
  }

  const duplicate = await Movie.findOne({
    title: { $regex: `^${escapeRegex(cleanTitle)}$`, $options: 'i' },
  }).lean();

  if (duplicate) {
    throw new AppError(409, 'DUPLICATE_TITLE', `A movie titled "${cleanTitle}" already exists.`);
  }

  const uniquePrereqs = validateAndDeduplicatePrereqs(prerequisites);
  await ensurePrerequisitesExist(uniquePrereqs);

  const created = await Movie.create({
    title: cleanTitle,
    releaseYear: cleanYear,
    runtime: cleanRuntime,
    prerequisites: uniquePrereqs,
    watched,
    tmdbId: Number.isInteger(tmdbId) ? tmdbId : null,
    mediaType: mediaType === 'tv' ? 'tv' : 'movie',
    posterUrl: typeof posterUrl === 'string' ? posterUrl.trim() : '',
    overview: typeof overview === 'string' ? overview.trim() : '',
  });

  res.status(201).json(serializeMovie(created));
}

async function updateMovie(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid movie ID format.');
  }

  const movie = await Movie.findById(id);
  if (!movie) {
    throw new AppError(404, 'MOVIE_NOT_FOUND', 'Movie not found.');
  }

  const {
    title,
    releaseYear,
    runtime,
    prerequisites,
    watched,
    tmdbId,
    mediaType,
    posterUrl,
    overview,
  } = req.body || {};

  if (title !== undefined) {
    const cleanTitle = validateTitle(title);
    const duplicate = await Movie.findOne({
      _id: { $ne: id },
      title: { $regex: `^${escapeRegex(cleanTitle)}$`, $options: 'i' },
    }).lean();

    if (duplicate) {
      throw new AppError(409, 'DUPLICATE_TITLE', `A movie titled "${cleanTitle}" already exists.`);
    }
    movie.title = cleanTitle;
  }

  if (releaseYear !== undefined) {
    movie.releaseYear = validateReleaseYear(releaseYear);
  }

  if (runtime !== undefined) {
    movie.runtime = validateRuntime(runtime);
  }

  if (watched !== undefined) {
    if (typeof watched !== 'boolean') {
      throw new AppError(400, 'VALIDATION_ERROR', 'watched must be a boolean.');
    }
    movie.watched = watched;
  }

  if (tmdbId !== undefined) {
    movie.tmdbId = Number.isInteger(tmdbId) ? tmdbId : null;
  }

  if (mediaType !== undefined) {
    movie.mediaType = mediaType === 'tv' ? 'tv' : 'movie';
  }

  if (posterUrl !== undefined) {
    movie.posterUrl = typeof posterUrl === 'string' ? posterUrl.trim() : '';
  }

  if (overview !== undefined) {
    movie.overview = typeof overview === 'string' ? overview.trim() : '';
  }

  if (prerequisites !== undefined) {
    const uniquePrereqs = validateAndDeduplicatePrereqs(prerequisites);

    if (uniquePrereqs.includes(id)) {
      throw new AppError(
        409,
        'CIRCULAR_DEPENDENCY',
        'A movie cannot depend on itself.'
      );
    }

    await ensurePrerequisitesExist(uniquePrereqs);

    const allMovies = await Movie.find({}, '_id prerequisites').lean();
    const movieMap = new Map(allMovies.map((m) => [String(m._id), m]));

    if (wouldCreateCycle(id, uniquePrereqs, movieMap)) {
      throw new AppError(
        409,
        'CIRCULAR_DEPENDENCY',
        'Updating prerequisites would create a circular dependency.'
      );
    }

    movie.prerequisites = uniquePrereqs;
  }

  await movie.save();
  res.json(serializeMovie(movie));
}

async function deleteMovie(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid movie ID format.');
  }

  const deleted = await Movie.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError(404, 'MOVIE_NOT_FOUND', 'Movie not found.');
  }

  await Movie.updateMany(
    { prerequisites: id },
    { $pull: { prerequisites: id } }
  );

  res.json({ deletedId: id });
}

async function getRewatchOrder(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid movie ID format.');
  }

  const allMovies = await Movie.find().lean();
  const movieMap = new Map(allMovies.map((m) => [String(m._id), serializeMovie(m)]));

  if (!movieMap.has(id)) {
    throw new AppError(404, 'MOVIE_NOT_FOUND', 'Movie not found.');
  }

  const result = computeRewatchOrder(id, movieMap);
  res.json(result);
}

module.exports = {
  listMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  getRewatchOrder,
};
