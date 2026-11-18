import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'new_resource',
        'new_mock_test',
        'test_reminder',
        'payment_confirmation',
        'payment_failed',
        'package_expiration',
        'contributor_approved',
        'contributor_rejected',
        'reward_approved',
        'system',
      ],
      default: 'system',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Notification = createModel('Notification', notificationSchema);
