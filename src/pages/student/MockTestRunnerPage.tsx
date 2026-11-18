import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Clock, Flag } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AnimatedCounter,
  AnimatedProgressBar,
  CircularProgress,
  StaggerContainer,
  StaggerItem,
} from '../../components/common/MotionPrimitives.tsx';
import { LoadingSkeleton, StatusText } from '../../components/common/StateViews.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { DashboardLayout } from '../../layouts/DashboardLayout.tsx';
import { api, getApiErrorMessage } from '../../services/api.ts';

export function MockTestRunnerPage() {
  const { testId, attemptId } = useParams<{ testId?: string; attemptId?: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Runner state
  const [test, setTest] = useState<any>(null);
  const [startedAt, setStartedAt] = useState('');
  const [sectionIdx, setSectionIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Attempt review state
  const [attempt, setAttempt] = useState<any>(null);

  const submittedRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    submittedRef.current = false;
    if (attemptId) {
      api
        .get(`/mock-tests/attempts/${attemptId}`)
        .then((res) => setAttempt(res.data.attempt))
        .catch((err) => setError(getApiErrorMessage(err)))
        .finally(() => setLoading(false));
    } else if (testId) {
      setAttempt(null);
      api
        .get(`/mock-tests/${testId}/start`)
        .then((res) => {
          setTest(res.data.test);
          setStartedAt(res.data.startedAt);
          setSecondsLeft((res.data.test.durationMinutes || 15) * 60);
        })
        .catch((err) => setError(getApiErrorMessage(err)))
        .finally(() => setLoading(false));
    }
  }, [testId, attemptId]);

  const flatQuestions = useMemo(() => {
    if (!test) return [];
    const list: Array<{ sectionIdx: number; sectionName: string; q: any }> = [];
    test.sections.forEach((sec: any, sIdx: number) => {
      sec.questions.forEach((q: any) => {
        list.push({ sectionIdx: sIdx, sectionName: sec.name, q });
      });
    });
    return list;
  }, [test]);

  const submitExam = useCallback(
    async (reason: 'manual' | 'timer_expired') => {
      if (!test || submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        const totalDuration = (test.durationMinutes || 15) * 60;
        const payload = flatQuestions.map((item) => ({
          questionId: item.q._id,
          userAnswer: answers[item.q._id] || '',
          markedForReview: Boolean(flagged[item.q._id]),
        }));
        const res = await api.post(`/mock-tests/${test._id}/submit`, {
          answers: payload,
          startedAt,
          timeSpentSeconds: Math.max(1, totalDuration - secondsLeft),
          submissionReason: reason,
        });
        toast.success(
          reason === 'timer_expired'
            ? 'Time expired — examination submitted automatically.'
            : 'Mock examination submitted! Objective score calculated.'
        );
        navigate(`/student/tests/attempt/${res.data.attempt._id}`, { replace: true });
      } catch (err) {
        submittedRef.current = false;
        const msg = getApiErrorMessage(err);
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
      }
    },
    [test, flatQuestions, answers, flagged, startedAt, secondsLeft, navigate, toast]
  );

  useEffect(() => {
    if (!test || attemptId) return;
    if (secondsLeft <= 0) {
      submitExam('timer_expired');
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [test, attemptId, secondsLeft, submitExam]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <DashboardLayout title="Mock Examination">
        <LoadingSkeleton rows={6} />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Mock Examination">
        <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 p-6 space-y-4">
          <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          <Link to="/student/tests" className="inline-block text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline">
            Return to Mock Tests
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Attempt Results & Review View
  if (attempt) {
    return (
      <DashboardLayout title="Test Result & Breakdown">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs"
          >
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submitted {new Date(attempt.submittedAt).toLocaleString('en-IN')} ·{' '}
                {attempt.submissionReason === 'timer_expired' ? 'Auto-submitted at timeout' : 'Manual submission'}
              </p>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{attempt.testTitle}</h2>
              {attempt.hasPendingDescriptiveReview && (
                <div className="pt-1">
                  <StatusText
                    status="under_review"
                    label="Descriptive answers queued for manual rubric evaluation (not auto-graded)"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">Objective Score</p>
                <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                  <AnimatedCounter value={Number(attempt.objectiveScore || 0)} />/
                  {attempt.objectiveMaxScore}
                </p>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Time: {Math.floor((attempt.timeSpentSeconds || 0) / 60)}m {(attempt.timeSpentSeconds || 0) % 60}s
                </p>
              </div>
              <CircularProgress value={Number(attempt.percentage || 0)} size={96} strokeWidth={8} sublabel="Accuracy" />
            </div>
          </motion.div>

          {attempt.topicBreakdown && attempt.topicBreakdown.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Topic-Wise Objective Performance</h3>
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {attempt.topicBreakdown.map((tb: any) => (
                  <StaggerItem
                    key={tb.topicName}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{tb.topicName}</span>
                      <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        {tb.correct}/{tb.total}
                      </span>
                    </div>
                    <AnimatedProgressBar
                      value={tb.accuracyPercent}
                      colorClass={
                        tb.accuracyPercent >= 70
                          ? 'bg-emerald-600'
                          : tb.accuracyPercent >= 45
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                      }
                      label="Topic Accuracy"
                    />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Question-by-Question Review</h3>
            <StaggerContainer className="space-y-4" stagger={0.04}>
              {(attempt.detailedAnswers || []).map((ans: any, i: number) => (
                <StaggerItem
                  key={ans.questionId}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-mono text-slate-500">
                      Q{i + 1} · {ans.topicName} · {ans.maxMarks} Marks
                    </span>
                    {ans.isObjective ? (
                      <StatusText
                        status={ans.isCorrect ? 'approved' : 'rejected'}
                        label={ans.isCorrect ? `Correct (+${ans.awardedMarks})` : 'Incorrect (0)'}
                      />
                    ) : (
                      <StatusText
                        status={ans.evaluationStatus === 'rubric_graded' ? 'approved' : 'under_review'}
                        label={
                          ans.evaluationStatus === 'rubric_graded'
                            ? `Rubric Graded (${ans.awardedMarks}/${ans.maxMarks})`
                            : 'Pending Manual Rubric Review'
                        }
                      />
                    )}
                  </div>

                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{ans.statement}</p>

                  <div className="text-xs space-y-1">
                    <p className="text-slate-600 dark:text-slate-400">
                      Your Answer: <span className="font-medium text-slate-900 dark:text-white">{ans.userAnswer || 'Not attempted'}</span>
                    </p>
                    {ans.isObjective && (
                      <p className="text-emerald-700 dark:text-emerald-400">
                        Correct Answer: <span className="font-semibold">{ans.correctAnswer}</span>
                      </p>
                    )}
                    {ans.reviewerComment && (
                      <p className="text-amber-700 dark:text-amber-400">Reviewer Note: {ans.reviewerComment}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold">{ans.isVerifiedExplanation ? 'Verified Explanation: ' : 'Explanation Status: '}</span>
                    {ans.explanation}
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>

          <div>
            <Link
              to="/student/tests"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 transition-colors"
            >
              Back to Mock Tests
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Live Examination Runner
  const currentSection = test.sections[sectionIdx];
  const currentQ = currentSection?.questions[questionIdx];
  const isUrgent = secondsLeft < 120;

  const jumpTo = (sIdx: number, qIdx: number) => {
    setSlideDir(sIdx > sectionIdx || (sIdx === sectionIdx && qIdx >= questionIdx) ? 1 : -1);
    setSectionIdx(sIdx);
    setQuestionIdx(qIdx);
  };

  const goNext = () => {
    setSlideDir(1);
    if (questionIdx + 1 < currentSection.questions.length) {
      setQuestionIdx(questionIdx + 1);
    } else if (sectionIdx + 1 < test.sections.length) {
      setSectionIdx(sectionIdx + 1);
      setQuestionIdx(0);
    }
  };

  const goPrev = () => {
    setSlideDir(-1);
    if (questionIdx > 0) {
      setQuestionIdx(questionIdx - 1);
    } else if (sectionIdx > 0) {
      const prevSec = test.sections[sectionIdx - 1];
      setSectionIdx(sectionIdx - 1);
      setQuestionIdx(Math.max(0, prevSec.questions.length - 1));
    }
  };

  const answeredCount = flatQuestions.filter((item) => Boolean(answers[item.q._id]?.trim())).length;
  const flaggedCount = flatQuestions.filter((item) => Boolean(flagged[item.q._id])).length;
  const progressPct = flatQuestions.length > 0 ? Math.round((answeredCount / flatQuestions.length) * 100) : 0;

  return (
    <DashboardLayout title={test.title}>
      <div className="space-y-5">
        {/* Top Exam Status Bar */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5 space-y-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {test.sections.map((sec: any, idx: number) => {
                const isActive = sectionIdx === idx;
                return (
                  <button
                    key={sec.name}
                    type="button"
                    onClick={() => jumpTo(idx, 0)}
                    className={`relative px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      isActive ? 'text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="runner-section-pill"
                        transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                        className="absolute inset-0 rounded-md bg-slate-900 dark:bg-cyan-600"
                      />
                    )}
                    <span className="relative z-10">{sec.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <motion.div
                animate={isUrgent ? { scale: [1, 1.03, 1] } : {}}
                transition={isUrgent ? { duration: 1.1, repeat: Infinity } : undefined}
                className={`inline-flex items-center gap-1.5 font-mono tabular-nums text-sm font-bold px-3.5 py-1.5 rounded-lg border transition-colors ${
                  isUrgent
                    ? 'border-rose-400 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950'
                }`}
              >
                <Clock className={`w-4 h-4 ${isUrgent ? 'text-rose-600 dark:text-rose-400' : 'text-cyan-600 dark:text-cyan-400'}`} />
                <span>{formatTime(secondsLeft)}</span>
              </motion.div>
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(true)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-600 transition-colors cursor-pointer"
              >
                Submit Test
              </button>
            </div>
          </div>

          <AnimatedProgressBar
            value={progressPct}
            heightClass="h-1.5"
            colorClass="bg-cyan-600 dark:bg-cyan-400"
            label={`Completion Progress (${answeredCount}/${flatQuestions.length} answered)`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Active Question Stage */}
          <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
              <div>
                <p className="text-xs font-medium text-cyan-700 dark:text-cyan-400">{currentSection?.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{currentSection?.instructions}</p>
              </div>
              <span className="font-mono tabular-nums text-xs font-semibold text-slate-700 dark:text-slate-300">
                Question {questionIdx + 1} of {currentSection?.questions.length} · {currentQ?.marks} Marks
              </span>
            </div>

            <AnimatePresence mode="wait">
              {currentQ && (
                <motion.div
                  key={currentQ._id}
                  initial={{ opacity: 0, x: slideDir * 22 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: slideDir * -22 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-5"
                >
                  <p className="text-base font-medium text-slate-900 dark:text-white leading-relaxed">{currentQ.statement}</p>

                  {currentQ.questionType === 'mcq' || currentQ.questionType === 'true_false' ? (
                    <div className="space-y-2.5">
                      {(currentQ.options || []).map((opt: string, optIdx: number) => {
                        const selected = answers[currentQ._id] === opt;
                        return (
                          <motion.button
                            key={opt}
                            type="button"
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setAnswers((prev) => ({ ...prev, [currentQ._id]: opt }))}
                            className={`w-full text-left px-4 py-3 text-sm rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                              selected
                                ? 'border-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 text-slate-900 dark:text-white font-medium shadow-2xs'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <span
                                className={`w-6 h-6 rounded-md font-mono text-xs font-semibold flex items-center justify-center shrink-0 border ${
                                  selected
                                    ? 'bg-cyan-600 border-cyan-600 text-white'
                                    : 'border-slate-300 dark:border-slate-700 text-slate-500'
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                            </span>
                            {selected && <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                        Written Response (Evaluated manually via marking rubric after submission)
                      </label>
                      <textarea
                        rows={6}
                        value={answers[currentQ._id] || ''}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQ._id]: e.target.value }))}
                        placeholder="Write structured technical steps, formulas, or definitions..."
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                      />
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFlagged((prev) => ({ ...prev, [currentQ._id]: !prev[currentQ._id] }))
                      }
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        flagged[currentQ._id]
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      {flagged[currentQ._id] ? 'Marked for Review' : 'Mark for Review'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={goPrev}
                        disabled={sectionIdx === 0 && questionIdx === 0}
                        className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        disabled={
                          sectionIdx === test.sections.length - 1 &&
                          questionIdx === currentSection.questions.length - 1
                        }
                        className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 disabled:opacity-40 cursor-pointer"
                      >
                        Next
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Question Palette */}
          <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Question Navigation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Answered: <span className="font-mono font-semibold text-slate-900 dark:text-white">{answeredCount}/{flatQuestions.length}</span> · Marked:{' '}
              <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">{flaggedCount}</span>
            </p>

            <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80" /> Answered
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/80" /> Review
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm border border-slate-300 dark:border-slate-700" /> Unvisited
              </span>
            </div>

            <div className="space-y-4">
              {test.sections.map((sec: any, sIdx: number) => (
                <div key={sec.name} className="space-y-2">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{sec.name}</p>
                  <div className="grid grid-cols-5 gap-2">
                    {sec.questions.map((q: any, qIdx: number) => {
                      const isCurrent = sIdx === sectionIdx && qIdx === questionIdx;
                      const isAns = Boolean(answers[q._id]?.trim());
                      const isFlag = Boolean(flagged[q._id]);
                      let btnStyle = 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800';
                      if (isFlag) btnStyle = 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300';
                      else if (isAns) btnStyle = 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300';
                      if (isCurrent) btnStyle += ' ring-2 ring-cyan-600 ring-offset-1 dark:ring-offset-slate-900';

                      return (
                        <button
                          key={q._id}
                          type="button"
                          onClick={() => jumpTo(sIdx, qIdx)}
                          className={`h-9 rounded-lg border text-xs font-mono font-semibold transition-all cursor-pointer ${btnStyle}`}
                        >
                          {qIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {confirmSubmitOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
            onClick={() => setConfirmSubmitOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Confirm Test Submission</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                You have answered <span className="font-mono font-semibold">{answeredCount}</span> of{' '}
                <span className="font-mono font-semibold">{flatQuestions.length}</span> questions ({flaggedCount} marked for review). Once submitted, objective items are scored immediately.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmSubmitOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Continue Test
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => submitExam('manual')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-600 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {submitting ? 'Submitting...' : 'Confirm Submit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
