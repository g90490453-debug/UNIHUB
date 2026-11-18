import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';
import { Entitlement, MockTest, Question, Subject, TestAttempt, Topic } from '../models/index.ts';
import { createNotification } from '../services/auditService.ts';

const router = Router();

async function userHasTestAccess(userId: string, test: any): Promise<boolean> {
  if (test.isFreeSample) return true;
  const now = new Date().toISOString();
  const entitlements: any[] = await Entitlement.find({ userId, status: 'active' });
  return entitlements.some(
    (e) =>
      e.expiresAt > now &&
      e.includesMockTests &&
      String(e.universityId) === String(test.universityId) &&
      ((e.semesterIds || []).length === 0 || (e.semesterIds || []).map(String).includes(String(test.semesterId)))
  );
}

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const filter: Record<string, any> = { isPublished: true };
    const ap = req.user!.academicProfile || {};
    if (req.user!.role === 'student' && ap.universityId) {
      filter.universityId = ap.universityId;
      if (ap.curriculumSchemeId) filter.curriculumSchemeId = ap.curriculumSchemeId;
      if (ap.semesterId) filter.semesterId = ap.semesterId;
    }
    if (req.query.subjectId) filter.subjectId = String(req.query.subjectId);

    const [tests, subjects, attempts] = await Promise.all([
      MockTest.find(filter).sort({ createdAt: -1 }),
      Subject.find({}),
      TestAttempt.find({ userId: req.user!.id }).sort({ submittedAt: -1 }),
    ]);

    const subMap = new Map((subjects as any[]).map((s) => [String(s._id), s]));

    const enriched = await Promise.all(
      (tests as any[]).map(async (t) => {
        const plain = t.toObject ? t.toObject() : t;
        const canAttempt = req.user!.role !== 'student' || (await userHasTestAccess(req.user!.id, plain));
        const userAttempts = (attempts as any[]).filter((a) => String(a.mockTestId) === String(plain._id));
        return {
          ...plain,
          subjectName: plain.subjectId ? subMap.get(String(plain.subjectId))?.name || '' : 'Full Semester Combined',
          questionCount: (plain.questionIds || []).length,
          canAttempt,
          attemptCount: userAttempts.length,
          bestPercentage: userAttempts.length
            ? Math.max(...userAttempts.map((a) => Number(a.percentage || 0)))
            : null,
        };
      })
    );

    res.json({ tests: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/attempts/my', requireAuth, async (req: AuthRequest, res) => {
  try {
    const [attempts, tests, subjects] = await Promise.all([
      TestAttempt.find({ userId: req.user!.id }).sort({ submittedAt: -1 }),
      MockTest.find({}),
      Subject.find({}),
    ]);
    const testMap = new Map((tests as any[]).map((t) => [String(t._id), t]));
    const subMap = new Map((subjects as any[]).map((s) => [String(s._id), s]));

    const enriched = (attempts as any[]).map((a) => {
      const plain = a.toObject ? a.toObject() : a;
      const test = testMap.get(String(plain.mockTestId));
      return {
        ...plain,
        testTitle: test?.title || 'Mock Test',
        testScope: test?.testScope || 'subject',
        subjectName: plain.subjectId ? subMap.get(String(plain.subjectId))?.name || '' : 'Full Semester',
      };
    });

    res.json({ attempts: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/attempts/:attemptId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const attempt: any = await TestAttempt.findById(req.params.attemptId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (
      String(attempt.userId) !== req.user!.id &&
      !['admin', 'reviewer'].includes(req.user!.role)
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [test, questions, topics] = await Promise.all([
      MockTest.findById(attempt.mockTestId),
      Question.find({}),
      Topic.find({}),
    ]);

    const qMap = new Map((questions as any[]).map((q) => [String(q._id), q]));
    const tMap = new Map((topics as any[]).map((t) => [String(t._id), t]));

    const detailedAnswers = (attempt.answers || []).map((ans: any) => {
      const q = qMap.get(String(ans.questionId));
      return {
        ...ans,
        statement: q?.statement || '',
        questionType: q?.questionType || 'mcq',
        options: q?.options || [],
        correctAnswer: q?.correctAnswer || '',
        rubricPoints: q?.rubricPoints || [],
        explanation: q?.isVerifiedExplanation ? q.explanation : 'Detailed verified explanation is under academic review.',
        isVerifiedExplanation: Boolean(q?.isVerifiedExplanation),
        topicName: q?.topicId ? tMap.get(String(q.topicId))?.name || 'General' : 'General',
      };
    });

    res.json({
      attempt: {
        ...(attempt.toObject ? attempt.toObject() : attempt),
        testTitle: (test as any)?.title || 'Mock Test',
        detailedAnswers,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/start', requireAuth, async (req: AuthRequest, res) => {
  try {
    const test: any = await MockTest.findById(req.params.id);
    if (!test || !test.isPublished) {
      return res.status(404).json({ error: 'Mock test not found or unpublished.' });
    }

    if (req.user!.role === 'student') {
      const allowed = await userHasTestAccess(req.user!.id, test);
      if (!allowed) {
        return res.status(403).json({
          error: 'An active Semester Test Pass or Complete Pass is required to start this test.',
        });
      }
    }

    const qDocs: any[] = await Question.find({ _id: { $in: test.questionIds || [] } });
    const qMap = new Map(qDocs.map((q) => [String(q._id), q]));

    const sanitizeQuestion = (q: any) => ({
      _id: String(q._id),
      statement: q.statement,
      questionType: q.questionType,
      difficulty: q.difficulty,
      marks: q.marks,
      options: q.options || [],
      rubricPoints: q.rubricPoints || [],
      topicId: q.topicId,
    });

    let sections = (test.sections || []).map((sec: any) => {
      let items = (sec.questionIds || []).map((id: string) => qMap.get(String(id))).filter(Boolean);
      if (test.randomizeQuestions) {
        items = [...items].sort(() => Math.random() - 0.5);
      }
      return {
        name: sec.name,
        instructions: sec.instructions,
        questions: items.map(sanitizeQuestion),
      };
    });

    if (sections.length === 0) {
      let items = (test.questionIds || []).map((id: string) => qMap.get(String(id))).filter(Boolean);
      if (test.randomizeQuestions) {
        items = [...items].sort(() => Math.random() - 0.5);
      }
      sections = [{ name: 'All Questions', instructions: 'Attempt all questions carefully.', questions: items.map(sanitizeQuestion) }];
    }

    res.json({
      test: {
        _id: String(test._id),
        title: test.title,
        description: test.description,
        durationMinutes: test.durationMinutes,
        totalMarks: test.totalMarks,
        testScope: test.testScope,
        sections,
      },
      startedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/submit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const test: any = await MockTest.findById(req.params.id);
    if (!test) return res.status(404).json({ error: 'Mock test not found.' });

    const { answers = [], startedAt, timeSpentSeconds = 0, submissionReason = 'manual' } = req.body;
    const qDocs: any[] = await Question.find({ _id: { $in: test.questionIds || [] } });
    const topics: any[] = await Topic.find({});
    const topicMap = new Map(topics.map((t) => [String(t._id), t.name]));

    const ansMap = new Map<string, { userAnswer: string; markedForReview: boolean }>();
    for (const a of answers) {
      ansMap.set(String(a.questionId), {
        userAnswer: String(a.userAnswer ?? '').trim(),
        markedForReview: Boolean(a.markedForReview),
      });
    }

    let objectiveScore = 0;
    let objectiveMaxScore = 0;
    let descriptiveMaxScore = 0;
    let hasDescriptive = false;

    const topicStats = new Map<string, { topicName: string; correct: number; total: number }>();

    const evaluatedAnswers = qDocs.map((q) => {
      const qId = String(q._id);
      const submitted = ansMap.get(qId) || { userAnswer: '', markedForReview: false };
      const isObjective = q.questionType === 'mcq' || q.questionType === 'true_false';
      const maxMarks = Number(q.marks || 2);

      const tId = String(q.topicId || 'general');
      const tName = q.topicId ? topicMap.get(tId) || 'General' : 'General';
      if (!topicStats.has(tId)) topicStats.set(tId, { topicName: tName, correct: 0, total: 0 });
      const ts = topicStats.get(tId)!;

      if (isObjective) {
        objectiveMaxScore += maxMarks;
        ts.total += 1;
        const isCorrect =
          submitted.userAnswer !== '' &&
          submitted.userAnswer.toLowerCase() === String(q.correctAnswer || '').trim().toLowerCase();
        const awardedMarks = isCorrect ? maxMarks : 0;
        objectiveScore += awardedMarks;
        if (isCorrect) ts.correct += 1;

        return {
          questionId: qId,
          userAnswer: submitted.userAnswer,
          markedForReview: submitted.markedForReview,
          isObjective: true,
          isCorrect,
          awardedMarks,
          maxMarks,
          evaluationStatus: 'auto_graded',
          reviewerComment: '',
        };
      } else {
        // Descriptive & short-answer questions are NEVER falsely auto-graded!
        hasDescriptive = true;
        descriptiveMaxScore += maxMarks;
        return {
          questionId: qId,
          userAnswer: submitted.userAnswer,
          markedForReview: submitted.markedForReview,
          isObjective: false,
          isCorrect: false,
          awardedMarks: 0,
          maxMarks,
          evaluationStatus: submitted.userAnswer ? 'pending_manual_review' : 'unanswered',
          reviewerComment: submitted.userAnswer
            ? 'Awaiting manual rubric evaluation by an academic reviewer.'
            : 'No response submitted.',
        };
      }
    });

    const totalMaxScore = objectiveMaxScore + descriptiveMaxScore;
    const percentage = objectiveMaxScore > 0 ? Math.round((objectiveScore / objectiveMaxScore) * 100) : 0;

    const topicBreakdown = Array.from(topicStats.entries())
      .filter(([, v]) => v.total > 0)
      .map(([topicId, v]) => ({
        topicId,
        topicName: v.topicName,
        correct: v.correct,
        total: v.total,
        accuracyPercent: Math.round((v.correct / v.total) * 100),
      }));

    const attempt: any = await TestAttempt.create({
      userId: req.user!.id,
      mockTestId: String(test._id),
      universityId: test.universityId,
      semesterId: test.semesterId,
      subjectId: test.subjectId || null,
      startedAt: startedAt || new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      timeSpentSeconds: Number(timeSpentSeconds),
      submissionReason: submissionReason === 'timer_expired' ? 'timer_expired' : 'manual',
      answers: evaluatedAnswers,
      objectiveScore,
      objectiveMaxScore,
      descriptiveScore: 0,
      descriptiveMaxScore,
      totalAwardedScore: objectiveScore,
      totalMaxScore,
      percentage,
      hasPendingDescriptiveReview: hasDescriptive,
      descriptiveEvaluationStatus: hasDescriptive ? 'pending_manual_review' : 'not_applicable',
      topicBreakdown,
    });

    if (hasDescriptive) {
      await createNotification({
        userId: req.user!.id,
        type: 'test_reminder',
        title: 'Objective Score Ready — Descriptive Pending Rubric Review',
        message: `You scored ${objectiveScore}/${objectiveMaxScore} in objective questions on "${test.title}". Descriptive responses have been queued for rubric evaluation.`,
        link: `/student/tests/attempt/${attempt._id}`,
      });
    }

    res.status(201).json({ attempt });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit mock test' });
  }
});

export default router;
