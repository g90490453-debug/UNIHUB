import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const solutionSchema = new mongoose.Schema(
  {
    pyqPaperId: { type: String, ref: 'PYQPaper', required: true, index: true },
    subjectId: { type: String, ref: 'Subject', required: true, index: true },
    topicId: { type: String, ref: 'Topic', default: null, index: true },
    universityId: { type: String, ref: 'University', required: true, index: true },
    title: { type: String, required: true, trim: true },
    questionReference: { type: String, required: true },
    steps: {
      type: [
        {
          stepNumber: Number,
          heading: String,
          content: String,
        },
      ],
      default: [],
    },
    finalAnswerSummary: { type: String, default: '' },
    verificationStatus: {
      type: String,
      enum: ['verified', 'under_review', 'not_verified'],
      default: 'under_review',
      index: true,
    },
    reviewerId: { type: String, ref: 'User', default: null },
    reviewerName: { type: String, default: '' },
    lastReviewedAt: { type: String, default: null },
    currentVersion: { type: Number, default: 1 },
    versionHistory: {
      type: [
        {
          version: Number,
          updatedBy: String,
          updatedAt: String,
          changeNote: String,
          verificationStatus: String,
        },
      ],
      default: [],
    },
    isSampleFree: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Solution = createModel('Solution', solutionSchema);
