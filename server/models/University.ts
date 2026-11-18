import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const universitySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    shortName: { type: String, required: true, trim: true },
    location: { type: String, default: '' },
    type: { type: String, enum: ['State Technical', 'State Public', 'Private', 'Central'], default: 'State Technical' },
    website: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const University = createModel('University', universitySchema);
