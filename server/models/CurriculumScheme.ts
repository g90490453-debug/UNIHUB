import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const curriculumSchemeSchema = new mongoose.Schema(
  {
    universityId: { type: String, ref: 'University', required: true, index: true },
    programmeId: { type: String, ref: 'Programme', required: true, index: true },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    effectiveFromYear: { type: Number, default: 2022 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CurriculumScheme = createModel('CurriculumScheme', curriculumSchemeSchema);
