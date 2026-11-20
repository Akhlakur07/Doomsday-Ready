import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import Lenis from 'lenis';
import { motion } from 'framer-motion';
import { Menu, Shield, X } from 'lucide-react';
import { Toaster } from 'sonner';

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/movies', label: 'Movies' },
  { to: '/rewatch-plan', label: 'Rewatch Plan' },
  { to: '/booking', label: 'Booking' },
];

export default function Layout() {
  const location = useLocation();
  const lenisRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHomePage = location.pathname === '/';

  // Initialize Lenis smooth scrolling across the application
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    let rafId = 0;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Scroll to top immediately when navigating between pages
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen flex-col bg-[#040706] text-slate-100">
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        toastOptions={{
          style: {
            background: '#08120d',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#ecfdf5',
          },
        }}
      />

      {/* Sticky Obsidian-Emerald Navbar */}
      <header className="sticky top-0 z-40 border-b border-emerald-500/20 bg-[#040907]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="group flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/40 bg-emerald-950/80 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.28)] transition group-hover:border-emerald-300 group-hover:shadow-[0_0_24px_rgba(16,185,129,0.45)]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="block font-display text-base font-extrabold tracking-[0.14em] text-white sm:text-lg">
                DOOMSDAY <span className="text-emerald-400">READY</span>
              </span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.26em] text-emerald-400/75">
                MCU Tactical Protocol
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1.5 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="relative px-3.5 py-2 text-sm font-medium transition"
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className="absolute inset-0 rounded-lg border border-emerald-400/40 bg-emerald-500/15 shadow-[0_0_16px_rgba(16,185,129,0.18)]"
                      />
                    )}
                    <span
                      className={`relative z-10 ${
                        isActive
                          ? 'text-emerald-300'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Mobile Drawer Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="rounded-lg border border-emerald-500/25 bg-emerald-950/40 p-2 text-emerald-300 md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <nav className="border-t border-emerald-500/15 bg-[#050b08] px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1.5">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'border border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main
        className={
          isHomePage
            ? 'flex-1'
            : 'mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6'
        }
      >
        <Outlet />
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-emerald-500/15 bg-[#030605] py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:px-6">
          <p className="font-display tracking-wider text-slate-400">
            DOOMSDAY <span className="text-emerald-400">READY</span>
          </p>
          <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-500/70">
            Avengers: Doomsday · December 18 · Rewatch &amp; Watch-Party Planner
          </p>
        </div>
      </footer>
    </div>
  );
}
