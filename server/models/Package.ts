import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const packageSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      enum: ['free', 'pyq_pass', 'test_pass', 'complete_pass', 'large_semester_pass', 'two_semester_bundle'],
      required: true,
      unique: true,
    },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, default: '' },
    priceInr: { type: Number, required: true },
    validityMonths: { type: Number, default: 6 },
    semesterSlots: { type: Number, default: 1 },
    includesPyqs: { type: Boolean, default: false },
    includesMockTests: { type: Boolean, default: false },
    includesTrendPractice: { type: Boolean, default: false },
    includesDetailedAnalytics: { type: Boolean, default: false },
    features: { type: [String], default: [] },
    isPilotPrice: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const Package = createModel('Package', packageSchema);
