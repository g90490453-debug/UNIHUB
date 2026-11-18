import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const questionSchema = new mongoose.Schema(
  {
    universityId: { type: String, ref: 'University', required: true, index: true },
    subjectId: { type: String, ref: 'Subject', required: true, index: true },
    topicId: { type: String, ref: 'Topic', default: null, index: true },
    pyqPaperId: { type: String, ref: 'PYQPaper', default: null },
    statement: { type: String, required: true },
    questionType: {
      type: String,
      enum: ['mcq', 'true_false', 'short_answer', 'descriptive'],
      required: true,
      index: true,
    },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    marks: { type: Number, required: true, default: 2 },
    examYear: { type: Number, default: 2024 },
    source: { type: String, default: 'University PYQ Archive' },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, default: '' },
    rubricPoints: { type: [String], default: [] },
    explanation: { type: String, default: '' },
    isVerifiedExplanation: { type: Boolean, default: false },
    publicationStatus: { type: String, enum: ['published', 'draft', 'archived'], default: 'published', index: true },
  },
  { timestamps: true }
);

export const Question = createModel('Question', questionSchema);
