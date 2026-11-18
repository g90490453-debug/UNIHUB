import { Eye, Plus, Search, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  AnimatedCounter,
  AnimatedProgressBar,
  StaggerContainer,
  StaggerItem,
} from '../../components/common/MotionPrimitives.tsx';
import { PdfViewerModal } from '../../components/common/PdfViewerModal.tsx';
import { LoadingSkeleton, StatusText } from '../../components/common/StateViews.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { DashboardLayout } from '../../layouts/DashboardLayout.tsx';
import { api, getApiErrorMessage } from '../../services/api.ts';

type AdminTab = 'reports' | 'users' | 'academic' | 'content' | 'contributors' | 'payments' | 'inbox';

export function AdminDashboard() {
  const toast = useToast();
  const [tab, setTab] = useState<AdminTab>('reports');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [reportsData, setReportsData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [academic, setAcademic] = useState<any>(null);
  const [pyqs, setPyqs] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [rewardsData, setRewardsData] = useState<any>(null);
  const [paymentsData, setPaymentsData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [previewPaper, setPreviewPaper] = useState<any>(null);

  // Academic Catalogue Forms
  const [uniForm, setUniForm] = useState({ code: '', name: '', shortName: '', location: '' });
  const [progForm, setProgForm] = useState({ universityId: '', code: '', name: '', durationSemesters: '8' });
  const [branchForm, setBranchForm] = useState({ universityId: '', programmeId: '', code: '', name: '' });
  const [semForm, setSemForm] = useState({ universityId: '', programmeId: '', number: '1', name: 'Semester 1' });
  const [schemeForm, setSchemeForm] = useState({ universityId: '', programmeId: '', code: '', name: '', effectiveFromYear: '2024' });
  const [subjForm, setSubjForm] = useState({
    universityId: '',
    programmeId: '',
    branchId: '',
    semesterId: '',
    curriculumSchemeId: '',
    code: '',
    name: '',
    credits: '4',
  });
  const [topicForm, setTopicForm] = useState({ subjectId: '', unitNumber: '1', name: '', syllabusWeightagePercent: '20' });

  // Content Forms (PYQ + Question + MockTest)
  const [pyqForm, setPyqForm] = useState({
    title: '',
    universityId: '',
    programmeId: '',
    branchId: '',
    semesterId: '',
    curriculumSchemeId: '',
    subjectId: '',
    examYear: '2025',
    examSession: 'End-Semester',
    paperCode: '',
    isSampleFree: false,
  });
  const [pyqFile, setPyqFile] = useState<File | null>(null);

  const [qForm, setQForm] = useState({
    universityId: '',
    subjectId: '',
    statement: '',
    questionType: 'mcq',
    difficulty: 'medium',
    marks: '2',
    examYear: '2025',
    optA: '',
    optB: '',
    optC: '',
    optD: '',
    correctAnswer: '',
    explanation: '',
  });

  const [testForm, setTestForm] = useState({
    title: '',
    description: '',
    universityId: '',
    programmeId: '',
    branchId: '',
    semesterId: '',
    curriculumSchemeId: '',
    subjectId: '',
    durationMinutes: '30',
    totalMarks: '20',
    isFreeSample: false,
    selectedQIds: [] as string[],
  });

  const [rateForm, setRateForm] = useState({
    pyq_paper: 15,
    complete_semester_set: 75,
    syllabus_document: 10,
    revision_notes: 35,
    mock_question: 4,
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [repRes, usrRes, acaRes, pyqRes, qRes, tstRes, rewRes, payRes, msgRes] = await Promise.all([
        api.get('/admin/reports'),
        api.get('/admin/users'),
        api.get('/admin/academic/all'),
        api.get('/admin/pyqs'),
        api.get('/admin/questions'),
        api.get('/admin/mock-tests'),
        api.get('/admin/rewards-payouts'),
        api.get('/admin/payments'),
        api.get('/admin/messages'),
      ]);
      setReportsData(repRes.data);
      setUsers(usrRes.data.users || []);
      setAcademic(acaRes.data);
      setPyqs(pyqRes.data.papers || []);
      setQuestions(qRes.data.questions || []);
      setTests(tstRes.data.tests || []);
      setRewardsData(rewRes.data);
      if (rewRes.data.setting?.rewardRates) setRateForm(rewRes.data.setting.rewardRates);
      setPaymentsData(payRes.data);
      setMessages(msgRes.data.messages || []);
    } catch (e) {
      setErr(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (userSearch.trim()) {
        const needle = userSearch.toLowerCase();
        return u.name?.toLowerCase().includes(needle) || u.email?.toLowerCase().includes(needle);
      }
      return true;
    });
  }, [users, userSearch, roleFilter]);

  const updateUser = async (id: string, patch: any) => {
    try {
      await api.patch(`/admin/users/${id}`, patch);
      toast.success('User account updated.');
      await loadAll();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const addUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/academic/universities', uniForm);
      setUniForm({ code: '', name: '', shortName: '', location: '' });
      toast.success('University added to academic catalogue.');
      await loadAll();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const addProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/academic/programmes', { ...progForm, durationSemesters: Number(progForm.durationSemesters) });
      setProgForm({ ...progForm, code: '', name: '' });
      toast.success('Programme added.');
      await loadAll();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const addBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/academic/branches', branchForm);
      setBranchForm({ ...branchForm, code: '', name: '' });
      toast.success('Branch added.');
      await loadAll();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const addSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/academic/semesters', { ...semForm, number: Number(semForm.number) });
      toast.success('Semester added.');
      await loadAll();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const addScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/academic/schemes', { ...schemeForm, effectiveFromYear: Number(schemeForm.effectiveFromYear) });
      setSchemeForm({ ...schemeForm, code: '', name: '' });
      toast.success('Curriculum scheme added.');
      await loadAll();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/academic/subjects', { ...subjForm, credits: Number(subjForm.credits) });
      setSubjForm({ ...subjForm, code: '', name: '' });
      toast.success('Subject created cleanly.');
      await loadAll();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const addTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/academic/topics', {
        subjectId: topicForm.subjectId,
        unitNumber: Number(topicForm.unitNumber),
        name: topicForm.name,
        syllabusWeightagePercent: Number(topicForm.syllabusWeightagePercent),
      });
      setTopicForm({ ...topicForm, name: '' });
      toast.success('Syllabus topic mapped.');
      await loadAll();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const publishPyq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(pyqForm).forEach(([k, v]) => fd.append(k, String(v)));
      if (pyqFile) fd.append('file', pyqFile);
      await api.post('/admin/pyqs', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPyqForm({ ...pyqForm, title: '', paperCode: '' });
      setPyqFile(null);
      toast.success('Official PYQ published to library.');
      await loadAll();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const updatePyqStatus = async (id: string, qualityStatus: string) => {
    try {
      await api.patch(`/admin/pyqs/${id}`, { qualityStatus });
      toast.success(`PYQ status changed to ${qualityStatus}.`);
      await loadAll();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const createQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const options =
        qForm.questionType === 'mcq'
          ? [qForm.optA, qForm.optB, qForm.optC, qForm.optD].filter(Boolean)
          : qForm.questionType === 'true_false'
            ? ['True', 'False']
            : [];
      await api.post('/admin/questions', {
        universityId: qForm.universityId,
        subjectId: qForm.subjectId,
        statement: qForm.statement,
        questionType: qForm.questionType,
        difficulty: qForm.difficulty,
        marks: Number(qForm.marks),
        examYear: Number(qForm.examYear),
        options,
        correctAnswer: qForm.correctAnswer,
        explanation: qForm.explanation,
        isVerifiedExplanation: Boolean(qForm.explanation.trim()),
      });
      setQForm({ ...qForm, statement: '', optA: '', optB: '', optC: '', optD: '', correctAnswer: '', explanation: '' });
      toast.success('Question added to Question Bank.');
      await loadAll();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      await api.delete(`/admin/questions/${id}`);
      toast.info('Question deleted.');
      await loadAll();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const createMockTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (testForm.selectedQIds.length === 0) {
      toast.error('Select at least one question from the Question Bank.');
      return;
    }
    try {
      await api.post('/admin/mock-tests', {
        title: testForm.title,
        description: testForm.description,
        universityId: testForm.universityId,
        programmeId: testForm.programmeId,
        branchId: testForm.branchId,
        semesterId: testForm.semesterId,
        curriculumSchemeId: testForm.curriculumSchemeId,
        subjectId: testForm.subjectId || null,
        durationMinutes: Number(testForm.durationMinutes),
        totalMarks: Number(testForm.totalMarks),
        isFreeSample: testForm.isFreeSample,
        questionIds: testForm.selectedQIds,
      });
      setTestForm({ ...testForm, title: '', description: '', selectedQIds: [] });
      toast.success('Mock test created and published.');
      await loadAll();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const toggleTestPublish = async (id: string, isPublished: boolean) => {
    try {
      await api.patch(`/admin/mock-tests/${id}`, { isPublished });
      toast.info(isPublished ? 'Mock test published.' : 'Mock test unpublished.');
      await loadAll();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const saveRewardRates = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/admin/reward-rates', rateForm);
      toast.success('Contributor reward configuration saved.');
      await loadAll();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const approvePayout = async (id: string) => {
    try {
      await api.post(`/admin/payouts/${id}/approve`, {});
      toast.success('Payout approved and marked paid.');
      await loadAll();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const refundPurchase = async (id: string) => {
    try {
      await api.post(`/admin/purchases/${id}/refund`, { reason: 'Admin issued refund' });
      toast.info('Refund issued and entitlement revoked.');
      await loadAll();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const updatePackagePrice = async (id: string, priceInr: number) => {
    try {
      await api.patch(`/admin/packages/${id}`, { priceInr });
      toast.success('Package pricing updated.');
      await loadAll();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const updateMessageStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/messages/${id}`, { status });
      toast.success(`Inquiry marked ${status.replace('_', ' ')}.`);
      await loadAll();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const openInquiries = messages.filter((m) => m.status === 'new').length;

  return (
    <DashboardLayout title="Platform Administration Console">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit">
          {[
            { id: 'reports', label: 'Reports & Audit' },
            { id: 'users', label: `Users (${users.length})` },
            { id: 'academic', label: 'Academic Catalogue' },
            { id: 'content', label: 'PYQs, Bank & Mocks' },
            { id: 'contributors', label: 'Rewards & Payouts' },
            { id: 'payments', label: 'Payments & Plans' },
            { id: 'inbox', label: `Support Inbox (${openInquiries})` },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as AdminTab)}
                className={`relative px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  active ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="admin-tab-pill"
                    transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                    className="absolute inset-0 rounded-lg bg-white dark:bg-slate-800 shadow-sm"
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>

        {err && <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/30 px-4 py-2.5 text-xs text-rose-700 dark:text-rose-300">{err}</div>}

        {loading && !reportsData ? (
          <LoadingSkeleton rows={6} />
        ) : (
          <AnimatePresence mode="wait">
            {tab === 'reports' && reportsData && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                    <p className="text-xs text-slate-500">Registered Students</p>
                    <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      <AnimatedCounter value={reportsData.reports.totalStudents} />
                    </p>
                  </StaggerItem>
                  <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                    <p className="text-xs text-slate-500">Approved PYQs</p>
                    <p className="font-mono tabular-nums text-2xl font-bold text-cyan-700 dark:text-cyan-400 mt-1">
                      <AnimatedCounter value={reportsData.reports.approvedPyqs} />/{reportsData.reports.totalResources}
                    </p>
                  </StaggerItem>
                  <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                    <p className="text-xs text-slate-500">Gross Revenue</p>
                    <p className="font-mono tabular-nums text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                      <AnimatedCounter value={reportsData.reports.grossRevenueInr} prefix="₹" />
                    </p>
                  </StaggerItem>
                  <StaggerItem className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">Syllabus Coverage</p>
                      <p className="font-mono tabular-nums text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                        <AnimatedCounter value={reportsData.reports.contentCoveragePercent} suffix="%" />
                      </p>
                    </div>
                    <AnimatedProgressBar value={reportsData.reports.contentCoveragePercent} heightClass="h-1.5" />
                  </StaggerItem>
                </StaggerContainer>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                    <h2 className="font-display text-base font-semibold">Revenue by Semester Package (INR)</h2>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportsData.revenueByPackage || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                          <XAxis dataKey="packageCode" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="revenue" fill="#0891b2" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                    <h2 className="font-display text-base font-semibold">Account Distribution by Role</h2>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportsData.roleDistribution || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                          <XAxis dataKey="role" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#0f172a" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                  <h2 className="font-display text-base font-semibold">Recent Security & Audit Logs</h2>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs max-h-80 overflow-y-auto">
                    {(reportsData.auditLogs || []).map((log: any) => (
                      <div key={log._id} className="py-2.5 flex flex-wrap justify-between gap-2">
                        <div>
                          <span className="font-mono font-semibold text-cyan-700 dark:text-cyan-400">{log.action}</span> ·{' '}
                          <span className="text-slate-700 dark:text-slate-300">{log.summary}</span>
                        </div>
                        <span className="font-mono text-slate-400">
                          {log.actorEmail} · {new Date(log.createdAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search users by name or email..."
                      className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="all">All Roles</option>
                    <option value="student">Student</option>
                    <option value="contributor">Contributor</option>
                    <option value="campus_lead">Campus Lead</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                        <th className="py-3 px-4 font-medium">Name & Email</th>
                        <th className="py-3 px-4 font-medium">Role</th>
                        <th className="py-3 px-4 font-medium">Status</th>
                        <th className="py-3 px-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {filteredUsers.map((u) => (
                        <tr key={u._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900 dark:text-white">{u.name}</p>
                            <p className="text-slate-500">{u.email}</p>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={u.role}
                              onChange={(e) => updateUser(u._id, { role: e.target.value })}
                              className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                            >
                              <option value="student">student</option>
                              <option value="contributor">contributor</option>
                              <option value="campus_lead">campus_lead</option>
                              <option value="reviewer">reviewer</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <StatusText status={u.status === 'active' ? 'active' : 'rejected'} label={u.status} />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                updateUser(u._id, { status: u.status === 'suspended' ? 'active' : 'suspended' })
                              }
                              className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline cursor-pointer"
                            >
                              {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {tab === 'academic' && academic && (
              <motion.div
                key="academic"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                <form onSubmit={addUniversity} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                  <h2 className="font-display text-base font-semibold">1. Add Supported University</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" required placeholder="Code (e.g., DTU)" value={uniForm.code} onChange={(e) => setUniForm({ ...uniForm, code: e.target.value })} className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                    <input type="text" required placeholder="Location" value={uniForm.location} onChange={(e) => setUniForm({ ...uniForm, location: e.target.value })} className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                  </div>
                  <input type="text" required placeholder="Full University Name" value={uniForm.name} onChange={(e) => setUniForm({ ...uniForm, name: e.target.value, shortName: e.target.value })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                  <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white cursor-pointer">Add University</button>
                </form>

                <form onSubmit={addProgramme} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                  <h2 className="font-display text-base font-semibold">2. Add Programme / Degree</h2>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <select required value={progForm.universityId} onChange={(e) => setProgForm({ ...progForm, universityId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                      <option value="">University</option>
                      {academic.universities.map((u: any) => <option key={u._id} value={u._id}>{u.code}</option>)}
                    </select>
                    <input type="text" required placeholder="Code (e.g., BTECH)" value={progForm.code} onChange={(e) => setProgForm({ ...progForm, code: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                    <input type="text" required placeholder="Name (e.g., B.Tech)" value={progForm.name} onChange={(e) => setProgForm({ ...progForm, name: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                    <input type="number" required placeholder="Semesters" value={progForm.durationSemesters} onChange={(e) => setProgForm({ ...progForm, durationSemesters: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                  </div>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white cursor-pointer">Add Programme</button>
                </form>

                <form onSubmit={addBranch} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                  <h2 className="font-display text-base font-semibold">3. Add Branch / Specialisation</h2>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <select required value={branchForm.universityId} onChange={(e) => setBranchForm({ ...branchForm, universityId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                      <option value="">University</option>
                      {academic.universities.map((u: any) => <option key={u._id} value={u._id}>{u.code}</option>)}
                    </select>
                    <select required value={branchForm.programmeId} onChange={(e) => setBranchForm({ ...branchForm, programmeId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                      <option value="">Programme</option>
                      {academic.programmes.filter((p: any) => !branchForm.universityId || p.universityId === branchForm.universityId).map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                    <input type="text" required placeholder="Code (e.g., CSE)" value={branchForm.code} onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                    <input type="text" required placeholder="Branch Name" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                  </div>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white cursor-pointer">Add Branch</button>
                </form>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
                  <form onSubmit={addSemester} className="space-y-2.5">
                    <h2 className="font-display text-base font-semibold">4. Add Semester & Curriculum Scheme</h2>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <select required value={semForm.universityId} onChange={(e) => setSemForm({ ...semForm, universityId: e.target.value })} className="px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                        <option value="">Uni</option>
                        {academic.universities.map((u: any) => <option key={u._id} value={u._id}>{u.code}</option>)}
                      </select>
                      <select required value={semForm.programmeId} onChange={(e) => setSemForm({ ...semForm, programmeId: e.target.value })} className="px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                        <option value="">Prog</option>
                        {academic.programmes.filter((p: any) => !semForm.universityId || p.universityId === semForm.universityId).map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                      <input type="number" min={1} max={10} required value={semForm.number} onChange={(e) => setSemForm({ ...semForm, number: e.target.value, name: `Semester ${e.target.value}` })} className="px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                      <button type="submit" className="px-3 py-2 font-semibold rounded bg-slate-900 dark:bg-cyan-600 text-white cursor-pointer">+ Sem</button>
                    </div>
                  </form>

                  <form onSubmit={addScheme} className="grid grid-cols-4 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <select required value={schemeForm.universityId} onChange={(e) => setSchemeForm({ ...schemeForm, universityId: e.target.value })} className="px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                      <option value="">Uni</option>
                      {academic.universities.map((u: any) => <option key={u._id} value={u._id}>{u.code}</option>)}
                    </select>
                    <select required value={schemeForm.programmeId} onChange={(e) => setSchemeForm({ ...schemeForm, programmeId: e.target.value })} className="px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                      <option value="">Prog</option>
                      {academic.programmes.filter((p: any) => !schemeForm.universityId || p.universityId === schemeForm.universityId).map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                    <input type="text" required placeholder="Scheme Code" value={schemeForm.code} onChange={(e) => setSchemeForm({ ...schemeForm, code: e.target.value, name: e.target.value })} className="px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                    <button type="submit" className="px-3 py-2 font-semibold rounded bg-slate-900 dark:bg-cyan-600 text-white cursor-pointer">+ Scheme</button>
                  </form>
                </div>

                <form onSubmit={addSubject} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                  <h2 className="font-display text-base font-semibold">5. Add Curriculum Subject</h2>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <select required value={subjForm.universityId} onChange={(e) => setSubjForm({ ...subjForm, universityId: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                      <option value="">University</option>
                      {academic.universities.map((u: any) => <option key={u._id} value={u._id}>{u.code}</option>)}
                    </select>
                    <select required value={subjForm.programmeId} onChange={(e) => setSubjForm({ ...subjForm, programmeId: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                      <option value="">Programme</option>
                      {academic.programmes.filter((p: any) => !subjForm.universityId || p.universityId === subjForm.universityId).map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                    <select required value={subjForm.branchId} onChange={(e) => setSubjForm({ ...subjForm, branchId: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                      <option value="">Branch</option>
                      {academic.branches.filter((b: any) => !subjForm.programmeId || b.programmeId === subjForm.programmeId).map((b: any) => <option key={b._id} value={b._id}>{b.code}</option>)}
                    </select>
                    <select required value={subjForm.semesterId} onChange={(e) => setSubjForm({ ...subjForm, semesterId: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                      <option value="">Semester</option>
                      {academic.semesters.filter((s: any) => !subjForm.programmeId || s.programmeId === subjForm.programmeId).map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                    <select required value={subjForm.curriculumSchemeId} onChange={(e) => setSubjForm({ ...subjForm, curriculumSchemeId: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                      <option value="">Scheme</option>
                      {academic.schemes.filter((sc: any) => !subjForm.programmeId || sc.programmeId === subjForm.programmeId).map((sc: any) => <option key={sc._id} value={sc._id}>{sc.code}</option>)}
                    </select>
                    <input type="text" required placeholder="Code (e.g., BCS404)" value={subjForm.code} onChange={(e) => setSubjForm({ ...subjForm, code: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                  </div>
                  <input type="text" required placeholder="Subject Name" value={subjForm.name} onChange={(e) => setSubjForm({ ...subjForm, name: e.target.value })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                  <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white cursor-pointer">Add Subject</button>
                </form>

                <form onSubmit={addTopic} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                  <h2 className="font-display text-base font-semibold">6. Map Syllabus Topic to Subject</h2>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <select required value={topicForm.subjectId} onChange={(e) => setTopicForm({ ...topicForm, subjectId: e.target.value })} className="col-span-2 px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                      <option value="">Select Subject</option>
                      {academic.subjects.map((sub: any) => <option key={sub._id} value={sub._id}>{sub.code} — {sub.name}</option>)}
                    </select>
                    <input type="number" min={1} max={10} required placeholder="Unit #" value={topicForm.unitNumber} onChange={(e) => setTopicForm({ ...topicForm, unitNumber: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                    <input type="number" min={5} max={100} required placeholder="Weightage %" value={topicForm.syllabusWeightagePercent} onChange={(e) => setTopicForm({ ...topicForm, syllabusWeightagePercent: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                  </div>
                  <input type="text" required placeholder="Topic Name (e.g., Deadlock Avoidance)" value={topicForm.name} onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                  <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white cursor-pointer">Add Syllabus Topic</button>
                </form>

                <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2 text-xs">
                  <h3 className="font-display text-sm font-semibold">Active Academic Inventory</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Universities: <span className="font-mono font-semibold">{academic.universities.length}</span> · Programmes:{' '}
                    <span className="font-mono font-semibold">{academic.programmes.length}</span> · Branches:{' '}
                    <span className="font-mono font-semibold">{academic.branches.length}</span> · Schemes:{' '}
                    <span className="font-mono font-semibold">{academic.schemes.length}</span> · Subjects:{' '}
                    <span className="font-mono font-semibold">{academic.subjects.length}</span> · Topics:{' '}
                    <span className="font-mono font-semibold">{academic.topics.length}</span>
                  </p>
                </div>
              </motion.div>
            )}

            {tab === 'content' && academic && (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Official PYQ Upload + Moderation */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <form onSubmit={publishPyq} className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
                    <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-cyan-600" /> Publish Official PYQ Paper
                    </h2>
                    <input type="text" required placeholder="Paper Title" value={pyqForm.title} onChange={(e) => setPyqForm({ ...pyqForm, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                    <div className="grid grid-cols-2 gap-2">
                      <select required value={pyqForm.universityId} onChange={(e) => setPyqForm({ ...pyqForm, universityId: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                        <option value="">University</option>
                        {academic.universities.map((u: any) => <option key={u._id} value={u._id}>{u.code}</option>)}
                      </select>
                      <select required value={pyqForm.programmeId} onChange={(e) => setPyqForm({ ...pyqForm, programmeId: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                        <option value="">Programme</option>
                        {academic.programmes.filter((p: any) => !pyqForm.universityId || p.universityId === pyqForm.universityId).map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                      <select required value={pyqForm.branchId} onChange={(e) => setPyqForm({ ...pyqForm, branchId: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                        <option value="">Branch</option>
                        {academic.branches.filter((b: any) => !pyqForm.programmeId || b.programmeId === pyqForm.programmeId).map((b: any) => <option key={b._id} value={b._id}>{b.code}</option>)}
                      </select>
                      <select required value={pyqForm.semesterId} onChange={(e) => setPyqForm({ ...pyqForm, semesterId: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                        <option value="">Semester</option>
                        {academic.semesters.filter((s: any) => !pyqForm.programmeId || s.programmeId === pyqForm.programmeId).map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                      <select required value={pyqForm.curriculumSchemeId} onChange={(e) => setPyqForm({ ...pyqForm, curriculumSchemeId: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                        <option value="">Scheme</option>
                        {academic.schemes.filter((sc: any) => !pyqForm.programmeId || sc.programmeId === pyqForm.programmeId).map((sc: any) => <option key={sc._id} value={sc._id}>{sc.code}</option>)}
                      </select>
                      <select required value={pyqForm.subjectId} onChange={(e) => setPyqForm({ ...pyqForm, subjectId: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                        <option value="">Subject</option>
                        {academic.subjects.filter((s: any) => !pyqForm.universityId || s.universityId === pyqForm.universityId).map((s: any) => <option key={s._id} value={s._id}>{s.code}</option>)}
                      </select>
                      <input type="text" required placeholder="Paper Code" value={pyqForm.paperCode} onChange={(e) => setPyqForm({ ...pyqForm, paperCode: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                      <input type="number" required placeholder="Year" value={pyqForm.examYear} onChange={(e) => setPyqForm({ ...pyqForm, examYear: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                    </div>
                    <input type="file" accept=".pdf" onChange={(e) => setPyqFile(e.target.files?.[0] || null)} className="block w-full text-xs text-slate-500" />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={pyqForm.isSampleFree} onChange={(e) => setPyqForm({ ...pyqForm, isSampleFree: e.target.checked })} className="accent-cyan-600" />
                      <span>Make available as Free Sample</span>
                    </label>
                    <button type="submit" className="w-full py-2 font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white cursor-pointer">
                      Publish PYQ Paper
                    </button>
                  </form>

                  <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
                    <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                      <h2 className="font-display text-base font-semibold">PYQ Moderation & Archive Control ({pyqs.length})</h2>
                    </div>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                          <th className="py-3 px-4 font-medium">Title</th>
                          <th className="py-3 px-4 font-medium">Code / Year</th>
                          <th className="py-3 px-4 font-medium">Status</th>
                          <th className="py-3 px-4 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {pyqs.map((p) => (
                          <tr key={p._id}>
                            <td className="py-3 px-4 font-medium">{p.title}</td>
                            <td className="py-3 px-4 font-mono">{p.paperCode} · {p.examYear}</td>
                            <td className="py-3 px-4"><StatusText status={p.qualityStatus} /></td>
                            <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setPreviewPaper({ _id: p._id, title: p.title, paperCode: p.paperCode, examYear: p.examYear, canDownload: true })}
                                className="text-cyan-700 dark:text-cyan-400 hover:underline cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 inline" />
                              </button>
                              <button type="button" onClick={() => updatePyqStatus(p._id, 'approved')} className="text-emerald-700 hover:underline cursor-pointer">Approve</button>
                              <button type="button" onClick={() => updatePyqStatus(p._id, 'archived')} className="text-slate-500 hover:underline cursor-pointer">Archive</button>
                              <button type="button" onClick={() => updatePyqStatus(p._id, 'withdrawn')} className="text-rose-600 hover:underline cursor-pointer">Withdraw</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Question Bank Builder & Mock Test Builder */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <form onSubmit={createQuestion} className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
                    <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">Add Question Bank Item</h2>
                    <div className="grid grid-cols-2 gap-2">
                      <select required value={qForm.universityId} onChange={(e) => setQForm({ ...qForm, universityId: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                        <option value="">University</option>
                        {academic.universities.map((u: any) => <option key={u._id} value={u._id}>{u.code}</option>)}
                      </select>
                      <select required value={qForm.subjectId} onChange={(e) => setQForm({ ...qForm, subjectId: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                        <option value="">Subject</option>
                        {academic.subjects.filter((s: any) => !qForm.universityId || s.universityId === qForm.universityId).map((s: any) => <option key={s._id} value={s._id}>{s.code} — {s.name}</option>)}
                      </select>
                      <select value={qForm.questionType} onChange={(e) => setQForm({ ...qForm, questionType: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                        <option value="mcq">MCQ</option>
                        <option value="true_false">True / False</option>
                        <option value="short_answer">Short Answer</option>
                        <option value="descriptive">Descriptive</option>
                      </select>
                      <select value={qForm.difficulty} onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <textarea rows={2} required placeholder="Question Statement" value={qForm.statement} onChange={(e) => setQForm({ ...qForm, statement: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                    {qForm.questionType === 'mcq' && (
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Option A" value={qForm.optA} onChange={(e) => setQForm({ ...qForm, optA: e.target.value })} className="px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                        <input type="text" placeholder="Option B" value={qForm.optB} onChange={(e) => setQForm({ ...qForm, optB: e.target.value })} className="px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                        <input type="text" placeholder="Option C" value={qForm.optC} onChange={(e) => setQForm({ ...qForm, optC: e.target.value })} className="px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                        <input type="text" placeholder="Option D" value={qForm.optD} onChange={(e) => setQForm({ ...qForm, optD: e.target.value })} className="px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Correct Answer (for MCQ/TF)" value={qForm.correctAnswer} onChange={(e) => setQForm({ ...qForm, correctAnswer: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                      <input type="number" min={1} max={20} placeholder="Marks" value={qForm.marks} onChange={(e) => setQForm({ ...qForm, marks: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                    </div>
                    <input type="text" placeholder="Verified Explanation" value={qForm.explanation} onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                    <button type="submit" className="px-4 py-2 font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white cursor-pointer">
                      Save Question ({questions.length} indexed)
                    </button>
                  </form>

                  <form onSubmit={createMockTest} className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
                    <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">Assemble New Mock Test</h2>
                    <input type="text" required placeholder="Mock Test Title" value={testForm.title} onChange={(e) => setTestForm({ ...testForm, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                    <div className="grid grid-cols-2 gap-2">
                      <select required value={testForm.universityId} onChange={(e) => setTestForm({ ...testForm, universityId: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                        <option value="">University</option>
                        {academic.universities.map((u: any) => <option key={u._id} value={u._id}>{u.code}</option>)}
                      </select>
                      <select required value={testForm.programmeId} onChange={(e) => setTestForm({ ...testForm, programmeId: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                        <option value="">Programme</option>
                        {academic.programmes.filter((p: any) => !testForm.universityId || p.universityId === testForm.universityId).map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                      <select required value={testForm.branchId} onChange={(e) => setTestForm({ ...testForm, branchId: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                        <option value="">Branch</option>
                        {academic.branches.filter((b: any) => !testForm.programmeId || b.programmeId === testForm.programmeId).map((b: any) => <option key={b._id} value={b._id}>{b.code}</option>)}
                      </select>
                      <select required value={testForm.semesterId} onChange={(e) => setTestForm({ ...testForm, semesterId: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                        <option value="">Semester</option>
                        {academic.semesters.filter((s: any) => !testForm.programmeId || s.programmeId === testForm.programmeId).map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                      <select required value={testForm.curriculumSchemeId} onChange={(e) => setTestForm({ ...testForm, curriculumSchemeId: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                        <option value="">Scheme</option>
                        {academic.schemes.filter((sc: any) => !testForm.programmeId || sc.programmeId === testForm.programmeId).map((sc: any) => <option key={sc._id} value={sc._id}>{sc.code}</option>)}
                      </select>
                      <input type="number" min={5} placeholder="Minutes" value={testForm.durationMinutes} onChange={(e) => setTestForm({ ...testForm, durationMinutes: e.target.value })} className="px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                    </div>
                    <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 space-y-1.5">
                      <p className="font-semibold text-slate-600 dark:text-slate-400">Select Questions ({testForm.selectedQIds.length} chosen):</p>
                      {questions.slice(0, 20).map((q: any) => {
                        const checked = testForm.selectedQIds.includes(q._id);
                        return (
                          <label key={q._id} className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setTestForm((prev) => ({
                                  ...prev,
                                  selectedQIds: checked
                                    ? prev.selectedQIds.filter((id) => id !== q._id)
                                    : [...prev.selectedQIds, q._id],
                                }))
                              }
                              className="mt-0.5 accent-cyan-600"
                            />
                            <span className="line-clamp-1">{q.statement}</span>
                          </label>
                        );
                      })}
                    </div>
                    <button type="submit" className="w-full py-2 font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white cursor-pointer">
                      Create & Publish Mock Test
                    </button>
                  </form>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
                    <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                      <h2 className="font-display text-base font-semibold">Mock Tests Publication Control</h2>
                    </div>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                          <th className="py-3 px-4 font-medium">Test Title</th>
                          <th className="py-3 px-4 font-medium">Duration / Marks</th>
                          <th className="py-3 px-4 font-medium">Status</th>
                          <th className="py-3 px-4 font-medium text-right">Toggle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {tests.map((t) => (
                          <tr key={t._id}>
                            <td className="py-3 px-4 font-medium">{t.title}</td>
                            <td className="py-3 px-4 font-mono">{t.durationMinutes}m · {t.totalMarks} marks</td>
                            <td className="py-3 px-4">
                              <StatusText status={t.isPublished ? 'active' : 'withdrawn'} label={t.isPublished ? 'Published' : 'Unpublished'} />
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => toggleTestPublish(t._id, !t.isPublished)}
                                className="text-cyan-700 dark:text-cyan-400 font-semibold hover:underline cursor-pointer"
                              >
                                {t.isPublished ? 'Unpublish' : 'Publish'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
                    <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                      <h2 className="font-display text-base font-semibold">Recent Question Bank Items</h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs max-h-72 overflow-y-auto">
                      {questions.slice(0, 15).map((q) => (
                        <div key={q._id} className="px-4 py-3 flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white line-clamp-1">{q.statement}</p>
                            <p className="text-slate-500 mt-0.5 font-mono">
                              {q.questionType.toUpperCase()} · {q.difficulty} · {q.marks}m
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteQuestion(q._id)}
                            aria-label="Delete question"
                            className="text-rose-600 hover:text-rose-500 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'contributors' && rewardsData && (
              <motion.div
                key="contributors"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                <form onSubmit={saveRewardRates} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                  <h2 className="font-display text-base font-semibold">Configurable Contributor Rewards (INR)</h2>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {[
                      { k: 'pyq_paper', label: 'PYQ Paper (₹10–15)' },
                      { k: 'complete_semester_set', label: 'Complete Semester Set (~₹75)' },
                      { k: 'syllabus_document', label: 'Syllabus Doc (~₹10)' },
                      { k: 'revision_notes', label: 'Revision Notes (₹20–50)' },
                      { k: 'mock_question', label: 'Mock Question (₹2–5)' },
                    ].map((f) => (
                      <div key={f.k}>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1">{f.label}</label>
                        <input
                          type="number"
                          value={(rateForm as any)[f.k]}
                          onChange={(e) => setRateForm({ ...rateForm, [f.k]: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                        />
                      </div>
                    ))}
                  </div>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white cursor-pointer">
                    Save Reward Rates
                  </button>
                </form>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                  <h2 className="font-display text-base font-semibold">Contributor Payout Requests</h2>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {(rewardsData.payouts || []).length === 0 ? (
                      <p className="text-slate-500 py-4">No payout requests submitted yet.</p>
                    ) : (
                      rewardsData.payouts.map((p: any) => (
                        <div key={p._id} className="py-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">{p.contributorName} · ₹{p.amountInr}</p>
                            <p className="text-slate-500">UPI: {p.upiId}</p>
                          </div>
                          {p.status === 'paid' ? (
                            <StatusText status="paid" label="Paid" />
                          ) : (
                            <button
                              type="button"
                              onClick={() => approvePayout(p._id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold cursor-pointer"
                            >
                              Approve & Pay
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'payments' && paymentsData && (
              <motion.div
                key="payments"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                  <h2 className="font-display text-base font-semibold">Configure Semester Package Pilot Pricing</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    {paymentsData.packages.map((pkg: any) => (
                      <div key={pkg._id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold">{pkg.name}</p>
                          <p className="text-slate-500">{pkg.validityMonths}m validity</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>₹</span>
                          <input
                            type="number"
                            defaultValue={pkg.priceInr}
                            onBlur={(e) => {
                              const next = Number(e.target.value);
                              if (next !== pkg.priceInr) updatePackagePrice(pkg._id, next);
                            }}
                            className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-right"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
                  <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="font-display text-base font-semibold">Transactions & Refunds</h2>
                  </div>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="py-3 px-4 font-medium">Receipt</th>
                        <th className="py-3 px-4 font-medium">Student</th>
                        <th className="py-3 px-4 font-medium">Package</th>
                        <th className="py-3 px-4 font-medium text-right">Amount</th>
                        <th className="py-3 px-4 font-medium">Status</th>
                        <th className="py-3 px-4 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paymentsData.purchases.map((pur: any) => (
                        <tr key={pur._id}>
                          <td className="py-3 px-4 font-mono">{pur.receiptNumber}</td>
                          <td className="py-3 px-4">{pur.studentName} ({pur.studentEmail})</td>
                          <td className="py-3 px-4">{pur.packageCode}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">₹{pur.finalAmountInr}</td>
                          <td className="py-3 px-4"><StatusText status={pur.status === 'paid' ? 'paid' : pur.status === 'failed' ? 'failed' : 'withdrawn'} label={pur.status} /></td>
                          <td className="py-3 px-4 text-right">
                            {pur.status === 'paid' && (
                              <button
                                type="button"
                                onClick={() => refundPurchase(pur._id)}
                                className="text-rose-600 font-semibold hover:underline cursor-pointer"
                              >
                                Refund & Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {tab === 'inbox' && (
              <motion.div
                key="inbox"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
              >
                <h2 className="font-display text-base font-semibold">Support Inquiries & Campus Feedback Inbox</h2>
                {messages.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6">No support inquiries or campus feedback records yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {messages.map((m) => (
                      <div key={m._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white">{m.name}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500">{m.email}</span>
                            {m.university && (
                              <>
                                <span className="text-slate-400">·</span>
                                <span className="font-mono text-cyan-700 dark:text-cyan-400">{m.university}</span>
                              </>
                            )}
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500">{m.category.replace(/_/g, ' ')}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{m.message}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <StatusText status={m.status || 'new'} />
                          <select
                            value={m.status || 'new'}
                            onChange={(e) => updateMessageStatus(m._id, e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                          >
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <PdfViewerModal paper={previewPaper} onClose={() => setPreviewPaper(null)} />
    </DashboardLayout>
  );
}
