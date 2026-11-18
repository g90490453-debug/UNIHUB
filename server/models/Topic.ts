import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const topicSchema = new mongoose.Schema(
  {
    subjectId: { type: String, ref: 'Subject', required: true, index: true },
    unitNumber: { type: Number, default: 1 },
    name: { type: String, required: true, trim: true },
    syllabusWeightagePercent: { type: Number, default: 20 },
  },
  { timestamps: true }
);

export const Topic = createModel('Topic', topicSchema);
