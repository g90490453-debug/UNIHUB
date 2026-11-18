import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Reveal } from '../../components/common/MotionPrimitives.tsx';
import { EmptyState, LoadingSkeleton } from '../../components/common/StateViews.tsx';
import { DashboardLayout } from '../../layouts/DashboardLayout.tsx';
import { api } from '../../services/api.ts';

export function TrendAnalysisPage() {
  const [data, setData] = useState<any>(null);
  const [subjectId, setSubjectId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/analytics/pyq-trends', { params: { subjectId: subjectId || undefined } })
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subjectId]);

  const COLORS = ['#0f172a', '#0284c7', '#059669', '#d97706'];

  return (
    <DashboardLayout title="Historical PYQ Trend Analysis">
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : !data ? (
        <EmptyState
          title="Unable to compute historical trends"
          description="Ensure your university and semester profile is selected in Account Settings."
        />
      ) : (
        <div className="space-y-6">
          <Reveal>
            <div className="rounded-xl border border-cyan-200 dark:border-cyan-900 bg-cyan-50/70 dark:bg-cyan-950/30 px-5 py-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{data.disclaimer}</p>
            </div>
          </Reveal>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Filter by Subject:</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="">All Semester Subjects</option>
                {(data.subjects || []).map((s: any) => (
                  <option key={s._id} value={s._id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs font-mono tabular-nums text-slate-500">
              Indexed Syllabus Topics: {data.syllabusCoverageCount}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Reveal className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                Historical Topic Recurrence (Archived Papers & Questions)
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topicRecurrence} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="topic" width={160} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="historicalOccurrences" name="Historical Occurrences" fill="#0284c7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Reveal>

            <Reveal delay={0.05} className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Question Format Distribution</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.questionDistribution}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      label
                    >
                      {(data.questionDistribution || []).map((_: any, idx: number) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Reveal>

            <Reveal className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                Examination Year Comparison
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.yearlyComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="papers" name="Archived Papers" fill="#0f172a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="questions" name="Indexed Questions" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Reveal>

            <Reveal delay={0.05} className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                Syllabus Coverage & Year Breakdown
              </h3>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <th className="py-2 pr-3 font-medium">Topic</th>
                      <th className="py-2 px-3 font-medium">Unit</th>
                      <th className="py-2 px-3 font-medium text-right">Weightage</th>
                      <th className="py-2 pl-3 font-medium text-right">Years Appeared</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(data.topicRecurrence || []).map((t: any) => (
                      <tr key={t.topic}>
                        <td className="py-2 pr-3 font-medium text-slate-900 dark:text-slate-100">{t.topic}</td>
                        <td className="py-2 px-3 text-slate-500">{t.unit}</td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums">{t.syllabusWeightagePercent}%</td>
                        <td className="py-2 pl-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                          {t.yearsAppeared.length > 0 ? t.yearsAppeared.join(', ') : 'Syllabus'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
