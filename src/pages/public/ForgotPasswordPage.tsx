import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from '../../components/common/MotionPrimitives.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { PublicLayout } from '../../layouts/PublicLayout.tsx';
import { api, getApiErrorMessage } from '../../services/api.ts';

export function ForgotPasswordPage() {
  const toast = useToast();
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [previewCode, setPreviewCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      if (res.data.previewResetCode) {
        setPreviewCode(res.data.previewResetCode);
      }
      toast.info('Reset verification step ready.');
      setStep('reset');
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { email, resetCode, newPassword });
      setMessage(res.data.message);
      toast.success('Password reset complete! You may now sign in.');
      setStep('done');
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <section className="max-w-md mx-auto px-4 sm:px-6 py-16">
        <Reveal>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-5 shadow-xs overflow-hidden">
            <div>
              <p className="text-xs font-mono text-cyan-700 dark:text-cyan-400">
                STEP {step === 'request' ? '01 / 03' : step === 'reset' ? '02 / 03' : '03 / 03'}
              </p>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">Reset Password</h1>
            </div>

            <AnimatePresence mode="wait">
              {step === 'request' && (
                <motion.form
                  key="request"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleRequest}
                  className="space-y-4"
                >
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Enter your registered email address to receive a password reset verification code.
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    />
                  </div>
                  {error && <p className="text-xs text-rose-600">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 text-sm font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 transition-colors cursor-pointer"
                  >
                    {loading ? 'Sending Code...' : 'Send Reset Code'}
                  </button>
                </motion.form>
              )}

              {step === 'reset' && (
                <motion.form
                  key="reset"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleReset}
                  className="space-y-4"
                >
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">{message}</p>
                  {previewCode && (
                    <div className="rounded-lg border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950/30 px-3 py-2 text-xs">
                      Verification code (dev preview): <span className="font-mono font-bold">{previewCode}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Reset Code</label>
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    />
                  </div>
                  {error && <p className="text-xs text-rose-600">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 text-sm font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 transition-colors cursor-pointer"
                  >
                    {loading ? 'Updating...' : 'Confirm Password Reset'}
                  </button>
                </motion.form>
              )}

              {step === 'done' && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p>
                  <Link
                    to="/login"
                    className="block text-center py-2.5 text-sm font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 transition-colors"
                  >
                    Return to Sign In
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </section>
    </PublicLayout>
  );
}
