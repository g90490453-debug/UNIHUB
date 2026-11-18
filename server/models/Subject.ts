import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const subjectSchema = new mongoose.Schema(
  {
    universityId: { type: String, ref: 'University', required: true, index: true },
    programmeId: { type: String, ref: 'Programme', required: true, index: true },
    branchId: { type: String, ref: 'Branch', required: true, index: true },
    semesterId: { type: String, ref: 'Semester', required: true, index: true },
    curriculumSchemeId: { type: String, ref: 'CurriculumScheme', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    credits: { type: Number, default: 4 },
    syllabusUnits: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Subject = createModel('Subject', subjectSchema);
