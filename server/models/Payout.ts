import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const payoutSchema = new mongoose.Schema(
  {
    contributorId: { type: String, ref: 'User', required: true, index: true },
    amountInr: { type: Number, required: true },
    upiId: { type: String, required: true },
    ledgerEntryIds: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['requested', 'processing', 'paid', 'rejected'],
      default: 'requested',
      index: true,
    },
    transactionReference: { type: String, default: '' },
    processedByAdminId: { type: String, ref: 'User', default: null },
    processedAt: { type: String, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Payout = createModel('Payout', payoutSchema);
