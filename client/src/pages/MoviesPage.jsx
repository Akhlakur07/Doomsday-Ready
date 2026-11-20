import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Clock,
  Film,
  GitBranch,
  LayoutGrid,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { deleteMovie, getMovies, updateMovie } from '../api/client';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import DependencyGraph from '../components/DependencyGraph';
import LoadingScreen from '../components/LoadingScreen';
import MovieForm from '../components/MovieForm';

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [editingId, setEditingId] = useState(null);
  const [draftPrereqs, setDraftPrereqs] = useState([]);
  const [savingPrereqs, setSavingPrereqs] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadMovies = useCallback(async () => {
    try {
      const list = await getMovies();
      setMovies(list);
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
        const list = await getMovies();
        if (!active) return;
        setMovies(list);
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

  const titleById = useMemo(() => {
    return new Map(movies.map((m) => [m._id, m.title]));
  }, [movies]);

  const filteredMovies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return movies.filter((m) => {
      if (statusFilter === 'watched' && !m.watched) return false;
      if (statusFilter === 'unwatched' && m.watched) return false;
      if (q && !m.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [movies, searchQuery, statusFilter]);

  const dependentMoviesForTarget = useMemo(() => {
    if (!deleteTarget) return [];
    return movies.filter(
      (m) =>
        m._id !== deleteTarget._id &&
        (m.prerequisites || []).includes(deleteTarget._id)
    );
  }, [movies, deleteTarget]);

  async function handleToggleWatched(movie) {
    setError('');
    try {
      const updated = await updateMovie(movie._id, { watched: !movie.watched });
      setMovies((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
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

  async function handleSavePrereqs(movie) {
    setError('');
    setSavingPrereqs(true);
    try {
      const updated = await updateMovie(movie._id, {
        prerequisites: draftPrereqs,
      });
      setMovies((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
      );
      setEditingId(null);
      toast.success(`Updated prerequisites for "${movie.title}".`);
    } catch (err) {
      const msg = err.code ? `[${err.code}] ${err.message}` : err.message;
      setError(msg);
      toast.error(msg);
    } finally {
      setSavingPrereqs(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    const removedTitle = deleteTarget.title;
    const removedId = deleteTarget._id;
    const unlinkedCount = dependentMoviesForTarget.length;

    try {
      await deleteMovie(removedId);
      if (editingId === removedId) {
        setEditingId(null);
      }
      setDeleteTarget(null);
      await loadMovies();
      toast.success(
        unlinkedCount > 0
          ? `Deleted "${removedTitle}" and unlinked it from ${unlinkedCount} dependent movie(s).`
          : `Deleted "${removedTitle}".`
      );
    } catch (err) {
      const msg = err.code ? `[${err.code}] ${err.message}` : err.message;
      setError(msg);
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <LoadingScreen
        message="LOADING MCU ARCHIVE..."
        subtext="Retrieving posters, runtimes, and prerequisite links"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-400">
            Sacred Timeline Vault
          </span>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-wide text-white sm:text-4xl">
            MCU Movies ({movies.length})
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage posters, watched status, and prerequisites. Circular timelines
            are blocked with{' '}
            <code className="rounded border border-emerald-500/25 bg-black/50 px-1.5 py-0.5 font-mono text-xs text-emerald-300">
              409 CIRCULAR_DEPENDENCY
            </code>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(16,185,129,0.35)] transition hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" />
          {showAddForm ? 'Hide Add Form' : 'Add Movie'}
        </button>
      </div>

      {/* Collapsible Add Movie Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <MovieForm
              movies={movies}
              onMovieAdded={async () => {
                await loadMovies();
                setShowAddForm(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Alert Banner (especially helpful for 409 CIRCULAR_DEPENDENCY) */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/50 bg-red-950/50 px-4 py-3 font-mono text-xs text-red-200 shadow-[0_0_24px_rgba(239,68,68,0.2)]"
        >
          {error}
        </div>
      )}

      {/* Search, Status Filter & View Switcher */}
      <div className="doom-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3.5">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-emerald-400/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter movies by title..."
            className="w-full rounded-xl border border-emerald-500/20 bg-black/50 py-2 pr-3 pl-9 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['all', 'watched', 'unwatched'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                statusFilter === status
                  ? 'border border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                  : 'border border-slate-800 bg-black/40 text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}

          <div className="ml-1 flex rounded-lg border border-emerald-500/20 bg-black/50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                viewMode === 'grid'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Posters
            </button>
            <button
              type="button"
              onClick={() => setViewMode('graph')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                viewMode === 'graph'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              DAG Graph
            </button>
          </div>
        </div>
      </div>

      {/* Main View */}
      {viewMode === 'graph' ? (
        <DependencyGraph
          movies={movies}
          title="Full MCU Dependency Graph"
          subtitle="Click or hover any movie to highlight every prerequisite leading into it and every sequel unlocked by it."
        />
      ) : filteredMovies.length === 0 ? (
        <div className="doom-card rounded-2xl p-10 text-center text-sm text-slate-400">
          No movies match your current filters.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMovies.map((movie, idx) => {
            const isEditing = editingId === movie._id;
            const prereqNames = (movie.prerequisites || [])
              .map((id) => titleById.get(id))
              .filter(Boolean);

            return (
              <motion.article
                key={movie._id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.35) }}
                className="group doom-card flex flex-col overflow-hidden rounded-2xl transition hover:border-emerald-400/45"
              >
                {/* 2:3 Poster Area */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#040a07]">
                  {movie.posterUrl ? (
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="bg-halftone flex h-full w-full flex-col items-center justify-center p-6 text-center">
                      <Film className="h-12 w-12 text-emerald-500/40" />
                      <span className="mt-3 font-marvel text-2xl tracking-wider text-emerald-200/80">
                        {movie.title}
                      </span>
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050a07] via-black/20 to-black/45" />

                  {/* Quick Watched Toggle Badge */}
                  <button
                    type="button"
                    onClick={() => handleToggleWatched(movie)}
                    className={`absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md transition ${
                      movie.watched
                        ? 'border-emerald-400/70 bg-emerald-500/90 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                        : 'border-white/20 bg-black/70 text-slate-200 hover:border-emerald-400/60 hover:text-emerald-200'
                    }`}
                  >
                    {movie.watched ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Watched
                      </>
                    ) : (
                      <>
                        <Circle className="h-3 w-3" /> Unwatched
                      </>
                    )}
                  </button>

                  {/* Year & Runtime Overlay */}
                  <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between gap-2">
                    <span className="rounded-md border border-emerald-500/25 bg-black/75 px-2 py-0.5 font-mono text-[11px] text-emerald-300 backdrop-blur-sm">
                      {movie.releaseYear}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-black/75 px-2 py-0.5 font-mono text-[11px] text-slate-200 backdrop-blur-sm">
                      <Clock className="h-3 w-3 text-emerald-400" />
                      {movie.runtime}m
                    </span>
                  </div>
                </div>

                {/* Card Details */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-marvel text-2xl leading-tight tracking-wide text-white">
                        {movie.title}
                      </h2>
                      {movie.mediaType === 'tv' && (
                        <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                          TV
                        </span>
                      )}
                    </div>

                    {movie.overview && (
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-400">
                        {movie.overview}
                      </p>
                    )}

                    <div className="mt-3">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-400/80">
                        Watch First ({prereqNames.length})
                      </p>
                      {prereqNames.length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {prereqNames.map((name) => (
                            <span
                              key={name}
                              className="rounded border border-emerald-500/20 bg-emerald-950/40 px-1.5 py-0.5 text-[11px] text-emerald-200"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-slate-500">
                          Standalone entry
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-4 space-y-3 border-t border-emerald-500/15 pt-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          isEditing ? setEditingId(null) : startEditPrereqs(movie)
                        }
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        {isEditing ? 'Close Editor' : 'Prerequisites'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(movie)}
                        aria-label={`Delete ${movie.title}`}
                        className="inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-950/30 p-1.5 text-red-400 transition hover:border-red-400 hover:bg-red-500/20 hover:text-red-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Inline Prerequisite Editor */}
                    {isEditing && (
                      <div className="rounded-xl border border-emerald-500/25 bg-black/60 p-3">
                        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                          Select Prerequisites
                        </p>
                        <div
                          data-lenis-prevent
                          className="max-h-36 space-y-1.5 overflow-y-auto pr-1"
                        >
                          {movies.map((candidate) => (
                            <label
                              key={candidate._id}
                              className="flex cursor-pointer items-center gap-2 text-xs text-slate-300 hover:text-white"
                            >
                              <input
                                type="checkbox"
                                checked={draftPrereqs.includes(candidate._id)}
                                onChange={() => toggleDraftPrereq(candidate._id)}
                                className="h-3.5 w-3.5 rounded accent-emerald-500"
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
                            onClick={() => handleSavePrereqs(movie)}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                          >
                            {savingPrereqs ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* Prerequisite-aware Delete Confirmation Modal */}
      <ConfirmDeleteModal
        movie={deleteTarget}
        dependentMovies={dependentMoviesForTarget}
        deleting={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}
