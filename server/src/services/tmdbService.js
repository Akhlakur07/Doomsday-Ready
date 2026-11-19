const { AppError } = require('../middleware/errorHandler');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

function isTmdbConfigured() {
  return Boolean(process.env.TMDB_ACCESS_TOKEN && process.env.TMDB_ACCESS_TOKEN.trim());
}

function parseReleaseYear(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }
  const year = Number.parseInt(dateStr.slice(0, 4), 10);
  return Number.isInteger(year) ? year : null;
}

function buildPosterUrl(posterPath) {
  return posterPath ? `${TMDB_IMAGE_BASE}${posterPath}` : '';
}

async function tmdbFetch(endpoint) {
  if (!isTmdbConfigured()) {
    throw new AppError(
      503,
      'TMDB_NOT_CONFIGURED',
      'TMDB_ACCESS_TOKEN is not configured on the server.'
    );
  }

  const response = await fetch(`${TMDB_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN.trim()}`,
      accept: 'application/json',
    },
  });

  if (response.status === 404) {
    throw new AppError(404, 'TMDB_NOT_FOUND', 'Requested TMDB title was not found.');
  }

  if (!response.ok) {
    throw new AppError(
      502,
      'TMDB_API_ERROR',
      `TMDB request failed with status ${response.status}.`
    );
  }

  return response.json();
}

/**
 * Search TMDB for movies or TV shows.
 *
 * @param {string} query
 * @param {'multi' | 'movie' | 'tv'} [type='multi']
 */
async function searchTitles(query, type = 'multi') {
  const allowedTypes = ['multi', 'movie', 'tv'];
  const searchType = allowedTypes.includes(type) ? type : 'multi';

  const data = await tmdbFetch(
    `/search/${searchType}?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`
  );

  const items = Array.isArray(data.results) ? data.results : [];

  return items
    .filter((item) => {
      if (searchType === 'multi') {
        return item.media_type === 'movie' || item.media_type === 'tv';
      }
      return true;
    })
    .slice(0, 8)
    .map((item) => ({
      tmdbId: item.id,
      mediaType: item.media_type || searchType,
      title: item.title || item.name || '',
      releaseYear: parseReleaseYear(item.release_date || item.first_air_date),
      posterUrl: buildPosterUrl(item.poster_path),
      overview: item.overview || '',
    }));
}

/**
 * Fetch detailed metadata (including runtime) for a specific TMDB movie or TV show.
 *
 * @param {number} tmdbId
 * @param {'movie' | 'tv'} [mediaType='movie']
 */
async function getTitleDetails(tmdbId, mediaType = 'movie') {
  const type = mediaType === 'tv' ? 'tv' : 'movie';
  const data = await tmdbFetch(`/${type}/${tmdbId}?language=en-US`);

  let runtime = null;
  if (type === 'tv') {
    const runtimes = Array.isArray(data.episode_run_time)
      ? data.episode_run_time.filter((n) => Number.isFinite(n) && n > 0)
      : [];
    const avg =
      runtimes.length > 0
        ? runtimes.reduce((sum, n) => sum + n, 0) / runtimes.length
        : data.last_episode_to_air?.runtime || 45;
    runtime = Math.min(300, Math.max(1, Math.round(avg)));
  } else if (Number.isInteger(data.runtime) && data.runtime >= 1 && data.runtime <= 300) {
    runtime = data.runtime;
  }

  return {
    tmdbId: data.id,
    mediaType: type,
    title: data.title || data.name || '',
    releaseYear: parseReleaseYear(data.release_date || data.first_air_date),
    runtime,
    posterUrl: buildPosterUrl(data.poster_path),
    overview: data.overview || '',
  };
}

module.exports = { isTmdbConfigured, searchTitles, getTitleDetails };
