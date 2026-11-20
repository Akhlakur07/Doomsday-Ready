import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Film,
  GitBranch,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { toast } from 'sonner';
import { getCinemas, getMovies, getRewatchOrder } from '../api/client';
import bannerBg from '../assets/banner_bg.png';
import heroCharacter from '../assets/hero_character.png';
import DoomsdayCountdown from '../components/DoomsdayCountdown';
import LoadingScreen from '../components/LoadingScreen';
import { formatRuntime } from '../utils/formatters';

const ERAS = [
  {
    id: 'infinity-setup',
    label: 'Infinity Setup',
    range: '2008 – 2015',
    match: (year) => year <= 2015,
  },
  {
    id: 'infinity-climax',
    label: 'Infinity Climax',
    range: '2016 – 2019',
    match: (year) => year >= 2016 && year <= 2019,
  },
  {
    id: 'multiverse-saga',
    label: 'Multiverse & Doomsday',
    range: '2020 – 2026+',
    match: (year) => year >= 2020,
  },
];

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [doomsdayPlan, setDoomsdayPlan] = useState(null);
  const [selectedEraId, setSelectedEraId] = useState('infinity-setup');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [movieList, cinemaList] = await Promise.all([
          getMovies(),
          getCinemas(),
        ]);
        if (!active) return;

        setMovies(movieList);
        setCinemas(cinemaList);

        const doomsday = movieList.find(
          (m) => m.title.toLowerCase() === 'avengers: doomsday'
        );
        if (doomsday) {
          const plan = await getRewatchOrder(doomsday._id);
          if (active) setDoomsdayPlan(plan);
        }
        setError('');
      } catch (err) {
        if (!active) return;
        const msg = err.message || 'Failed to load dashboard telemetry.';
        setError(msg);
        toast.error(msg);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const watchedCount = movies.filter((m) => m.watched).length;
  const remainingMinutes = movies
    .filter((m) => !m.watched)
    .reduce((sum, m) => sum + (m.runtime || 0), 0);

  const doomsdayMovie = movies.find(
    (m) => m.title.toLowerCase() === 'avengers: doomsday'
  );

  const eraStats = useMemo(() => {
    return ERAS.map((era) => {
      const eraMovies = movies.filter((m) => era.match(m.releaseYear));
      const eraWatched = eraMovies.filter((m) => m.watched).length;
      const pct =
        eraMovies.length > 0
          ? Math.round((eraWatched / eraMovies.length) * 100)
          : 0;
      return {
        ...era,
        movies: eraMovies,
        watched: eraWatched,
        pct,
      };
    });
  }, [movies]);

  const activeEra =
    eraStats.find((e) => e.id === selectedEraId) || eraStats[0];

  const gaugeTotal = doomsdayPlan ? doomsdayPlan.totalMovies : movies.length;
  const gaugeWatched = doomsdayPlan ? doomsdayPlan.watchedCount : watchedCount;
  const gaugePct =
    gaugeTotal > 0 ? Math.round((gaugeWatched / gaugeTotal) * 100) : 0;
  const gaugeRemainingMin = doomsdayPlan
    ? doomsdayPlan.remainingRuntimeMinutes
    : remainingMinutes;

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - gaugePct / 100);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <LoadingScreen
          message="INITIALIZING DOOMSDAY COMMAND..."
          subtext="Loading Sacred Timeline movies, rewatch vectors, and cinema bundles"
        />
      </div>
    );
  }

  return (
    <div className="bg-[#040706]">
      {/* Section 1: Hero Banner with Custom Doctor Doom & Citadel Assets */}
      <section className="relative overflow-hidden bg-[#030604]">
        {/* Citadel backdrop */}
        <motion.div
          initial={{ scale: 1.07, opacity: 0.65 }}
          animate={{ scale: 1, opacity: 0.42 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bannerBg})` }}
        />

        {/* Halftone & atmospheric emerald-black vignette gradients */}
        <div className="pointer-events-none absolute inset-0 bg-halftone opacity-35" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#020403] via-[#040a07]/85 to-[#040907]/40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#030604] via-transparent to-[#040907]/70" />
        <div className="pointer-events-none absolute -top-24 right-1/4 h-96 w-96 rounded-full bg-emerald-500/20 blur-[120px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pt-12 pb-6 sm:px-6 lg:min-h-[600px] lg:grid-cols-12 lg:pt-12 lg:pb-0 xl:min-h-[640px]">
          {/* Left Hero Copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65 }}
            className="relative z-20 space-y-6 pb-8 lg:col-span-6 lg:pb-16"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-950/70 px-3.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              Multiverse Saga · Tactical Briefing
            </div>

            <h1 className="font-display text-4xl leading-[1.06] font-black tracking-wider text-white sm:text-6xl lg:text-7xl">
              DOOMSDAY{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-lime-300 bg-clip-text text-transparent text-glow-emerald">
                READY
              </span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Master the MCU timeline before{' '}
              <span className="font-semibold text-white">
                Avengers: Doomsday
              </span>{' '}
              arrives. Trace prerequisite chains without circular timelines and lock
              in zero-waste seat bundles for your opening-night watch party.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to={
                  doomsdayMovie
                    ? `/rewatch-plan?movieId=${doomsdayMovie._id}`
                    : '/rewatch-plan'
                }
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold tracking-wide text-slate-950 shadow-[0_0_28px_rgba(16,185,129,0.45)] transition hover:bg-emerald-400"
              >
                Launch Rewatch Plan
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/movies"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/35 bg-black/55 px-5 py-3 text-sm font-semibold text-emerald-200 backdrop-blur-sm transition hover:border-emerald-300 hover:bg-emerald-950/60"
              >
                Explore MCU Vault
              </Link>

              <Link
                to="/booking"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-black/45 px-5 py-3 text-sm font-semibold text-slate-200 backdrop-blur-sm transition hover:border-emerald-400/40 hover:text-white"
              >
                <Ticket className="h-4 w-4 text-emerald-400" />
                Book Watch Party
              </Link>
            </div>
          </motion.div>

          {/* Right Hero Doctor Doom Render */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.1 }}
            className="relative flex items-end justify-center lg:col-span-6 lg:self-end"
          >
            <div className="pointer-events-none absolute bottom-6 h-64 w-64 rounded-full bg-emerald-500/25 blur-3xl animate-pulse-glow lg:h-96 lg:w-96" />
            <img
              src={heroCharacter}
              alt="Doctor Doom — Avengers: Doomsday"
              className="relative z-10 h-[340px] w-auto max-w-none object-contain object-bottom drop-shadow-[0_0_42px_rgba(16,185,129,0.5)] animate-float-slow sm:h-[430px] lg:h-[570px] lg:translate-x-4 xl:h-[630px]"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-[#030604] to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Section 2: December 18 Countdown Timer */}
      <DoomsdayCountdown />

      {/* Inner Content Container */}
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6">
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Section 3: 4 Tactical Stat Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'MCU Archive',
              value: movies.length,
              sub: 'Tracked movies',
              icon: Film,
              accent: 'text-white',
            },
            {
              label: 'Completed',
              value: watchedCount,
              sub: `${movies.length - watchedCount} remaining`,
              icon: CheckCircle2,
              accent: 'text-emerald-400',
            },
            {
              label: 'Watch Time Left',
              value:
                remainingMinutes >= 60
                  ? `${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}m`
                  : `${remainingMinutes}m`,
              sub: `${remainingMinutes} total minutes`,
              icon: Clock,
              accent: 'text-lime-300',
            },
            {
              label: 'Cinemas Ready',
              value: cinemas.length,
              sub: 'Bundle tiers loaded',
              icon: Building2,
              accent: 'text-emerald-300',
            },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className="doom-card rounded-2xl p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-400/80">
                    {stat.label}
                  </span>
                  <Icon className="h-4 w-4 text-emerald-400/75" />
                </div>
                <p className={`mt-2 font-marvel text-4xl tracking-wider ${stat.accent}`}>
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-slate-400">{stat.sub}</p>
              </motion.div>
            );
          })}
        </section>

        {/* Section 4: Interactive Figures & Telemetry */}
        <section className="grid gap-6 lg:grid-cols-12">
          {/* Animated SVG Circular Readiness Gauge */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="doom-card flex flex-col justify-between rounded-2xl p-6 lg:col-span-5"
          >
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-400">
                Doomsday Readiness Gauge
              </span>
              <h2 className="mt-1 font-display text-xl font-bold text-white">
                {doomsdayPlan
                  ? `Before ${doomsdayPlan.targetMovie?.title}`
                  : 'Overall Archive Progress'}
              </h2>
            </div>

            <div className="my-6 flex flex-wrap items-center gap-6">
              <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="rgba(16, 185, 129, 0.14)"
                    strokeWidth="12"
                  />
                  <motion.circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    whileInView={{ strokeDashoffset }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="drop-shadow-[0_0_12px_rgba(16,185,129,0.65)]"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="block font-marvel text-4xl leading-none text-white">
                    {gaugePct}%
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-300">
                    Ready
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-slate-300">
                  <strong className="text-white">{gaugeWatched}</strong> of{' '}
                  <strong className="text-white">{gaugeTotal}</strong> prerequisite
                  movies watched
                </p>
                <p className="text-xs text-slate-400">
                  Remaining runtime:{' '}
                  <span className="font-mono text-emerald-300">
                    {formatRuntime(gaugeRemainingMin)}
                  </span>
                </p>
                <Link
                  to={
                    doomsdayMovie
                      ? `/rewatch-plan?movieId=${doomsdayMovie._id}`
                      : '/rewatch-plan'
                  }
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  Inspect Full Sequence <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Interactive MCU Era Breakdown Figure */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="doom-card rounded-2xl p-6 lg:col-span-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-400">
                  Interactive Saga Breakdown
                </span>
                <h2 className="mt-1 font-display text-xl font-bold text-white">
                  Progress by MCU Era
                </h2>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                Click an era bar to inspect titles
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {eraStats.map((era) => {
                const isSelected = activeEra?.id === era.id;
                return (
                  <button
                    key={era.id}
                    type="button"
                    onClick={() => setSelectedEraId(era.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? 'border-emerald-400/50 bg-emerald-950/40'
                        : 'border-emerald-500/15 bg-black/40 hover:border-emerald-500/35'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white">
                          {era.label}
                        </span>
                        <span className="ml-2 font-mono text-[11px] text-slate-400">
                          ({era.range})
                        </span>
                      </div>
                      <span className="font-mono text-emerald-300">
                        {era.watched}/{era.movies.length} watched ({era.pct}%)
                      </span>
                    </div>

                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-900">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${era.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-lime-400"
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {activeEra && (
              <div className="mt-4 rounded-xl border border-emerald-500/15 bg-black/45 p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-300">
                    {activeEra.label} Roster ({activeEra.movies.length})
                  </span>
                  <Link
                    to="/movies"
                    className="text-xs font-medium text-emerald-400 hover:underline"
                  >
                    Manage in Vault →
                  </Link>
                </div>
                {activeEra.movies.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No movies in this era yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {activeEra.movies.map((m) => (
                      <span
                        key={m._id}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                          m.watched
                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                            : 'border-slate-700 bg-slate-900/70 text-slate-300'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            m.watched ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        />
                        {m.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </section>

        {/* Section 5: Mission Quick-Launch Cards */}
        <section className="grid gap-5 md:grid-cols-3">
          {[
            {
              to: '/movies',
              step: '01',
              title: 'MCU Movie Vault',
              desc: 'Browse posters, autofill from TMDB, manage prerequisites, and guard against circular timelines.',
              icon: Film,
            },
            {
              to: '/rewatch-plan',
              step: '02',
              title: 'Topological Rewatch',
              desc: 'Generate a chronological watch sequence with an interactive DAG flow diagram and live runtime tally.',
              icon: GitBranch,
            },
            {
              to: '/booking',
              step: '03',
              title: 'Watch-Party Bundles',
              desc: 'Optimize opening-night cinema bundle combinations with zero wasted seats and auditorium pod diagrams.',
              icon: Ticket,
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.to}
                to={card.to}
                className="group doom-card relative overflow-hidden rounded-2xl p-6 transition hover:-translate-y-1 hover:border-emerald-400/50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-marvel text-2xl text-emerald-400/80">
                    PROTOCOL {card.step}
                  </span>
                  <Icon className="h-5 w-5 text-emerald-400 transition group-hover:scale-110" />
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-white">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {card.desc}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  Enter Sector{' '}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </section>
      </div>
    </div>
  );
}
