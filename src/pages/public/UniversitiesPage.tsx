import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { InteractiveCard, Reveal, StaggerContainer, StaggerItem } from '../../components/common/MotionPrimitives.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { PublicLayout } from '../../layouts/PublicLayout.tsx';
import { api } from '../../services/api.ts';

export function UniversitiesPage() {
  const { user } = useAuth();
  const [universities, setUniversities] = useState<any[]>([]);

  useEffect(() => {
    api
      .get('/academic/universities')
      .then((res) => setUniversities(res.data.universities || []))
      .catch(() => {});
  }, []);

  return (
    <PublicLayout>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-8">
        <Reveal className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">Academic Coverage</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Supported Universities & Programmes
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Universities, degrees, branches, semesters, and curriculum schemes are dynamically configured so students only see resources matching their exact syllabus.
          </p>
        </Reveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {universities.map((u) => {
            const targetHref = user ? `/student/pyqs?q=${encodeURIComponent(u.code)}` : '/register';
            return (
              <StaggerItem key={u._id}>
                <InteractiveCard className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between gap-4 hover:border-cyan-600/50 transition-colors">
                  <div className="space-y-2.5">
                    <p className="font-mono text-xs font-semibold text-cyan-700 dark:text-cyan-400">{u.code}</p>
                    <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{u.name}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {u.location || 'India'} · {u.type}
                    </p>
                  </div>
                  <Link
                    to={targetHref}
                    className="inline-flex items-center gap-1.5 pt-2 text-xs font-semibold text-slate-900 dark:text-cyan-400 hover:underline w-fit"
                  >
                    <span>{user ? `Browse ${u.code} Papers` : `Enroll under ${u.code}`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </InteractiveCard>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        <Reveal className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Don’t see your university or curriculum scheme yet?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Submit an academic onboarding request and our curriculum team will configure your syllabus codes.
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            Request University Coverage
          </Link>
        </Reveal>
      </section>
    </PublicLayout>
  );
}
