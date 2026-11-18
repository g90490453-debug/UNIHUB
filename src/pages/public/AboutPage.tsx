import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { InteractiveCard, Reveal, StaggerContainer, StaggerItem } from '../../components/common/MotionPrimitives.tsx';
import { getDefaultRouteForRole, useAuth } from '../../context/AuthContext.tsx';
import { PublicLayout } from '../../layouts/PublicLayout.tsx';

export function AboutPage() {
  const { user } = useAuth();
  const ctaHref = user ? getDefaultRouteForRole(user) : '/register';
  const ctaLabel = user ? 'Go to Your Dashboard' : 'Create Your Student Profile';

  return (
    <PublicLayout>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-8">
        <Reveal className="space-y-4">
          <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">About UNIHUB</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Your University. Your Semester. Your Preparation.
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            UNIHUB was designed to solve a persistent problem in Indian higher education: university students spend hours chasing blurry question papers across unverified chat groups, mixing up old and new curriculum schemes, and practicing without timed feedback.
          </p>
        </Reveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <StaggerItem>
            <InteractiveCard className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-2">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Academic Integrity First</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                We never host leaked, confidential, or unreleased examination material. Every uploaded paper undergoes a 4-point reviewer checklist verifying university mapping, scan readability, authenticity, and distribution rights.
              </p>
            </InteractiveCard>
          </StaggerItem>
          <StaggerItem>
            <InteractiveCard className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-2">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Honest Assessment & Analytics</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Objective questions are scored automatically, while descriptive theory responses are routed for rubric evaluation. Trend charts reflect historical past-paper frequency rather than speculative future predictions.
              </p>
            </InteractiveCard>
          </StaggerItem>
        </StaggerContainer>

        <Reveal delay={0.1} className="pt-4 flex flex-wrap gap-3">
          <Link
            to={ctaHref}
            className="group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 transition-colors"
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            Contact Academic Team
          </Link>
        </Reveal>
      </section>
    </PublicLayout>
  );
}
