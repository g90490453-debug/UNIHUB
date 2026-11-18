import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const entitlementSchema = new mongoose.Schema(
  {
    userId: { type: String, ref: 'User', required: true, index: true },
    purchaseId: { type: String, ref: 'Purchase', required: true },
    packageId: { type: String, ref: 'Package', required: true },
    packageCode: { type: String, required: true },
    packageName: { type: String, required: true },
    universityId: { type: String, ref: 'University', required: true },
    semesterIds: { type: [String], default: [] },
    includesPyqs: { type: Boolean, default: false },
    includesMockTests: { type: Boolean, default: false },
    includesTrendPractice: { type: Boolean, default: false },
    includesDetailedAnalytics: { type: Boolean, default: false },
    activatedAt: { type: String, required: true },
    expiresAt: { type: String, required: true },
    status: { type: String, enum: ['active', 'expired', 'revoked_refund', 'upgraded'], default: 'active', index: true },
  },
  { timestamps: true }
);

export const Entitlement = createModel('Entitlement', entitlementSchema);
