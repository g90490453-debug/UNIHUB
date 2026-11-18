import { History } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Reveal, StaggerContainer, StaggerItem } from '../../components/common/MotionPrimitives.tsx';
import { EmptyState, LoadingSkeleton, StatusText } from '../../components/common/StateViews.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { DashboardLayout } from '../../layouts/DashboardLayout.tsx';
import { api } from '../../services/api.ts';

export function VerifiedSolutionsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [solutions, setSolutions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectId, setSubjectId] = useState(searchParams.get('subjectId') || '');
  const [pyqPaperId, setPyqPaperId] = useState(searchParams.get('pyqPaperId') || '');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [historyModal, setHistoryModal] = useState<any>(null);

  useEffect(() => {
    const paramSub = searchParams.get('subjectId');
    const paramPyq = searchParams.get('pyqPaperId');
    if (paramSub !== null) setSubjectId(paramSub);
    if (paramPyq !== null) setPyqPaperId(paramPyq);
  }, [searchParams]);

  const ap = user?.academicProfile;

  const fetchSolutions = useCallback(async () => {
    setLoading(true);
    try {
      const [solRes, casRes] = await Promise.all([
        api.get('/solutions', {
          params: {
            subjectId: subjectId || undefined,
            pyqPaperId: pyqPaperId || undefined,
            verificationStatus: verificationStatus || undefined,
          },
        }),
        api.get('/academic/cascade', {
          params: {
            universityId: ap?.universityId || undefined,
            programmeId: ap?.programmeId || undefined,
            branchId: ap?.branchId || undefined,
            semesterId: ap?.semesterId || undefined,
            curriculumSchemeId: ap?.curriculumSchemeId || undefined,
          },
        }),
      ]);
      setSolutions(solRes.data.solutions || []);
      setSubjects(casRes.data.subjects || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [subjectId, pyqPaperId, verificationStatus, ap]);

  useEffect(() => {
    fetchSolutions();
  }, [fetchSolutions]);

  return (
    <DashboardLayout title="Verified Solutions">
      <div className="space-y-6">
        <Reveal>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setPyqPaperId('');
                }}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="">All Verification States</option>
                <option value="verified">Verified Only</option>
                <option value="under_review">Under Review</option>
                <option value="not_verified">Not Verified</option>
              </select>
              {(subjectId || pyqPaperId || verificationStatus) && (
                <button
                  type="button"
                  onClick={() => {
                    setSubjectId('');
                    setPyqPaperId('');
                    setVerificationStatus('');
                  }}
                  className="text-xs font-medium text-cyan-700 dark:text-cyan-400 hover:underline cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Only solutions approved by academic reviewers are marked Verified.
            </p>
          </div>
        </Reveal>

        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : solutions.length === 0 ? (
          <EmptyState
            title="No solutions match this filter"
            description="Try selecting a different subject or verification status filter."
          />
        ) : (
          <StaggerContainer className="space-y-5">
            {solutions.map((sol) => (
              <StaggerItem
                key={sol._id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono text-cyan-700 dark:text-cyan-400">
                      {sol.questionReference} · {sol.subjectCode} · {sol.topicName}
                    </p>
                    <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white mt-1">
                      {sol.title}
                    </h3>
                  </div>
                  <StatusText status={sol.verificationStatus} />
                </div>

                <div className="space-y-3 pt-2">
                  {(sol.steps || []).map((st: any) => (
                    <div key={st.stepNumber} className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Step {st.stepNumber}: {st.heading}
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{st.content}</p>
                    </div>
                  ))}
                </div>

                {sol.finalAnswerSummary && (
                  <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-3 text-xs text-slate-800 dark:text-slate-200">
                    <span className="font-semibold">Final Summary: </span>
                    {sol.finalAnswerSummary}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Reviewer: {sol.reviewerName || 'Pending Assignment'} · Version {sol.currentVersion} · Updated{' '}
                    {new Date(sol.updatedAt).toLocaleDateString('en-IN')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHistoryModal(sol)}
                    className="inline-flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400 font-semibold hover:underline cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    Version History ({(sol.versionHistory || []).length})
                  </button>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      <AnimatePresence>
        {historyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHistoryModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  Solution Version History
                </h3>
                <button
                  type="button"
                  onClick={() => setHistoryModal(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Close
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(historyModal.versionHistory || []).map((v: any) => (
                  <div key={v.version} className="py-3 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold">Version {v.version}</span>
                      <StatusText status={v.verificationStatus} />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{v.changeNote}</p>
                    <p className="text-slate-500">
                      By {v.updatedBy} · {new Date(v.updatedAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
