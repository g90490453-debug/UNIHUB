import { Router } from 'express';
import { optionalAuth, type AuthRequest } from '../middleware/auth.ts';
import { PYQPaper, Solution, Subject, Topic, University } from '../models/index.ts';

const router = Router();

router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { subjectId, topicId, pyqPaperId, verificationStatus, universityId } = req.query as Record<string, string>;

    const filter: Record<string, any> = {};
    if (req.user?.role === 'student' && req.user.academicProfile?.universityId) {
      filter.universityId = universityId || req.user.academicProfile.universityId;
    } else if (universityId) {
      filter.universityId = universityId;
    }
    if (subjectId) filter.subjectId = subjectId;
    if (topicId) filter.topicId = topicId;
    if (pyqPaperId) filter.pyqPaperId = pyqPaperId;
    if (verificationStatus) filter.verificationStatus = verificationStatus;

    const [solutions, subjects, topics, papers, unis] = await Promise.all([
      Solution.find(filter).sort({ updatedAt: -1 }),
      Subject.find({}),
      Topic.find({}),
      PYQPaper.find({}),
      University.find({}),
    ]);

    const subMap = new Map((subjects as any[]).map((s) => [String(s._id), s]));
    const topMap = new Map((topics as any[]).map((t) => [String(t._id), t]));
    const paperMap = new Map((papers as any[]).map((p) => [String(p._id), p]));
    const uniMap = new Map((unis as any[]).map((u) => [String(u._id), u]));

    const hydrated = (solutions as any[]).map((s) => {
      const plain = s.toObject ? s.toObject() : s;
      const paper = paperMap.get(String(plain.pyqPaperId));
      return {
        ...plain,
        subjectName: subMap.get(String(plain.subjectId))?.name || '',
        subjectCode: subMap.get(String(plain.subjectId))?.code || '',
        topicName: topMap.get(String(plain.topicId))?.name || 'General',
        paperTitle: paper?.title || '',
        paperCode: paper?.paperCode || '',
        examYear: paper?.examYear || '',
        universityCode: uniMap.get(String(plain.universityId))?.code || '',
      };
    });

    res.json({ solutions: hydrated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const sol: any = await Solution.findById(req.params.id);
    if (!sol) return res.status(404).json({ error: 'Solution not found' });
    res.json({ solution: sol });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
