import { Router } from 'express';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth.ts';
import { sanitizeString } from '../middleware/validate.ts';
import {
  ContributorProfile,
  MockTest,
  PYQPaper,
  Question,
  ResourceSubmission,
  Review,
  RewardLedger,
  Solution,
  Subject,
  TestAttempt,
  University,
  User,
} from '../models/index.ts';
import { createNotification, recordAudit } from '../services/auditService.ts';

const router = Router();

router.get('/queue', requireAuth, requireRole('reviewer', 'admin'), async (_req: AuthRequest, res) => {
  try {
    const [submissions, solutions, attempts, subjects, unis, users, reviews, tests, questions] = await Promise.all([
      ResourceSubmission.find({}).sort({ createdAt: -1 }),
      Solution.find({}).sort({ updatedAt: -1 }),
      TestAttempt.find({ hasPendingDescriptiveReview: true }).sort({ submittedAt: -1 }),
      Subject.find({}),
      University.find({}),
      User.find({}),
      Review.find({}).sort({ createdAt: -1 }),
      MockTest.find({}),
      Question.find({}),
    ]);

    const subMap = new Map((subjects as any[]).map((s) => [String(s._id), s]));
    const uniMap = new Map((unis as any[]).map((u) => [String(u._id), u]));
    const userMap = new Map((users as any[]).map((u) => [String(u._id), u]));
    const testMap = new Map((tests as any[]).map((t) => [String(t._id), t]));
    const qMap = new Map((questions as any[]).map((q) => [String(q._id), q]));

    const hydratedSubmissions = (submissions as any[]).map((s) => {
      const plain = s.toObject ? s.toObject() : s;
      return {
        ...plain,
        contributorName: userMap.get(String(plain.contributorId))?.name || 'Contributor',
        subjectName: subMap.get(String(plain.subjectId))?.name || '',
        subjectCode: subMap.get(String(plain.subjectId))?.code || '',
        universityCode: uniMap.get(String(plain.universityId))?.code || '',
      };
    });

    const hydratedSolutions = (solutions as any[]).map((sol) => {
      const plain = sol.toObject ? sol.toObject() : sol;
      return {
        ...plain,
        subjectName: subMap.get(String(plain.subjectId))?.name || '',
        universityCode: uniMap.get(String(plain.universityId))?.code || '',
      };
    });

    const descriptiveAttempts = (attempts as any[]).map((a) => {
      const plain = a.toObject ? a.toObject() : a;
      const student = userMap.get(String(plain.userId));
      const test = testMap.get(String(plain.mockTestId));
      return {
        ...plain,
        studentName: student?.name || 'Student',
        testTitle: test?.title || 'Mock Test',
        descriptiveQuestions: (plain.answers || [])
          .filter((ans: any) => !ans.isObjective)
          .map((ans: any) => {
            const q = qMap.get(String(ans.questionId));
            return {
              ...ans,
              statement: q?.statement || '',
              rubricPoints: q?.rubricPoints || [],
            };
          }),
      };
    });

    res.json({
      submissions: hydratedSubmissions,
      solutions: hydratedSolutions,
      descriptiveAttempts,
      reviews: (reviews as any[]).slice(0, 30),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/submissions/:id/decide', requireAuth, requireRole('reviewer', 'admin'), async (req: AuthRequest, res) => {
  try {
    const { decision, comments, checklist = {} } = req.body;
    if (!['approved', 'rejected', 'needs_correction', 'under_review'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid review decision.' });
    }

    const sub: any = await ResourceSubmission.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Submission not found.' });

    if (
      decision === 'approved' &&
      (!checklist.universityMappingVerified ||
        !checklist.readabilityChecked ||
        !checklist.authenticityChecked ||
        !checklist.permissionsCleared)
    ) {
      return res.status(400).json({
        error: 'All 4 verification checklist items (university mapping, readability, authenticity, permissions) must be confirmed before approval.',
      });
    }

    let publishedPyqId = sub.publishedPyqId || null;

    if (decision === 'approved' && sub.resourceType === 'pyq_paper' && !publishedPyqId) {
      const contributor: any = await User.findById(sub.contributorId);
      const paper: any = await PYQPaper.create({
        title: sub.title,
        universityId: sub.universityId,
        programmeId: sub.programmeId,
        branchId: sub.branchId,
        semesterId: sub.semesterId,
        curriculumSchemeId: sub.curriculumSchemeId,
        subjectId: sub.subjectId,
        examYear: sub.examYear,
        examSession: sub.examSession || 'End-Semester',
        paperCode: sub.paperCode || `SUB-${sub.examYear}`,
        source: sub.sourceDescription,
        uploaderId: sub.contributorId,
        uploaderName: contributor?.name || 'Verified Contributor',
        qualityStatus: 'approved',
        permissionStatus: 'verified_public',
        fileUrl: sub.fileUrl,
        storedFilename: sub.fileUrl ? sub.fileUrl.replace('/uploads/', '') : '',
        fileHash: sub.fileHash,
      });
      publishedPyqId = String(paper._id);
    }

    await ResourceSubmission.findByIdAndUpdate(String(sub._id), {
      $set: {
        status: decision,
        assignedReviewerId: req.user!.id,
        reviewerNotes: sanitizeString(comments || '', 500),
        publishedPyqId,
      },
    });

    if (decision === 'approved') {
      await RewardLedger.updateMany(
        { submissionId: String(sub._id), status: 'pending' },
        { $set: { status: 'approved', notes: 'Approved by academic reviewer' } }
      );
      await ContributorProfile.findOneAndUpdate(
        { userId: sub.contributorId },
        { $inc: { approvedSubmissions: 1 } }
      );
      await createNotification({
        userId: sub.contributorId,
        type: 'contributor_approved',
        title: 'Contribution Approved',
        message: `"${sub.title}" passed review. ₹${sub.rewardAmountInr} has moved to your Approved balance.`,
        link: '/contributor',
      });
    } else if (decision === 'rejected' || decision === 'needs_correction') {
      await RewardLedger.updateMany(
        { submissionId: String(sub._id), status: 'pending' },
        { $set: { status: decision === 'rejected' ? 'reversed' : 'pending', notes: sanitizeString(comments || decision, 200) } }
      );
      await createNotification({
        userId: sub.contributorId,
        type: 'contributor_rejected',
        title: decision === 'rejected' ? 'Contribution Rejected' : 'Corrections Requested',
        message: `"${sub.title}": ${sanitizeString(comments || 'Please review checklist notes.', 200)}`,
        link: '/contributor',
      });
    }

    await Review.create({
      targetType: 'submission',
      targetId: String(sub._id),
      reviewerId: req.user!.id,
      reviewerName: req.user!.name,
      decision,
      checklist: {
        universityMappingVerified: Boolean(checklist.universityMappingVerified),
        readabilityChecked: Boolean(checklist.readabilityChecked),
        authenticityChecked: Boolean(checklist.authenticityChecked),
        permissionsCleared: Boolean(checklist.permissionsCleared),
      },
      comments: sanitizeString(comments || '', 500),
    });

    await recordAudit({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: `REVIEW_SUBMISSION_${decision.toUpperCase()}`,
      entityType: 'ResourceSubmission',
      entityId: String(sub._id),
      summary: `Reviewer ${req.user!.name} marked "${sub.title}" as ${decision}`,
    });

    res.json({ message: `Submission marked as ${decision}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/solutions/:id/decide', requireAuth, requireRole('reviewer', 'admin'), async (req: AuthRequest, res) => {
  try {
    const { decision, comments } = req.body;
    if (!['verified', 'under_review', 'not_verified'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid verification status.' });
    }

    const sol: any = await Solution.findById(req.params.id);
    if (!sol) return res.status(404).json({ error: 'Solution not found.' });

    const nextVersion = Number(sol.currentVersion || 1) + 1;
    const now = new Date().toISOString();

    await Solution.findByIdAndUpdate(String(sol._id), {
      $set: {
        verificationStatus: decision,
        reviewerId: req.user!.id,
        reviewerName: decision === 'verified' ? req.user!.name : sol.reviewerName || 'Under Review',
        lastReviewedAt: now,
        currentVersion: nextVersion,
      },
      $push: {
        versionHistory: {
          version: nextVersion,
          updatedBy: req.user!.name,
          updatedAt: now,
          changeNote: sanitizeString(comments || `Status changed to ${decision}`, 300),
          verificationStatus: decision,
        },
      },
    });

    await Review.create({
      targetType: 'solution',
      targetId: String(sol._id),
      reviewerId: req.user!.id,
      reviewerName: req.user!.name,
      decision: decision === 'verified' ? 'approved' : decision === 'not_verified' ? 'needs_correction' : 'under_review',
      comments: sanitizeString(comments || '', 500),
      versionNumber: nextVersion,
    });

    res.json({ message: `Solution verification updated to ${decision}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/attempts/:attemptId/grade-descriptive', requireAuth, requireRole('reviewer', 'admin'), async (req: AuthRequest, res) => {
  try {
    const { scores } = req.body; // [{ questionId, awardedMarks, reviewerComment }]
    const attempt: any = await TestAttempt.findById(req.params.attemptId);
    if (!attempt) return res.status(404).json({ error: 'Test attempt not found.' });

    const scoreMap = new Map<string, { awardedMarks: number; reviewerComment: string }>();
    for (const s of scores || []) {
      scoreMap.set(String(s.questionId), {
        awardedMarks: Number(s.awardedMarks || 0),
        reviewerComment: sanitizeString(s.reviewerComment || '', 300),
      });
    }

    let descriptiveScore = 0;
    const updatedAnswers = (attempt.answers || []).map((ans: any) => {
      if (ans.isObjective) return ans;
      const graded = scoreMap.get(String(ans.questionId));
      const marks = graded ? Math.min(ans.maxMarks, Math.max(0, graded.awardedMarks)) : ans.awardedMarks;
      descriptiveScore += marks;
      return {
        ...ans,
        awardedMarks: marks,
        evaluationStatus: 'rubric_graded',
        reviewerComment: graded?.reviewerComment || ans.reviewerComment || 'Evaluated by reviewer.',
      };
    });

    const totalAwardedScore = Number(attempt.objectiveScore || 0) + descriptiveScore;
    const percentage =
      attempt.totalMaxScore > 0 ? Math.round((totalAwardedScore / attempt.totalMaxScore) * 100) : attempt.percentage;

    await TestAttempt.findByIdAndUpdate(String(attempt._id), {
      $set: {
        answers: updatedAnswers,
        descriptiveScore,
        totalAwardedScore,
        percentage,
        hasPendingDescriptiveReview: false,
        descriptiveEvaluationStatus: 'evaluated',
      },
    });

    await createNotification({
      userId: attempt.userId,
      type: 'test_reminder',
      title: 'Descriptive Rubric Evaluation Complete',
      message: `Your descriptive mock test responses have been graded. Final score: ${totalAwardedScore}/${attempt.totalMaxScore} (${percentage}%).`,
      link: `/student/tests/attempt/${attempt._id}`,
    });

    res.json({ message: 'Descriptive answers graded via rubric.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
