import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Clock,
  Film,
  GitBranch,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { getMovies, getRewatchOrder, updateMovie } from '../api/client';
import comic2 from '../assets/comic2.jfif';
import DependencyGraph from '../components/DependencyGraph';
import LoadingScreen from '../components/LoadingScreen';
import { formatRuntime } from '../utils/formatters';

export default function RewatchPlanPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [plan, setPlan] = useState(null);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [showGraph, setShowGraph] = useState(true);
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
          const hasQueryMatch =
            fromQuery && list.some((m) => m._id === fromQuery);
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
        const msg = err.code ? `[${err.code}] ${err.message}` : err.message;
        setError(msg);
        toast.error(msg);
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
        const msg = err.code ? `[${err.code}] ${err.message}` : err.message;
        setError(msg);
        toast.error(msg);
      } finally {
        if (active) setLoadingPlan(false);
      }
    }

    fetchPlan();
    return () => {
      active = false;
    };
  }, [selectedId]);

  const titleById = useMemo(
    () => new Map(movies.map((m) => [m._id, m.title])),
    [movies]
  );

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
      const updated = await updateMovie(movie._id, { watched: !movie.watched });
      const updatedPlan = await getRewatchOrder(selectedId);
      setPlan(updatedPlan);
      setMovies((prev) =>
        prev.map((m) => (m._id === updated._id ? updated : m))
      );
      toast.success(
        updated.watched
          ? `Marked "${updated.title}" as watched.`
          : `Marked "${updated.title}" as unwatched.`
      );
    } catch (err) {
      const msg = err.code ? `[${err.code}] ${err.message}` : err.message;
      setError(msg);
      toast.error(msg);
    }
  }

  function handleGraphSelect(movie) {
    const el = document.getElementById(`rewatch-item-${movie._id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  if (loadingMovies || (loadingPlan && !plan)) {
    return (
      <LoadingScreen
        message="COMPUTING TOPOLOGICAL REWATCH PATH..."
        subtext="Resolving prerequisite DAG and remaining watch time"
      />
    );
  }

  const total = plan?.totalMovies ?? 0;
  const watched = plan?.watchedCount ?? 0;
  const progressPercent = total > 0 ? Math.round((watched / total) * 100) : 0;

  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progressPercent / 100);

  const subgraphMovies = plan?.targetMovie
    ? [...(plan.rewatchOrder || []), plan.targetMovie]
    : [];

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="doom-card relative overflow-hidden rounded-2xl p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(${comic2})` }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#060d09] via-[#060d09]/92 to-[#060d09]/40"
        />

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-400">
              Topological Timeline Solver
            </span>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-wide text-white sm:text-4xl">
              Rewatch Plan
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Pick a target movie to reveal every prerequisite you must watch first,
              sorted chronologically in valid dependency order.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowGraph((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/35 bg-black/60 px-3.5 py-2 text-xs font-semibold text-emerald-300 backdrop-blur-sm transition hover:bg-emerald-500/20"
          >
            <GitBranch className="h-4 w-4" />
            {showGraph ? 'Hide DAG Diagram' : 'Show DAG Diagram'}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/50 bg-red-950/50 px-4 py-3 font-mono text-xs text-red-200"
        >
          {error}
        </div>
      )}

      {movies.length === 0 ? (
        <div className="doom-card rounded-2xl p-8 text-center text-sm text-slate-400">
          No movies available yet. Add movies on the Movies page first.
        </div>
      ) : (
        <>
          {/* Target Selector */}
          <section className="doom-card rounded-2xl p-5">
            <label className="block">
              <span className="mb-2 block font-mono text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Select Target Movie
              </span>
              <select
                value={selectedId}
                onChange={(e) => handleSelectTarget(e.target.value)}
                className="w-full max-w-lg rounded-xl border border-emerald-500/30 bg-black/60 px-3.5 py-2.5 text-sm font-medium text-white focus:border-emerald-400 focus:outline-none"
              >
                {movies.map((movie) => (
                  <option
                    key={movie._id}
                    value={movie._id}
                    className="bg-[#08120d] text-white"
                  >
                    {movie.title} ({movie.releaseYear})
                  </option>
                ))}
              </select>
            </label>
          </section>

          {loadingPlan ? (
            <LoadingScreen
              compact
              message="RECALCULATING PATH..."
              subtext="Building topological watch order"
            />
          ) : (
            plan && (
              <>
                {/* Target Movie Showcase + SVG Progress Ring */}
                <section className="doom-card overflow-hidden rounded-2xl p-5 sm:p-6">
                  <div className="grid items-center gap-6 lg:grid-cols-12">
                    {/* Target Movie Poster & Meta */}
                    <div className="flex items-start gap-4 lg:col-span-7">
                      {plan.targetMovie?.posterUrl ? (
                        <img
                          src={plan.targetMovie.posterUrl}
                          alt={plan.targetMovie.title}
                          className="h-36 w-24 shrink-0 rounded-xl border border-emerald-500/30 object-cover shadow-[0_0_24px_rgba(16,185,129,0.2)]"
                        />
                      ) : (
                        <div className="flex h-36 w-24 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-400">
                          <Film className="h-8 w-8" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                          <Sparkles className="h-3 w-3" /> Target Objective
                        </span>
                        <h2 className="mt-2 font-display text-2xl font-bold text-white">
                          {plan.targetMovie?.title}
                        </h2>
                        <p className="mt-1 font-mono text-xs text-slate-400">
                          {plan.targetMovie?.releaseYear} ·{' '}
                          {plan.targetMovie?.runtime} min (target not included in
                          count)
                        </p>
                        {plan.targetMovie?.overview && (
                          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">
                            {plan.targetMovie.overview}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress Ring + Linear Bar + Remaining Time */}
                    <div className="flex flex-wrap items-center gap-5 rounded-xl border border-emerald-500/20 bg-black/45 p-4 lg:col-span-5">
                      <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                        <svg
                          className="h-full w-full -rotate-90"
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r={ringRadius}
                            fill="none"
                            stroke="rgba(16, 185, 129, 0.15)"
                            strokeWidth="9"
                          />
                          <motion.circle
                            key={`${selectedId}-${progressPercent}`}
                            cx="50"
                            cy="50"
                            r={ringRadius}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="9"
                            strokeLinecap="round"
                            strokeDasharray={ringCircumference}
                            initial={{ strokeDashoffset: ringCircumference }}
                            animate={{ strokeDashoffset: ringOffset }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                          />
                        </svg>
                        <span className="absolute font-marvel text-2xl text-white">
                          {progressPercent}%
                        </span>
                      </div>

                      <div className="min-w-40 flex-1 space-y-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-semibold text-white">
                            {watched} of {total} watched
                          </span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                          />
                        </div>
                        <p className="flex items-center gap-1.5 font-mono text-xs text-emerald-300">
                          <Clock className="h-3.5 w-3.5" />
                          Remaining: {formatRuntime(plan.remainingRuntimeMinutes)}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Interactive Subgraph Diagram */}
                {showGraph && subgraphMovies.length > 0 && (
                  <DependencyGraph
                    movies={subgraphMovies}
                    targetMovieId={plan.targetMovie?._id}
                    onSelectMovie={handleGraphSelect}
                    title={`Rewatch Flow into ${plan.targetMovie?.title}`}
                    subtitle="Click any node to jump straight to that step in your watchlist below."
                  />
                )}

                {/* Ordered Timeline Checklist */}
                <section className="doom-card rounded-2xl p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-white">
                      Ordered Watch Sequence ({plan.rewatchOrder.length})
                    </h3>
                    {total > 0 && watched === total && (
                      <span className="rounded-full border border-emerald-400/50 bg-emerald-500/20 px-3 py-1 font-mono text-xs font-semibold text-emerald-300">
                        ALL PREREQUISITES COMPLETE
                      </span>
                    )}
                  </div>

                  {plan.rewatchOrder.length === 0 ? (
                    <div className="rounded-xl border border-emerald-500/20 bg-black/40 p-6 text-center text-sm text-slate-300">
                      No prerequisites required before{' '}
                      <strong className="text-white">
                        {plan.targetMovie?.title}
                      </strong>{' '}
                      — you can watch it immediately!
                    </div>
                  ) : (
                    <ol className="relative space-y-3 border-l border-emerald-500/25 pl-5 sm:pl-6">
                      {plan.rewatchOrder.map((movie, index) => {
                        const directPrereqs = (movie.prerequisites || [])
                          .map((id) => titleById.get(id))
                          .filter(Boolean);

                        return (
                          <motion.li
                            id={`rewatch-item-${movie._id}`}
                            key={movie._id}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.28,
                              delay: Math.min(index * 0.03, 0.35),
                            }}
                            className={`relative flex flex-wrap items-center justify-between gap-4 rounded-xl border p-3.5 transition ${
                              movie.watched
                                ? 'border-emerald-500/30 bg-emerald-950/20'
                                : 'border-emerald-500/15 bg-black/45 hover:border-emerald-400/40'
                            }`}
                          >
                            {/* Timeline Spine Node */}
                            <span
                              className={`absolute top-1/2 -left-[29px] flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full border sm:-left-[33px] ${
                                movie.watched
                                  ? 'border-emerald-400 bg-emerald-500 shadow-[0_0_10px_#10b981]'
                                  : 'border-emerald-500/50 bg-[#050a07]'
                              }`}
                            />

                            <div className="flex min-w-0 flex-1 items-center gap-3.5">
                              <span className="w-7 shrink-0 font-marvel text-2xl text-emerald-400/80">
                                {String(index + 1).padStart(2, '0')}
                              </span>

                              {movie.posterUrl ? (
                                <img
                                  src={movie.posterUrl}
                                  alt={movie.title}
                                  loading="lazy"
                                  className="h-16 w-11 shrink-0 rounded-lg border border-emerald-500/25 object-cover"
                                />
                              ) : (
                                <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-950/40 text-emerald-400">
                                  <Film className="h-4 w-4" />
                                </div>
                              )}

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`font-marvel text-xl tracking-wide ${
                                      movie.watched
                                        ? 'text-slate-400 line-through'
                                        : 'text-white'
                                    }`}
                                  >
                                    {movie.title}
                                  </span>
                                  <span className="font-mono text-xs text-slate-400">
                                    {movie.releaseYear} · {movie.runtime}m
                                  </span>
                                </div>
                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                  {directPrereqs.length > 0
                                    ? `Follows: ${directPrereqs.join(', ')}`
                                    : 'Starting entry (no prerequisites)'}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleWatched(movie)}
                              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                                movie.watched
                                  ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
                                  : 'border-slate-700 bg-black/50 text-slate-300 hover:border-emerald-400/50 hover:text-white'
                              }`}
                            >
                              {movie.watched ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                  Watched
                                </>
                              ) : (
                                <>
                                  <Circle className="h-4 w-4 text-slate-400" />
                                  Mark Watched
                                </>
                              )}
                            </button>
                          </motion.li>
                        );
                      })}
                    </ol>
                  )}
                </section>
              </>
            )
          )}
        </>
      )}
    </div>
  );
}
