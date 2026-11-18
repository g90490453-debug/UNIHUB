import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { PageTransition, ScrollProgressBar } from '../components/common/MotionPrimitives.tsx';
import { ThemeToggle } from '../components/common/ThemeToggle.tsx';
import { getDefaultRouteForRole, useAuth } from '../context/AuthContext.tsx';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/universities', label: 'Universities' },
    { to: '/features', label: 'Features' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/how-it-works', label: 'How It Works' },
    { to: '/about', label: 'About' },
  ];

  const primaryHref = user ? getDefaultRouteForRole(user) : '/login';
  const primaryLabel = user ? 'Dashboard' : 'Sign In';

  const contributorHref = user
    ? user.role === 'contributor' || user.role === 'campus_lead' || user.role === 'admin'
      ? '/contributor'
      : '/settings'
    : '/register?role=contributor';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <ScrollProgressBar />

      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <Link
            to="/"
            className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            UNIHUB
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`relative py-1 whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 dark:hover:text-white ${
                    isActive ? 'text-slate-900 dark:text-white' : ''
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="public-nav-underline"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute left-0 right-0 -bottom-1 h-0.5 bg-cyan-600 dark:bg-cyan-400 rounded-full"
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={primaryHref}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 transition-colors whitespace-nowrap shrink-0"
            >
              {primaryLabel}
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden overflow-hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
            >
              <div className="px-4 py-4 space-y-2">
                {navLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.to
                        ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/contact"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/contact'
                      ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Contact Support
                </Link>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <ThemeToggle />
                  <Link
                    to={primaryHref}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white whitespace-nowrap"
                  >
                    {primaryLabel}
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 overflow-x-clip">
        <PageTransition key={location.pathname}>{children}</PageTransition>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 space-y-3">
              <Link to="/" className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                UNIHUB
              </Link>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
                Your University. Your Semester. Your Preparation. Curriculum-scoped previous year papers, timed mock tests, and verified academic solutions.
              </p>
              <div className="pt-2">
                <ThemeToggle />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link to="/universities" className="hover:text-slate-900 dark:hover:text-white transition-colors">Supported Universities</Link></li>
                <li><Link to="/features" className="hover:text-slate-900 dark:hover:text-white transition-colors">PYQs & Mock Engine</Link></li>
                <li><Link to="/pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">Semester Packages</Link></li>
                <li><Link to="/how-it-works" className="hover:text-slate-900 dark:hover:text-white transition-colors">How It Works</Link></li>
                <li><Link to="/about" className="hover:text-slate-900 dark:hover:text-white transition-colors">About UNIHUB</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-3">Academic Trust & Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link to={contributorHref} className="hover:text-slate-900 dark:hover:text-white transition-colors">Campus Contributor Programme</Link></li>
                <li><Link to="/contact" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact Support</Link></li>
                <li><Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <p>© {new Date().getFullYear()} UNIHUB Academic Preparation Platform. All rights reserved.</p>
            <p>One student profile · Correct university curriculum · Transparent semester pricing</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
