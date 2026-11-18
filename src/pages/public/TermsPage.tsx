import { Reveal, StaggerContainer, StaggerItem } from '../../components/common/MotionPrimitives.tsx';
import { PublicLayout } from '../../layouts/PublicLayout.tsx';

export function TermsPage() {
  return (
    <PublicLayout>
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-6">
        <Reveal className="space-y-3">
          <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">Academic Governance</p>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Terms and Conditions</h1>
        </Reveal>

        <StaggerContainer className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">1. Academic Content & Non-Leak Policy</h2>
            <p>UNIHUB strictly prohibits uploading or distributing leaked, confidential, or unreleased university examination materials. Contributors must attest ownership or public academic availability for every submission.</p>
          </StaggerItem>
          <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">2. Semester Entitlements & Refunds</h2>
            <p>Semester packages remain valid for the specified duration (6 or 12 months) without automatic renewal. Upgrades deduct the previously paid pass fee for the same semester.</p>
          </StaggerItem>
          <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">3. Historical Analytics Disclaimer</h2>
            <p>PYQ trend analysis displays historical topic frequency from archived papers and does not guarantee future examination questions.</p>
          </StaggerItem>
        </StaggerContainer>
      </section>
    </PublicLayout>
  );
}
