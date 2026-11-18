import { Clock, Lock, PlayCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { InteractiveCard, Reveal, StaggerContainer, StaggerItem } from '../../components/common/MotionPrimitives.tsx';
import { EmptyState, LoadingSkeleton, StatusText } from '../../components/common/StateViews.tsx';
import { DashboardLayout } from '../../layouts/DashboardLayout.tsx';
import { api } from '../../services/api.ts';

export function MockTestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/mock-tests'), api.get('/mock-tests/attempts/my')])
      .then(([tRes, aRes]) => {
        setTests(tRes.data.tests || []);
        setAttempts(aRes.data.attempts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Mock Tests & Attempt History">
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <div className="space-y-8">
          <div className="space-y-4">
            <Reveal className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                Available Semester & Subject Assessments
              </h2>
              <Link to="/student/packages" className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline">
                Unlock Test Pass
              </Link>
            </Reveal>

            {tests.length === 0 ? (
              <EmptyState
                title="No mock tests published for this semester yet"
                description="Administrators publish subject-wise and full-semester timed mocks mapped to your curriculum scheme."
              />
            ) : (
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {tests.map((test) => (
                  <StaggerItem key={test._id}>
                    <InteractiveCard className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4 hover:border-cyan-600/40 transition-colors">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-cyan-700 dark:text-cyan-400">
                          {test.testScope === 'full_semester'
                            ? 'Full Semester Mock'
                            : test.testScope === 'sample'
                              ? 'Free Sample Diagnostic'
                              : test.subjectName}
                        </p>
                        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                          {test.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{test.description}</p>
                        <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {test.durationMinutes} min
                          </span>
                          <span>·</span>
                          <span>{test.questionCount} Questions</span>
                          <span>·</span>
                          <span>{test.totalMarks} Marks</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {test.attemptCount > 0 ? `Best: ${test.bestPercentage}%` : 'Not attempted'}
                        </span>

                        {test.canAttempt ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/student/tests/run/${test._id}`)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 transition-colors cursor-pointer"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            Start Test
                          </button>
                        ) : (
                          <Link
                            to="/student/packages"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            Test Pass Required
                          </Link>
                        )}
                      </div>
                    </InteractiveCard>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </div>

          {/* Attempt History Table */}
          <Reveal className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Your Attempt History</h2>
            {attempts.length === 0 ? (
              <EmptyState
                title="No test attempts recorded"
                description="Your completed mock test scores, topic breakdowns, and rubric evaluations will appear here."
              />
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4 font-medium">Assessment</th>
                      <th className="py-3 px-4 font-medium">Submitted</th>
                      <th className="py-3 px-4 font-medium text-right">Objective Score</th>
                      <th className="py-3 px-4 font-medium text-right">Percentage</th>
                      <th className="py-3 px-4 font-medium">Descriptive Review</th>
                      <th className="py-3 px-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {attempts.map((a) => (
                      <tr key={a._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{a.testTitle}</td>
                        <td className="py-3 px-4 text-xs font-mono tabular-nums text-slate-500">
                          {new Date(a.submittedAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          {a.objectiveScore}/{a.objectiveMaxScore}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-cyan-700 dark:text-cyan-400">
                          {a.percentage}%
                        </td>
                        <td className="py-3 px-4">
                          {a.descriptiveEvaluationStatus === 'not_applicable' ? (
                            <span className="text-xs text-slate-500">Objective Only</span>
                          ) : a.descriptiveEvaluationStatus === 'pending_manual_review' ? (
                            <StatusText status="under_review" label="Pending Manual Rubric" />
                          ) : (
                            <StatusText status="approved" label="Rubric Graded" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/student/tests/attempt/${a._id}`}
                            className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline"
                          >
                            View Breakdown
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Reveal>
        </div>
      )}
    </DashboardLayout>
  );
}
