import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const contributorProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, ref: 'User', required: true, unique: true, index: true },
    universityId: { type: String, ref: 'University', required: true },
    programmeId: { type: String, ref: 'Programme', required: true },
    branchId: { type: String, ref: 'Branch', required: true },
    collegeName: { type: String, required: true },
    upiId: { type: String, default: '' },
    assignedCampusLeadId: { type: String, ref: 'User', default: null },
    status: { type: String, enum: ['active', 'pending_verification', 'suspended'], default: 'active' },
    totalSubmissions: { type: Number, default: 0 },
    approvedSubmissions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ContributorProfile = createModel('ContributorProfile', contributorProfileSchema);
