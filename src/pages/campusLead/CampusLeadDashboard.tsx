import { MessageSquarePlus, Search } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  AnimatedCounter,
  Reveal,
  StaggerContainer,
  StaggerItem,
} from '../../components/common/MotionPrimitives.tsx';
import { LoadingSkeleton, StatusText } from '../../components/common/StateViews.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { DashboardLayout } from '../../layouts/DashboardLayout.tsx';
import { api, getApiErrorMessage } from '../../services/api.ts';

export function CampusLeadDashboard() {
  const toast = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [university, setUniversity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/campus-lead/dashboard');
      setData(res.data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/campus-lead/feedback', { message: feedbackMsg, university });
      setFeedbackMsg('');
      toast.success('Campus student feedback logged and forwarded to academics team.');
      await loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSubmissions = useMemo(() => {
    return (data?.submissions || []).filter((s: any) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.title?.toLowerCase().includes(q) ||
          s.contributorName?.toLowerCase().includes(q) ||
          s.subjectCode?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, search, statusFilter]);

  const pipelineChartData = useMemo(() => {
    const subs = data?.submissions || [];
    const statuses = ['submitted', 'under_review', 'needs_correction', 'approved', 'rejected'];
    return statuses.map((st) => ({
      status: st.replace(/_/g, ' '),
      count: subs.filter((s: any) => s.status === st).length,
    }));
  }, [data]);

  return (
    <DashboardLayout title="Campus Lead Console">
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="space-y-6">
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-xs text-slate-500">Contributors</p>
              <p className="font-mono tabular-nums text-2xl font-bold mt-1">
                <AnimatedCounter value={data?.stats?.activeContributors || 0} />
              </p>
            </StaggerItem>
            <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-xs text-slate-500">Submissions</p>
              <p className="font-mono tabular-nums text-2xl font-bold mt-1">
                <AnimatedCounter value={data?.stats?.totalSubmissions || 0} />
              </p>
            </StaggerItem>
            <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-xs text-slate-500">Approved</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                <AnimatedCounter value={data?.stats?.approvedSubmissions || 0} />
              </p>
            </StaggerItem>
            <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-xs text-slate-500">Pending Review</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                <AnimatedCounter value={data?.stats?.pendingSubmissions || 0} />
              </p>
            </StaggerItem>
            <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-xs text-slate-500">Resource Gaps</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-rose-700 dark:text-rose-400 mt-1">
                <AnimatedCounter value={data?.stats?.missingSubjectsCount || 0} />
              </p>
            </StaggerItem>
          </StaggerContainer>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Pipeline Chart */}
            <Reveal className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  Campus Submission Pipeline
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Live submission distribution by review status</p>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0891b2" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Reveal>

            {/* Assigned Contributors */}
            <Reveal delay={0.05} className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Campus Contributors
              </h2>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs max-h-60 overflow-y-auto">
                {(data?.contributors || []).length === 0 ? (
                  <p className="text-slate-500 py-6">No contributor profiles mapped yet.</p>
                ) : (
                  (data?.contributors || []).map((c: any) => (
                    <div key={c._id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                        <p className="text-slate-500">{c.collegeName} · {c.universityCode}</p>
                      </div>
                      <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {c.approvedSubmissions}/{c.totalSubmissions} approved
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Reveal>
          </div>

          {/* Missing Academic Resources */}
          <Reveal>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Missing Resource Coverage Gaps
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {(data?.missingResources || []).map((m: any) => (
                  <div
                    key={m.subjectId}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {m.code} — {m.name}
                      </p>
                      <p className="text-slate-500 mt-0.5">Approved PYQs archived: {m.approvedPyqsCount}</p>
                    </div>
                    <StatusText
                      status={m.approvedPyqsCount === 0 ? 'rejected' : 'needs_correction'}
                      label={m.gapSeverity}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Campus Submissions Monitor */}
          <Reveal>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  Monitored Campus Submissions
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filter submissions..."
                      className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  >
                    <option value="all">All Statuses</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="needs_correction">Needs Correction</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                    <th className="py-3 px-4 font-medium">Resource</th>
                    <th className="py-3 px-4 font-medium">Contributor</th>
                    <th className="py-3 px-4 font-medium">Subject</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSubmissions.map((s: any) => (
                    <tr key={s._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{s.title}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{s.contributorName}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{s.subjectCode} · {s.examYear}</td>
                      <td className="py-3 px-4"><StatusText status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          {/* Student Feedback Collection & History */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Reveal className="lg:col-span-6">
              <form onSubmit={submitFeedback} className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    Collect Campus Student Feedback
                  </h2>
                </div>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Campus / College Name"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
                <textarea
                  rows={3}
                  required
                  value={feedbackMsg}
                  onChange={(e) => setFeedbackMsg(e.target.value)}
                  placeholder="Log requested subjects, missing papers, or student feedback..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submitting ? 'Logging...' : 'Log Student Feedback'}
                </button>
              </form>
            </Reveal>

            <Reveal delay={0.05} className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Logged Campus Feedback History
              </h2>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs max-h-64 overflow-y-auto">
                {(data?.feedback || []).length === 0 ? (
                  <p className="text-slate-500 py-6">No campus feedback logged yet.</p>
                ) : (
                  (data?.feedback || []).map((f: any) => (
                    <div key={f._id} className="py-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{f.university || 'Campus Chapter'}</span>
                        <StatusText status={f.status || 'new'} />
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{f.message}</p>
                      <p className="text-[11px] font-mono text-slate-400">
                        {f.name} · {new Date(f.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Reveal>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
