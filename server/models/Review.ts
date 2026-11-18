import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const reviewSchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ['submission', 'pyq_paper', 'solution'], required: true, index: true },
    targetId: { type: String, required: true, index: true },
    reviewerId: { type: String, ref: 'User', required: true },
    reviewerName: { type: String, required: true },
    decision: {
      type: String,
      enum: ['approved', 'rejected', 'needs_correction', 'under_review'],
      required: true,
    },
    checklist: {
      universityMappingVerified: { type: Boolean, default: false },
      readabilityChecked: { type: Boolean, default: false },
      authenticityChecked: { type: Boolean, default: false },
      permissionsCleared: { type: Boolean, default: false },
    },
    comments: { type: String, default: '' },
    versionNumber: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const Review = createModel('Review', reviewSchema);
