import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const semesterSchema = new mongoose.Schema(
  {
    universityId: { type: String, ref: 'University', required: true, index: true },
    programmeId: { type: String, ref: 'Programme', required: true, index: true },
    number: { type: Number, required: true, min: 1, max: 12 },
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Semester = createModel('Semester', semesterSchema);
