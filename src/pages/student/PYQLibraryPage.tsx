import { BookCheck, Download, Eye, Lock, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { InteractiveCard, Reveal, StaggerContainer, StaggerItem } from '../../components/common/MotionPrimitives.tsx';
import { PdfViewerModal } from '../../components/common/PdfViewerModal.tsx';
import { EmptyState, LoadingSkeleton, StatusText } from '../../components/common/StateViews.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { DashboardLayout } from '../../layouts/DashboardLayout.tsx';
import { api, downloadAuthenticatedFile, getApiErrorMessage } from '../../services/api.ts';

export function PYQLibraryPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [papers, setPapers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewPaper, setPreviewPaper] = useState<any>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [dlError, setDlError] = useState('');

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [subjectId, setSubjectId] = useState(searchParams.get('subjectId') || '');
  const [examYear, setExamYear] = useState('');
  const [examSession, setExamSession] = useState('');
  const [sort, setSort] = useState<'latest' | 'oldest'>('latest');

  useEffect(() => {
    const paramQ = searchParams.get('q');
    const paramSubject = searchParams.get('subjectId');
    if (paramQ !== null) setQ(paramQ);
    if (paramSubject !== null) setSubjectId(paramSubject);
  }, [searchParams]);

  const ap = user?.academicProfile;

  const fetchPapers = useCallback(async () => {
    setLoading(true);
    try {
      const [pyqRes, cascadeRes] = await Promise.all([
        api.get('/pyqs', {
          params: {
            q: q || undefined,
            subjectId: subjectId || undefined,
            examYear: examYear || undefined,
            examSession: examSession || undefined,
            sort,
          },
        }),
        api.get('/academic/cascade', {
          params: {
            universityId: ap?.universityId || undefined,
            programmeId: ap?.programmeId || undefined,
            branchId: ap?.branchId || undefined,
            semesterId: ap?.semesterId || undefined,
            curriculumSchemeId: ap?.curriculumSchemeId || undefined,
          },
        }),
      ]);
      setPapers(pyqRes.data.papers || []);
      setSubjects(cascadeRes.data.subjects || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [q, subjectId, examYear, examSession, sort, ap]);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  const handleDownload = async (paper: any) => {
    setDlError('');
    setDownloadingId(paper._id);
    try {
      const filename = `${(paper.paperCode || paper.title || 'pyq').replace(/[^a-zA-Z0-9_-]/g, '_')}_${paper.examYear}.pdf`;
      await downloadAuthenticatedFile(`/api/pyqs/${paper._id}/pdf?download=1`, filename);
      fetchPapers();
    } catch (err) {
      setDlError(getApiErrorMessage(err, 'Failed to download paper PDF.'));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <DashboardLayout title="PYQ Library">
      <div className="space-y-6">
        <Reveal>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Approved & Permission-Checked Question Papers
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Scoped to {ap?.universityCode || 'your university'} · {ap?.semesterName || 'your semester'} ·{' '}
                  {ap?.curriculumSchemeName || 'curriculum scheme'}
                </p>
              </div>
              <Link to="/student/packages" className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline">
                Manage Semester Pass
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search title, code (BCS401), subject..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
              <select
                value={examYear}
                onChange={(e) => setExamYear(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="">All Exam Years</option>
                {[2025, 2024, 2023, 2022, 2021].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as 'latest' | 'oldest')}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="latest">Sort: Latest First</option>
                <option value="oldest">Sort: Oldest First</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {['', 'End-Semester', 'Odd Semester', 'Even Semester', 'Back Paper'].map((sess) => (
                  <button
                    key={sess || 'all'}
                    type="button"
                    onClick={() => setExamSession(sess)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                      examSession === sess
                        ? 'border-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {sess || 'All Sessions'}
                  </button>
                ))}
              </div>
              {(q || subjectId || examYear || examSession) && (
                <button
                  type="button"
                  onClick={() => {
                    setQ('');
                    setSubjectId('');
                    setExamYear('');
                    setExamSession('');
                  }}
                  className="text-xs font-medium text-cyan-700 dark:text-cyan-400 hover:underline cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </Reveal>

        {dlError && (
          <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-4 py-2.5 text-xs text-rose-700 dark:text-rose-300">
            {dlError}
          </div>
        )}

        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : papers.length === 0 ? (
          <EmptyState
            title="No matching question papers found"
            description="Adjust your search filters or clear the query to browse all approved papers for your semester."
          />
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {papers.map((paper) => (
              <StaggerItem key={paper._id}>
                <InteractiveCard className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4 hover:border-cyan-600/40 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                        {paper.paperCode} · {paper.examYear}
                      </span>
                      <StatusText status="approved" label="Approved & Verified" />
                    </div>
                    <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">{paper.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {paper.universityCode} · {paper.programmeName} · {paper.branchName} · {paper.semesterName}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Subject: {paper.subjectName} · Session: {paper.examSession} · Marks: {paper.totalMarks}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Source: {paper.source} · Uploaded by {paper.uploaderName}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewPaper(paper)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>
                      <Link
                        to={`/student/solutions?subjectId=${encodeURIComponent(paper.subjectId)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-600/50 transition-colors"
                      >
                        <BookCheck className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                        Solutions
                      </Link>
                    </div>

                    {paper.canDownload ? (
                      <button
                        type="button"
                        disabled={downloadingId === paper._id}
                        onClick={() => handleDownload(paper)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {downloadingId === paper._id ? 'Saving...' : `Download (${paper.downloadCount})`}
                      </button>
                    ) : (
                      <Link
                        to="/student/packages"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Unlock Download
                      </Link>
                    )}
                  </div>
                </InteractiveCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      <PdfViewerModal paper={previewPaper} onClose={() => setPreviewPaper(null)} />
    </DashboardLayout>
  );
}
