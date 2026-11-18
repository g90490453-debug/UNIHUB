import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const rewardLedgerSchema = new mongoose.Schema(
  {
    contributorId: { type: String, ref: 'User', required: true, index: true },
    submissionId: { type: String, ref: 'ResourceSubmission', required: true },
    resourceType: { type: String, required: true },
    amountInr: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'reversed'],
      default: 'pending',
      index: true,
    },
    payoutId: { type: String, ref: 'Payout', default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const RewardLedger = createModel('RewardLedger', rewardLedgerSchema);
