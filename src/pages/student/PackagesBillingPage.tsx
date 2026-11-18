import { Check, Download, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { InteractiveCard, Reveal, StaggerContainer, StaggerItem } from '../../components/common/MotionPrimitives.tsx';
import { RazorpayCheckoutModal } from '../../components/common/RazorpayCheckoutModal.tsx';
import { LoadingSkeleton, StatusText } from '../../components/common/StateViews.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { DashboardLayout } from '../../layouts/DashboardLayout.tsx';
import { api, downloadAuthenticatedFile, getApiErrorMessage } from '../../services/api.ts';

export function PackagesBillingPage() {
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedPlanCode = searchParams.get('plan') || '';

  const [packages, setPackages] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [entitlements, setEntitlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);

  const [checkoutState, setCheckoutState] = useState<{ pkg: any; quote: any } | null>(null);

  const ap = user?.academicProfile;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pkgRes, txRes] = await Promise.all([api.get('/packages'), api.get('/packages/transactions/my')]);
      setPackages(pkgRes.data.packages || []);
      setTransactions(txRes.data.transactions || []);
      setEntitlements(txRes.data.entitlements || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectPackage = async (pkg: any) => {
    setError('');
    setSuccessMsg('');
    if (!ap?.universityId || !ap?.semesterId) {
      setError('Please complete your University and Semester profile in Account Settings before purchasing.');
      return;
    }
    try {
      const res = await api.post('/packages/quote', {
        packageId: pkg._id,
        universityId: ap.universityId,
        semesterIds: [ap.semesterId],
      });
      setCheckoutState({ pkg, quote: res.data.quote });
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleCheckoutSuccess = async (receiptNumber: string) => {
    setCheckoutState(null);
    setSuccessMsg(`Payment verified and semester pass activated! Receipt: ${receiptNumber}`);
    await refreshUser();
    await loadData();
  };

  const handleDownloadReceipt = async (tx: any) => {
    setError('');
    setDownloadingReceiptId(tx._id);
    try {
      await downloadAuthenticatedFile(`/api/packages/receipt/${tx._id}`, `${tx.receiptNumber || 'unihub-receipt'}.pdf`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to download receipt PDF.'));
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  return (
    <DashboardLayout title="Semester Packages & Billing">
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="space-y-8">
          {error && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              {successMsg}
            </div>
          )}

          {/* Active Entitlements */}
          <Reveal>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    Active Semester Entitlements
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configured for {ap?.universityCode || 'University'} · {ap?.semesterName || 'Current Semester'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  No automatic renewal enabled
                </span>
              </div>

              {entitlements.length === 0 ? (
                <p className="text-xs text-slate-500">You are currently on Free Access. Choose a pass below to unlock full semester resources.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {entitlements.map((e) => (
                    <div key={e._id} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{e.packageName}</span>
                        <StatusText status={e.status === 'active' ? 'active' : 'withdrawn'} label={e.status.toUpperCase()} />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Coverage: {e.includesPyqs ? 'PYQs · ' : ''}
                        {e.includesMockTests ? 'Mock Tests · ' : ''}
                        {e.includesDetailedAnalytics ? 'Deep Analytics' : 'Core Access'}
                      </p>
                      <p className="text-xs font-mono text-slate-500">
                        Valid until {new Date(e.expiresAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          {/* Packages Grid */}
          <div className="space-y-3">
            <Reveal>
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Available Pilot Semester Packages
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upgrading from PYQ Pass or Test Pass to Complete Pass automatically deducts your previous payment.
                </p>
              </div>
            </Reveal>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {packages.map((pkg) => {
                const isHighlighted = requestedPlanCode ? pkg.code === requestedPlanCode : pkg.code === 'complete_pass';
                return (
                  <StaggerItem key={pkg._id}>
                    <InteractiveCard
                      className={`h-full rounded-xl border bg-white dark:bg-slate-900 p-5 flex flex-col justify-between transition-shadow hover:shadow-md ${
                        isHighlighted
                          ? 'border-cyan-600 dark:border-cyan-500 ring-1 ring-cyan-500/20'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">{pkg.name}</h3>
                          <span className="font-mono tabular-nums text-xl font-bold text-slate-900 dark:text-white">
                            ₹{pkg.priceInr}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {pkg.validityMonths} months · {pkg.semesterSlots} semester{pkg.semesterSlots > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">{pkg.tagline}</p>
                        <ul className="mt-4 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                          {(pkg.features || []).map((f: string) => (
                            <li key={f} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {pkg.priceInr > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSelectPackage(pkg)}
                          className="mt-5 w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 transition-colors cursor-pointer"
                        >
                          Purchase / Upgrade
                        </button>
                      )}
                    </InteractiveCard>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>

          {/* Transaction History */}
          <Reveal className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              Transaction & Receipt History
            </h2>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                    <th className="py-3 px-4 font-medium">Receipt</th>
                    <th className="py-3 px-4 font-medium">Package</th>
                    <th className="py-3 px-4 font-medium">Method</th>
                    <th className="py-3 px-4 font-medium text-right">Amount</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs text-slate-500">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx._id}>
                        <td className="py-3 px-4 font-mono text-xs">{tx.receiptNumber}</td>
                        <td className="py-3 px-4 text-xs font-medium text-slate-900 dark:text-white">
                          {tx.packageName}
                          {tx.isUpgrade && ' (Upgrade)'}
                        </td>
                        <td className="py-3 px-4 text-xs uppercase text-slate-500">{tx.paymentMethod}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                          ₹{tx.finalAmountInr}
                        </td>
                        <td className="py-3 px-4">
                          <StatusText
                            status={
                              tx.status === 'paid'
                                ? 'paid'
                                : tx.status === 'failed'
                                  ? 'failed'
                                  : tx.status === 'refunded'
                                    ? 'withdrawn'
                                    : 'pending'
                            }
                            label={tx.status.toUpperCase()}
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          {tx.status === 'paid' && (
                            <button
                              type="button"
                              disabled={downloadingReceiptId === tx._id}
                              onClick={() => handleDownloadReceipt(tx)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline disabled:opacity-50 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              {downloadingReceiptId === tx._id ? 'Saving...' : 'Receipt'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      )}

      {checkoutState && (
        <RazorpayCheckoutModal
          pkg={checkoutState.pkg}
          quote={checkoutState.quote}
          semesterIds={[ap!.semesterId!]}
          universityId={ap!.universityId!}
          onClose={() => setCheckoutState(null)}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </DashboardLayout>
  );
}
