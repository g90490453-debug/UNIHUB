import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const mockTestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    universityId: { type: String, ref: 'University', required: true, index: true },
    programmeId: { type: String, ref: 'Programme', required: true, index: true },
    branchId: { type: String, ref: 'Branch', required: true, index: true },
    semesterId: { type: String, ref: 'Semester', required: true, index: true },
    curriculumSchemeId: { type: String, ref: 'CurriculumScheme', required: true, index: true },
    subjectId: { type: String, ref: 'Subject', default: null, index: true },
    testScope: { type: String, enum: ['subject', 'full_semester', 'sample'], default: 'subject' },
    durationMinutes: { type: Number, required: true, default: 30 },
    totalMarks: { type: Number, required: true, default: 20 },
    randomizeQuestions: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: true, index: true },
    isFreeSample: { type: Boolean, default: false },
    sections: {
      type: [
        {
          name: String,
          instructions: String,
          questionIds: [String],
        },
      ],
      default: [],
    },
    questionIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const MockTest = createModel('MockTest', mockTestSchema);
