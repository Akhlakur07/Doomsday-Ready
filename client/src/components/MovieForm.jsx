import { useState } from 'react';
import { createMovie, getTmdbDetails, searchTmdb } from '../api/client';

const INITIAL_FORM = {
  title: '',
  releaseYear: '',
  runtime: '',
  watched: false,
  prerequisites: [],
  tmdbId: null,
  mediaType: 'movie',
  posterUrl: '',
  overview: '',
};

export default function MovieForm({ movies, onMovieAdded }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [tmdbQuery, setTmdbQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState([]);
  const [searchingTmdb, setSearchingTmdb] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleTmdbSearch(e) {
    e.preventDefault();
    const query = tmdbQuery.trim();
    if (!query) return;

    setSearchingTmdb(true);
    setError('');
    try {
      const data = await searchTmdb(query);
      setTmdbResults(data.results || []);
    } catch (err) {
      setError(err.code ? `[${err.code}] ${err.message}` : err.message);
    } finally {
      setSearchingTmdb(false);
    }
  }

  async function handlePickTmdb(item) {
    setError('');
    try {
      const details = await getTmdbDetails(item.mediaType, item.tmdbId);
      setForm((prev) => ({
        ...prev,
        title: details.title || item.title || '',
        releaseYear: details.releaseYear ? String(details.releaseYear) : prev.releaseYear,
        runtime: details.runtime ? String(details.runtime) : prev.runtime,
        tmdbId: details.tmdbId,
        mediaType: details.mediaType || 'movie',
        posterUrl: details.posterUrl || '',
        overview: details.overview || '',
      }));
      setTmdbResults([]);
    } catch (err) {
      setError(err.code ? `[${err.code}] ${err.message}` : err.message);
    }
  }

  function togglePrerequisite(movieId) {
    setForm((prev) => {
      const exists = prev.prerequisites.includes(movieId);
      return {
        ...prev,
        prerequisites: exists
          ? prev.prerequisites.filter((id) => id !== movieId)
          : [...prev.prerequisites, movieId],
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await createMovie({
        title: form.title.trim(),
        releaseYear: Number.parseInt(form.releaseYear, 10),
        runtime: Number.parseInt(form.runtime, 10),
        watched: form.watched,
        prerequisites: form.prerequisites,
        tmdbId: form.tmdbId,
        mediaType: form.mediaType,
        posterUrl: form.posterUrl,
        overview: form.overview,
      });

      setForm(INITIAL_FORM);
      setTmdbQuery('');
      await onMovieAdded();
    } catch (err) {
      setError(err.code ? `[${err.code}] ${err.message}` : err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900">Add Movie</h2>

      {/* Optional TMDB search autofill */}
      <form onSubmit={handleTmdbSearch} className="mt-3 flex flex-wrap gap-2">
        <input
          type="text"
          value={tmdbQuery}
          onChange={(e) => setTmdbQuery(e.target.value)}
          placeholder="Optional: search TMDB to autofill title, year, runtime..."
          className="min-w-60 flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={searchingTmdb}
          className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-200 disabled:opacity-50"
        >
          {searchingTmdb ? 'Searching...' : 'Search TMDB'}
        </button>
      </form>

      {tmdbResults.length > 0 && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
            <span>Click a TMDB match to autofill</span>
            <button
              type="button"
              onClick={() => setTmdbResults([])}
              className="text-slate-600 underline"
            >
              Close
            </button>
          </div>
          <ul className="space-y-1">
            {tmdbResults.map((item) => (
              <li key={`${item.mediaType}-${item.tmdbId}`}>
                <button
                  type="button"
                  onClick={() => handlePickTmdb(item)}
                  className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm hover:bg-white"
                >
                  <span className="font-medium text-slate-800">{item.title}</span>
                  <span className="text-xs text-slate-500">
                    {item.releaseYear || 'TBA'} · {item.mediaType.toUpperCase()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Title</span>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Iron Man"
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Release Year</span>
            <input
              type="number"
              required
              min={1888}
              max={2100}
              value={form.releaseYear}
              onChange={(e) => setForm({ ...form, releaseYear: e.target.value })}
              placeholder="2008"
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Runtime (1–300 min)</span>
            <input
              type="number"
              required
              min={1}
              max={300}
              value={form.runtime}
              onChange={(e) => setForm({ ...form, runtime: e.target.value })}
              placeholder="126"
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.watched}
            onChange={(e) => setForm({ ...form, watched: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          Already watched
        </label>

        {movies.length > 0 && (
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">
              Prerequisites (watch these first)
            </p>
            <div className="grid max-h-40 grid-cols-1 gap-1.5 overflow-y-auto rounded-md border border-slate-200 p-2.5 sm:grid-cols-2 md:grid-cols-3">
              {movies.map((movie) => (
                <label
                  key={movie._id}
                  className="inline-flex items-center gap-2 text-xs text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={form.prerequisites.includes(movie._id)}
                    onChange={() => togglePrerequisite(movie._id)}
                    className="h-3.5 w-3.5 rounded border-slate-300"
                  />
                  <span className="truncate">
                    {movie.title} ({movie.releaseYear})
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? 'Adding...' : 'Add Movie'}
        </button>
      </form>
    </section>
  );
}
