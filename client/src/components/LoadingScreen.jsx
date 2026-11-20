import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function LoadingScreen({
  message = 'SYNCING SACRED TIMELINE...',
  subtext = 'Initializing Doomsday Protocol',
  compact = false,
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#060c09]/90 px-6 ${
        compact ? 'min-h-[240px] py-10' : 'min-h-[62vh] py-20'
      }`}
    >
      {/* Ambient emerald core glow */}
      <div className="pointer-events-none absolute h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl animate-pulse-glow" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="relative flex flex-col items-center text-center"
      >
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* Outer dashed orbital ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-400/50 animate-spin-slow" />
          {/* Inner counter-rotating arc ring */}
          <div className="absolute inset-2.5 rounded-full border-2 border-transparent border-t-emerald-400 border-r-emerald-500/50 animate-spin-reverse" />
          {/* Pulsing Latverian shield core */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-950/80 shadow-[0_0_24px_rgba(16,185,129,0.45)]">
            <Shield className="h-6 w-6 text-emerald-300" />
          </div>
        </div>

        <p className="mt-6 font-mono text-xs font-semibold tracking-[0.28em] text-emerald-300">
          {message}
        </p>
        <p className="mt-1.5 text-xs text-slate-400">{subtext}</p>
      </motion.div>
    </div>
  );
}
