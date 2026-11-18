import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getDefaultRouteForRole, useAuth } from '../../context/AuthContext.tsx';
import { PublicLayout } from '../../layouts/PublicLayout.tsx';
import { getApiErrorMessage } from '../../services/api.ts';

export function RegisterPage() {
  const { user, loading: authLoading, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialRole = searchParams.get('role') === 'contributor' ? 'contributor' : 'student';
  const requestedPlan = searchParams.get('plan') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [role, setRole] = useState<'student' | 'contributor'>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const paramRole = searchParams.get('role');
    if (paramRole === 'contributor' || paramRole === 'student') {
      setRole(paramRole);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && user) {
      if (requestedPlan) {
        navigate(`/student/packages?plan=${encodeURIComponent(requestedPlan)}`, { replace: true });
      } else {
        navigate(getDefaultRouteForRole(user), { replace: true });
      }
    }
  }, [authLoading, user, requestedPlan, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const createdUser = await register({ name, email, password, role, collegeName });
      if (requestedPlan && createdUser.role === 'student') {
        navigate(`/onboarding?next=${encodeURIComponent(`/student/packages?plan=${requestedPlan}`)}`, { replace: true });
      } else {
        navigate(getDefaultRouteForRole(createdUser), { replace: true });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed.'));
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
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Create your UNIHUB account</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {requestedPlan
                ? 'Create your student profile to continue selecting your semester package.'
                : 'Select your academic profile right after creating your account.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            {(['student', 'contributor'] as const).map((r) => {
              const active = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`relative py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    active ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="register-role-pill"
                      transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                      className="absolute inset-0 rounded-md bg-white dark:bg-slate-900 shadow-sm"
                    />
                  )}
                  <span className="relative z-10">
                    {r === 'student' ? 'Student Account' : 'Campus Contributor'}
                  </span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Aarav Sharma"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.ac.in"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">College / Institute Name</label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="Optional during signup"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password (min 8 chars with letters & numbers)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-cyan-700 dark:text-cyan-400 hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </section>
    </PublicLayout>
  );
}
