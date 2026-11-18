import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const paymentSchema = new mongoose.Schema(
  {
    purchaseId: { type: String, ref: 'Purchase', required: true, index: true },
    userId: { type: String, ref: 'User', required: true, index: true },
    gateway: { type: String, enum: ['razorpay', 'razorpay_sandbox'], default: 'razorpay' },
    method: { type: String, enum: ['upi', 'card', 'netbanking', 'free'], default: 'upi' },
    razorpayOrderId: { type: String, required: true, index: true },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    signatureVerified: { type: Boolean, default: false },
    amountInr: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'captured', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    failureReason: { type: String, default: '' },
    refundId: { type: String, default: '' },
    refundReason: { type: String, default: '' },
    refundedAt: { type: String, default: null },
  },
  { timestamps: true }
);

export const Payment = createModel('Payment', paymentSchema);
