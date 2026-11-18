import { AuditLog, Notification } from '../models/index.ts';

export async function recordAudit(params: {
  actorId?: string | null;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, any>;
}) {
  try {
    await AuditLog.create({
      actorId: params.actorId || null,
      actorEmail: params.actorEmail || 'system',
      actorRole: params.actorRole || 'system',
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId || '',
      summary: params.summary,
      metadata: params.metadata || {},
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

export async function createNotification(params: {
  userId: string;
  type?: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    await Notification.create({
      userId: params.userId,
      type: params.type || 'system',
      title: params.title,
      message: params.message,
      link: params.link || '',
      isRead: false,
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
