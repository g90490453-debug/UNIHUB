import { Reveal, StaggerContainer, StaggerItem } from '../../components/common/MotionPrimitives.tsx';
import { PublicLayout } from '../../layouts/PublicLayout.tsx';

export function PrivacyPage() {
  return (
    <PublicLayout>
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-6">
        <Reveal className="space-y-3">
          <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">Compliance & Data Protection</p>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Privacy Policy</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            UNIHUB collects only the academic and account details necessary to map your university curriculum, record mock test attempts, process semester entitlements, and administer contributor payouts.
          </p>
        </Reveal>

        <StaggerContainer className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">1. Payment Security</h2>
            <p>All Indian UPI, card, and net-banking transactions are processed via Razorpay. UNIHUB never stores raw credit/debit card numbers, CVV codes, or net-banking credentials.</p>
          </StaggerItem>
          <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">2. Account & Deletion Controls</h2>
            <p>Students and contributors may update their profile details or submit an account deletion request directly from their Profile & Settings panel at any time.</p>
          </StaggerItem>
        </StaggerContainer>
      </section>
    </PublicLayout>
  );
}
