import { ChevronDown, Eye, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AnimatedCounter,
  StaggerContainer,
  StaggerItem,
} from '../../components/common/MotionPrimitives.tsx';
import { PdfViewerModal } from '../../components/common/PdfViewerModal.tsx';
import { LoadingSkeleton, StatusText } from '../../components/common/StateViews.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { DashboardLayout } from '../../layouts/DashboardLayout.tsx';
import { api, getApiErrorMessage } from '../../services/api.ts';

export function ReviewerDashboard() {
  const toast = useToast();
  const [queue, setQueue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'submissions' | 'solutions' | 'rubric'>('submissions');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [previewSubmission, setPreviewSubmission] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedSol, setExpandedSol] = useState<Record<string, boolean>>({});

  // Checklist & comment state per submission
  const [checklists, setChecklists] = useState<Record<string, any>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [rubricScores, setRubricScores] = useState<Record<string, Record<string, { marks: number; comment: string }>>>({});

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviewer/queue');
      setQueue(res.data);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const toggleCheck = (id: string, key: string) => {
    setChecklists((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [key]: !prev[id]?.[key] },
    }));
  };

  const decideSubmission = async (id: string, decision: string) => {
    setMsg('');
    setErr('');
    try {
      const res = await api.post(`/reviewer/submissions/${id}/decide`, {
        decision,
        comments: comments[id] || '',
        checklist: checklists[id] || {},
      });
      setMsg(res.data.message);
      toast.success(res.data.message);
      await loadQueue();
    } catch (e) {
      const m = getApiErrorMessage(e);
      setErr(m);
      toast.error(m);
    }
  };

  const decideSolution = async (id: string, decision: string) => {
    setMsg('');
    setErr('');
    try {
      const res = await api.post(`/reviewer/solutions/${id}/decide`, {
        decision,
        comments: comments[id] || '',
      });
      setMsg(res.data.message);
      toast.success(res.data.message);
      await loadQueue();
    } catch (e) {
      const m = getApiErrorMessage(e);
      setErr(m);
      toast.error(m);
    }
  };

  const submitRubricGrade = async (attemptId: string, descriptiveQuestions: any[]) => {
    setMsg('');
    setErr('');
    try {
      const scores = descriptiveQuestions.map((dq) => ({
        questionId: dq.questionId,
        awardedMarks: Number(rubricScores[attemptId]?.[dq.questionId]?.marks ?? 0),
        reviewerComment: rubricScores[attemptId]?.[dq.questionId]?.comment || 'Evaluated via marking rubric',
      }));
      const res = await api.post(`/reviewer/attempts/${attemptId}/grade-descriptive`, { scores });
      setMsg(res.data.message);
      toast.success(res.data.message);
      await loadQueue();
    } catch (e) {
      const m = getApiErrorMessage(e);
      setErr(m);
      toast.error(m);
    }
  };

  const filteredSubmissions = useMemo(() => {
    return (queue?.submissions || []).filter((s: any) => {
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
  }, [queue, search, statusFilter]);

  const filteredSolutions = useMemo(() => {
    return (queue?.solutions || []).filter((sol: any) => {
      if (statusFilter !== 'all' && sol.verificationStatus !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          sol.title?.toLowerCase().includes(q) ||
          sol.questionReference?.toLowerCase().includes(q) ||
          sol.subjectName?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [queue, search, statusFilter]);

  const pendingSubmissionsCount = (queue?.submissions || []).filter((s: any) =>
    ['submitted', 'under_review'].includes(s.status)
  ).length;
  const verifiedSolutionsCount = (queue?.solutions || []).filter(
    (sol: any) => sol.verificationStatus === 'verified'
  ).length;

  return (
    <DashboardLayout title="Academic Reviewer Workbench">
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="space-y-6">
          {/* Reviewer Queue KPIs */}
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-xs text-slate-500">Pending Submissions</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                <AnimatedCounter value={pendingSubmissionsCount} />
              </p>
            </StaggerItem>
            <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-xs text-slate-500">Total Submissions</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white mt-1">
                <AnimatedCounter value={(queue?.submissions || []).length} />
              </p>
            </StaggerItem>
            <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-xs text-slate-500">Verified Solutions</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                <AnimatedCounter value={verifiedSolutionsCount} />
              </p>
            </StaggerItem>
            <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-xs text-slate-500">Descriptive Rubric Queue</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-cyan-700 dark:text-cyan-400 mt-1">
                <AnimatedCounter value={(queue?.descriptiveAttempts || []).length} />
              </p>
            </StaggerItem>
          </StaggerContainer>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit">
              {[
                { id: 'submissions', label: `Submissions (${(queue?.submissions || []).length})` },
                { id: 'solutions', label: `Solutions (${(queue?.solutions || []).length})` },
                { id: 'rubric', label: `Descriptive Rubric (${(queue?.descriptiveAttempts || []).length})` },
              ].map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTab(t.id as any);
                      setStatusFilter('all');
                    }}
                    className={`relative px-3.5 py-2 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                      active ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="reviewer-tab-pill"
                        transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                        className="absolute inset-0 rounded-md bg-white dark:bg-slate-800 shadow-sm"
                      />
                    )}
                    <span className="relative z-10">{t.label}</span>
                  </button>
                );
              })}
            </div>

            {tab !== 'rubric' && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search title, code, or author..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="all">All Statuses</option>
                  {tab === 'submissions' ? (
                    <>
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="needs_correction">Needs Correction</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </>
                  ) : (
                    <>
                      <option value="verified">Verified</option>
                      <option value="under_review">Under Review</option>
                      <option value="not_verified">Not Verified</option>
                    </>
                  )}
                </select>
              </div>
            )}
          </div>

          {err && <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/30 px-4 py-2.5 text-xs text-rose-700 dark:text-rose-300">{err}</div>}
          {msg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2.5 text-xs text-emerald-700 dark:text-emerald-300">{msg}</div>}

          <AnimatePresence mode="wait">
            {tab === 'submissions' && (
              <motion.div
                key="submissions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {filteredSubmissions.map((s: any) => {
                  const ck = checklists[s._id] || {};
                  const canPreview = Boolean(s.fileUrl || s.publishedPyqId);
                  return (
                    <div key={s._id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-mono text-cyan-700 dark:text-cyan-400">
                            {s.universityCode} · {s.subjectCode} · {s.examYear} ({s.examSession})
                          </p>
                          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white mt-0.5">{s.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Uploaded by {s.contributorName} · Source: {s.sourceDescription}
                          </p>
                          {canPreview && (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewSubmission({
                                  _id: s.publishedPyqId || undefined,
                                  fileUrl: s.fileUrl || undefined,
                                  title: s.title,
                                  paperCode: s.subjectCode,
                                  examYear: s.examYear,
                                  examSession: s.examSession,
                                  universityName: s.universityCode,
                                  subjectName: s.subjectCode,
                                  canDownload: true,
                                })
                              }
                              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Inspect Uploaded PDF ({s.originalFilename || 'Preview Inline'})
                            </button>
                          )}
                        </div>
                        <StatusText status={s.status} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                        {[
                          { key: 'universityMappingVerified', label: 'University & Semester Mapped' },
                          { key: 'readabilityChecked', label: 'Scan Readability Checked' },
                          { key: 'authenticityChecked', label: 'Authenticity & Completeness' },
                          { key: 'permissionsCleared', label: 'Permissions & Non-Leak Cleared' },
                        ].map((item) => (
                          <label key={item.key} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(ck[item.key])}
                              onChange={() => toggleCheck(s._id, item.key)}
                              className="accent-cyan-600"
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>

                      <input
                        type="text"
                        value={comments[s._id] || ''}
                        onChange={(e) => setComments((prev) => ({ ...prev, [s._id]: e.target.value }))}
                        placeholder="Reviewer comments or correction feedback..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => decideSubmission(s._id, 'approved')}
                          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-600 cursor-pointer"
                        >
                          Approve & Credit Reward
                        </button>
                        <button
                          type="button"
                          onClick={() => decideSubmission(s._id, 'needs_correction')}
                          className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-amber-500 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer"
                        >
                          Request Corrections
                        </button>
                        <button
                          type="button"
                          onClick={() => decideSubmission(s._id, 'rejected')}
                          className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-rose-500 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {tab === 'solutions' && (
              <motion.div
                key="solutions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {filteredSolutions.map((sol: any) => {
                  const isExpanded = Boolean(expandedSol[sol._id]);
                  return (
                    <div key={sol._id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-mono text-cyan-700 dark:text-cyan-400">
                            {sol.universityCode} · {sol.questionReference} · Version {sol.currentVersion}
                          </p>
                          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">{sol.title}</h3>
                        </div>
                        <StatusText status={sol.verificationStatus} />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{sol.finalAnswerSummary}</p>

                      <button
                        type="button"
                        onClick={() => setExpandedSol((prev) => ({ ...prev, [sol._id]: !prev[sol._id] }))}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Step-by-Step Derivation' : `Inspect Steps (${(sol.steps || []).length}) & History`}</span>
                        <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </motion.span>
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden space-y-3 pt-1"
                          >
                            {(sol.steps || []).length > 0 && (
                              <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 text-xs">
                                {sol.steps.map((step: any, i: number) => (
                                  <div key={i}>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                      Step {step.stepNumber || i + 1}: {step.heading}
                                    </p>
                                    <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{step.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {(sol.versionHistory || []).length > 0 && (
                              <div className="text-[11px] text-slate-500 space-y-1">
                                <p className="font-semibold text-slate-700 dark:text-slate-300">Revision Log:</p>
                                {sol.versionHistory.map((vh: any, idx: number) => (
                                  <p key={idx}>
                                    v{vh.version} by {vh.updatedBy} — {vh.changeNote}
                                  </p>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <input
                        type="text"
                        value={comments[sol._id] || ''}
                        onChange={(e) => setComments((prev) => ({ ...prev, [sol._id]: e.target.value }))}
                        placeholder="Version change note / verification comment..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => decideSolution(sol._id, 'verified')}
                          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-600 cursor-pointer"
                        >
                          Mark Verified
                        </button>
                        <button
                          type="button"
                          onClick={() => decideSolution(sol._id, 'under_review')}
                          className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-amber-500 text-amber-700 dark:text-amber-400 cursor-pointer"
                        >
                          Keep Under Review
                        </button>
                        <button
                          type="button"
                          onClick={() => decideSolution(sol._id, 'not_verified')}
                          className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                        >
                          Mark Not Verified
                        </button>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {tab === 'rubric' && (
              <motion.div
                key="rubric"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {(queue?.descriptiveAttempts || []).length === 0 ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-xs text-slate-500">
                    No descriptive mock test submissions are currently awaiting rubric evaluation.
                  </div>
                ) : (
                  (queue?.descriptiveAttempts || []).map((att: any) => (
                    <div key={att._id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
                      <div>
                        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                          {att.testTitle} — {att.studentName}
                        </h3>
                        <p className="text-xs text-slate-500">Objective Score: {att.objectiveScore}/{att.objectiveMaxScore}</p>
                      </div>
                      {att.descriptiveQuestions.map((dq: any) => (
                        <div key={dq.questionId} className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs">
                          <p className="font-semibold text-slate-900 dark:text-white">{dq.statement} ({dq.maxMarks} Marks)</p>
                          {(dq.rubricPoints || []).length > 0 && (
                            <p className="text-[11px] text-cyan-700 dark:text-cyan-400">
                              Marking Rubric: {dq.rubricPoints.join(' · ')}
                            </p>
                          )}
                          <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2.5 rounded">
                            Student Response: {dq.userAnswer || 'No response provided'}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                            <input
                              type="number"
                              min={0}
                              max={dq.maxMarks}
                              placeholder={`Marks (0-${dq.maxMarks})`}
                              onChange={(e) =>
                                setRubricScores((prev) => ({
                                  ...prev,
                                  [att._id]: {
                                    ...(prev[att._id] || {}),
                                    [dq.questionId]: {
                                      marks: Number(e.target.value),
                                      comment: prev[att._id]?.[dq.questionId]?.comment || '',
                                    },
                                  },
                                }))
                              }
                              className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                            />
                            <input
                              type="text"
                              placeholder="Rubric feedback..."
                              onChange={(e) =>
                                setRubricScores((prev) => ({
                                  ...prev,
                                  [att._id]: {
                                    ...(prev[att._id] || {}),
                                    [dq.questionId]: {
                                      marks: prev[att._id]?.[dq.questionId]?.marks || 0,
                                      comment: e.target.value,
                                    },
                                  },
                                }))
                              }
                              className="sm:col-span-2 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => submitRubricGrade(att._id, att.descriptiveQuestions)}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 cursor-pointer"
                      >
                        Save Rubric Evaluation
                      </button>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <PdfViewerModal paper={previewSubmission} onClose={() => setPreviewSubmission(null)} />
    </DashboardLayout>
  );
}
