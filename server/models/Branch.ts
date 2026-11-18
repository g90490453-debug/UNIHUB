import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const branchSchema = new mongoose.Schema(
  {
    universityId: { type: String, ref: 'University', required: true, index: true },
    programmeId: { type: String, ref: 'Programme', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Branch = createModel('Branch', branchSchema);
