import { CheckCircle2, Edit3, Eye, FileUp, Upload, Wallet, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AcademicCascadeSelector, type CascadeSelection } from '../../components/common/AcademicCascadeSelector.tsx';
import {
  AnimatedCounter,
  AnimatedProgressBar,
  Reveal,
  StaggerContainer,
  StaggerItem,
} from '../../components/common/MotionPrimitives.tsx';
import { PdfViewerModal } from '../../components/common/PdfViewerModal.tsx';
import { LoadingSkeleton, StatusText } from '../../components/common/StateViews.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { DashboardLayout } from '../../layouts/DashboardLayout.tsx';
import { api, getApiErrorMessage } from '../../services/api.ts';

export function ContributorDashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [cascade, setCascade] = useState<CascadeSelection>({
    universityId: user?.academicProfile?.universityId || '',
    programmeId: user?.academicProfile?.programmeId || '',
    branchId: user?.academicProfile?.branchId || '',
    academicYearId: user?.academicProfile?.academicYearId || '',
    semesterId: user?.academicProfile?.semesterId || '',
    curriculumSchemeId: user?.academicProfile?.curriculumSchemeId || '',
    subjectId: '',
  });
  const [resourceType, setResourceType] = useState('pyq_paper');
  const [title, setTitle] = useState('');
  const [examYear, setExamYear] = useState('2025');
  const [examSession, setExamSession] = useState('End-Semester');
  const [paperCode, setPaperCode] = useState('');
  const [sourceDescription, setSourceDescription] = useState('');
  const [rightsAccepted, setRightsAccepted] = useState(false);
  const [notLeakedAccepted, setNotLeakedAccepted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [upiId, setUpiId] = useState('');
  const [collegeName, setCollegeName] = useState(user?.collegeName || '');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [previewPaper, setPreviewPaper] = useState<any>(null);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: '', paperCode: '', examYear: '2025', examSession: 'End-Semester', sourceDescription: '' });
  const [editFile, setEditFile] = useState<File | null>(null);
  const [resubmitting, setResubmitting] = useState(false);

  const initializedProfileRef = useRef(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/contributor/dashboard');
      setData(res.data);
      if (!initializedProfileRef.current) {
        if (res.data.profile?.upiId) setUpiId(res.data.profile.upiId);
        if (res.data.profile?.collegeName) setCollegeName(res.data.profile.collegeName);
        initializedProfileRef.current = true;
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleSaveContributorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.post('/contributor/profile', {
        universityId: cascade.universityId || data?.profile?.universityId || user?.academicProfile?.universityId,
        programmeId: cascade.programmeId || data?.profile?.programmeId || user?.academicProfile?.programmeId,
        branchId: cascade.branchId || data?.profile?.branchId || user?.academicProfile?.branchId,
        collegeName: collegeName || 'Campus Partner College',
        upiId,
      });
      toast.success('Contributor profile & default UPI saved.');
      await loadDashboard();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    setUploadProgress(5);
    try {
      const fd = new FormData();
      fd.append('universityId', cascade.universityId);
      fd.append('programmeId', cascade.programmeId);
      fd.append('branchId', cascade.branchId);
      fd.append('semesterId', cascade.semesterId);
      fd.append('curriculumSchemeId', cascade.curriculumSchemeId);
      fd.append('subjectId', cascade.subjectId || '');
      fd.append('resourceType', resourceType);
      fd.append('title', title);
      fd.append('examYear', examYear);
      fd.append('examSession', examSession);
      fd.append('paperCode', paperCode);
      fd.append('sourceDescription', sourceDescription);
      fd.append('rightsDeclarationAccepted', String(rightsAccepted));
      fd.append('notLeakedOrUnreleasedAttested', String(notLeakedAccepted));
      if (file) fd.append('file', file);

      const res = await api.post('/contributor/submissions', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) {
            setUploadProgress(Math.min(95, Math.round((evt.loaded / evt.total) * 100)));
          }
        },
      });
      setUploadProgress(100);
      const msg = res.data.duplicateWarning
        ? `Submitted for review. ${res.data.duplicateWarning}`
        : 'Resource submitted cleanly and queued for academic review.';
      setSuccess(msg);
      toast.success('Resource uploaded and queued for review.');
      setTitle('');
      setPaperCode('');
      setSourceDescription('');
      setFile(null);
      setRightsAccepted(false);
      setNotLeakedAccepted(false);
      await loadDashboard();
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setTimeout(() => setUploadProgress(0), 600);
    }
  };

  const handleWithdraw = async (id: string) => {
    try {
      await api.patch(`/contributor/submissions/${id}/withdraw`);
      toast.info('Submission withdrawn and pending reward reversed.');
      await loadDashboard();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const openResubmitModal = (sub: any) => {
    setEditingSub(sub);
    setEditForm({
      title: sub.title || '',
      paperCode: sub.paperCode || '',
      examYear: String(sub.examYear || '2025'),
      examSession: sub.examSession || 'End-Semester',
      sourceDescription: sub.sourceDescription || '',
    });
    setEditFile(null);
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    setResubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', editForm.title);
      fd.append('paperCode', editForm.paperCode);
      fd.append('examYear', editForm.examYear);
      fd.append('examSession', editForm.examSession);
      fd.append('sourceDescription', editForm.sourceDescription);
      if (editFile) fd.append('file', editFile);
      await api.patch(`/contributor/submissions/${editingSub._id}/resubmit`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Corrections saved and resubmitted for academic review.');
      setEditingSub(null);
      await loadDashboard();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setResubmitting(false);
    }
  };

  const handlePayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setPayoutLoading(true);
    try {
      await api.post('/contributor/payouts/request', { upiId });
      setSuccess('Payout request submitted from your approved balance.');
      toast.success('UPI payout request queued for admin release.');
      await loadDashboard();
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setPayoutLoading(false);
    }
  };

  const totalSubs = (data?.submissions || []).length;
  const approvedSubs = (data?.submissions || []).filter((s: any) => s.status === 'approved').length;
  const approvalRate = totalSubs > 0 ? Math.round((approvedSubs / totalSubs) * 100) : 0;

  return (
    <DashboardLayout title="Campus Contributor Portal">
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              {success}
            </div>
          )}

          {/* Contributor Wallet */}
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <p className="text-xs text-slate-500">Pending Rewards (Locked)</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                <AnimatedCounter value={Number(data?.wallet?.pendingRewardsInr || 0)} prefix="₹" />
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Not withdrawable until approved</p>
            </StaggerItem>
            <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <p className="text-xs text-slate-500">Approved (Withdrawable)</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                <AnimatedCounter value={Number(data?.wallet?.approvedRewardsInr || 0)} prefix="₹" />
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Eligible for UPI payout</p>
            </StaggerItem>
            <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
              <div>
                <p className="text-xs text-slate-500">Paid Rewards</p>
                <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  <AnimatedCounter value={Number(data?.wallet?.paidRewardsInr || 0)} prefix="₹" />
                </p>
              </div>
              <AnimatedProgressBar
                value={approvalRate}
                heightClass="h-1.5"
                colorClass="bg-emerald-600"
                label={`Approval Rate (${approvedSubs}/${totalSubs})`}
              />
            </StaggerItem>
            <StaggerItem>
              <form
                onSubmit={handlePayoutRequest}
                className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2.5 flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                  <Wallet className="w-3.5 h-3.5 text-cyan-600" />
                  Request UPI Payout
                </div>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@okaxis"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
                <button
                  type="submit"
                  disabled={payoutLoading || (data?.wallet?.approvedRewardsInr || 0) <= 0}
                  className="w-full py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  {payoutLoading ? 'Requesting...' : 'Withdraw Approved Balance'}
                </button>
              </form>
            </StaggerItem>
          </StaggerContainer>

          {/* Contributor Profile & Payout Defaults */}
          <Reveal>
            <form
              onSubmit={handleSaveContributorProfile}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-wrap items-end gap-4"
            >
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Campus / College Affiliation
                </label>
                <input
                  type="text"
                  required
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="e.g., AKGEC Ghaziabad"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Default Payout UPI ID
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="contributor@okicici"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                {savingProfile ? 'Saving...' : 'Save Contributor Profile'}
              </button>
            </form>
          </Reveal>

          {/* Resource Upload Form */}
          <Reveal delay={0.05}>
            <form
              onSubmit={handleUpload}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    Submit Academic Resource
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Current configured rates: PYQ ₹{data?.rewardRates?.pyq_paper} · Complete Set ₹
                    {data?.rewardRates?.complete_semester_set} · Syllabus ₹{data?.rewardRates?.syllabus_document} · Notes ₹
                    {data?.rewardRates?.revision_notes}
                  </p>
                </div>
              </div>

              <AcademicCascadeSelector value={cascade} onChange={setCascade} includeSubject />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Resource Type</label>
                  <select
                    value={resourceType}
                    onChange={(e) => setResourceType(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  >
                    <option value="pyq_paper">PYQ Paper (₹{data?.rewardRates?.pyq_paper})</option>
                    <option value="complete_semester_set">Complete Semester Set (₹{data?.rewardRates?.complete_semester_set})</option>
                    <option value="syllabus_document">Verified Syllabus (₹{data?.rewardRates?.syllabus_document})</option>
                    <option value="revision_notes">Original Revision Notes (₹{data?.rewardRates?.revision_notes})</option>
                    <option value="mock_question">Original Mock Question (₹{data?.rewardRates?.mock_question})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Exam Year</label>
                  <input
                    type="number"
                    required
                    value={examYear}
                    onChange={(e) => setExamYear(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Session</label>
                  <select
                    value={examSession}
                    onChange={(e) => setExamSession(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  >
                    <option>End-Semester</option>
                    <option>Odd Semester</option>
                    <option>Even Semester</option>
                    <option>Back Paper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Paper Code</label>
                  <input
                    type="text"
                    value={paperCode}
                    onChange={(e) => setPaperCode(e.target.value)}
                    placeholder="e.g., BCS401-2025"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Resource Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Operating Systems End-Sem 2025 Clean Scan"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Source Information</label>
                  <input
                    type="text"
                    required
                    value={sourceDescription}
                    onChange={(e) => setSourceDescription(e.target.value)}
                    placeholder="e.g., College library exam booklet / self-authored notes"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
              </div>

              <label className="block rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 bg-slate-50/70 dark:bg-slate-950/60 p-5 text-center cursor-pointer transition-colors">
                <FileUp className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mx-auto mb-2" />
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {file ? `Selected: ${file.name} (${(file.size / 1024).toFixed(0)} KB)` : 'Select PDF or High-Res Scan (Max 15 MB)'}
                </span>
                <span className="block text-[11px] text-slate-500 mt-1">
                  SHA-256 checksum automatically prevents duplicate uploads
                </span>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>

              {uploadProgress > 0 && (
                <AnimatedProgressBar
                  value={uploadProgress}
                  heightClass="h-2"
                  colorClass="bg-cyan-600"
                  label="Uploading & Computing SHA-256 Checksum"
                />
              )}

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rightsAccepted}
                    onChange={(e) => setRightsAccepted(e.target.checked)}
                    className="mt-0.5 accent-cyan-600"
                  />
                  <span>
                    Rights & Permission Declaration: I confirm this document is either an official past university question paper or original academic work I have permission to share.
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notLeakedAccepted}
                    onChange={(e) => setNotLeakedAccepted(e.target.checked)}
                    className="mt-0.5 accent-cyan-600"
                  />
                  <span>
                    Non-Leak Attestation: I confirm this submission is NOT leaked, confidential, or from an unreleased examination.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                {submitting ? 'Uploading & Hashing...' : 'Submit for Review'}
              </button>
            </form>
          </Reveal>

          {/* Submission History */}
          <Reveal delay={0.08}>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Submission History</h3>
              </div>
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                    <th className="py-3 px-4 font-medium">Title</th>
                    <th className="py-3 px-4 font-medium">Subject</th>
                    <th className="py-3 px-4 font-medium">Type</th>
                    <th className="py-3 px-4 font-medium text-right">Reward</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(data?.submissions || []).map((s: any) => (
                    <tr key={s._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {s.title}
                        {s.reviewerNotes && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">Reviewer Note: {s.reviewerNotes}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                        {s.subjectCode} · {s.examYear}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">{s.resourceType.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">₹{s.rewardAmountInr}</td>
                      <td className="py-3 px-4">
                        <StatusText status={s.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-3">
                          {(s.fileUrl || s.publishedPyqId) && (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewPaper({
                                  _id: s.publishedPyqId || undefined,
                                  fileUrl: s.fileUrl || undefined,
                                  title: s.title,
                                  paperCode: s.paperCode || s.subjectCode,
                                  examYear: s.examYear,
                                  examSession: s.examSession,
                                  universityName: s.universityCode,
                                  subjectName: s.subjectName,
                                  canDownload: true,
                                })
                              }
                              className="inline-flex items-center gap-1 text-xs font-medium text-cyan-700 dark:text-cyan-400 hover:underline cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                          )}
                          {['needs_correction', 'submitted', 'rejected'].includes(s.status) && (
                            <button
                              type="button"
                              onClick={() => openResubmitModal(s)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:underline cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                          )}
                          {['submitted', 'under_review', 'needs_correction'].includes(s.status) && (
                            <button
                              type="button"
                              onClick={() => handleWithdraw(s._id)}
                              className="text-xs text-rose-600 hover:underline cursor-pointer"
                            >
                              Withdraw
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          {/* Payout History */}
          {(data?.payouts || []).length > 0 && (
            <Reveal delay={0.1}>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Payout History</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {data.payouts.map((p: any) => (
                    <div key={p._id} className="py-2.5 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-mono font-semibold">₹{p.amountInr}</span> · UPI: {p.upiId}
                        {p.transactionReference && <span className="text-slate-500"> · Ref: {p.transactionReference}</span>}
                      </div>
                      <StatusText status={p.status === 'paid' ? 'paid' : 'pending'} label={p.status.toUpperCase()} />
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      )}

      {/* Resubmit Corrections Modal */}
      <AnimatePresence>
        {editingSub && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
            onClick={() => setEditingSub(null)}
          >
            <motion.form
              onSubmit={handleResubmit}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Update & Resubmit Resource
                </h3>
                <button type="button" onClick={() => setEditingSub(null)} className="text-slate-500 hover:text-slate-800 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {editingSub.reviewerNotes && (
                <p className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                  Reviewer Note: {editingSub.reviewerNotes}
                </p>
              )}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-medium mb-1">Paper Code</label>
                    <input
                      type="text"
                      value={editForm.paperCode}
                      onChange={(e) => setEditForm({ ...editForm, paperCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Year</label>
                    <input
                      type="number"
                      value={editForm.examYear}
                      onChange={(e) => setEditForm({ ...editForm, examYear: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Session</label>
                    <input
                      type="text"
                      value={editForm.examSession}
                      onChange={(e) => setEditForm({ ...editForm, examSession: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-1">Source Description</label>
                  <input
                    type="text"
                    required
                    value={editForm.sourceDescription}
                    onChange={(e) => setEditForm({ ...editForm, sourceDescription: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Replace File (Optional PDF/Scan)</label>
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-600 dark:text-slate-400"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="px-4 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {resubmitting ? 'Saving...' : 'Resubmit for Review'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <PdfViewerModal paper={previewPaper} onClose={() => setPreviewPaper(null)} />
    </DashboardLayout>
  );
}
