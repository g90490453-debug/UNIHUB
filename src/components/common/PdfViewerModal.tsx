import { Download, FileText, Lock, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { downloadAuthenticatedFile, getApiErrorMessage, TOKEN_KEY } from '../../services/api.ts';

export function PdfViewerModal({
  paper,
  onClose,
}: {
  paper: {
    _id?: string;
    fileUrl?: string;
    title: string;
    paperCode?: string;
    examYear?: number;
    examSession?: string;
    universityName?: string;
    subjectName?: string;
    canDownload?: boolean;
  } | null;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadErr, setDownloadErr] = useState('');

  const token = localStorage.getItem(TOKEN_KEY) || '';
  const isUploadedSubmission = Boolean(paper?.fileUrl);
  const previewUrl = paper
    ? paper.fileUrl
      ? paper.fileUrl
      : `/api/pyqs/${paper._id}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`
    : '';
  const downloadPath = paper
    ? paper.fileUrl
      ? paper.fileUrl
      : `/api/pyqs/${paper._id}/pdf?download=1`
    : '';

  const handleDownload = async () => {
    if (!paper) return;
    setDownloadErr('');
    setDownloading(true);
    try {
      const safeName = `${(paper.paperCode || paper.title || 'unihub-paper').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      if (isUploadedSubmission && paper.fileUrl) {
        const res = await fetch(paper.fileUrl);
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = safeName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      } else {
        await downloadAuthenticatedFile(downloadPath, safeName);
      }
    } catch (err) {
      setDownloadErr(getApiErrorMessage(err, 'Unable to download PDF. Please check your semester pass.'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {paper && (
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
            exit={{ opacity: 0, scale: 0.96, y: 14 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl h-[88vh] flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{paper.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {[paper.universityName, paper.subjectName, paper.paperCode, paper.examYear ? `${paper.examYear} (${paper.examSession || 'Exam'})` : '']
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {paper.canDownload || isUploadedSubmission ? (
                  <button
                    type="button"
                    disabled={downloading}
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {downloading ? 'Downloading...' : 'Download PDF'}
                  </button>
                ) : (
                  <Link
                    to="/student/packages"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Unlock with PYQ Pass
                  </Link>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close preview"
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {downloadErr && (
              <div className="px-5 py-2 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-700 dark:text-rose-300 border-b border-rose-200 dark:border-rose-900">
                {downloadErr}
              </div>
            )}

            <div className="flex-1 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
              {previewUrl ? (
                <iframe title={paper.title} src={previewUrl} className="w-full h-full border-0" />
              ) : (
                <div className="text-center p-8 space-y-2 text-slate-500">
                  <FileText className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No file stream attached to this submission record.</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
