import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getDefaultRouteForRole, useAuth } from '../../context/AuthContext.tsx';
import { PublicLayout } from '../../layouts/PublicLayout.tsx';
import { getApiErrorMessage } from '../../services/api.ts';

const DEMO_ACCOUNTS = [
  { label: 'Student (AKTU)', email: 'aarav.sharma@aktu.ac.in' },
  { label: 'Contributor', email: 'priya.verma@aktu.ac.in' },
  { label: 'Campus Lead', email: 'rohan.mehta@ipu.ac.in' },
  { label: 'Reviewer', email: 'dr.kavita.nair@unihub.edu' },
  { label: 'Administrator', email: 'admin@unihub.edu' },
];

export function LoginPage() {
  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      navigate(fromPath || getDefaultRouteForRole(user), { replace: true });
    }
  }, [authLoading, user, fromPath, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const signedInUser = await login(email, password);
      const target =
        fromPath && (signedInUser.role === 'student' || signedInUser.role === 'admin' || !fromPath.startsWith('/student/dashboard'))
          ? fromPath
          : getDefaultRouteForRole(signedInUser);
      navigate(target, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <section className="max-w-md mx-auto px-4 sm:px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-sm"
        >
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Sign in to UNIHUB</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Access your university dashboard, PYQ archive, and mock tests.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.ac.in"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-cyan-700 dark:text-cyan-400 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Quick-Fill Role Accounts (Password: <span className="font-mono">Unihub@2026</span>)
            </p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('Unihub@2026');
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            New to UNIHUB?{' '}
            <Link to="/register" className="font-semibold text-cyan-700 dark:text-cyan-400 hover:underline">
              Create an account
            </Link>
          </p>
        </motion.div>
      </section>
    </PublicLayout>
  );
}
