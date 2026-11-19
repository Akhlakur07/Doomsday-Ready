import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { getMovies, getRewatchOrder, updateMovie } from '../api/client';

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m (${totalMinutes} min)`;
}

export default function RewatchPlanPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [plan, setPlan] = useState(null);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function initMovies() {
      try {
        const list = await getMovies();
        if (!active) return;
        setMovies(list);

        if (list.length > 0) {
          const fromQuery = searchParams.get('movieId');
          const hasQueryMatch = fromQuery && list.some((m) => m._id === fromQuery);
          const doomsday = list.find(
            (m) => m.title.toLowerCase() === 'avengers: doomsday'
          );
          const defaultId = hasQueryMatch
            ? fromQuery
            : doomsday?._id || list[0]._id;
          setSelectedId(defaultId);
        }
        setError('');
      } catch (err) {
        if (!active) return;
        setError(err.code ? `[${err.code}] ${err.message}` : err.message);
      } finally {
        if (active) setLoadingMovies(false);
      }
    }

    initMovies();
    return () => {
      active = false;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;

    async function fetchPlan() {
      try {
        const data = await getRewatchOrder(selectedId);
        if (!active) return;
        setPlan(data);
        setError('');
      } catch (err) {
        if (!active) return;
        setError(err.code ? `[${err.code}] ${err.message}` : err.message);
      } finally {
        if (active) setLoadingPlan(false);
      }
    }

    fetchPlan();
    return () => {
      active = false;
    };
  }, [selectedId]);

  function handleSelectTarget(nextId) {
    setSelectedId(nextId);
    setLoadingPlan(true);
    if (nextId) {
      setSearchParams({ movieId: nextId });
    }
  }

  async function handleToggleWatched(movie) {
    setError('');
    try {
      await updateMovie(movie._id, { watched: !movie.watched });
      const updatedPlan = await getRewatchOrder(selectedId);
      setPlan(updatedPlan);
    } catch (err) {
      setError(err.code ? `[${err.code}] ${err.message}` : err.message);
    }
  }

  const total = plan?.totalMovies ?? 0;
  const watched = plan?.watchedCount ?? 0;
  const progressPercent = total > 0 ? Math.round((watched / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rewatch Plan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pick a target movie to see every prerequisite movie you must watch before it,
          in topological watch order.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {loadingMovies ? (
        <p className="text-sm text-slate-500">Loading movies...</p>
      ) : movies.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          No movies available yet. Add movies on the Movies page first.
        </div>
      ) : (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-700">
                Target Movie
              </span>
              <select
                value={selectedId}
                onChange={(e) => handleSelectTarget(e.target.value)}
                className="w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                {movies.map((movie) => (
                  <option key={movie._id} value={movie._id}>
                    {movie.title} ({movie.releaseYear})
                  </option>
                ))}
              </select>
            </label>
          </section>

          {loadingPlan && !plan ? (
            <p className="text-sm text-slate-500">Computing rewatch plan...</p>
          ) : (
            plan && (
              <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Before {plan.targetMovie?.title}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {watched} of {total} watched
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium uppercase text-slate-500">
                      Remaining Watch Time
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatMinutes(plan.remainingRuntimeMinutes)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-xs text-slate-500">
                    {progressPercent}% complete
                  </p>
                </div>

                {plan.rewatchOrder.length === 0 ? (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    No prerequisites required before{' '}
                    <strong>{plan.targetMovie?.title}</strong> — you can watch it
                    right away!
                  </div>
                ) : (
                  <ol className="divide-y divide-slate-200">
                    {plan.rewatchOrder.map((movie, index) => (
                      <li
                        key={movie._id}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <label className="flex cursor-pointer items-center gap-3">
                          <span className="w-6 text-xs font-semibold text-slate-400">
                            {index + 1}.
                          </span>
                          <input
                            type="checkbox"
                            checked={movie.watched}
                            onChange={() => handleToggleWatched(movie)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          <span
                            className={`text-sm font-medium ${
                              movie.watched
                                ? 'text-slate-500 line-through'
                                : 'text-slate-900'
                            }`}
                          >
                            {movie.title}
                          </span>
                        </label>
                        <span className="text-xs text-slate-500">
                          {movie.releaseYear} · {movie.runtime} min
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            )
          )}
        </>
      )}
    </div>
  );
}
