import { useEffect, useState } from 'react';
import { api } from '../../services/api.ts';

export interface CascadeSelection {
  universityId: string;
  programmeId: string;
  branchId: string;
  academicYearId: string;
  semesterId: string;
  curriculumSchemeId: string;
  subjectId?: string;
}

export function AcademicCascadeSelector({
  value,
  onChange,
  includeSubject = false,
}: {
  value: CascadeSelection;
  onChange: (next: CascadeSelection) => void;
  includeSubject?: boolean;
}) {
  const [options, setOptions] = useState<{
    universities: any[];
    academicYears: any[];
    programmes: any[];
    branches: any[];
    semesters: any[];
    curriculumSchemes: any[];
    subjects: any[];
  }>({
    universities: [],
    academicYears: [],
    programmes: [],
    branches: [],
    semesters: [],
    curriculumSchemes: [],
    subjects: [],
  });

  useEffect(() => {
    let active = true;
    api
      .get('/academic/cascade', {
        params: {
          universityId: value.universityId || undefined,
          programmeId: value.programmeId || undefined,
          branchId: value.branchId || undefined,
          semesterId: value.semesterId || undefined,
          curriculumSchemeId: value.curriculumSchemeId || undefined,
        },
      })
      .then((res) => {
        if (active) setOptions(res.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [value.universityId, value.programmeId, value.branchId, value.semesterId, value.curriculumSchemeId]);

  const inputClass =
    'w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-600';
  const labelClass = 'block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className={labelClass}>University</label>
        <select
          className={inputClass}
          value={value.universityId}
          onChange={(e) =>
            onChange({
              ...value,
              universityId: e.target.value,
              programmeId: '',
              branchId: '',
              semesterId: '',
              curriculumSchemeId: '',
              subjectId: '',
            })
          }
          required
        >
          <option value="">Select University</option>
          {options.universities.map((u) => (
            <option key={u._id} value={u._id}>
              {u.code} — {u.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Programme / Degree</label>
        <select
          className={inputClass}
          value={value.programmeId}
          disabled={!value.universityId}
          onChange={(e) =>
            onChange({
              ...value,
              programmeId: e.target.value,
              branchId: '',
              semesterId: '',
              curriculumSchemeId: '',
              subjectId: '',
            })
          }
          required
        >
          <option value="">Select Programme</option>
          {options.programmes.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Branch / Specialisation</label>
        <select
          className={inputClass}
          value={value.branchId}
          disabled={!value.programmeId}
          onChange={(e) => onChange({ ...value, branchId: e.target.value, subjectId: '' })}
          required
        >
          <option value="">Select Branch</option>
          {options.branches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.code} — {b.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Academic Year</label>
        <select
          className={inputClass}
          value={value.academicYearId}
          onChange={(e) => onChange({ ...value, academicYearId: e.target.value })}
          required
        >
          <option value="">Select Academic Year</option>
          {options.academicYears.map((ay) => (
            <option key={ay._id} value={ay._id}>
              {ay.label} {ay.isCurrent ? '(Current)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Semester</label>
        <select
          className={inputClass}
          value={value.semesterId}
          disabled={!value.programmeId}
          onChange={(e) => onChange({ ...value, semesterId: e.target.value, subjectId: '' })}
          required
        >
          <option value="">Select Semester</option>
          {options.semesters.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Curriculum / Scheme</label>
        <select
          className={inputClass}
          value={value.curriculumSchemeId}
          disabled={!value.programmeId}
          onChange={(e) => onChange({ ...value, curriculumSchemeId: e.target.value, subjectId: '' })}
          required
        >
          <option value="">Select Curriculum Scheme</option>
          {options.curriculumSchemes.map((sc) => (
            <option key={sc._id} value={sc._id}>
              {sc.code} — {sc.name}
            </option>
          ))}
        </select>
      </div>

      {includeSubject && (
        <div className="md:col-span-2">
          <label className={labelClass}>Subject</label>
          <select
            className={inputClass}
            value={value.subjectId || ''}
            disabled={!value.semesterId}
            onChange={(e) => onChange({ ...value, subjectId: e.target.value })}
            required
          >
            <option value="">Select Subject</option>
            {options.subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.code} — {sub.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
