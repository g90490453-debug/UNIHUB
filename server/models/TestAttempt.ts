import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const testAttemptSchema = new mongoose.Schema(
  {
    userId: { type: String, ref: 'User', required: true, index: true },
    mockTestId: { type: String, ref: 'MockTest', required: true, index: true },
    universityId: { type: String, ref: 'University', required: true },
    semesterId: { type: String, ref: 'Semester', required: true },
    subjectId: { type: String, ref: 'Subject', default: null },
    startedAt: { type: String, required: true },
    submittedAt: { type: String, required: true },
    timeSpentSeconds: { type: Number, default: 0 },
    submissionReason: { type: String, enum: ['manual', 'timer_expired'], default: 'manual' },
    answers: {
      type: [
        {
          questionId: String,
          userAnswer: String,
          markedForReview: Boolean,
          isObjective: Boolean,
          isCorrect: Boolean,
          awardedMarks: Number,
          maxMarks: Number,
          evaluationStatus: String,
          reviewerComment: String,
        },
      ],
      default: [],
    },
    objectiveScore: { type: Number, default: 0 },
    objectiveMaxScore: { type: Number, default: 0 },
    descriptiveScore: { type: Number, default: 0 },
    descriptiveMaxScore: { type: Number, default: 0 },
    totalAwardedScore: { type: Number, default: 0 },
    totalMaxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    hasPendingDescriptiveReview: { type: Boolean, default: false },
    descriptiveEvaluationStatus: {
      type: String,
      enum: ['not_applicable', 'pending_manual_review', 'evaluated'],
      default: 'not_applicable',
    },
    topicBreakdown: {
      type: [
        {
          topicId: String,
          topicName: String,
          correct: Number,
          total: Number,
          accuracyPercent: Number,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const TestAttempt = createModel('TestAttempt', testAttemptSchema);
