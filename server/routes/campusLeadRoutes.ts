import { Router } from 'express';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth.ts';
import {
  ContactMessage,
  ContributorProfile,
  PYQPaper,
  ResourceSubmission,
  Subject,
  University,
  User,
} from '../models/index.ts';
import { sanitizeString } from '../middleware/validate.ts';

const router = Router();

router.get('/dashboard', requireAuth, requireRole('campus_lead', 'admin'), async (req: AuthRequest, res) => {
  try {
    const ap = req.user!.academicProfile || {};
    const uniFilter = ap.universityId ? { universityId: ap.universityId } : {};

    const [profiles, submissions, subjects, pyqs, feedback, users, unis] = await Promise.all([
      ContributorProfile.find(uniFilter),
      ResourceSubmission.find(uniFilter).sort({ createdAt: -1 }),
      Subject.find(uniFilter),
      PYQPaper.find({ ...uniFilter, qualityStatus: 'approved' }),
      ContactMessage.find({ category: 'campus_feedback' }).sort({ createdAt: -1 }),
      User.find({}),
      University.find({}),
    ]);

    const userMap = new Map((users as any[]).map((u) => [String(u._id), u]));
    const subMap = new Map((subjects as any[]).map((s) => [String(s._id), s]));
    const uniMap = new Map((unis as any[]).map((u) => [String(u._id), u]));

    const contributors = (profiles as any[]).map((p) => {
      const plain = p.toObject ? p.toObject() : p;
      const u = userMap.get(String(plain.userId));
      return {
        ...plain,
        name: u?.name || 'Contributor',
        email: u?.email || '',
        universityCode: uniMap.get(String(plain.universityId))?.code || '',
      };
    });

    const enrichedSubmissions = (submissions as any[]).map((s) => {
      const plain = s.toObject ? s.toObject() : s;
      const u = userMap.get(String(plain.contributorId));
      return {
        ...plain,
        contributorName: u?.name || 'Contributor',
        subjectName: subMap.get(String(plain.subjectId))?.name || '',
        subjectCode: subMap.get(String(plain.subjectId))?.code || '',
      };
    });

    const missingResources = (subjects as any[])
      .map((sub) => {
        const approvedCount = (pyqs as any[]).filter((p) => String(p.subjectId) === String(sub._id)).length;
        return {
          subjectId: String(sub._id),
          code: sub.code,
          name: sub.name,
          approvedPyqsCount: approvedCount,
          gapSeverity: approvedCount === 0 ? 'Critical Gap (0 PYQs)' : approvedCount < 2 ? 'Low Coverage (1 PYQ)' : 'Covered',
        };
      })
      .filter((item) => item.approvedPyqsCount < 2);

    const stats = {
      activeContributors: contributors.length,
      totalSubmissions: enrichedSubmissions.length,
      approvedSubmissions: enrichedSubmissions.filter((s) => s.status === 'approved').length,
      pendingSubmissions: enrichedSubmissions.filter((s) => ['submitted', 'under_review'].includes(s.status)).length,
      missingSubjectsCount: missingResources.length,
    };

    res.json({
      stats,
      contributors,
      submissions: enrichedSubmissions,
      missingResources,
      feedback,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/feedback', requireAuth, requireRole('campus_lead', 'admin'), async (req: AuthRequest, res) => {
  try {
    const message = sanitizeString(req.body.message, 600);
    const university = sanitizeString(req.body.university || 'Campus Chapter', 120);
    if (!message) return res.status(400).json({ error: 'Feedback summary is required.' });

    const entry = await ContactMessage.create({
      name: req.user!.name,
      email: req.user!.email,
      university,
      category: 'campus_feedback',
      message,
      status: 'new',
    });

    res.status(201).json({ entry });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
