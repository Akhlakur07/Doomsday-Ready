import { useState } from 'react';
import { motion } from 'framer-motion';
import { Armchair, CheckCircle2, Layers } from 'lucide-react';

const BUNDLE_PALETTE = [
  {
    bg: 'bg-emerald-500',
    soft: 'bg-emerald-500/15',
    border: 'border-emerald-400/50',
    text: 'text-emerald-300',
    seat: 'text-emerald-300',
  },
  {
    bg: 'bg-lime-400',
    soft: 'bg-lime-400/15',
    border: 'border-lime-400/50',
    text: 'text-lime-300',
    seat: 'text-lime-300',
  },
  {
    bg: 'bg-teal-400',
    soft: 'bg-teal-400/15',
    border: 'border-teal-400/50',
    text: 'text-teal-300',
    seat: 'text-teal-300',
  },
  {
    bg: 'bg-cyan-400',
    soft: 'bg-cyan-400/15',
    border: 'border-cyan-400/50',
    text: 'text-cyan-300',
    seat: 'text-cyan-300',
  },
  {
    bg: 'bg-green-400',
    soft: 'bg-green-400/15',
    border: 'border-green-400/50',
    text: 'text-green-300',
    seat: 'text-green-300',
  },
];

export default function SeatBundleVisualizer({ quote }) {
  const [focusedSize, setFocusedSize] = useState(null);

  if (!quote || !quote.possible) {
    return null;
  }

  const totalSeats = quote.bundles.reduce(
    (sum, item) => sum + item.size * item.count,
    0
  );

  const colorBySize = new Map();
  quote.bundles.forEach((item, idx) => {
    colorBySize.set(item.size, BUNDLE_PALETTE[idx % BUNDLE_PALETTE.length]);
  });

  // Expand pods when groupSize is reasonable so individual auditorium seats stay legible
  const showSeatPods = totalSeats <= 240;
  const pods = [];
  if (showSeatPods) {
    let podIndex = 0;
    for (const item of quote.bundles) {
      for (let i = 0; i < item.count; i++) {
        podIndex += 1;
        pods.push({
          key: `${item.size}-${i}`,
          label: `Pod #${podIndex}`,
          size: item.size,
          palette: colorBySize.get(item.size),
        });
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="doom-card mt-5 overflow-hidden rounded-2xl"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/15 bg-black/40 px-5 py-4">
        <div>
          <h3 className="flex items-center gap-2 font-display text-sm font-bold tracking-wide text-white">
            <Layers className="h-4 w-4 text-emerald-400" />
            Interactive Bundle Allocation Diagram
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Hover or click a bundle chip to inspect how seats fill the auditorium with
            zero wasted seats.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {totalSeats} / {quote.groupSize} Seats Filled
        </div>
      </div>

      <div className="space-y-6 p-5">
        {/* Interactive Legend */}
        <div className="flex flex-wrap gap-2.5">
          {quote.bundles.map((item) => {
            const palette = colorBySize.get(item.size);
            const isActive = focusedSize === item.size;
            return (
              <button
                key={item.size}
                type="button"
                onMouseEnter={() => setFocusedSize(item.size)}
                onMouseLeave={() => setFocusedSize(null)}
                onClick={() =>
                  setFocusedSize((prev) => (prev === item.size ? null : item.size))
                }
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-left transition ${
                  isActive
                    ? `${palette.border} ${palette.soft} scale-[1.02]`
                    : 'border-emerald-500/20 bg-black/45 hover:border-emerald-400/40'
                }`}
              >
                <span className={`h-3 w-3 rounded-sm ${palette.bg}`} />
                <div>
                  <p className="font-mono text-xs font-semibold text-white">
                    {item.size}-Seat Bundle × {item.count}
                  </p>
                  <p className={`font-mono text-[11px] ${palette.text}`}>
                    {item.size * item.count} seats (
                    {Math.round(((item.size * item.count) / totalSeats) * 100)}%)
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Proportional Allocation Bar */}
        <div>
          <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-slate-400">
            <span>Seat Distribution</span>
            <span>{quote.totalBundles} Total Bundles</span>
          </div>
          <div className="flex h-6 w-full overflow-hidden rounded-lg border border-emerald-500/20 bg-black/60 p-0.5">
            {quote.bundles.map((item) => {
              const palette = colorBySize.get(item.size);
              const seats = item.size * item.count;
              const widthPct = (seats / totalSeats) * 100;
              const dimmed = focusedSize !== null && focusedSize !== item.size;

              return (
                <div
                  key={item.size}
                  onMouseEnter={() => setFocusedSize(item.size)}
                  onMouseLeave={() => setFocusedSize(null)}
                  style={{ width: `${widthPct}%` }}
                  title={`${item.size} × ${item.count} = ${seats} seats`}
                  className={`flex items-center justify-center border-r border-black/50 last:border-r-0 font-mono text-[10px] font-bold text-black transition-opacity ${
                    palette.bg
                  } ${dimmed ? 'opacity-30' : 'opacity-95'}`}
                >
                  {widthPct >= 10 ? `${item.size}×${item.count}` : ''}
                </div>
              );
            })}
          </div>
        </div>

        {/* Opening-Night Screen + Seat Pods */}
        {showSeatPods ? (
          <div className="rounded-xl border border-emerald-500/15 bg-[#030705] p-4">
            {/* Curved IMAX Screen */}
            <div className="mx-auto mb-5 max-w-md text-center">
              <svg
                viewBox="0 0 320 26"
                className="mx-auto h-6 w-full overflow-visible"
              >
                <path
                  d="M 12 20 Q 160 2 308 20"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="drop-shadow-[0_0_10px_rgba(52,211,153,0.75)]"
                />
              </svg>
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-400/80">
                Opening Night IMAX Screen
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {pods.map((pod) => {
                const dimmed = focusedSize !== null && focusedSize !== pod.size;
                return (
                  <motion.div
                    key={pod.key}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: dimmed ? 0.3 : 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    onMouseEnter={() => setFocusedSize(pod.size)}
                    onMouseLeave={() => setFocusedSize(null)}
                    className={`rounded-xl border px-3 py-2.5 ${pod.palette.border} ${pod.palette.soft}`}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-3 font-mono text-[10px] text-slate-300">
                      <span>{pod.label}</span>
                      <span className={pod.palette.text}>{pod.size} seats</span>
                    </div>
                    <div className="flex max-w-[180px] flex-wrap gap-1">
                      {Array.from({ length: pod.size }).map((_, seatIdx) => (
                        <Armchair
                          key={seatIdx}
                          className={`h-3.5 w-3.5 ${pod.palette.seat}`}
                        />
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-500/15 bg-black/40 p-4 text-center font-mono text-xs text-slate-400">
            Large party mode ({totalSeats.toLocaleString()} seats): seat-by-seat pod
            map switches to proportional bundle bar above for instant rendering.
          </div>
        )}
      </div>
    </motion.div>
  );
}
