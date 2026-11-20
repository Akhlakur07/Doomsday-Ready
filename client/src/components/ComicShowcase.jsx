import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Maximize2, X } from 'lucide-react';
import comic1 from '../assets/comic1.jfif';
import comic2 from '../assets/comic2.jfif';

const COMIC_PANELS = [
  {
    id: 'latverian-prologue',
    issue: 'ISSUE #01 · LATVERIAN PROLOGUE',
    title: 'Patience of Doom',
    caption: '"When you get to Hell... I\'ll be waiting."',
    image: comic1,
    previewClass: 'object-cover object-top',
    actionLabel: 'Expand Panel',
  },
  {
    id: 'secret-wars',
    issue: 'ISSUE #02 · SECRET WARS: GOD EMPEROR DOOM',
    title: 'That Appears Untrue',
    caption:
      'Battleworld forged by Victor von Doom — the mythic foundation behind Avengers: Doomsday.',
    image: comic2,
    previewClass: 'object-cover object-[50%_42%]',
    actionLabel: 'Expand Full Page',
  },
];

export default function ComicShowcase() {
  const [activePanel, setActivePanel] = useState(null);

  useEffect(() => {
    if (!activePanel) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setActivePanel(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePanel]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.24em] text-emerald-400">
            <BookOpen className="h-3.5 w-3.5" />
            Comic Archive · Marvel Lore
          </span>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-wider text-white sm:text-3xl">
            From The Pages of Doom
          </h2>
        </div>
        <p className="font-mono text-xs text-slate-400">
          Click any panel to inspect full-resolution artwork
        </p>
      </div>

      <div className="grid items-stretch gap-6 lg:grid-cols-12">
        {COMIC_PANELS.map((panel, idx) => (
          <motion.article
            key={panel.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: idx * 0.08 }}
            onClick={() => setActivePanel(panel)}
            className="comic-panel-frame group flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-[#050b08] transition hover:border-emerald-400/70 lg:col-span-6"
          >
            {/* Narration Strip */}
            <div className="flex items-center justify-between gap-2 border-b border-emerald-500/25 bg-[#07130d] px-4 py-2.5">
              <span className="font-mono text-[11px] font-semibold tracking-[0.2em] text-emerald-300">
                {panel.issue}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-slate-300 transition group-hover:text-emerald-300">
                <Maximize2 className="h-3 w-3" />
                {panel.actionLabel}
              </span>
            </div>

            {/* Comic Artwork Preview */}
            <div className="relative h-[360px] overflow-hidden bg-black sm:h-[420px]">
              <img
                src={panel.image}
                alt={panel.title}
                loading="lazy"
                className={`h-full w-full ${panel.previewClass} transition duration-500 group-hover:scale-[1.03]`}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050b08] via-transparent to-black/25" />
            </div>

            {/* Caption Box */}
            <div className="flex flex-1 flex-col justify-between border-t border-emerald-500/20 bg-black/60 px-4 py-3.5">
              <h3 className="font-marvel text-xl tracking-wider text-white">
                {panel.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                {panel.caption}
              </p>
            </div>
          </motion.article>
        ))}
      </div>

      {/* Full-Resolution Comic Lightbox Modal */}
      <AnimatePresence>
        {activePanel && (
          <motion.div
            key="comic-lightbox-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePanel(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          >
            <motion.div
              key="comic-lightbox-card"
              role="dialog"
              aria-modal="true"
              aria-label={activePanel.title}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              data-lenis-prevent
              className="comic-panel-frame flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-[#050b08]"
            >
              <div className="flex items-center justify-between gap-3 border-b border-emerald-500/20 bg-black/60 px-4 py-3">
                <div>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-400">
                    {activePanel.issue}
                  </span>
                  <h3 className="font-marvel text-xl tracking-wider text-white">
                    {activePanel.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePanel(null)}
                  aria-label="Close comic lightbox"
                  className="rounded-lg border border-emerald-500/30 bg-black/60 p-2 text-slate-300 transition hover:border-emerald-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-1 items-center justify-center overflow-auto bg-[#020503] p-3 sm:p-5">
                <img
                  src={activePanel.image}
                  alt={activePanel.title}
                  className="max-h-[75vh] w-auto rounded-lg object-contain shadow-[0_0_40px_rgba(0,0,0,0.9)]"
                />
              </div>

              <div className="border-t border-emerald-500/20 bg-black/60 px-4 py-3 text-xs text-slate-300">
                {activePanel.caption}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
