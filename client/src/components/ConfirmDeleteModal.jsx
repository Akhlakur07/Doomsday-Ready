import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Film, Loader2, Trash2, X } from 'lucide-react';

export default function ConfirmDeleteModal({
  movie,
  dependentMovies = [],
  deleting = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!movie) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !deleting) {
        onCancel();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movie, deleting, onCancel]);

  const hasDependents = dependentMovies.length > 0;

  return (
    <AnimatePresence>
      {movie && (
        <motion.div
          key="delete-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => !deleting && onCancel()}
        >
          <motion.div
            key="delete-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#080f0b] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-500/15 bg-black/40 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                    hasDependents
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                      : 'border-red-500/40 bg-red-500/10 text-red-400'
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    id="delete-modal-title"
                    className="font-display text-base font-bold tracking-wide text-white"
                  >
                    {hasDependents
                      ? 'Prerequisite Warning'
                      : 'Confirm Movie Deletion'}
                  </h2>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                    Timeline Archive Action
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={deleting}
                onClick={onCancel}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3.5 rounded-xl border border-emerald-500/15 bg-black/40 p-3">
                {movie.posterUrl ? (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="h-16 w-11 shrink-0 rounded-md border border-emerald-500/20 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-950/40 text-emerald-400">
                    <Film className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-marvel text-xl tracking-wide text-white">
                    {movie.title}
                  </p>
                  <p className="font-mono text-xs text-slate-400">
                    {movie.releaseYear} · {movie.runtime} min
                  </p>
                </div>
              </div>

              {hasDependents ? (
                <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-4">
                  <p className="text-sm font-semibold text-amber-200">
                    Warning: <span className="text-white">{movie.title}</span> is a
                    prerequisite of {dependentMovies.length}{' '}
                    {dependentMovies.length === 1 ? 'movie' : 'movies'}:
                  </p>
                  <ul
                    data-lenis-prevent
                    className="mt-2.5 max-h-40 space-y-1.5 overflow-y-auto pr-1"
                  >
                    {dependentMovies.map((dep) => (
                      <li
                        key={dep._id}
                        className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-black/45 px-3 py-1.5 text-xs"
                      >
                        <span className="font-medium text-amber-100">
                          {dep.title}
                        </span>
                        <span className="font-mono text-[11px] text-amber-300/80">
                          {dep.releaseYear}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs leading-relaxed text-amber-200/80">
                    Deleting this movie will permanently remove it and automatically
                    unlink it from the prerequisites of the{' '}
                    {dependentMovies.length === 1 ? 'movie' : 'movies'} listed above.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-300">
                  No other movies currently list{' '}
                  <strong className="text-white">{movie.title}</strong> as a
                  prerequisite. Are you sure you want to permanently remove it from
                  the timeline?
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-emerald-500/15 bg-black/40 px-5 py-3.5">
              <button
                type="button"
                disabled={deleting}
                onClick={onCancel}
                className="rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={onConfirm}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/60 bg-red-600/90 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(220,38,38,0.35)] transition hover:bg-red-500 disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    {hasDependents ? 'Delete & Unlink' : 'Delete Movie'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
