import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const purchaseSchema = new mongoose.Schema(
  {
    userId: { type: String, ref: 'User', required: true, index: true },
    packageId: { type: String, ref: 'Package', required: true },
    packageCode: { type: String, required: true },
    universityId: { type: String, ref: 'University', required: true },
    semesterIds: { type: [String], default: [] },
    isUpgrade: { type: Boolean, default: false },
    upgradedFromPurchaseId: { type: String, ref: 'Purchase', default: null },
    basePriceInr: { type: Number, required: true },
    creditAppliedInr: { type: Number, default: 0 },
    finalAmountInr: { type: Number, required: true },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    autoRenewConsent: { type: Boolean, default: false },
    receiptNumber: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Purchase = createModel('Purchase', purchaseSchema);
