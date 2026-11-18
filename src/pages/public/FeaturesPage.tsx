import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { InteractiveCard, Reveal, StaggerContainer, StaggerItem } from '../../components/common/MotionPrimitives.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { PublicLayout } from '../../layouts/PublicLayout.tsx';

export function FeaturesPage() {
  const { user } = useAuth();

  const contributorHref = user
    ? user.role === 'contributor' || user.role === 'campus_lead' || user.role === 'admin'
      ? '/contributor'
      : '/settings'
    : '/register?role=contributor';

  const modules = [
    {
      num: '01.',
      title: 'Curriculum-Locked PYQ Library',
      desc: 'Filter approved previous year papers by university, degree, branch, semester, subject, examination year, and session with inline PDF preview and controlled downloads.',
      to: '/student/pyqs',
      action: 'Open PYQ Library',
    },
    {
      num: '02.',
      title: 'Multi-Format Question Bank',
      desc: 'Practice MCQs, True/False, Short-Answer, and Long Descriptive questions tagged by syllabus topic, difficulty, marks, and source year.',
      to: '/student/questions',
      action: 'Explore Question Bank',
    },
    {
      num: '03.',
      title: 'Timed Mock Test Engine',
      desc: 'Full-semester and subject-wise timed exams with section tabs, question review flagging, auto-submit on timeout, objective scoring, and manual rubric review.',
      to: '/student/tests',
      action: 'Launch Mock Tests',
    },
    {
      num: '04.',
      title: 'Verified Step-by-Step Solutions',
      desc: 'Solutions clearly labeled Verified, Under Review, or Not Verified with reviewer attribution and full version history.',
      to: '/student/solutions',
      action: 'Read Verified Solutions',
    },
    {
      num: '05.',
      title: 'Historical PYQ Trend Analysis',
      desc: 'Inspect year-over-year topic recurrence, syllabus weightage coverage, and question type distribution across archived examinations.',
      to: '/student/trends',
      action: 'View Trend Analysis',
    },
    {
      num: '06.',
      title: 'Campus Contributor & Review Pipeline',
      desc: 'Student contributors upload verified resources with duplicate checksum detection, reviewed by academic reviewers and campus leads before reward release.',
      to: contributorHref,
      action: user ? 'Open Contributor Portal' : 'Apply as Contributor',
    },
  ];

  return (
    <PublicLayout>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-10">
        <Reveal className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">Platform Capabilities</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Everything required for structured semester preparation
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Designed around university exam workflows for students, contributors, campus leads, reviewers, and administrators.
          </p>
        </Reveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m) => (
            <StaggerItem key={m.num}>
              <InteractiveCard className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between gap-4 hover:border-cyan-600/50 transition-colors">
                <div className="space-y-2.5">
                  <span className="font-mono text-xs font-semibold text-cyan-700 dark:text-cyan-400">{m.num}</span>
                  <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{m.title}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{m.desc}</p>
                </div>
                <Link
                  to={m.to}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline w-fit"
                >
                  <span>{m.action}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </InteractiveCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>
    </PublicLayout>
  );
}
