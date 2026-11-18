import { AlertCircle, AlertTriangle, CheckCircle2, Clock, ShieldAlert, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-12 text-center"
    >
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-md mx-auto">{description}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </motion.div>
  );
}

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading content">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="h-12 rounded-xl bg-gradient-to-r from-slate-200/70 via-slate-100 to-slate-200/70 dark:from-slate-800/70 dark:via-slate-800/40 dark:to-slate-800/70 animate-pulse"
        />
      ))}
    </div>
  );
}

export function StatusText({
  status,
  label,
}: {
  status:
    | 'verified'
    | 'approved'
    | 'paid'
    | 'active'
    | 'under_review'
    | 'pending'
    | 'needs_correction'
    | 'rejected'
    | 'not_verified'
    | 'failed'
    | 'withdrawn'
    | 'resolved'
    | 'in_progress'
    | 'new';
  label?: string;
}) {
  const map: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
    verified: { text: 'Verified', color: 'text-emerald-700 dark:text-emerald-400', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    approved: { text: 'Approved', color: 'text-emerald-700 dark:text-emerald-400', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    paid: { text: 'Paid', color: 'text-emerald-700 dark:text-emerald-400', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    active: { text: 'Active', color: 'text-emerald-700 dark:text-emerald-400', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    resolved: { text: 'Resolved', color: 'text-emerald-700 dark:text-emerald-400', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    under_review: { text: 'Under Review', color: 'text-amber-700 dark:text-amber-400', icon: <Clock className="w-3.5 h-3.5" /> },
    in_progress: { text: 'In Progress', color: 'text-amber-700 dark:text-amber-400', icon: <Clock className="w-3.5 h-3.5" /> },
    pending: { text: 'Pending', color: 'text-amber-700 dark:text-amber-400', icon: <Clock className="w-3.5 h-3.5" /> },
    new: { text: 'New', color: 'text-cyan-700 dark:text-cyan-400', icon: <AlertCircle className="w-3.5 h-3.5" /> },
    needs_correction: { text: 'Needs Correction', color: 'text-amber-700 dark:text-amber-400', icon: <AlertCircle className="w-3.5 h-3.5" /> },
    not_verified: { text: 'Not Verified', color: 'text-slate-600 dark:text-slate-400', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    rejected: { text: 'Rejected', color: 'text-rose-700 dark:text-rose-400', icon: <XCircle className="w-3.5 h-3.5" /> },
    failed: { text: 'Failed', color: 'text-rose-700 dark:text-rose-400', icon: <XCircle className="w-3.5 h-3.5" /> },
    withdrawn: { text: 'Withdrawn', color: 'text-slate-500 dark:text-slate-400', icon: <XCircle className="w-3.5 h-3.5" /> },
  };
  const cfg = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${cfg.color}`}>
      {cfg.icon}
      <span>{label || cfg.text}</span>
    </span>
  );
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl"
          >
            <div className={`flex items-center gap-2 ${danger ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{description}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={onConfirm}
                className={`px-4 py-2 text-xs font-semibold rounded-lg text-white disabled:opacity-50 cursor-pointer ${
                  danger
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-slate-900 dark:bg-cyan-600 hover:bg-slate-800 dark:hover:bg-cyan-500'
                }`}
              >
                {loading ? 'Processing...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
