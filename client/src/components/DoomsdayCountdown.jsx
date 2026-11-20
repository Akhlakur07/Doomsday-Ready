import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import bannerBg from '../assets/banner_bg.png';
import {
  computeCalendarCountdown,
  getDoomsdayTargetDate,
} from '../utils/formatters';

export default function DoomsdayCountdown() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const targetDate = useMemo(() => getDoomsdayTargetDate(now), [now]);
  const countdown = useMemo(
    () => computeCalendarCountdown(now, targetDate),
    [now, targetDate]
  );

  const blocks = [
    { label: 'MONTHS', value: countdown.months },
    { label: 'DAYS', value: countdown.days },
    { label: 'HOURS', value: countdown.hours },
    { label: 'MINUTES', value: countdown.minutes },
    { label: 'SECONDS', value: countdown.seconds },
  ];

  return (
    <section
      aria-label="Countdown to Avengers: Doomsday"
      className="relative overflow-hidden border-y border-emerald-500/25 bg-[#030604] py-12 sm:py-16"
    >
      {/* Atmospheric stained-glass / Latverian backdrop matching reference */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25 blur-[1px]"
        style={{ backgroundImage: `url(${bannerBg})` }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#020403] via-[#041209]/80 to-[#020403]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.16),transparent_68%)]" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.55 }}
        className="relative mx-auto max-w-5xl px-4 text-center"
      >
        <p className="font-sans text-xs font-bold uppercase tracking-[0.38em] text-white/95 drop-shadow sm:text-sm md:text-base">
          DOOMSDAY IS COMING
        </p>

        {/* Digits row faithfully inspired by the December 18 teaser */}
        <div className="mt-5 flex flex-wrap items-start justify-center gap-x-2 gap-y-5 sm:flex-nowrap sm:gap-x-3 md:gap-x-5">
          {blocks.map((block, index) => (
            <div key={block.label} className="flex items-start gap-2 sm:gap-3 md:gap-5">
              <div className="flex min-w-[60px] flex-col items-center sm:min-w-[82px] md:min-w-[104px]">
                <span className="font-sans text-4xl font-semibold leading-none tracking-[0.06em] text-white tabular-nums drop-shadow-[0_0_24px_rgba(16,185,129,0.45)] sm:text-6xl md:text-7xl">
                  {block.value}
                </span>
                <span className="mt-2.5 font-sans text-[10px] font-medium uppercase tracking-[0.26em] text-emerald-200/80 sm:text-xs">
                  {block.label}
                </span>
              </div>

              {index < blocks.length - 1 && (
                <span
                  aria-hidden="true"
                  className="pt-0.5 font-sans text-3xl font-light leading-none text-white/65 sm:text-5xl md:text-6xl"
                >
                  :
                </span>
              )}
            </div>
          ))}
        </div>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.26em] text-emerald-400/80">
          December 18, {countdown.targetYear} · Opening Night Watch Party
        </p>
      </motion.div>
    </section>
  );
}
