import { CheckCircle2, CreditCard, Landmark, ShieldCheck, Smartphone, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { api, getApiErrorMessage } from '../../services/api.ts';

export function RazorpayCheckoutModal({
  pkg,
  quote,
  semesterIds,
  universityId,
  onClose,
  onSuccess,
}: {
  pkg: any;
  quote: {
    basePriceInr: number;
    creditAppliedInr: number;
    finalAmountInr: number;
    isUpgrade: boolean;
  };
  semesterIds: string[];
  universityId: string;
  onClose: () => void;
  onSuccess: (receiptNumber: string) => void;
}) {
  const [method, setMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('student@okicici');
  const [cardLast4] = useState('4242');
  const [bankName, setBankName] = useState('State Bank of India');
  const [noAutoRenewAck, setNoAutoRenewAck] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setError('');
    setLoading(true);
    try {
      const orderRes = await api.post('/packages/checkout/create-order', {
        packageId: pkg._id,
        semesterIds,
        universityId,
        paymentMethod: method,
        autoRenewConsent: false,
      });

      const { purchase, razorpay } = orderRes.data;

      // Verify payment signature strictly on the backend before activating any access
      if (razorpay.gateway === 'razorpay_sandbox') {
        const verifyRes = await api.post('/packages/checkout/verify', {
          purchaseId: purchase._id,
          razorpayOrderId: razorpay.orderId,
          razorpayPaymentId: razorpay.sandboxPaymentId,
          razorpaySignature: razorpay.sandboxSignature,
          method,
        });
        onSuccess(verifyRes.data.receiptNumber);
      } else {
        setError('Live Razorpay SDK checkout requires Razorpay Checkout JS script with live Key ID.');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Payment could not be completed.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateFailure = async () => {
    setError('');
    setLoading(true);
    try {
      const orderRes = await api.post('/packages/checkout/create-order', {
        packageId: pkg._id,
        semesterIds,
        universityId,
        paymentMethod: method,
      });
      await api.post('/packages/checkout/fail', {
        purchaseId: orderRes.data.purchase._id,
        reason: 'Bank authorization declined by user',
      });
      setError('Payment declined at gateway. No entitlement was activated and no charge was recorded.');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div>
            <p className="text-xs text-cyan-300 font-medium">UNIHUB Verified Checkout · Razorpay</p>
            <h3 className="text-base font-semibold mt-0.5">{pkg.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Package Base Price</span>
              <span className="font-mono tabular-nums">₹{quote.basePriceInr}</span>
            </div>
            {quote.isUpgrade && quote.creditAppliedInr > 0 && (
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                <span>Active Pass Upgrade Credit</span>
                <span className="font-mono tabular-nums">- ₹{quote.creditAppliedInr}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-semibold text-slate-900 dark:text-slate-100 text-base">
              <span>Payable Total</span>
              <span className="font-mono tabular-nums">₹{quote.finalAmountInr}</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Select Indian Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  method === 'upi'
                    ? 'border-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                UPI
              </button>
              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  method === 'card'
                    ? 'border-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Card
              </button>
              <button
                type="button"
                onClick={() => setMethod('netbanking')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  method === 'netbanking'
                    ? 'border-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                NetBanking
              </button>
            </div>
          </div>

          {method === 'upi' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">UPI ID / VPA</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@okaxis"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>
          )}

          {method === 'card' && (
            <div className="text-xs text-slate-600 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-800 p-3">
              Tokenized Razorpay Card Checkout (Visa / RuPay / Mastercard ending •••• {cardLast4}). UNIHUB never stores raw card numbers or CVV.
            </div>
          )}

          {method === 'netbanking' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Select Bank</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option>State Bank of India</option>
                <option>HDFC Bank</option>
                <option>ICICI Bank</option>
                <option>Axis Bank</option>
              </select>
            </div>
          )}

          <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={noAutoRenewAck}
              onChange={(e) => setNoAutoRenewAck(e.target.checked)}
              className="mt-0.5 accent-cyan-600"
            />
            <span>
              One-time semester access ({pkg.validityMonths} months validity). No automatic renewal will occur without explicit consent.
            </span>
          </label>

          {error && (
            <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleSimulateFailure}
              className="px-3.5 py-2.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap"
            >
              Test Failed Flow
            </button>
            <button
              type="button"
              disabled={loading || !noAutoRenewAck}
              onClick={handlePay}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Verifying Signature...' : `Pay ₹${quote.finalAmountInr} & Activate`}
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>HMAC-SHA256 server-side payment signature verification</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
