import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Building2,
  Calculator,
  CheckCircle2,
  Loader2,
  Plus,
  Ticket,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createCinema,
  deleteCinema,
  getBookingQuote,
  getCinemas,
} from '../api/client';
import LoadingScreen from '../components/LoadingScreen';
import SeatBundleVisualizer from '../components/SeatBundleVisualizer';

const QUICK_GROUP_SIZES = [6, 7, 11, 44, 100];

export default function BookingPage() {
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [groupSize, setGroupSize] = useState('6');
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [cinemaName, setCinemaName] = useState('');
  const [bundleInput, setBundleInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState('');

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
      const msg = err.code ? `[${err.code}] ${err.message}` : err.message;
      setError(msg);
      toast.error(msg);
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
        const msg = err.code ? `[${err.code}] ${err.message}` : err.message;
        setError(msg);
        toast.error(msg);
      } finally {
        if (active) setLoading(false);
      }
    }

    init();
    return () => {
      active = false;
    };
  }, []);

  const parsedPreviewBundles = useMemo(() => {
    return bundleInput
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => Number(p))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 500);
  }, [bundleInput]);

  async function handleGetQuote(e) {
    e.preventDefault();
    if (!selectedCinemaId) return;

    setError('');
    setQuoteLoading(true);
    try {
      const result = await getBookingQuote(selectedCinemaId, groupSize);
      setQuote(result);
      if (result.possible) {
        toast.success(
          `Found optimal quote: ${result.totalBundles} bundle${
            result.totalBundles === 1 ? '' : 's'
          } for ${result.groupSize} seats.`
        );
      } else {
        toast.warning(
          `Not possible for ${result.groupSize} seats at ${result.cinemaName}.`
        );
      }
    } catch (err) {
      setQuote(null);
      const msg = err.code ? `[${err.code}] ${err.message}` : err.message;
      setError(msg);
      toast.error(msg);
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
      const msg =
        'Bundle sizes must be comma-separated whole numbers (e.g. 1, 3, 4).';
      setError(msg);
      toast.error(msg);
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
      setQuote(null);
      toast.success(`Added cinema "${created.name}".`);
    } catch (err) {
      const msg = err.code ? `[${err.code}] ${err.message}` : err.message;
      setError(msg);
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteCinema(cinema) {
    setError('');
    setDeletingId(cinema._id);
    try {
      await deleteCinema(cinema._id);
      if (quote?.cinemaId === cinema._id) {
        setQuote(null);
      }
      await loadCinemas();
      toast.success(`Deleted cinema "${cinema.name}".`);
    } catch (err) {
      const msg = err.code ? `[${err.code}] ${err.message}` : err.message;
      setError(msg);
      toast.error(msg);
    } finally {
      setDeletingId('');
    }
  }

  if (loading) {
    return (
      <LoadingScreen
        message="SCANNING OPENING-NIGHT CINEMAS..."
        subtext="Loading seat bundle tiers for December 18 watch parties"
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-400">
          Dynamic Programming Optimizer
        </span>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-wide text-white sm:text-4xl">
          Watch-Party Booking
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Select an opening-night cinema and group size (1–10,000) to calculate the
          fewest seat bundles totaling the exact party size—with zero empty seats.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/50 bg-red-950/50 px-4 py-3 font-mono text-xs text-red-200"
        >
          {error}
        </div>
      )}

      {/* Section 1: Booking Quote Command Center */}
      <section className="doom-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-emerald-400" />
          <h2 className="font-display text-xl font-bold text-white">
            Calculate Booking Quote
          </h2>
        </div>

        {cinemas.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            No cinemas available yet. Create one below first.
          </p>
        ) : (
          <form onSubmit={handleGetQuote} className="mt-5 space-y-5">
            {/* Clickable Cinema Selector Cards */}
            <div>
              <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-emerald-300">
                1. Choose Cinema
              </span>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {cinemas.map((cinema) => {
                  const selected = cinema._id === selectedCinemaId;
                  return (
                    <button
                      key={cinema._id}
                      type="button"
                      onClick={() => {
                        setSelectedCinemaId(cinema._id);
                        setQuote(null);
                      }}
                      className={`rounded-xl border p-3.5 text-left transition ${
                        selected
                          ? 'border-emerald-400 bg-emerald-950/45 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                          : 'border-emerald-500/20 bg-black/45 hover:border-emerald-400/45'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold text-white">
                          {cinema.name}
                        </span>
                        {selected && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {cinema.bundleSizes.map((size) => (
                          <span
                            key={size}
                            className="rounded border border-emerald-500/25 bg-black/50 px-1.5 py-0.5 font-mono text-[11px] text-emerald-300"
                          >
                            {size}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Group Size Input + Quick Presets */}
            <div className="grid gap-4 sm:grid-cols-12 sm:items-end">
              <div className="sm:col-span-5">
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-emerald-300">
                    <Users className="h-3.5 w-3.5" /> 2. Group Size (1–10,000)
                  </span>
                  <input
                    type="number"
                    required
                    min={1}
                    max={10000}
                    value={groupSize}
                    onChange={(e) => setGroupSize(e.target.value)}
                    className="w-full rounded-xl border border-emerald-500/30 bg-black/60 px-3.5 py-2.5 font-mono text-sm text-white focus:border-emerald-400 focus:outline-none"
                  />
                </label>
              </div>

              <div className="sm:col-span-4">
                <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  Quick Presets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_GROUP_SIZES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGroupSize(String(preset))}
                      className={`rounded-lg border px-2.5 py-2 font-mono text-xs transition ${
                        String(preset) === String(groupSize)
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                          : 'border-slate-800 bg-black/45 text-slate-300 hover:border-emerald-500/35'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={quoteLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(16,185,129,0.35)] transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  {quoteLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Solving...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4" />
                      Calculate Bundles
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Quote Result */}
        {quote && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 rounded-2xl border p-5 ${
              quote.possible
                ? 'border-emerald-500/45 bg-emerald-950/25'
                : 'border-amber-500/45 bg-amber-950/25'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg font-bold text-white">
                {quote.cinemaName} — Group of {quote.groupSize}
              </h3>
              <span className="font-mono text-xs text-slate-300">
                Available bundles: [{quote.bundleSizes.join(', ')}]
              </span>
            </div>

            {quote.possible ? (
              <div className="mt-3 space-y-2">
                <p className="font-marvel text-3xl tracking-wider text-emerald-300">
                  {quote.totalBundles} BUNDLE
                  {quote.totalBundles === 1 ? '' : 'S'}:{' '}
                  <span className="text-white">
                    {quote.bundles
                      .map((b) => `${b.size} × ${b.count}`)
                      .join(', ')}
                  </span>
                </p>
                <p className="font-mono text-xs text-emerald-200/80">
                  Exact match verified:{' '}
                  {quote.bundles
                    .map((b) => `${b.size}×${b.count}`)
                    .join(' + ')}{' '}
                  ={' '}
                  {quote.bundles.reduce(
                    (sum, b) => sum + b.size * b.count,
                    0
                  )}{' '}
                  seats (0 empty seats)
                </p>
              </div>
            ) : (
              <div className="mt-3 flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div>
                  <p className="font-marvel text-2xl tracking-wider text-amber-300">
                    NOT POSSIBLE
                  </p>
                  <p className="mt-0.5 text-sm text-amber-100/80">
                    No exact combination of bundle sizes [
                    {quote.bundleSizes.join(', ')}] adds up to {quote.groupSize}{' '}
                    seats without leaving an empty seat.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Interactive Seat Bundle Allocation Diagram */}
        {quote && quote.possible && <SeatBundleVisualizer quote={quote} />}
      </section>

      {/* Section 2: Manage Cinemas */}
      <section className="doom-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-emerald-400" />
          <h2 className="font-display text-xl font-bold text-white">
            Manage Cinemas ({cinemas.length})
          </h2>
        </div>

        <form
          onSubmit={handleCreateCinema}
          className="mt-4 grid gap-3.5 sm:grid-cols-12 sm:items-end"
        >
          <label className="block sm:col-span-4">
            <span className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-emerald-300">
              Cinema Name
            </span>
            <input
              type="text"
              required
              value={cinemaName}
              onChange={(e) => setCinemaName(e.target.value)}
              placeholder="e.g. Latveria IMAX"
              className="w-full rounded-xl border border-emerald-500/25 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
          </label>

          <label className="block sm:col-span-5">
            <span className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-emerald-300">
              Bundle Sizes (1–10 sizes, each 1–500)
            </span>
            <input
              type="text"
              required
              value={bundleInput}
              onChange={(e) => setBundleInput(e.target.value)}
              placeholder="e.g. 6, 9, 20"
              className="w-full rounded-xl border border-emerald-500/25 bg-black/50 px-3 py-2 font-mono text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
          </label>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/25 disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Cinema
                </>
              )}
            </button>
          </div>
        </form>

        {parsedPreviewBundles.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-slate-400">
            <span>Parsed bundles:</span>
            {parsedPreviewBundles.map((size, idx) => (
              <span
                key={`${size}-${idx}`}
                className="rounded border border-emerald-500/25 bg-emerald-950/40 px-1.5 py-0.5 text-emerald-300"
              >
                {size} seats
              </span>
            ))}
          </div>
        )}

        {cinemas.length > 0 && (
          <ul className="mt-5 divide-y divide-emerald-500/15">
            {cinemas.map((cinema) => (
              <li
                key={cinema._id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-semibold text-white">{cinema.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {cinema.bundleSizes.map((size) => (
                      <span
                        key={size}
                        className="rounded border border-emerald-500/20 bg-black/50 px-2 py-0.5 font-mono text-xs text-emerald-300"
                      >
                        {size} seats
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={deletingId === cinema._id}
                  onClick={() => handleDeleteCinema(cinema)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                >
                  {deletingId === cinema._id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
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
