import gsap from 'gsap';
import {
  ArrowRight,
  BookCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileSearch,
  Layers,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AnimatedCounter,
  FloatingCard,
  InteractiveCard,
  Reveal,
  StaggerContainer,
  StaggerItem,
} from '../../components/common/MotionPrimitives.tsx';
import { getDefaultRouteForRole, useAuth } from '../../context/AuthContext.tsx';
import { PublicLayout } from '../../layouts/PublicLayout.tsx';
import { api } from '../../services/api.ts';

const SHOWCASE_TABS = [
  {
    id: 'pyqs',
    num: '01',
    label: 'PYQ Library',
    icon: FileSearch,
    headline: 'Filter by university, degree, branch, semester & paper code',
    description:
      'Every uploaded question paper passes readability, authenticity, and non-leak permission checks before entering the library. Preview PDFs inline or download with your semester pass.',
    bullets: [
      'Curriculum-locked: AKTU (BCS/KCS), GGSIPU, and IIMT never cross-contaminate',
      'Search instantly by paper code (BCS401, CIC-206) or exam session',
      'Inline high-clarity PDF viewer with one-click verified downloads',
    ],
    ctaLabel: 'Open PYQ Library',
    ctaHref: '/student/pyqs',
    previewCode: 'BCS401 · Operating Systems',
    previewMeta: 'AKTU · B.Tech CSE Sem 4 · End-Semester 2024 · 70 Marks',
    previewItems: [
      'Q1 (a) Compare preemptive vs non-preemptive scheduling with turnaround metrics.',
      'Q2 (b) Apply Banker’s algorithm to check safe sequence on 5-process snapshot.',
      'Q3 (c) Analyze Belady’s anomaly in FIFO vs LRU page replacement.',
    ],
  },
  {
    id: 'mocks',
    num: '02',
    label: 'Mock Engine',
    icon: ClipboardList,
    headline: 'Real exam timer, section tabs, review flags & instant objective score',
    description:
      'Practice subject-wise or full-semester mock papers under university time limits. Objective MCQs and True/False grade immediately; descriptive answers route to manual rubric review.',
    bullets: [
      'Live countdown timer with automatic submission on timeout',
      'Interactive question palette with answered, skipped & marked-for-review states',
      'Clear separation between auto-graded objective and rubric-evaluated theory items',
    ],
    ctaLabel: 'Launch Mock Tests',
    ctaHref: '/student/tests',
    previewCode: 'TIMED MOCK · 45:00 REMAINING',
    previewMeta: 'Section A (Objective) · Section B (Short) · Section C (Descriptive)',
    previewItems: [
      'Objective MCQs: Instant accuracy & topic breakdown upon submission',
      'Descriptive Theory: Saved transparently for marking-rubric evaluation',
      'Review Flagging: Jump cleanly between flagged questions before final submit',
    ],
  },
  {
    id: 'solutions',
    num: '03',
    label: 'Verified Solutions',
    icon: BookCheck,
    headline: 'Step-by-step derivations checked by academic reviewers',
    description:
      'No unverified crowd guesses. Every solution displays its verification badge (Verified, Under Review, or Not Verified), reviewer attribution, and complete revision history.',
    bullets: [
      'Structured Step 1 → Step N derivations aligned to university marking schemes',
      'Direct reference to exact PYQ question number and paper year',
      'Full version history log showing every academic reviewer edit',
    ],
    ctaLabel: 'Browse Verified Solutions',
    ctaHref: '/student/solutions',
    previewCode: 'VERIFIED SOLUTION · VERSION 2.0',
    previewMeta: 'Reviewed by Dr. Kavita Nair · BCS402 DBMS · B+ Tree Indexing',
    previewItems: [
      'Step 1: Compute order p from block size (4096 B) and key-pointer sizes.',
      'Step 2: Derive leaf capacity and maximum entries per internal node.',
      'Step 3: Construct 3-level insertion trace with split node verification.',
    ],
  },
  {
    id: 'trends',
    num: '04',
    label: 'Trend Analytics',
    icon: TrendingUp,
    headline: 'Historical topic recurrence & personal weak-area tracking',
    description:
      'See which syllabus units and topics appeared most often across 2021–2025 examinations alongside your personal mock accuracy—presented transparently as historical evidence.',
    bullets: [
      'Year-over-year historical topic frequency across archived question papers',
      'Syllabus unit weightage breakdown to guide structured revision time',
      'Personal weak-topic flags linked directly to targeted practice questions',
    ],
    ctaLabel: 'Inspect Trend Analytics',
    ctaHref: '/student/trends',
    previewCode: 'HISTORICAL RECURRENCE (2021–2025)',
    previewMeta: 'Based on archived end-semester papers · Historical pattern only',
    previewItems: [
      'Normalization & BCNF: Appeared in 5 of 5 archived semesters (Avg 14 Marks)',
      'Deadlock & Semaphores: Appeared in 4 of 5 archived semesters (Avg 10 Marks)',
      'Recommended Drill: Practice 12 targeted questions where accuracy < 65%',
    ],
  },
];

const MARQUEE_ITEMS = [
  { code: 'BCS401', uni: 'AKTU', label: 'Operating Systems (2024)', q: 'BCS401' },
  { code: 'BCS402', uni: 'AKTU', label: 'Database Management Systems', q: 'BCS402' },
  { code: 'BCS403', uni: 'AKTU', label: 'Software Engineering', q: 'BCS403' },
  { code: 'CIC-206', uni: 'GGSIPU', label: 'Theory of Computation', q: 'CIC-206' },
  { code: 'CIC-208', uni: 'GGSIPU', label: 'Database Systems', q: 'CIC-208' },
  { code: 'BCM-201', uni: 'IIMT', label: 'Corporate Accounting', q: 'BCM-201' },
  { code: 'BCA-202', uni: 'IIMT', label: 'Data Structures & Algorithms', q: 'BCA' },
  { code: 'KCS401', uni: 'AKTU', label: 'Legacy Scheme Archive', q: 'AKTU' },
];

export function HomePage() {
  const { user } = useAuth();
  const [preview, setPreview] = useState<{
    universities: any[];
    semesters: any[];
    subjects: any[];
    counts: { pyqCount: number; mockTestCount: number; subjectCount: number };
  }>({ universities: [], semesters: [], subjects: [], counts: { pyqCount: 0, mockTestCount: 0, subjectCount: 0 } });
  const [selectedUniId, setSelectedUniId] = useState('');
  const [selectedSemId, setSelectedSemId] = useState('');
  const [packages, setPackages] = useState<any[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeShowcase, setActiveShowcase] = useState(0);
  const heroMediaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !heroMediaRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        heroMediaRef.current,
        { y: 18, opacity: 0.9 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
    }, heroMediaRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    api
      .get('/academic/public-preview', {
        params: {
          universityId: selectedUniId || undefined,
          semesterId: selectedSemId || undefined,
        },
      })
      .then((res) => {
        setPreview(res.data);
        if (!selectedUniId && res.data.universities?.length > 0) {
          setSelectedUniId(res.data.universities[0]._id);
        }
      })
      .catch(() => {});
  }, [selectedUniId, selectedSemId]);

  useEffect(() => {
    api
      .get('/packages')
      .then((res) => setPackages(res.data.packages || []))
      .catch(() => {});
  }, []);

  const filteredSemesters = preview.semesters.filter(
    (s) => !selectedUniId || String(s.universityId) === String(selectedUniId)
  );

  const primaryCtaHref = user ? getDefaultRouteForRole(user) : '/register';
  const primaryCtaLabel = user ? 'Open Your Dashboard' : 'Start Semester Preparation';
  const contributorHref = user
    ? user.role === 'contributor' || user.role === 'campus_lead' || user.role === 'admin'
      ? '/contributor'
      : '/settings'
    : '/register?role=contributor';
  const contributorLabel = user
    ? user.role === 'contributor' || user.role === 'campus_lead' || user.role === 'admin'
      ? 'Open Contributor Portal'
      : 'View Contributor Eligibility'
    : 'Apply as Campus Contributor';

  const currentTab = SHOWCASE_TABS[activeShowcase];

  const faqs = [
    {
      q: 'Why does UNIHUB lock resources to my university and curriculum scheme?',
      a: 'Syllabus codes and marking rubrics vary sharply across AKTU (BCS vs KCS), IPU, and IIMT. Scoping your profile prevents studying outdated or off-syllabus topics.',
    },
    {
      q: 'How does the Semester PYQ Pass or Test Pass upgrade work?',
      a: 'If you start with the ₹99 PYQ Pass or ₹99 Test Pass and upgrade to the ₹199 Semester Complete Pass for the same semester, you pay only the ₹100 price difference.',
    },
    {
      q: 'Are descriptive mock test answers graded automatically?',
      a: 'Objective MCQs and True/False items are scored immediately on submission. Short-answer and descriptive responses are evaluated manually using university marking rubrics—we never misrepresent heuristic text checks as automated grading.',
    },
    {
      q: 'Does historical PYQ trend analysis guarantee future exam questions?',
      a: 'No. Trend charts present historical recurrence across past papers to help prioritize revision time. They never predict or guarantee upcoming university question papers.',
    },
  ];

  return (
    <PublicLayout>
      {/* 1. Hero Section */}
      <section className="relative bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex flex-col justify-center space-y-6"
            >
              <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 tracking-wide">
                Your University. Your Semester. Your Preparation.
              </p>
              <h1
                className="font-display font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1]"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', textWrap: 'balance' }}
              >
                University exam preparation built around your exact curriculum.
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Discover verified previous year question papers, practice with timed semester mock tests, study reviewer-checked solutions, and analyze historical topic frequency without switching across scattered drives.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to={primaryCtaHref}
                  className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  <span>{primaryCtaLabel}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/universities"
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors whitespace-nowrap"
                >
                  Explore Universities
                </Link>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AKTU · GGSIPU Delhi · IIMT University · B.Tech, BCA, BBA & B.Com
              </p>
            </motion.div>

            <motion.div
              ref={heroMediaRef}
              initial={{ opacity: 0, scale: 0.97, x: 18 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.65, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 relative"
            >
              <div className="h-full min-h-[320px] lg:min-h-[430px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 relative shadow-sm">
                <img
                  src="/src/assets/images/hero_university_study_1794935442826.jpg"
                  alt="University students studying in a sunlit academic library"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent pointer-events-none" />

                <FloatingCard className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm rounded-xl border border-white/20 bg-slate-950/85 backdrop-blur-md p-4 text-white shadow-xl">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[11px] font-semibold text-cyan-300">SCOPED WORKSPACE ACTIVE</p>
                    <Layers className="w-4 h-4 text-cyan-300 shrink-0" />
                  </div>
                  <p className="text-sm font-semibold mt-1">AKTU B.Tech CSE · Semester 4 (BCS)</p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Verified PYQs · Timed Mocks · Historical Frequency
                  </p>
                </FloatingCard>
              </div>
            </motion.div>
          </div>

          {/* 4-Column Proof Strip */}
          <StaggerContainer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <StaggerItem>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                <AnimatedCounter value={3} suffix="+ Universities" />
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">AKTU, IPU, IIMT & configurable schemes</p>
            </StaggerItem>
            <StaggerItem>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                <AnimatedCounter value={100} suffix="% Scoped" />
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Zero off-curriculum or wrong-scheme papers</p>
            </StaggerItem>
            <StaggerItem>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                <AnimatedCounter value={99} prefix="₹" suffix=" / Sem" />
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Transparent pilot semester passes with upgrade credit</p>
            </StaggerItem>
            <StaggerItem>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                <AnimatedCounter value={4} suffix="-Check Review" />
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Every PYQ and solution verified before publishing</p>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Continuous Sliding PYQ & Curriculum Ticker */}
      <section
        aria-label="Indexed curriculum papers"
        className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/60 overflow-hidden py-3"
      >
        <div className="animate-marquee gap-4 px-2">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <Link
              key={`${item.code}-${idx}`}
              to={`/student/pyqs?q=${encodeURIComponent(item.q)}`}
              className="group inline-flex items-center gap-2.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs hover:border-cyan-600 dark:hover:border-cyan-500 transition-colors shrink-0 shadow-2xs"
            >
              <span className="font-mono font-semibold text-cyan-700 dark:text-cyan-400">{item.uni}</span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">{item.code}</span>
              <span className="text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                {item.label}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </section>

      {/* Interactive Sliding 4-Module Platform Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">Interactive Platform Preview</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Explore how each exam workspace fits together
              </h2>
            </div>

            <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              {SHOWCASE_TABS.map((tab, index) => {
                const isActive = activeShowcase === index;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveShowcase(index)}
                    className={`relative flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="showcase-active-tab"
                        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                        className="absolute inset-0 rounded-lg bg-slate-900 dark:bg-cyan-600"
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.num}. {tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 overflow-hidden shadow-xs">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              <div className="lg:col-span-6 space-y-4">
                <span className="font-mono text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                  MODULE {currentTab.num} · {currentTab.label.toUpperCase()}
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                  {currentTab.headline}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {currentTab.description}
                </p>
                <ul className="space-y-2.5 pt-1">
                  {currentTab.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-2">
                  <Link
                    to={currentTab.ctaHref}
                    className="group inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 transition-colors"
                  >
                    <span>{currentTab.ctaLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-mono text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                      {currentTab.previewCode}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Live Platform Structure</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{currentTab.previewMeta}</p>
                  <div className="space-y-2.5">
                    {currentTab.previewItems.map((line, i) => (
                      <motion.div
                        key={line}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.28 }}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-200"
                      >
                        {line}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 2. University & Semester Selection Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <Reveal direction="right" className="lg:col-span-5 space-y-3">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Preview your university semester catalogue
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Select a supported university and semester to inspect live indexed subjects, approved PYQs, and available mock examinations.
            </p>
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">University</label>
                <select
                  value={selectedUniId}
                  onChange={(e) => {
                    setSelectedUniId(e.target.value);
                    setSelectedSemId('');
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  {preview.universities.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.code} — {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Semester</label>
                <select
                  value={selectedSemId}
                  onChange={(e) => setSelectedSemId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="">All Available Semesters</option>
                  {filteredSemesters.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Reveal>

          <Reveal direction="left" className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Matched Curriculum Subjects</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span className="font-mono tabular-nums">{preview.counts.subjectCount}</span> subjects ·{' '}
                  <span className="font-mono tabular-nums">{preview.counts.pyqCount}</span> approved PYQs ·{' '}
                  <span className="font-mono tabular-nums">{preview.counts.mockTestCount}</span> mock tests
                </p>
              </div>
              <Link
                to={user ? '/student/pyqs' : '/register'}
                className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline whitespace-nowrap"
              >
                {user ? 'Open PYQ Library' : 'Create Profile to Access'}
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
              {preview.subjects.length === 0 ? (
                <p className="py-6 text-sm text-slate-500">Select a university to view mapped subjects.</p>
              ) : (
                preview.subjects.map((sub) => (
                  <div
                    key={sub._id}
                    className="py-3 px-2 -mx-2 rounded-lg flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{sub.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-mono">{sub.code}</span> · {sub.credits} Credits · {(sub.syllabusUnits || []).length} Units
                      </p>
                    </div>
                    <Link
                      to={`/student/pyqs?q=${encodeURIComponent(sub.code)}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline whitespace-nowrap"
                    >
                      <span>View Papers</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3. Platform Features (Asymmetric Bento) */}
      <section className="bg-white dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <Reveal className="max-w-2xl mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Structured examination tools designed for semester clarity
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Every module aligns directly with your university code, syllabus units, and marking format.
            </p>
          </Reveal>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StaggerItem className="md:col-span-2">
              <InteractiveCard className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-6 flex flex-col justify-between space-y-4 hover:border-cyan-600/50 transition-colors">
                <div className="space-y-3">
                  <FileSearch className="w-5 h-5 text-cyan-700 dark:text-cyan-400" />
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    Permission-Checked PYQ Archive
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Search and filter question papers by university, programme, branch, semester, subject, examination year, and session. Every paper passes readability, authenticity, and permission checks before publication.
                  </p>
                </div>
                <Link to="/student/pyqs" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline w-fit">
                  Browse PYQ Archive <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </InteractiveCard>
            </StaggerItem>

            <StaggerItem>
              <InteractiveCard className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-6 flex flex-col justify-between space-y-4 hover:border-cyan-600/50 transition-colors">
                <div className="space-y-3">
                  <ClipboardList className="w-5 h-5 text-cyan-700 dark:text-cyan-400" />
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    Timed Mock Test Engine
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Section-wise navigation, review flagging, automatic timer submission, instant objective scoring, and manual rubric tracking for descriptive answers.
                  </p>
                </div>
                <Link to="/student/tests" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline w-fit">
                  Explore Mock Engine <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </InteractiveCard>
            </StaggerItem>

            <StaggerItem>
              <InteractiveCard className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-6 flex flex-col justify-between space-y-4 hover:border-cyan-600/50 transition-colors">
                <div className="space-y-3">
                  <BookCheck className="w-5 h-5 text-cyan-700 dark:text-cyan-400" />
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    Reviewer-Verified Solutions
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Step-by-step derivations linked directly to PYQ questions with clear Verified, Under Review, or Not Verified status labels and version history.
                  </p>
                </div>
                <Link to="/student/solutions" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline w-fit">
                  Read Verified Solutions <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </InteractiveCard>
            </StaggerItem>

            <StaggerItem className="md:col-span-2">
              <InteractiveCard className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-6 flex flex-col justify-between space-y-4 hover:border-cyan-600/50 transition-colors">
                <div className="space-y-3">
                  <TrendingUp className="w-5 h-5 text-cyan-700 dark:text-cyan-400" />
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    Historical PYQ Trend & Performance Analytics
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Inspect topic recurrence across examination years, syllabus weightage coverage, and your personal weak topics over time—presented transparently as historical patterns, never speculative exam predictions.
                  </p>
                </div>
                <Link to="/student/trends" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline w-fit">
                  Inspect Trend Analysis <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </InteractiveCard>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* 4. How UNIHUB Works + Preview Split */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <Reveal direction="right" className="lg:col-span-6 space-y-6">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              How UNIHUB works for your semester
            </h2>
            <div className="space-y-5">
              {[
                {
                  num: '01.',
                  title: 'Configure your academic profile once',
                  body: 'Pick your university, programme, branch, academic year, semester, and curriculum scheme so your dashboard filters out mismatched subjects.',
                },
                {
                  num: '02.',
                  title: 'Review PYQs and historical topic frequency',
                  body: 'Read archived end-semester papers in the PDF viewer and inspect which syllabus units appeared most frequently across past years.',
                },
                {
                  num: '03.',
                  title: 'Practice under real examination timing',
                  body: 'Attempt subject-wise or full-semester mock tests, mark questions for review, and inspect verified step-by-step explanations.',
                },
                {
                  num: '04.',
                  title: 'Track measurable topic accuracy',
                  body: 'Monitor score progression over time and focus revision on topics where your mock accuracy falls below target.',
                },
              ].map((step) => (
                <div key={step.num} className="flex gap-4">
                  <span className="font-mono text-sm font-semibold text-cyan-700 dark:text-cyan-400 pt-0.5">{step.num}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal direction="left" className="lg:col-span-6">
            <InteractiveCard className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <img
                src="/src/assets/images/exam_prep_desk_1794935443799.jpg"
                alt="Structured engineering examination papers and handwritten notes on a desk"
                referrerPolicy="no-referrer"
                className="w-full h-72 object-cover"
              />
              <div className="p-6 space-y-3">
                <p className="text-xs font-medium text-cyan-700 dark:text-cyan-400">PYQ Library & Mock Assessment Preview</p>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Sample AKTU Sem 4 Diagnostic & Archive Ready
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Sign in with a free student account to preview BCS401 Operating Systems & BCS402 DBMS sample papers and attempt the free diagnostic mock test.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-4">
                  <Link
                    to="/student/tests"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline"
                  >
                    Try Diagnostic Mock Test <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/student/pyqs?q=BCS401"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:underline"
                  >
                    Preview BCS401 Papers
                  </Link>
                </div>
              </div>
            </InteractiveCard>
          </Reveal>
        </div>
      </section>

      {/* 7. Semester Package Pricing */}
      <section className="bg-white dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Transparent semester packages
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Purchase one semester pass at pilot pricing—never per-subject fees, and upgrade credits deduct what you already paid.
              </p>
            </div>
            <Link to="/pricing" className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline whitespace-nowrap">
              Compare All Plans
            </Link>
          </Reveal>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.slice(0, 6).map((pkg) => {
              const planHref = user
                ? `/student/packages?plan=${encodeURIComponent(pkg.code)}`
                : `/register?plan=${encodeURIComponent(pkg.code)}`;
              return (
                <StaggerItem key={pkg._id}>
                  <InteractiveCard
                    className={`h-full rounded-xl border p-6 flex flex-col justify-between bg-slate-50 dark:bg-slate-900 transition-shadow hover:shadow-md ${
                      pkg.code === 'complete_pass'
                        ? 'border-cyan-600 dark:border-cyan-500'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">{pkg.name}</h3>
                        <span className="font-mono tabular-nums text-xl font-bold text-slate-900 dark:text-white">
                          ₹{pkg.priceInr}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {pkg.validityMonths} months validity · {pkg.semesterSlots} semester{pkg.semesterSlots > 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">{pkg.tagline}</p>
                      <ul className="mt-4 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                        {(pkg.features || []).map((f: string) => (
                          <li key={f} className="flex items-start gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link
                      to={planHref}
                      className={`mt-6 w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                        pkg.code === 'complete_pass'
                          ? 'bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500'
                          : 'border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      {pkg.priceInr === 0 ? (user ? 'View Free Tier' : 'Start Free Access') : `Choose ${pkg.name}`}
                    </Link>
                  </InteractiveCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* 8. Campus Contributor Programme & 9. Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <Reveal direction="right" className="lg:col-span-6 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <img
              src="/src/assets/images/campus_collaboration_1794935443240.jpg"
              alt="Indian university students collaborating on question papers and study notes"
              referrerPolicy="no-referrer"
              className="w-full h-full min-h-[280px] object-cover"
            />
          </Reveal>
          <Reveal direction="left" className="lg:col-span-6 flex flex-col justify-center space-y-5">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Campus Contributor Programme
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Help juniors at your college prepare with clean, legible past question papers, verified syllabi, and original revision notes. Rewards are credited transparently to your contributor wallet only after academic reviewer approval.
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs border-y border-slate-200 dark:border-slate-800 py-4">
              <div>
                <p className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">₹10 – ₹15</p>
                <p className="text-slate-500 dark:text-slate-400">Eligible verified PYQ paper</p>
              </div>
              <div>
                <p className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">~₹75</p>
                <p className="text-slate-500 dark:text-slate-400">Complete semester paper set</p>
              </div>
              <div>
                <p className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">₹20 – ₹50</p>
                <p className="text-slate-500 dark:text-slate-400">Original revision notes</p>
              </div>
              <div>
                <p className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">₹2 – ₹5</p>
                <p className="text-slate-500 dark:text-slate-400">Original mock test question</p>
              </div>
            </div>
            <div>
              <Link
                to={contributorHref}
                className="group inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 transition-colors"
              >
                <span>{contributorLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Testimonials */}
        <div>
          <Reveal>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
              How students use UNIHUB during end-semester preparation
            </h2>
          </Reveal>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Ananya Tiwari',
                role: 'B.Tech CSE, Semester 4 · AKTU Lucknow',
                quote:
                  'Before UNIHUB I spent hours sorting KCS vs BCS PDFs in group chats. Having BCS401–403 papers scoped strictly to my scheme saved three days before internals and pushed my mock test score from 54% to 82%.',
              },
              {
                name: 'Siddharth Malhotra',
                role: 'B.Tech CSE, Semester 4 · GGSIPU Delhi',
                quote:
                  'The topic recurrence breakdown showed me Dynamic Programming and Recurrence Relations appeared every year since 2021, while the timed test runner exposed how slowly I was solving Section B.',
              },
              {
                name: 'Ritika Chaudhary',
                role: 'Campus Contributor · AKGEC Ghaziabad',
                quote:
                  'Uploading clean 300 DPI library scans took under ten minutes per paper. Every submission showed its review status clearly and my ₹50 approved reward settled via UPI without ambiguity.',
              },
            ].map((t) => (
              <StaggerItem key={t.name}>
                <InteractiveCard className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between gap-4 hover:shadow-md transition-shadow">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">“{t.quote}”</p>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                  </div>
                </InteractiveCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        {/* 10. FAQ */}
        <Reveal className="max-w-3xl">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
            Frequently asked questions
          </h2>
          <div className="divide-y divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800">
            {faqs.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left text-sm font-semibold text-slate-900 dark:text-white cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Reveal>
      </section>
    </PublicLayout>
  );
}
