import { ArrowRight, BookOpen, ClipboardCheck, FileText, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
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
import { InteractiveCard, Reveal, StaggerContainer, StaggerItem } from '../../components/common/MotionPrimitives.tsx';
import { EmptyState, LoadingSkeleton } from '../../components/common/StateViews.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { DashboardLayout } from '../../layouts/DashboardLayout.tsx';
import { api } from '../../services/api.ts';

export function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/analytics/student-dashboard')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ap = user?.academicProfile;

  return (
    <DashboardLayout title="Student Dashboard">
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : !data ? (
        <EmptyState
          title="Unable to load dashboard analytics"
          description="Please check your academic profile settings and try refreshing."
        />
      ) : (
        <div className="space-y-6">
          {/* Welcome & Academic Profile Header */}
          <Reveal>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Welcome back, {user?.name}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {ap?.universityCode || 'University'} · {ap?.programmeName || 'Programme'} · {ap?.branchName || 'Branch'} ·{' '}
                  {ap?.semesterName || 'Semester'} · {ap?.curriculumSchemeName || 'Curriculum'}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 min-w-[260px]">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Semester Package</span>
                  <Link to="/student/packages" className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline">
                    {data.activePackage ? 'Upgrade / Manage' : 'View Passes'}
                  </Link>
                </div>
                {data.activePackage ? (
                  <div className="mt-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{data.activePackage.packageName}</p>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      Expires {new Date(data.activePackage.expiresAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                ) : (
                  <div className="mt-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Free Access Tier</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sample papers & diagnostic test active</p>
                  </div>
                )}
              </div>
            </div>
          </Reveal>

          {/* 4-Column Summary Strip */}
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StaggerItem>
              <InteractiveCard className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <p className="text-xs text-slate-500 dark:text-slate-400">Available PYQs</p>
                <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {data.summary.availablePyqs}
                </p>
                <Link to="/student/pyqs" className="text-xs text-cyan-700 dark:text-cyan-400 hover:underline mt-2 inline-block">
                  Browse Archive
                </Link>
              </InteractiveCard>
            </StaggerItem>

            <StaggerItem>
              <InteractiveCard className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <p className="text-xs text-slate-500 dark:text-slate-400">Available Mock Tests</p>
                <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {data.summary.availableMockTests}
                </p>
                <Link to="/student/tests" className="text-xs text-cyan-700 dark:text-cyan-400 hover:underline mt-2 inline-block">
                  Start Practice
                </Link>
              </InteractiveCard>
            </StaggerItem>

            <StaggerItem>
              <InteractiveCard className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <p className="text-xs text-slate-500 dark:text-slate-400">Average Test Score</p>
                <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {data.summary.averageScore}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Across {data.summary.totalAttempts} attempt{data.summary.totalAttempts === 1 ? '' : 's'}
                </p>
              </InteractiveCard>
            </StaggerItem>

            <StaggerItem>
              <InteractiveCard className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <p className="text-xs text-slate-500 dark:text-slate-400">Study Progress</p>
                <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {data.summary.studyProgressPercent}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {data.summary.completedTestsCount}/{data.summary.availableMockTests} tests completed
                </p>
              </InteractiveCard>
            </StaggerItem>
          </StaggerContainer>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Reveal className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Performance Over Time (%)</h3>
              {data.performanceOverTime.length === 0 ? (
                <p className="text-xs text-slate-500 py-16 text-center">Complete a mock test to visualize score trends.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.performanceOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="score" stroke="#0284c7" fill="#0284c7" fillOpacity={0.15} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Reveal>

            <Reveal delay={0.05} className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Test Completion Rate</h3>
              <div className="h-64 flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: data.summary.completedTestsCount },
                        {
                          name: 'Remaining',
                          value: Math.max(0, data.summary.availableMockTests - data.summary.completedTestsCount),
                        },
                      ]}
                      dataKey="value"
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={3}
                    >
                      <Cell fill="#0284c7" />
                      <Cell fill="#cbd5e1" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <p className="font-mono tabular-nums text-sm font-semibold text-slate-900 dark:text-white">
                  {data.summary.completionRate}% Completed ({data.summary.completedTestsCount} of {data.summary.availableMockTests})
                </p>
              </div>
            </Reveal>

            <Reveal className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Subject-Wise Average Scores</h3>
              {data.subjectScores.length === 0 ? (
                <p className="text-xs text-slate-500 py-16 text-center">No subject scores recorded yet.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.subjectScores}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                      <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#0f172a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Reveal>

            <Reveal delay={0.05} className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Topic Strengths & Weaknesses (%)</h3>
              {data.topicPerformance.length === 0 ? (
                <p className="text-xs text-slate-500 py-16 text-center">Attempt tests to unlock topic-wise diagnostics.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topicPerformance} layout="vertical" margin={{ left: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="topic" width={140} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
                        {data.topicPerformance.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.accuracy >= 65 ? '#059669' : '#d97706'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Reveal>
          </div>

          {/* Weak Topics, Recommended Practice, Recent Attempts & Resources */}
          <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Weak Topics & Recommended Practice</h3>
              </div>
              {data.weakTopics.length > 0 && (
                <div className="space-y-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  {data.weakTopics.map((w: any) => (
                    <div key={w.topic} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 dark:text-slate-300 truncate">{w.topic}</span>
                      <span className="font-mono tabular-nums font-semibold text-amber-700 dark:text-amber-400">
                        {w.accuracy}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-3">
                {data.recommendedPractice.map((rec: any) => (
                  <div key={rec.topic} className="text-xs space-y-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                      {rec.topic}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">{rec.reason}</p>
                    <Link
                      to={`/student/questions?q=${encodeURIComponent(rec.topic)}`}
                      className="inline-flex items-center gap-1 text-cyan-700 dark:text-cyan-400 font-medium hover:underline"
                    >
                      Practice now <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </StaggerItem>

            <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Test Attempts</h3>
              </div>
              {data.recentAttempts.length === 0 ? (
                <p className="text-xs text-slate-500">No attempts yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.recentAttempts.map((a: any) => (
                    <Link
                      key={a._id}
                      to={`/student/tests/attempt/${a._id}`}
                      className="block py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded px-1.5 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{a.testTitle}</p>
                        <span className="font-mono tabular-nums text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                          {a.percentage}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {new Date(a.submittedAt).toLocaleDateString('en-IN')} · Obj {a.objectiveScore}/{a.objectiveMaxScore}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </StaggerItem>

            <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recently Uploaded Resources</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.recentResources.map((r: any) => (
                  <Link
                    key={r._id}
                    to={`/student/pyqs?q=${encodeURIComponent(r.paperCode || r.title)}`}
                    className="block py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded px-1.5 transition-colors"
                  >
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{r.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {r.subjectName} · {r.paperCode} · {r.examYear}
                    </p>
                  </Link>
                ))}
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      )}
    </DashboardLayout>
  );
}
