import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const platformSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    rewardRates: {
      pyq_paper: { type: Number, default: 15 },
      complete_semester_set: { type: Number, default: 75 },
      syllabus_document: { type: Number, default: 10 },
      revision_notes: { type: Number, default: 35 },
      mock_question: { type: Number, default: 4 },
    },
    allowPilotPricingNotice: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const PlatformSetting = createModel('PlatformSetting', platformSettingSchema);
