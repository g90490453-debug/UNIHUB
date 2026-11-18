import { Router } from 'express';
import { optionalAuth, type AuthRequest } from '../middleware/auth.ts';
import { Question, Subject, Topic, University } from '../models/index.ts';

const router = Router();

router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { universityId, subjectId, topicId, difficulty, questionType, examYear, q } = req.query as Record<
      string,
      string
    >;

    const filter: Record<string, any> = { publicationStatus: 'published' };
    if (req.user?.role === 'student' && req.user.academicProfile?.universityId) {
      filter.universityId = universityId || req.user.academicProfile.universityId;
    } else if (universityId) {
      filter.universityId = universityId;
    }
    if (subjectId) filter.subjectId = subjectId;
    if (topicId) filter.topicId = topicId;
    if (difficulty) filter.difficulty = difficulty;
    if (questionType) filter.questionType = questionType;
    if (examYear) filter.examYear = Number(examYear);

    const [questions, subjects, topics, universities] = await Promise.all([
      Question.find(filter).sort({ examYear: -1, createdAt: -1 }),
      Subject.find({}),
      Topic.find({}),
      University.find({}),
    ]);

    const subMap = new Map((subjects as any[]).map((s) => [String(s._id), s]));
    const topMap = new Map((topics as any[]).map((t) => [String(t._id), t]));
    const uniMap = new Map((universities as any[]).map((u) => [String(u._id), u]));

    let result = (questions as any[]).map((item) => {
      const plain = item.toObject ? item.toObject() : item;
      return {
        ...plain,
        subjectName: subMap.get(String(plain.subjectId))?.name || '',
        subjectCode: subMap.get(String(plain.subjectId))?.code || '',
        topicName: topMap.get(String(plain.topicId))?.name || 'General',
        universityCode: uniMap.get(String(plain.universityId))?.code || '',
      };
    });

    if (q) {
      const needle = q.toLowerCase();
      result = result.filter(
        (item) =>
          item.statement.toLowerCase().includes(needle) ||
          item.subjectName.toLowerCase().includes(needle) ||
          item.topicName.toLowerCase().includes(needle)
      );
    }

    res.json({ questions: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
