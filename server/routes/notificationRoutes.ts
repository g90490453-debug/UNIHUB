import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';
import { Notification } from '../models/index.ts';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(30);
    const unreadCount = (notifications as any[]).filter((n) => !n.isRead).length;
    res.json({ notifications, unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      { $set: { isRead: true } }
    );
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/read-all', requireAuth, async (req: AuthRequest, res) => {
  try {
    await Notification.updateMany({ userId: req.user!.id, isRead: false }, { $set: { isRead: true } });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
