import { KeyRound, ShieldAlert, UserCheck } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AcademicCascadeSelector, type CascadeSelection } from '../../components/common/AcademicCascadeSelector.tsx';
import { AnimatedProgressBar, Reveal } from '../../components/common/MotionPrimitives.tsx';
import { ConfirmModal, StatusText } from '../../components/common/StateViews.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { DashboardLayout } from '../../layouts/DashboardLayout.tsx';
import { api, getApiErrorMessage } from '../../services/api.ts';

export function ProfileSettingsPage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [academic, setAcademic] = useState<CascadeSelection>({
    universityId: '',
    programmeId: '',
    branchId: '',
    academicYearId: '',
    semesterId: '',
    curriculumSchemeId: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [delMsg, setDelMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setPhone(user.phone || '');
    setCollegeName(user.collegeName || '');
    setAcademic({
      universityId: user.academicProfile?.universityId || '',
      programmeId: user.academicProfile?.programmeId || '',
      branchId: user.academicProfile?.branchId || '',
      academicYearId: user.academicProfile?.academicYearId || '',
      semesterId: user.academicProfile?.semesterId || '',
      curriculumSchemeId: user.academicProfile?.curriculumSchemeId || '',
    });
  }, [user]);

  const pwStrength = (() => {
    let score = 0;
    if (newPassword.length >= 8) score += 35;
    if (/[A-Z]/.test(newPassword)) score += 20;
    if (/[0-9]/.test(newPassword)) score += 25;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 20;
    return Math.min(100, score);
  })();

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    setSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', {
        name,
        phone,
        collegeName,
        academicProfile: academic,
      });
      await refreshUser();
      setProfileMsg(res.data.message);
      toast.success('Profile and academic curriculum mapping saved.');
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setProfileErr(msg);
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg('');
    setPwErr('');
    setSavingPw(true);
    try {
      const res = await api.put('/auth/change-password', { currentPassword, newPassword });
      setPwMsg(res.data.message);
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Account password updated.');
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setPwErr(msg);
      toast.error(msg);
    } finally {
      setSavingPw(false);
    }
  };

  const requestDeletion = async () => {
    setDeleting(true);
    try {
      const res = await api.post('/auth/delete-account-request');
      setDelMsg(res.data.message);
      setConfirmDeleteOpen(false);
      await refreshUser();
      toast.info('Account deletion request logged for compliance review.');
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setDelMsg(msg);
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout title="Profile & Account Settings">
      <div className="max-w-3xl space-y-6">
        {/* Account Overview Strip */}
        <Reveal>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-900 dark:bg-cyan-600 text-white font-display font-bold flex items-center justify-center text-base">
                {(user?.name || 'U').slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">{user?.name}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.email} · {user?.role?.replace(/_/g, ' ')}
                  {user?.academicProfile?.universityCode ? ` · ${user.academicProfile.universityCode}` : ''}
                </p>
              </div>
            </div>
            <StatusText
              status={user?.status === 'active' ? 'active' : 'pending'}
              label={user?.status === 'deletion_requested' ? 'Deletion Requested' : 'Account Active'}
            />
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <form onSubmit={saveProfile} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Personal & Academic Profile
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98XXXXXXXX"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">College / Institute</label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-600"
              />
            </div>

            {(user?.role === 'student' || user?.role === 'contributor') && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">Academic Curriculum Mapping</p>
                <AcademicCascadeSelector value={academic} onChange={setAcademic} />
              </div>
            )}

            {profileErr && <p className="text-xs text-rose-600 dark:text-rose-400">{profileErr}</p>}
            {profileMsg && <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{profileMsg}</p>}

            <button
              type="submit"
              disabled={savingProfile}
              className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </Reveal>

        <Reveal delay={0.1}>
          <form onSubmit={changePassword} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">Security & Password</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
              </div>
            </div>
            {newPassword && (
              <AnimatedProgressBar
                value={pwStrength}
                heightClass="h-1.5"
                colorClass={
                  pwStrength >= 80 ? 'bg-emerald-600' : pwStrength >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }
                label="Password Strength"
              />
            )}
            {pwErr && <p className="text-xs text-rose-600 dark:text-rose-400">{pwErr}</p>}
            {pwMsg && <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{pwMsg}</p>}
            <button
              type="submit"
              disabled={savingPw}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {savingPw ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </Reveal>

        <Reveal delay={0.14}>
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 p-6 space-y-3">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
              <h2 className="font-display text-base font-semibold">Privacy & Account Deletion</h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Submit a formal request to delete your UNIHUB personal data. Financial audit records remain retained as required by Indian tax compliance.
            </p>
            {delMsg && <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">{delMsg}</p>}
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              Request Account Deletion
            </button>
          </div>
        </Reveal>
      </div>

      <ConfirmModal
        open={confirmDeleteOpen}
        title="Confirm Account Deletion Request"
        description="This submits a formal privacy compliance deletion request to the platform administrator. Active financial receipts remain archived as mandated by tax regulations."
        confirmLabel="Submit Deletion Request"
        danger
        loading={deleting}
        onConfirm={requestDeletion}
        onClose={() => setConfirmDeleteOpen(false)}
      />
    </DashboardLayout>
  );
}
