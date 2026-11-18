import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    university: { type: String, default: '' },
    category: { type: String, default: 'general' },
    message: { type: String, required: true },
    status: { type: String, enum: ['new', 'resolved'], default: 'new' },
  },
  { timestamps: true }
);

export const ContactMessage = createModel('ContactMessage', contactMessageSchema);
