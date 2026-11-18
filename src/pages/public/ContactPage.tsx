import { Send } from 'lucide-react';
import React, { useState } from 'react';
import { Reveal } from '../../components/common/MotionPrimitives.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { PublicLayout } from '../../layouts/PublicLayout.tsx';
import { api, getApiErrorMessage } from '../../services/api.ts';

export function ContactPage() {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', university: '', category: 'general', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.post('/contact', form);
      setSuccess(res.data.message);
      toast.success('Inquiry sent! Our academic support team will respond shortly.');
      setForm({ name: '', email: '', university: '', category: 'general', message: '' });
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
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-8">
        <Reveal className="space-y-2">
          <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">Support & Academic Inquiries</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Contact UNIHUB</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Reach out for university onboarding requests, curriculum corrections, contributor support, or payment assistance.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">University / College</label>
                <input
                  type="text"
                  value={form.university}
                  onChange={(e) => setForm({ ...form, university: e.target.value })}
                  placeholder="e.g., AKTU, GGSIPU, IIMT"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                >
                  <option value="general">General Inquiry</option>
                  <option value="university_request">Add University / Programme</option>
                  <option value="payment_support">Payment & Refund Support</option>
                  <option value="content_takedown">Rights / Content Review</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
              <textarea
                rows={4}
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-600"
              />
            </div>

            {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
            {success && <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Submitting...' : 'Send Message'}
            </button>
          </form>
        </Reveal>
      </section>
    </PublicLayout>
  );
}
