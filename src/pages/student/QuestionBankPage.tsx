import { ChevronDown, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Reveal, StaggerContainer, StaggerItem } from '../../components/common/MotionPrimitives.tsx';
import { EmptyState, LoadingSkeleton, StatusText } from '../../components/common/StateViews.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { DashboardLayout } from '../../layouts/DashboardLayout.tsx';
import { api } from '../../services/api.ts';

export function QuestionBankPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [subjectId, setSubjectId] = useState(searchParams.get('subjectId') || '');
  const [questionType, setQuestionType] = useState('');
  const [difficulty, setDifficulty] = useState('');

  useEffect(() => {
    const paramQ = searchParams.get('q');
    const paramSub = searchParams.get('subjectId');
    if (paramQ !== null) setQ(paramQ);
    if (paramSub !== null) setSubjectId(paramSub);
  }, [searchParams]);

  const ap = user?.academicProfile;

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, casRes] = await Promise.all([
        api.get('/questions', {
          params: {
            q: q || undefined,
            subjectId: subjectId || undefined,
            questionType: questionType || undefined,
            difficulty: difficulty || undefined,
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
      setQuestions(qRes.data.questions || []);
      setSubjects(casRes.data.subjects || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [q, subjectId, questionType, difficulty, ap]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const typeLabel: Record<string, string> = {
    mcq: 'Multiple Choice',
    true_false: 'True / False',
    short_answer: 'Short Answer',
    descriptive: 'Descriptive',
  };

  return (
    <DashboardLayout title="Question Bank">
      <div className="space-y-6">
        <Reveal>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search question text or topic..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
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
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="">All Formats</option>
                <option value="mcq">Multiple Choice (MCQ)</option>
                <option value="true_false">True / False</option>
                <option value="short_answer">Short Answer</option>
                <option value="descriptive">Descriptive</option>
              </select>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            {(q || subjectId || questionType || difficulty) && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setQ('');
                    setSubjectId('');
                    setQuestionType('');
                    setDifficulty('');
                  }}
                  className="text-xs font-medium text-cyan-700 dark:text-cyan-400 hover:underline cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </Reveal>

        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : questions.length === 0 ? (
          <EmptyState
            title="No questions match your filters"
            description="Try clearing the format, topic search, or difficulty filter to explore all published university questions."
          />
        ) : (
          <StaggerContainer className="space-y-4">
            {questions.map((item) => {
              const isOpen = openId === item._id;
              return (
                <StaggerItem
                  key={item._id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {item.subjectCode} · {item.topicName} · {typeLabel[item.questionType] || item.questionType} ·{' '}
                      <span className="capitalize">{item.difficulty}</span> ·{' '}
                      <span className="font-mono tabular-nums">{item.marks} Marks</span>
                    </span>
                    <span>
                      {item.examYear} · {item.source}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">{item.statement}</p>

                  {item.options && item.options.length > 0 && (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
                      {item.options.map((opt: string, i: number) => (
                        <li
                          key={i}
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                        >
                          {String.fromCharCode(65 + i)}. {opt}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                    <StatusText
                      status={item.isVerifiedExplanation ? 'verified' : 'not_verified'}
                      label={item.isVerifiedExplanation ? 'Verified Explanation' : 'Unverified Explanation'}
                    />
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : item._id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline cursor-pointer"
                    >
                      <span>{isOpen ? 'Hide Answer' : 'View Answer & Explanation'}</span>
                      <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </motion.span>
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                          {item.correctAnswer && (
                            <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
                              Answer: {item.correctAnswer}
                            </p>
                          )}
                          {item.rubricPoints && item.rubricPoints.length > 0 && (
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">Marking Rubric:</p>
                              <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 mt-1 space-y-0.5">
                                {item.rubricPoints.map((rp: string, i: number) => (
                                  <li key={i}>{rp}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {item.explanation && (
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.explanation}</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>
    </DashboardLayout>
  );
}
