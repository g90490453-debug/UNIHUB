import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AcademicCascadeSelector, type CascadeSelection } from '../../components/common/AcademicCascadeSelector.tsx';
import { Reveal } from '../../components/common/MotionPrimitives.tsx';
import { getDefaultRouteForRole, useAuth } from '../../context/AuthContext.tsx';
import { PublicLayout } from '../../layouts/PublicLayout.tsx';
import { api, getApiErrorMessage } from '../../services/api.ts';

export function OnboardingPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next');

  const [selection, setSelection] = useState<CascadeSelection>({
    universityId: user?.academicProfile?.universityId || '',
    programmeId: user?.academicProfile?.programmeId || '',
    branchId: user?.academicProfile?.branchId || '',
    academicYearId: user?.academicProfile?.academicYearId || '',
    semesterId: user?.academicProfile?.semesterId || '',
    curriculumSchemeId: user?.academicProfile?.curriculumSchemeId || '',
  });
  const [collegeName, setCollegeName] = useState(user?.collegeName || '');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.put('/auth/onboarding', {
        ...selection,
        collegeName,
        upiId,
      });
      await refreshUser();
      navigate(nextPath || getDefaultRouteForRole(res.data.user));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <Reveal>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
            <div>
              <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">Academic Profile Setup</p>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
                Select your university and curriculum scheme
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                UNIHUB filters all PYQs, mock tests, and solutions strictly to your selected profile.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AcademicCascadeSelector value={selection} onChange={setSelection} />

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  College / Institute Name
                </label>
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="e.g., JSS Academy of Technical Education, Noida"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              {user?.role === 'contributor' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    UPI ID for Approved Contributor Payouts
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="name@okaxis"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg bg-slate-900 dark:bg-cyan-600 text-white hover:bg-slate-800 dark:hover:bg-cyan-500 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loading ? 'Saving Academic Profile...' : 'Save & Enter Workspace'}
              </button>
            </form>
          </div>
        </Reveal>
      </section>
    </PublicLayout>
  );
}
