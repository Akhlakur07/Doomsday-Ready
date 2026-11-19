const { AppError } = require('../middleware/errorHandler');
const {
  isTmdbConfigured,
  searchTitles,
  getTitleDetails,
} = require('../services/tmdbService');

async function searchTmdb(req, res) {
  if (!isTmdbConfigured()) {
    throw new AppError(
      503,
      'TMDB_NOT_CONFIGURED',
      'TMDB_ACCESS_TOKEN is not configured on the server.'
    );
  }

  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!query) {
    throw new AppError(400, 'INVALID_QUERY', 'Query parameter "q" is required.');
  }

  const type = typeof req.query.type === 'string' ? req.query.type : 'multi';
  const results = await searchTitles(query, type);
  res.json({ results });
}

async function getTmdbDetails(req, res) {
  if (!isTmdbConfigured()) {
    throw new AppError(
      503,
      'TMDB_NOT_CONFIGURED',
      'TMDB_ACCESS_TOKEN is not configured on the server.'
    );
  }

  const { type, tmdbId } = req.params;
  if (type !== 'movie' && type !== 'tv') {
    throw new AppError(400, 'INVALID_MEDIA_TYPE', 'Media type must be "movie" or "tv".');
  }

  if (!/^\d+$/.test(tmdbId)) {
    throw new AppError(400, 'INVALID_TMDB_ID', 'tmdbId must be a numeric ID.');
  }

  const details = await getTitleDetails(Number.parseInt(tmdbId, 10), type);
  res.json(details);
}

module.exports = { searchTmdb, getTmdbDetails };
