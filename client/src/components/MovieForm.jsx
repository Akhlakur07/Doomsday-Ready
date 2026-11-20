import { useState } from 'react';
import {
  Calendar,
  Clock,
  Film,
  Loader2,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
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
  const [pickingTmdb, setPickingTmdb] = useState(false);
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
      const list = data.results || [];
      setTmdbResults(list);
      if (list.length === 0) {
        toast.info(`No TMDB matches found for "${query}".`);
      }
    } catch (err) {
      const msg = err.code ? `[${err.code}] ${err.message}` : err.message;
      setError(msg);
      toast.error(msg);
    } finally {
      setSearchingTmdb(false);
    }
  }

  async function handlePickTmdb(item) {
    setError('');
    setPickingTmdb(true);
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
      toast.success(`Autofilled metadata for "${details.title || item.title}".`);
    } catch (err) {
      const msg = err.code ? `[${err.code}] ${err.message}` : err.message;
      setError(msg);
      toast.error(msg);
    } finally {
      setPickingTmdb(false);
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
      const created = await createMovie({
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
      toast.success(`Added "${created.title}" to the MCU archive.`);
      await onMovieAdded();
    } catch (err) {
      const msg = err.code ? `[${err.code}] ${err.message}` : err.message;
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="doom-card rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-wide text-white">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            Add Movie to Archive
          </h2>
          <p className="text-xs text-slate-400">
            Search TMDB to autofill poster &amp; runtime, or enter movie details
            manually.
          </p>
        </div>

        {form.posterUrl && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1.5">
            <img
              src={form.posterUrl}
              alt={form.title || 'Selected poster'}
              className="h-9 w-6 rounded object-cover"
            />
            <span className="font-mono text-[11px] text-emerald-300">
              Poster attached
            </span>
          </div>
        )}
      </div>

      {/* Optional TMDB search autofill */}
      <form onSubmit={handleTmdbSearch} className="mt-4 flex flex-wrap gap-2">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-emerald-400/70" />
          <input
            type="text"
            value={tmdbQuery}
            onChange={(e) => setTmdbQuery(e.target.value)}
            placeholder="Search TMDB (e.g. Guardians of the Galaxy, Loki)..."
            className="w-full rounded-xl border border-emerald-500/25 bg-black/50 py-2 pr-3 pl-9 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={searchingTmdb || pickingTmdb}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/25 disabled:opacity-50"
        >
          {searchingTmdb ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            'Search TMDB'
          )}
        </button>
      </form>

      {tmdbResults.length > 0 && (
        <div
          data-lenis-prevent
          className="mt-3 max-h-60 overflow-y-auto rounded-xl border border-emerald-500/25 bg-[#050c08] p-2"
        >
          <div className="mb-1.5 flex items-center justify-between px-2 font-mono text-[11px] text-emerald-300/80">
            <span>Select a TMDB match to autofill</span>
            <button
              type="button"
              onClick={() => setTmdbResults([])}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" /> Close
            </button>
          </div>
          <ul className="space-y-1">
            {tmdbResults.map((item) => (
              <li key={`${item.mediaType}-${item.tmdbId}`}>
                <button
                  type="button"
                  disabled={pickingTmdb}
                  onClick={() => handlePickTmdb(item)}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-emerald-500/10"
                >
                  {item.posterUrl ? (
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      className="h-12 w-8 shrink-0 rounded border border-emerald-500/20 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-8 shrink-0 items-center justify-center rounded border border-emerald-500/20 bg-emerald-950/40 text-emerald-400">
                      <Film className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {item.overview || 'No overview available.'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border border-emerald-500/25 bg-black/50 px-2 py-0.5 font-mono text-[11px] text-emerald-300">
                    {item.releaseYear || 'TBA'} · {item.mediaType.toUpperCase()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/40 px-3.5 py-2.5 text-sm text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid gap-3.5 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
              <Film className="h-3.5 w-3.5" /> Title
            </span>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Iron Man"
              className="w-full rounded-xl border border-emerald-500/25 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
              <Calendar className="h-3.5 w-3.5" /> Release Year
            </span>
            <input
              type="number"
              required
              min={1888}
              max={2100}
              value={form.releaseYear}
              onChange={(e) => setForm({ ...form, releaseYear: e.target.value })}
              placeholder="2008"
              className="w-full rounded-xl border border-emerald-500/25 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
              <Clock className="h-3.5 w-3.5" /> Runtime (1–300 min)
            </span>
            <input
              type="number"
              required
              min={1}
              max={300}
              value={form.runtime}
              onChange={(e) => setForm({ ...form, runtime: e.target.value })}
              placeholder="126"
              className="w-full rounded-xl border border-emerald-500/25 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
          </label>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={form.watched}
            onChange={(e) => setForm({ ...form, watched: e.target.checked })}
            className="h-4 w-4 rounded border-emerald-500/40 bg-black/50 accent-emerald-500"
          />
          Already watched
        </label>

        {movies.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
              Prerequisites (watch these first)
            </p>
            <div
              data-lenis-prevent
              className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-emerald-500/20 bg-black/40 p-3 sm:grid-cols-2 md:grid-cols-3"
            >
              {movies.map((movie) => (
                <label
                  key={movie._id}
                  className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-300 hover:text-white"
                >
                  <input
                    type="checkbox"
                    checked={form.prerequisites.includes(movie._id)}
                    onChange={() => togglePrerequisite(movie._id)}
                    className="h-3.5 w-3.5 rounded border-emerald-500/40 bg-black/50 accent-emerald-500"
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
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(16,185,129,0.35)] transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding Movie...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add Movie
            </>
          )}
        </button>
      </form>
    </section>
  );
}
