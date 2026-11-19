import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getCinemas, getMovies } from '../api/client';

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      try {
        const [movieList, cinemaList] = await Promise.all([
          getMovies(),
          getCinemas(),
        ]);
        if (!active) return;
        setMovies(movieList);
        setCinemas(cinemaList);
        setError('');
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSummary();
    return () => {
      active = false;
    };
  }, []);

  const watchedCount = movies.filter((m) => m.watched).length;
  const unwatchedCount = movies.length - watchedCount;
  const doomsdayMovie = movies.find(
    (m) => m.title.toLowerCase() === 'avengers: doomsday'
  );

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">Doomsday Ready</h1>
        <p className="mt-2 text-sm text-slate-600">
          Plan your MCU rewatch order before <strong>Avengers: Doomsday</strong>{' '}
          and calculate the fewest seat bundles for your opening-night watch party.
        </p>

        {doomsdayMovie && (
          <div className="mt-4">
            <Link
              to={`/rewatch-plan?movieId=${doomsdayMovie._id}`}
              className="inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Open Avengers: Doomsday Rewatch Plan
            </Link>
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading summary...</p>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-slate-500">
              Total Movies
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{movies.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-slate-500">
              Watched
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{watchedCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-slate-500">
              Unwatched
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{unwatchedCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-slate-500">
              Cinemas
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{cinemas.length}</p>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <Link
          to="/movies"
          className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-400"
        >
          <h2 className="font-semibold text-slate-900">1. Movies</h2>
          <p className="mt-1 text-sm text-slate-600">
            Add movies, edit prerequisites, check cycle rules, and toggle watched status.
          </p>
        </Link>

        <Link
          to="/rewatch-plan"
          className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-400"
        >
          <h2 className="font-semibold text-slate-900">2. Rewatch Plan</h2>
          <p className="mt-1 text-sm text-slate-600">
            Pick a target movie and follow its topological rewatch order with remaining watch time.
          </p>
        </Link>

        <Link
          to="/booking"
          className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-400"
        >
          <h2 className="font-semibold text-slate-900">3. Booking</h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage cinemas and compute the minimum seat bundles for your group size.
          </p>
        </Link>
      </section>
    </div>
  );
}
