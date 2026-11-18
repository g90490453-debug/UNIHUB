import mongoose from 'mongoose';
import { createModel } from '../db/connection.ts';

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: String, ref: 'User', default: null },
    actorEmail: { type: String, default: 'system' },
    actorRole: { type: String, default: 'system' },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: String, default: '' },
    summary: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const AuditLog = createModel('AuditLog', auditLogSchema);
