import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';
import {
  Entitlement,
  MockTest,
  PYQPaper,
  Question,
  Subject,
  TestAttempt,
  Topic,
} from '../models/index.ts';

const router = Router();

router.get('/student-dashboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    const ap = req.user!.academicProfile || {};
    const pyqFilter: Record<string, any> = {
      qualityStatus: 'approved',
      permissionStatus: 'verified_public',
    };
    const testFilter: Record<string, any> = { isPublished: true };
    const subjFilter: Record<string, any> = { isActive: true };

    if (ap.universityId) {
      pyqFilter.universityId = ap.universityId;
      testFilter.universityId = ap.universityId;
      subjFilter.universityId = ap.universityId;
    }
    if (ap.curriculumSchemeId) {
      pyqFilter.curriculumSchemeId = ap.curriculumSchemeId;
      testFilter.curriculumSchemeId = ap.curriculumSchemeId;
      subjFilter.curriculumSchemeId = ap.curriculumSchemeId;
    }
    if (ap.semesterId) {
      pyqFilter.semesterId = ap.semesterId;
      testFilter.semesterId = ap.semesterId;
      subjFilter.semesterId = ap.semesterId;
    }

    const [pyqs, tests, subjects, attempts, entitlements] = await Promise.all([
      PYQPaper.find(pyqFilter).sort({ createdAt: -1 }),
      MockTest.find(testFilter),
      Subject.find(subjFilter),
      TestAttempt.find({ userId: req.user!.id }).sort({ submittedAt: 1 }),
      Entitlement.find({ userId: req.user!.id, status: 'active' }),
    ]);

    const now = new Date().toISOString();
    const activePackage = (entitlements as any[]).find((e) => e.expiresAt > now) || null;

    const subMap = new Map((subjects as any[]).map((s) => [String(s._id), s]));
    const testMap = new Map((tests as any[]).map((t) => [String(t._id), t]));

    const averageScore =
      (attempts as any[]).length > 0
        ? Math.round(
            (attempts as any[]).reduce((acc, a) => acc + Number(a.percentage || 0), 0) / (attempts as any[]).length
          )
        : 0;

    const performanceOverTime = (attempts as any[]).map((a, idx) => ({
      label: `Attempt ${idx + 1}`,
      date: new Date(a.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      score: Number(a.percentage || 0),
      testTitle: testMap.get(String(a.mockTestId))?.title || 'Mock Test',
    }));

    const subjectStats = new Map<string, { name: string; totalPct: number; count: number }>();
    const topicAgg = new Map<string, { topicName: string; correct: number; total: number }>();

    for (const a of attempts as any[]) {
      const sId = a.subjectId ? String(a.subjectId) : 'combined';
      const sName = a.subjectId ? subMap.get(sId)?.code || subMap.get(sId)?.name || 'Subject' : 'Combined';
      if (!subjectStats.has(sId)) subjectStats.set(sId, { name: sName, totalPct: 0, count: 0 });
      const st = subjectStats.get(sId)!;
      st.totalPct += Number(a.percentage || 0);
      st.count += 1;

      for (const tb of a.topicBreakdown || []) {
        const key = String(tb.topicId || tb.topicName);
        if (!topicAgg.has(key)) topicAgg.set(key, { topicName: tb.topicName, correct: 0, total: 0 });
        const tg = topicAgg.get(key)!;
        tg.correct += Number(tb.correct || 0);
        tg.total += Number(tb.total || 0);
      }
    }

    const subjectScores = Array.from(subjectStats.values()).map((v) => ({
      subject: v.name,
      score: Math.round(v.totalPct / v.count),
      attempts: v.count,
    }));

    const topicPerformance = Array.from(topicAgg.values()).map((t) => ({
      topic: t.topicName,
      accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
      attempted: t.total,
      correct: t.correct,
    }));

    const weakTopics = topicPerformance
      .filter((t) => t.accuracy < 65)
      .sort((a, b) => a.accuracy - b.accuracy);

    const attemptedTestIds = new Set((attempts as any[]).map((a) => String(a.mockTestId)));
    const completedTestsCount = attemptedTestIds.size;
    const totalTestsCount = (tests as any[]).length;
    const completionRate = totalTestsCount > 0 ? Math.round((completedTestsCount / totalTestsCount) * 100) : 0;

    const recentAttempts = [...(attempts as any[])]
      .reverse()
      .slice(0, 5)
      .map((a) => ({
        _id: String(a._id),
        testTitle: testMap.get(String(a.mockTestId))?.title || 'Mock Test',
        percentage: a.percentage,
        objectiveScore: a.objectiveScore,
        objectiveMaxScore: a.objectiveMaxScore,
        submittedAt: a.submittedAt,
        descriptiveEvaluationStatus: a.descriptiveEvaluationStatus,
      }));

    const recentResources = (pyqs as any[]).slice(0, 5).map((p) => ({
      _id: String(p._id),
      title: p.title,
      paperCode: p.paperCode,
      examYear: p.examYear,
      subjectName: subMap.get(String(p.subjectId))?.name || '',
    }));

    const recommendedPractice =
      weakTopics.length > 0
        ? weakTopics.slice(0, 3).map((w) => ({
            topic: w.topic,
            reason: `Historical attempt accuracy ${w.accuracy}% — review verified solutions and question bank items.`,
            link: '/student/questions',
          }))
        : [
            {
              topic: 'Full-Semester Mock Examination',
              reason: 'Build speed and time allocation across all semester subjects.',
              link: '/student/tests',
            },
          ];

    res.json({
      summary: {
        availablePyqs: (pyqs as any[]).length,
        availableMockTests: totalTestsCount,
        completedTestsCount,
        completionRate,
        averageScore,
        totalAttempts: (attempts as any[]).length,
        studyProgressPercent: Math.min(100, Math.round((completionRate * 0.6) + (averageScore * 0.4))),
      },
      activePackage,
      performanceOverTime,
      subjectScores,
      topicPerformance,
      weakTopics,
      recentAttempts,
      recentResources,
      recommendedPractice,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pyq-trends', requireAuth, async (req: AuthRequest, res) => {
  try {
    const ap = req.user!.academicProfile || {};
    const subjectId = req.query.subjectId ? String(req.query.subjectId) : '';

    const subjFilter: Record<string, any> = { isActive: true };
    if (ap.universityId) subjFilter.universityId = ap.universityId;
    if (ap.curriculumSchemeId) subjFilter.curriculumSchemeId = ap.curriculumSchemeId;
    if (ap.semesterId) subjFilter.semesterId = ap.semesterId;

    const subjects: any[] = await Subject.find(subjFilter);
    const activeSubjectIds = subjectId ? [subjectId] : subjects.map((s) => String(s._id));

    const [papers, questions, topics] = await Promise.all([
      PYQPaper.find({
        qualityStatus: 'approved',
        permissionStatus: 'verified_public',
        ...(ap.universityId ? { universityId: ap.universityId } : {}),
      }),
      Question.find({
        publicationStatus: 'published',
        ...(ap.universityId ? { universityId: ap.universityId } : {}),
      }),
      Topic.find({}),
    ]);

    const filteredPapers = (papers as any[]).filter(
      (p) => activeSubjectIds.length === 0 || activeSubjectIds.includes(String(p.subjectId))
    );
    const filteredQuestions = (questions as any[]).filter(
      (q) => activeSubjectIds.length === 0 || activeSubjectIds.includes(String(q.subjectId))
    );
    const filteredTopics = (topics as any[]).filter(
      (t) => activeSubjectIds.length === 0 || activeSubjectIds.includes(String(t.subjectId))
    );

    const topicMap = new Map(filteredTopics.map((t) => [String(t._id), t]));
    const subMap = new Map(subjects.map((s) => [String(s._id), s]));

    // Topic recurrence across papers & questions
    const topicFreq = new Map<string, { topic: string; unit: number; weightage: number; occurrences: number; years: Set<number> }>();
    for (const t of filteredTopics) {
      topicFreq.set(String(t._id), {
        topic: t.name,
        unit: t.unitNumber || 1,
        weightage: t.syllabusWeightagePercent || 20,
        occurrences: 0,
        years: new Set<number>(),
      });
    }

    for (const p of filteredPapers) {
      for (const tid of p.topicTagIds || []) {
        const entry = topicFreq.get(String(tid));
        if (entry) {
          entry.occurrences += 1;
          entry.years.add(Number(p.examYear));
        }
      }
    }
    for (const q of filteredQuestions) {
      if (q.topicId && topicFreq.has(String(q.topicId))) {
        const entry = topicFreq.get(String(q.topicId))!;
        entry.occurrences += 1;
        entry.years.add(Number(q.examYear));
      }
    }

    const topicRecurrence = Array.from(topicFreq.values())
      .map((item) => ({
        topic: item.topic,
        unit: `Unit ${item.unit}`,
        syllabusWeightagePercent: item.weightage,
        historicalOccurrences: item.occurrences,
        yearsAppeared: Array.from(item.years).sort((a, b) => b - a),
      }))
      .sort((a, b) => b.historicalOccurrences - a.historicalOccurrences);

    // Year-wise paper & question distribution
    const yearMap = new Map<number, { year: string; papers: number; questions: number }>();
    for (const p of filteredPapers) {
      const y = Number(p.examYear);
      if (!yearMap.has(y)) yearMap.set(y, { year: String(y), papers: 0, questions: 0 });
      yearMap.get(y)!.papers += 1;
    }
    for (const q of filteredQuestions) {
      const y = Number(q.examYear);
      if (!yearMap.has(y)) yearMap.set(y, { year: String(y), papers: 0, questions: 0 });
      yearMap.get(y)!.questions += 1;
    }
    const yearlyComparison = Array.from(yearMap.values()).sort((a, b) => Number(a.year) - Number(b.year));

    // Subject-wise historical frequency
    const subjFreq = subjects.map((s) => ({
      subject: s.code,
      subjectName: s.name,
      papersArchived: (papers as any[]).filter((p) => String(p.subjectId) === String(s._id)).length,
      questionsIndexed: (questions as any[]).filter((q) => String(q.subjectId) === String(s._id)).length,
    }));

    // Question type distribution
    const typeCounts = new Map<string, number>();
    for (const q of filteredQuestions) {
      const label =
        q.questionType === 'mcq'
          ? 'Multiple Choice'
          : q.questionType === 'true_false'
            ? 'True / False'
            : q.questionType === 'short_answer'
              ? 'Short Answer'
              : 'Descriptive';
      typeCounts.set(label, (typeCounts.get(label) || 0) + 1);
    }
    const questionDistribution = Array.from(typeCounts.entries()).map(([type, count]) => ({ type, count }));

    res.json({
      disclaimer:
        'Historical Analysis Only: These charts reflect past examination paper archives and indexed question frequencies. Historical recurrence never guarantees future examination questions.',
      subjects: subjects.map((s) => ({ _id: String(s._id), code: s.code, name: s.name })),
      topicRecurrence,
      yearlyComparison,
      subjectFrequency: subjFreq,
      questionDistribution,
      syllabusCoverageCount: filteredTopics.length,
    });
    void subMap;
    void topicMap;
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
