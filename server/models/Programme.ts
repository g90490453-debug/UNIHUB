import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const programmeSchema = new mongoose.Schema(
  {
    universityId: { type: String, ref: 'University', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    durationSemesters: { type: Number, default: 8 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Programme = createModel('Programme', programmeSchema);
