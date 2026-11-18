import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { InteractiveCard, Reveal, StaggerContainer, StaggerItem } from '../../components/common/MotionPrimitives.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { PublicLayout } from '../../layouts/PublicLayout.tsx';
import { api } from '../../services/api.ts';

export function PricingPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    api
      .get('/packages')
      .then((res) => setPackages(res.data.packages || []))
      .catch(() => {});
  }, []);

  return (
    <PublicLayout>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-10">
        <Reveal className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">Pilot Semester Pricing</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            One semester package. Zero duplicate charges.
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Students purchase semester-level passes rather than per-subject fees. Upgrading from a PYQ Pass or Test Pass to Complete Pass charges only the price difference. No automatic renewals without explicit consent.
          </p>
        </Reveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const targetHref = user
              ? `/student/packages?plan=${encodeURIComponent(pkg.code)}`
              : `/register?plan=${encodeURIComponent(pkg.code)}`;
            return (
              <StaggerItem key={pkg._id}>
                <InteractiveCard
                  className={`h-full rounded-xl border bg-white dark:bg-slate-900 p-6 flex flex-col justify-between transition-shadow hover:shadow-md ${
                    pkg.code === 'complete_pass'
                      ? 'border-cyan-600 dark:border-cyan-500'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{pkg.name}</h2>
                      <span className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                        ₹{pkg.priceInr}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {pkg.validityMonths} months · Covers {pkg.semesterSlots} semester{pkg.semesterSlots > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">{pkg.tagline}</p>

                    <ul className="mt-5 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                      {(pkg.features || []).map((f: string) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    to={targetHref}
                    className="mt-6 w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 transition-colors"
                  >
                    {user ? 'Select in Billing Portal' : pkg.priceInr === 0 ? 'Start Free Account' : `Choose ${pkg.name}`}
                  </Link>
                </InteractiveCard>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </section>
    </PublicLayout>
  );
}
