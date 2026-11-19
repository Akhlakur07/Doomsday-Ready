import { useCallback, useEffect, useState } from 'react';
import {
  createCinema,
  deleteCinema,
  getBookingQuote,
  getCinemas,
} from '../api/client';

export default function BookingPage() {
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [groupSize, setGroupSize] = useState('6');
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [cinemaName, setCinemaName] = useState('');
  const [bundleInput, setBundleInput] = useState('');
  const [creating, setCreating] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCinemas = useCallback(async () => {
    try {
      const list = await getCinemas();
      setCinemas(list);
      setSelectedCinemaId((prev) =>
        prev && list.some((c) => c._id === prev) ? prev : list[0]?._id || ''
      );
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
        const list = await getCinemas();
        if (!active) return;
        setCinemas(list);
        if (list.length > 0) {
          setSelectedCinemaId(list[0]._id);
        }
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

  async function handleGetQuote(e) {
    e.preventDefault();
    if (!selectedCinemaId) return;

    setError('');
    setQuoteLoading(true);
    try {
      const result = await getBookingQuote(selectedCinemaId, groupSize);
      setQuote(result);
    } catch (err) {
      setQuote(null);
      setError(err.code ? `[${err.code}] ${err.message}` : err.message);
    } finally {
      setQuoteLoading(false);
    }
  }

  async function handleCreateCinema(e) {
    e.preventDefault();
    setError('');

    const parsedBundles = bundleInput
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => Number(part));

    if (
      parsedBundles.length === 0 ||
      parsedBundles.some((n) => !Number.isInteger(n))
    ) {
      setError('Bundle sizes must be comma-separated whole numbers (e.g. 1, 3, 4).');
      return;
    }

    setCreating(true);
    try {
      const created = await createCinema({
        name: cinemaName.trim(),
        bundleSizes: parsedBundles,
      });
      setCinemaName('');
      setBundleInput('');
      await loadCinemas();
      setSelectedCinemaId(created._id);
    } catch (err) {
      setError(err.code ? `[${err.code}] ${err.message}` : err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteCinema(id) {
    setError('');
    try {
      await deleteCinema(id);
      if (quote?.cinemaId === id) {
        setQuote(null);
      }
      await loadCinemas();
    } catch (err) {
      setError(err.code ? `[${err.code}] ${err.message}` : err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Watch-Party Booking</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pick a cinema and group size to find the fewest seat bundles totaling the
          exact group size—with zero empty seats.
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

      {/* Booking Quote Calculator */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Get Booking Quote</h2>

        {loading ? (
          <p className="mt-2 text-sm text-slate-500">Loading cinemas...</p>
        ) : cinemas.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No cinemas available yet. Create one below first.
          </p>
        ) : (
          <form
            onSubmit={handleGetQuote}
            className="mt-3 grid gap-3 sm:grid-cols-3 sm:items-end"
          >
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Cinema</span>
              <select
                value={selectedCinemaId}
                onChange={(e) => {
                  setSelectedCinemaId(e.target.value);
                  setQuote(null);
                }}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                {cinemas.map((cinema) => (
                  <option key={cinema._id} value={cinema._id}>
                    {cinema.name} [{cinema.bundleSizes.join(', ')}]
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Group Size (1–10,000)
              </span>
              <input
                type="number"
                required
                min={1}
                max={10000}
                value={groupSize}
                onChange={(e) => setGroupSize(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={quoteLoading}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {quoteLoading ? 'Calculating...' : 'Calculate Bundles'}
            </button>
          </form>
        )}

        {quote && (
          <div
            className={`mt-4 rounded-md border p-4 ${
              quote.possible
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-amber-200 bg-amber-50'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-900">
                {quote.cinemaName} — Group of {quote.groupSize}
              </h3>
              <span className="text-xs text-slate-600">
                Available bundles: [{quote.bundleSizes.join(', ')}]
              </span>
            </div>

            {quote.possible ? (
              <div className="mt-2 space-y-1 text-sm text-slate-800">
                <p className="font-medium">
                  {quote.totalBundles} bundle{quote.totalBundles === 1 ? '' : 's'}:{' '}
                  {quote.bundles
                    .map((b) => `${b.size} × ${b.count}`)
                    .join(', ')}
                </p>
                <p className="text-xs text-slate-600">
                  Total seats:{' '}
                  {quote.bundles.reduce((sum, b) => sum + b.size * b.count, 0)} (exact
                  match)
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm font-semibold text-amber-900">
                Not possible — no exact combination of bundles [
                {quote.bundleSizes.join(', ')}] adds up to {quote.groupSize} seats.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Add & List Cinemas */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Manage Cinemas</h2>

        <form
          onSubmit={handleCreateCinema}
          className="mt-3 grid gap-3 sm:grid-cols-3 sm:items-end"
        >
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Cinema Name
            </span>
            <input
              type="text"
              required
              value={cinemaName}
              onChange={(e) => setCinemaName(e.target.value)}
              placeholder="e.g. Grand IMAX"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Bundle Sizes (1–10 sizes, each 1–500)
            </span>
            <input
              type="text"
              required
              value={bundleInput}
              onChange={(e) => setBundleInput(e.target.value)}
              placeholder="e.g. 6, 9, 20"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={creating}
            className="rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50"
          >
            {creating ? 'Adding...' : 'Add Cinema'}
          </button>
        </form>

        {cinemas.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-200">
            {cinemas.map((cinema) => (
              <li
                key={cinema._id}
                className="flex items-center justify-between gap-2 py-2.5 text-sm"
              >
                <div>
                  <span className="font-medium text-slate-900">{cinema.name}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    Bundles: {cinema.bundleSizes.join(', ')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCinema(cinema._id)}
                  className="rounded border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
