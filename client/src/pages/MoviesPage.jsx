import { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteMovie, getMovies, updateMovie } from '../api/client';
import MovieForm from '../components/MovieForm';

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draftPrereqs, setDraftPrereqs] = useState([]);
  const [savingPrereqs, setSavingPrereqs] = useState(false);

  const loadMovies = useCallback(async () => {
    try {
      const list = await getMovies();
      setMovies(list);
      setError('');
    } catch (err) {
      setError(err.code ? `[${err.code}] ${err.message}` : err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const list = await getMovies();
        if (!active) return;
        setMovies(list);
        setError('');
      } catch (err) {
        if (!active) return;
        setError(err.code ? `[${err.code}] ${err.message}` : err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    init();
    return () => {
      active = false;
    };
  }, []);

  const titleById = useMemo(() => {
    return new Map(movies.map((m) => [m._id, m.title]));
  }, [movies]);

  async function handleToggleWatched(movie) {
    setError('');
    try {
      const updated = await updateMovie(movie._id, { watched: !movie.watched });
      setMovies((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
      );
    } catch (err) {
      setError(err.code ? `[${err.code}] ${err.message}` : err.message);
    }
  }

  function startEditPrereqs(movie) {
    setError('');
    setEditingId(movie._id);
    setDraftPrereqs(movie.prerequisites || []);
  }

  function toggleDraftPrereq(prereqId) {
    setDraftPrereqs((prev) =>
      prev.includes(prereqId)
        ? prev.filter((id) => id !== prereqId)
        : [...prev, prereqId]
    );
  }

  async function handleSavePrereqs(movieId) {
    setError('');
    setSavingPrereqs(true);
    try {
      const updated = await updateMovie(movieId, { prerequisites: draftPrereqs });
      setMovies((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
      );
      setEditingId(null);
    } catch (err) {
      setError(err.code ? `[${err.code}] ${err.message}` : err.message);
    } finally {
      setSavingPrereqs(false);
    }
  }

  async function handleDelete(movie) {
    setError('');
    try {
      await deleteMovie(movie._id);
      if (editingId === movie._id) {
        setEditingId(null);
      }
      await loadMovies();
    } catch (err) {
      setError(err.code ? `[${err.code}] ${err.message}` : err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Movies</h1>
        <p className="mt-1 text-sm text-slate-600">
          Add MCU movies, configure prerequisites, and mark watched progress.
          Circular dependencies are rejected with <code>409 CIRCULAR_DEPENDENCY</code>.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </div>
      )}

      <MovieForm movies={movies} onMovieAdded={loadMovies} />

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            All Movies ({movies.length})
          </h2>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading movies...</p>
        ) : movies.length === 0 ? (
          <p className="text-sm text-slate-500">
            No movies found yet. Add one above or run the database seed script.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {movies.map((movie) => {
              const isEditing = editingId === movie._id;
              const prereqNames = (movie.prerequisites || [])
                .map((id) => titleById.get(id))
                .filter(Boolean);

              return (
                <li key={movie._id} className="py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={movie.watched}
                        onChange={() => handleToggleWatched(movie)}
                        aria-label={`Mark ${movie.title} as watched`}
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-medium ${
                              movie.watched
                                ? 'text-slate-500 line-through'
                                : 'text-slate-900'
                            }`}
                          >
                            {movie.title}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({movie.releaseYear}) · {movie.runtime} min
                          </span>
                          {movie.mediaType === 'tv' && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                              TV
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          <span className="font-medium">Watch first:</span>{' '}
                          {prereqNames.length > 0 ? prereqNames.join(', ') : 'None'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          isEditing ? setEditingId(null) : startEditPrereqs(movie)
                        }
                        className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        {isEditing ? 'Close' : 'Edit Prerequisites'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(movie)}
                        className="rounded border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                      <p className="mb-2 text-xs font-medium text-slate-700">
                        Select prerequisites for <strong>{movie.title}</strong>:
                      </p>
                      <div className="grid max-h-44 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2 md:grid-cols-3">
                        {movies.map((candidate) => (
                          <label
                            key={candidate._id}
                            className="inline-flex items-center gap-2 text-xs text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={draftPrereqs.includes(candidate._id)}
                              onChange={() => toggleDraftPrereq(candidate._id)}
                              className="h-3.5 w-3.5 rounded border-slate-300"
                            />
                            <span className="truncate">
                              {candidate.title}
                              {candidate._id === movie._id ? ' (self)' : ''}
                            </span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          disabled={savingPrereqs}
                          onClick={() => handleSavePrereqs(movie._id)}
                          className="rounded bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                          {savingPrereqs ? 'Saving...' : 'Save Prerequisites'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
