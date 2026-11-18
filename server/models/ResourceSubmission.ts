import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const resourceSubmissionSchema = new mongoose.Schema(
  {
    contributorId: { type: String, ref: 'User', required: true, index: true },
    universityId: { type: String, ref: 'University', required: true, index: true },
    programmeId: { type: String, ref: 'Programme', required: true },
    branchId: { type: String, ref: 'Branch', required: true },
    semesterId: { type: String, ref: 'Semester', required: true },
    curriculumSchemeId: { type: String, ref: 'CurriculumScheme', required: true },
    subjectId: { type: String, ref: 'Subject', required: true },
    resourceType: {
      type: String,
      enum: ['pyq_paper', 'complete_semester_set', 'syllabus_document', 'revision_notes', 'mock_question'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    examYear: { type: Number, required: true },
    examSession: { type: String, default: 'End-Semester' },
    paperCode: { type: String, default: '' },
    sourceDescription: { type: String, required: true },
    rightsDeclarationAccepted: { type: Boolean, required: true },
    notLeakedOrUnreleasedAttested: { type: Boolean, required: true },
    fileUrl: { type: String, default: '' },
    originalFilename: { type: String, default: '' },
    fileHash: { type: String, default: '', index: true },
    duplicateWarning: { type: String, default: '' },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'approved', 'rejected', 'needs_correction', 'withdrawn'],
      default: 'submitted',
      index: true,
    },
    assignedReviewerId: { type: String, ref: 'User', default: null },
    reviewerNotes: { type: String, default: '' },
    rewardAmountInr: { type: Number, default: 0 },
    publishedPyqId: { type: String, ref: 'PYQPaper', default: null },
  },
  { timestamps: true }
);

export const ResourceSubmission = createModel('ResourceSubmission', resourceSubmissionSchema);
