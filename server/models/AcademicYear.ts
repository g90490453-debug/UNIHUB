import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const academicYearSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, unique: true, trim: true },
    startYear: { type: Number, required: true },
    endYear: { type: Number, required: true },
    isCurrent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AcademicYear = createModel('AcademicYear', academicYearSchema);
