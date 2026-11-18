import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const pyqPaperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    universityId: { type: String, ref: 'University', required: true, index: true },
    programmeId: { type: String, ref: 'Programme', required: true, index: true },
    branchId: { type: String, ref: 'Branch', required: true, index: true },
    semesterId: { type: String, ref: 'Semester', required: true, index: true },
    curriculumSchemeId: { type: String, ref: 'CurriculumScheme', required: true, index: true },
    subjectId: { type: String, ref: 'Subject', required: true, index: true },
    examYear: { type: Number, required: true, index: true },
    examSession: { type: String, enum: ['End-Semester', 'Mid-Semester', 'Odd Semester', 'Even Semester', 'Back Paper', 'Supplementary'], default: 'End-Semester' },
    paperCode: { type: String, required: true, trim: true },
    totalMarks: { type: Number, default: 70 },
    durationMinutes: { type: Number, default: 180 },
    source: { type: String, required: true, default: 'Official University Archive' },
    uploaderId: { type: String, ref: 'User', default: null },
    uploaderName: { type: String, default: 'UNIHUB Academic Team' },
    qualityStatus: {
      type: String,
      enum: ['approved', 'under_review', 'needs_correction', 'rejected', 'archived', 'withdrawn'],
      default: 'approved',
      index: true,
    },
    permissionStatus: {
      type: String,
      enum: ['verified_public', 'pending_check', 'restricted'],
      default: 'verified_public',
      index: true,
    },
    isSampleFree: { type: Boolean, default: false },
    fileUrl: { type: String, default: '' },
    storedFilename: { type: String, default: '' },
    fileHash: { type: String, default: '' },
    downloadCount: { type: Number, default: 0 },
    sectionsSummary: { type: [String], default: [] },
    sampleQuestions: { type: [String], default: [] },
    topicTagIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const PYQPaper = createModel('PYQPaper', pyqPaperSchema);
