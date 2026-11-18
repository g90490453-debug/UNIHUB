import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { InteractiveCard, Reveal, StaggerContainer, StaggerItem } from '../../components/common/MotionPrimitives.tsx';
import { getDefaultRouteForRole, useAuth } from '../../context/AuthContext.tsx';
import { PublicLayout } from '../../layouts/PublicLayout.tsx';

export function HowItWorksPage() {
  const { user } = useAuth();
  const ctaHref = user ? getDefaultRouteForRole(user) : '/register';
  const ctaLabel = user ? 'Enter Your Workspace' : 'Get Started Now';

  const steps = [
    {
      step: '01. Academic Onboarding',
      detail: 'Register and select your University, Programme, Branch, Academic Year, Semester, and Curriculum Scheme.',
    },
    {
      step: '02. Explore Free Resources',
      detail: 'Browse your scoped syllabus units, preview free sample PYQ papers, and attempt the diagnostic mock test.',
    },
    {
      step: '03. Activate a Semester Pass',
      detail: 'Unlock full PYQ downloads, timed full-semester mock tests, and analytics via Razorpay UPI, Card, or NetBanking.',
    },
    {
      step: '04. Measure & Improve',
      detail: 'Review topic accuracy charts, identify weak areas, and practice verified step-by-step solutions before finals.',
    },
  ];

  return (
    <PublicLayout>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-10">
        <Reveal className="space-y-3 max-w-2xl">
          <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">Workflow</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            How UNIHUB works from onboarding to exam day
          </h1>
        </Reveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((s) => (
            <StaggerItem key={s.step}>
              <InteractiveCard className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-2 hover:border-cyan-600/50 transition-colors">
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{s.step}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.detail}</p>
              </InteractiveCard>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <Reveal className="flex flex-wrap gap-3">
          <Link
            to={ctaHref}
            className="group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 transition-colors"
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            View Semester Passes
          </Link>
        </Reveal>
      </section>
    </PublicLayout>
  );
}
