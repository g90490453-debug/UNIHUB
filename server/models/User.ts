import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

export type UserRole = 'student' | 'contributor' | 'campus_lead' | 'reviewer' | 'admin';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'contributor', 'campus_lead', 'reviewer', 'admin'],
      default: 'student',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'deletion_requested'],
      default: 'active',
    },
    phone: { type: String, default: '' },
    collegeName: { type: String, default: '' },
    onboardingCompleted: { type: Boolean, default: false },
    academicProfile: {
      universityId: { type: String, ref: 'University', default: null },
      programmeId: { type: String, ref: 'Programme', default: null },
      branchId: { type: String, ref: 'Branch', default: null },
      academicYearId: { type: String, ref: 'AcademicYear', default: null },
      semesterId: { type: String, ref: 'Semester', default: null },
      curriculumSchemeId: { type: String, ref: 'CurriculumScheme', default: null },
    },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: String, default: null },
    deletionRequestedAt: { type: String, default: null },
    lastLoginAt: { type: String, default: null },
  },
  { timestamps: true }
);

export const User = createModel('User', userSchema);
