import crypto from 'crypto';
import { Router } from 'express';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth.ts';
import { uploadMiddleware } from '../middleware/upload.ts';
import { sanitizeString } from '../middleware/validate.ts';
import {
  AcademicYear,
  AuditLog,
  Branch,
  ContactMessage,
  ContributorProfile,
  CurriculumScheme,
  Entitlement,
  MockTest,
  PYQPaper,
  Package,
  Payment,
  Payout,
  PlatformSetting,
  Programme,
  Purchase,
  Question,
  ResourceSubmission,
  RewardLedger,
  Semester,
  Solution,
  Subject,
  TestAttempt,
  Topic,
  University,
  User,
} from '../models/index.ts';
import { createNotification, recordAudit } from '../services/auditService.ts';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/reports', async (_req, res) => {
  try {
    const [
      users,
      pyqs,
      attempts,
      purchases,
      payments,
      contributors,
      submissions,
      subjects,
      payouts,
      auditLogs,
    ] = await Promise.all([
      User.find({}),
      PYQPaper.find({}),
      TestAttempt.find({}),
      Purchase.find({}),
      Payment.find({}),
      ContributorProfile.find({}),
      ResourceSubmission.find({}),
      Subject.find({}),
      Payout.find({}),
      AuditLog.find({}).sort({ createdAt: -1 }).limit(40),
    ]);

    const students = (users as any[]).filter((u) => u.role === 'student');
    const activeStudents = students.filter((u) => u.status === 'active');
    const approvedPyqs = (pyqs as any[]).filter((p) => p.qualityStatus === 'approved');
    const paidPurchases = (purchases as any[]).filter((p) => p.status === 'paid');
    const refundedPurchases = (purchases as any[]).filter((p) => p.status === 'refunded');

    const grossRevenueInr = paidPurchases.reduce((s, p) => s + Number(p.finalAmountInr || 0), 0);
    const totalRefundsInr = refundedPurchases.reduce((s, p) => s + Number(p.finalAmountInr || 0), 0);

    const coveredSubjects = new Set(approvedPyqs.map((p) => String(p.subjectId)));
    const contentCoveragePercent =
      (subjects as any[]).length > 0 ? Math.round((coveredSubjects.size / (subjects as any[]).length) * 100) : 0;

    const packageRevMap = new Map<string, { packageCode: string; revenue: number; count: number }>();
    for (const p of paidPurchases) {
      const code = String(p.packageCode || 'pass');
      if (!packageRevMap.has(code)) packageRevMap.set(code, { packageCode: code, revenue: 0, count: 0 });
      const entry = packageRevMap.get(code)!;
      entry.revenue += Number(p.finalAmountInr || 0);
      entry.count += 1;
    }

    const roleCountsMap = new Map<string, number>();
    for (const u of users as any[]) {
      roleCountsMap.set(u.role, (roleCountsMap.get(u.role) || 0) + 1);
    }
    const roleDistribution = Array.from(roleCountsMap.entries()).map(([role, count]) => ({ role, count }));

    const openInquiriesCount = await ContactMessage.countDocuments({ status: 'new' });

    res.json({
      reports: {
        totalStudents: students.length,
        activeStudents: activeStudents.length,
        totalUsers: (users as any[]).length,
        totalResources: (pyqs as any[]).length,
        approvedPyqs: approvedPyqs.length,
        mockTestAttempts: (attempts as any[]).length,
        grossRevenueInr,
        totalRefundsInr,
        refundCount: refundedPurchases.length,
        failedPaymentsCount: (payments as any[]).filter((p) => p.status === 'failed').length,
        activeContributors: (contributors as any[]).length,
        approvedSubmissions: (submissions as any[]).filter((s) => s.status === 'approved').length,
        pendingPayoutsCount: (payouts as any[]).filter((p) => p.status === 'requested').length,
        contentCoveragePercent,
        coveredSubjectsCount: coveredSubjects.size,
        totalSubjectsCount: (subjects as any[]).length,
        openInquiriesCount,
      },
      revenueByPackage: Array.from(packageRevMap.values()),
      roleDistribution,
      auditLogs,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Users
router.get('/users', async (req, res) => {
  try {
    const q = String(req.query.q || '').toLowerCase();
    const users: any[] = await User.find({}).sort({ createdAt: -1 });
    const filtered = users
      .map((u) => {
        const plain = u.toObject ? u.toObject() : u;
        const { passwordHash: _pw, resetToken: _rt, ...safe } = plain;
        return safe;
      })
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    res.json({ users: filtered });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id', async (req: AuthRequest, res) => {
  try {
    const { role, status, name, collegeName } = req.body;
    const updates: Record<string, any> = {};
    if (role && ['student', 'contributor', 'campus_lead', 'reviewer', 'admin'].includes(role)) {
      updates.role = role;
    }
    if (status && ['active', 'suspended', 'deletion_requested'].includes(status)) {
      updates.status = status;
    }
    if (name) updates.name = sanitizeString(name, 100);
    if (collegeName !== undefined) updates.collegeName = sanitizeString(collegeName, 150);

    const updated: any = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!updated) return res.status(404).json({ error: 'User not found' });

    await recordAudit({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: 'admin',
      action: 'ADMIN_USER_UPDATED',
      entityType: 'User',
      entityId: req.params.id,
      summary: `Updated user ${updated.email}: ${JSON.stringify(updates)}`,
    });

    res.json({ user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Academic Catalogue CRUD
router.get('/academic/all', async (_req, res) => {
  try {
    const [universities, programmes, branches, academicYears, semesters, schemes, subjects, topics] =
      await Promise.all([
        University.find({}).sort({ name: 1 }),
        Programme.find({}).sort({ name: 1 }),
        Branch.find({}).sort({ name: 1 }),
        AcademicYear.find({}).sort({ startYear: -1 }),
        Semester.find({}).sort({ number: 1 }),
        CurriculumScheme.find({}).sort({ effectiveFromYear: -1 }),
        Subject.find({}).sort({ code: 1 }),
        Topic.find({}).sort({ unitNumber: 1 }),
      ]);
    res.json({ universities, programmes, branches, academicYears, semesters, schemes, subjects, topics });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/academic/universities', async (req: AuthRequest, res) => {
  try {
    const doc = await University.create({
      code: sanitizeString(req.body.code, 20).toUpperCase(),
      name: sanitizeString(req.body.name, 150),
      shortName: sanitizeString(req.body.shortName || req.body.code, 60),
      location: sanitizeString(req.body.location || '', 120),
      type: req.body.type || 'State Technical',
      website: sanitizeString(req.body.website || '', 200),
    });
    await recordAudit({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: 'admin',
      action: 'ACADEMIC_UNIVERSITY_CREATED',
      entityType: 'University',
      entityId: String((doc as any)._id),
      summary: `Added university ${(doc as any).name}`,
    });
    res.status(201).json({ university: doc });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/academic/programmes', async (req, res) => {
  try {
    const doc = await Programme.create({
      universityId: req.body.universityId,
      code: sanitizeString(req.body.code, 20).toUpperCase(),
      name: sanitizeString(req.body.name, 100),
      durationSemesters: Number(req.body.durationSemesters || 8),
    });
    res.status(201).json({ programme: doc });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/academic/branches', async (req, res) => {
  try {
    const doc = await Branch.create({
      universityId: req.body.universityId,
      programmeId: req.body.programmeId,
      code: sanitizeString(req.body.code, 20).toUpperCase(),
      name: sanitizeString(req.body.name, 120),
    });
    res.status(201).json({ branch: doc });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/academic/years', async (req, res) => {
  try {
    const startYear = Number(req.body.startYear);
    const endYear = Number(req.body.endYear || startYear + 1);
    const doc = await AcademicYear.create({
      label: sanitizeString(req.body.label || `${startYear}-${String(endYear).slice(-2)}`, 20),
      startYear,
      endYear,
      isCurrent: Boolean(req.body.isCurrent),
    });
    res.status(201).json({ academicYear: doc });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/academic/semesters', async (req, res) => {
  try {
    const num = Number(req.body.number);
    const doc = await Semester.create({
      universityId: req.body.universityId,
      programmeId: req.body.programmeId,
      number: num,
      name: sanitizeString(req.body.name || `Semester ${num}`, 40),
    });
    res.status(201).json({ semester: doc });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/academic/schemes', async (req, res) => {
  try {
    const doc = await CurriculumScheme.create({
      universityId: req.body.universityId,
      programmeId: req.body.programmeId,
      code: sanitizeString(req.body.code, 40),
      name: sanitizeString(req.body.name, 150),
      effectiveFromYear: Number(req.body.effectiveFromYear || 2022),
    });
    res.status(201).json({ scheme: doc });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/academic/subjects', async (req, res) => {
  try {
    const doc = await Subject.create({
      universityId: req.body.universityId,
      programmeId: req.body.programmeId,
      branchId: req.body.branchId,
      semesterId: req.body.semesterId,
      curriculumSchemeId: req.body.curriculumSchemeId,
      code: sanitizeString(req.body.code, 30).toUpperCase(),
      name: sanitizeString(req.body.name, 150),
      credits: Number(req.body.credits || 4),
      syllabusUnits: Array.isArray(req.body.syllabusUnits) ? req.body.syllabusUnits : [],
    });
    res.status(201).json({ subject: doc });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/academic/topics', async (req, res) => {
  try {
    const doc = await Topic.create({
      subjectId: req.body.subjectId,
      unitNumber: Number(req.body.unitNumber || 1),
      name: sanitizeString(req.body.name, 150),
      syllabusWeightagePercent: Number(req.body.syllabusWeightagePercent || 20),
    });
    res.status(201).json({ topic: doc });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PYQ Management
router.get('/pyqs', async (_req, res) => {
  try {
    const papers = await PYQPaper.find({}).sort({ createdAt: -1 });
    res.json({ papers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pyqs', uploadMiddleware.single('file'), async (req: AuthRequest, res) => {
  try {
    const doc = await PYQPaper.create({
      title: sanitizeString(req.body.title, 200),
      universityId: req.body.universityId,
      programmeId: req.body.programmeId,
      branchId: req.body.branchId,
      semesterId: req.body.semesterId,
      curriculumSchemeId: req.body.curriculumSchemeId,
      subjectId: req.body.subjectId,
      examYear: Number(req.body.examYear || 2025),
      examSession: req.body.examSession || 'End-Semester',
      paperCode: sanitizeString(req.body.paperCode, 50),
      totalMarks: Number(req.body.totalMarks || 70),
      durationMinutes: Number(req.body.durationMinutes || 180),
      source: sanitizeString(req.body.source || 'Official Archive', 150),
      uploaderId: req.user!.id,
      uploaderName: req.user!.name,
      qualityStatus: req.body.qualityStatus || 'approved',
      permissionStatus: req.body.permissionStatus || 'verified_public',
      isSampleFree: req.body.isSampleFree === true || req.body.isSampleFree === 'true',
      fileUrl: req.file ? `/uploads/${req.file.filename}` : '',
      storedFilename: req.file ? req.file.filename : '',
    });
    res.status(201).json({ paper: doc });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/pyqs/:id', async (req: AuthRequest, res) => {
  try {
    const allowedFields = ['title', 'examYear', 'examSession', 'paperCode', 'qualityStatus', 'permissionStatus', 'isSampleFree', 'source'];
    const updates: Record<string, any> = {};
    for (const f of allowedFields) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
    const updated = await PYQPaper.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Paper not found' });
    await recordAudit({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: 'admin',
      action: 'ADMIN_PYQ_UPDATED',
      entityType: 'PYQPaper',
      entityId: req.params.id,
      summary: `Updated PYQ status/metadata: ${JSON.stringify(updates)}`,
    });
    res.json({ paper: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Question & Mock Test Management
router.get('/questions', async (_req, res) => {
  try {
    const questions = await Question.find({}).sort({ createdAt: -1 });
    res.json({ questions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/questions', async (req, res) => {
  try {
    const doc = await Question.create({
      universityId: req.body.universityId,
      subjectId: req.body.subjectId,
      topicId: req.body.topicId || null,
      statement: sanitizeString(req.body.statement, 1000),
      questionType: req.body.questionType || 'mcq',
      difficulty: req.body.difficulty || 'medium',
      marks: Number(req.body.marks || 2),
      examYear: Number(req.body.examYear || 2025),
      source: sanitizeString(req.body.source || 'Admin Question Bank', 120),
      options: Array.isArray(req.body.options) ? req.body.options : [],
      correctAnswer: sanitizeString(req.body.correctAnswer || '', 500),
      explanation: sanitizeString(req.body.explanation || '', 1000),
      isVerifiedExplanation: Boolean(req.body.isVerifiedExplanation),
      publicationStatus: req.body.publicationStatus || 'published',
    });
    res.status(201).json({ question: doc });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/questions/:id', async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/mock-tests', async (_req, res) => {
  try {
    const tests = await MockTest.find({}).sort({ createdAt: -1 });
    res.json({ tests });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/mock-tests', async (req, res) => {
  try {
    const questionIds = Array.isArray(req.body.questionIds) ? req.body.questionIds : [];
    const doc = await MockTest.create({
      title: sanitizeString(req.body.title, 200),
      description: sanitizeString(req.body.description || '', 500),
      universityId: req.body.universityId,
      programmeId: req.body.programmeId,
      branchId: req.body.branchId,
      semesterId: req.body.semesterId,
      curriculumSchemeId: req.body.curriculumSchemeId,
      subjectId: req.body.subjectId || null,
      testScope: req.body.testScope || 'subject',
      durationMinutes: Number(req.body.durationMinutes || 30),
      totalMarks: Number(req.body.totalMarks || 20),
      randomizeQuestions: Boolean(req.body.randomizeQuestions),
      isPublished: req.body.isPublished !== false,
      isFreeSample: Boolean(req.body.isFreeSample),
      sections: Array.isArray(req.body.sections)
        ? req.body.sections
        : [{ name: 'Section A', instructions: 'Attempt all questions.', questionIds }],
      questionIds,
    });
    res.status(201).json({ test: doc });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/mock-tests/:id', async (req, res) => {
  try {
    const updated = await MockTest.findByIdAndUpdate(
      req.params.id,
      { $set: { isPublished: Boolean(req.body.isPublished) } },
      { new: true }
    );
    res.json({ test: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Solutions reviewer assignment
router.patch('/solutions/:id/assign', async (req, res) => {
  try {
    const reviewer: any = await User.findById(req.body.reviewerId);
    const updated = await Solution.findByIdAndUpdate(
      req.params.id,
      { $set: { reviewerId: req.body.reviewerId, reviewerName: reviewer?.name || 'Assigned Reviewer' } },
      { new: true }
    );
    res.json({ solution: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Contributor Rewards & Payouts
router.get('/rewards-payouts', async (_req, res) => {
  try {
    const [setting, payouts, contributors, users] = await Promise.all([
      PlatformSetting.findOne({ key: 'default' }),
      Payout.find({}).sort({ createdAt: -1 }),
      ContributorProfile.find({}),
      User.find({}),
    ]);
    const userMap = new Map((users as any[]).map((u) => [String(u._id), u]));
    const hydratedPayouts = (payouts as any[]).map((p) => {
      const plain = p.toObject ? p.toObject() : p;
      return {
        ...plain,
        contributorName: userMap.get(String(plain.contributorId))?.name || 'Contributor',
        contributorEmail: userMap.get(String(plain.contributorId))?.email || '',
      };
    });
    res.json({ setting, payouts: hydratedPayouts, contributors });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/reward-rates', async (req: AuthRequest, res) => {
  try {
    const { pyq_paper, complete_semester_set, syllabus_document, revision_notes, mock_question } = req.body;
    const setting = await PlatformSetting.findOneAndUpdate(
      { key: 'default' },
      {
        $set: {
          rewardRates: {
            pyq_paper: Number(pyq_paper ?? 15),
            complete_semester_set: Number(complete_semester_set ?? 75),
            syllabus_document: Number(syllabus_document ?? 10),
            revision_notes: Number(revision_notes ?? 35),
            mock_question: Number(mock_question ?? 4),
          },
        },
      },
      { upsert: true, new: true }
    );
    await recordAudit({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: 'admin',
      action: 'REWARD_RATES_UPDATED',
      entityType: 'PlatformSetting',
      summary: 'Updated contributor reward rates',
    });
    res.json({ setting });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/payouts/:id/approve', async (req: AuthRequest, res) => {
  try {
    const payout: any = await Payout.findById(req.params.id);
    if (!payout) return res.status(404).json({ error: 'Payout request not found' });
    if (payout.status === 'paid') return res.status(400).json({ error: 'Payout already settled' });

    const txRef = sanitizeString(req.body.transactionReference || `UTR${crypto.randomInt(10000000, 99999999)}`, 60);

    await Payout.findByIdAndUpdate(String(payout._id), {
      $set: {
        status: 'paid',
        transactionReference: txRef,
        processedByAdminId: req.user!.id,
        processedAt: new Date().toISOString(),
      },
    });

    await RewardLedger.updateMany(
      { _id: { $in: payout.ledgerEntryIds || [] } },
      { $set: { status: 'paid' } }
    );

    await createNotification({
      userId: payout.contributorId,
      type: 'reward_approved',
      title: 'Contributor Payout Released',
      message: `₹${payout.amountInr} has been transferred to ${payout.upiId} (Ref: ${txRef}).`,
      link: '/contributor',
    });

    res.json({ message: 'Payout approved and marked paid.', transactionReference: txRef });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Payments, Packages & Refunds
router.get('/payments', async (_req, res) => {
  try {
    const [purchases, payments, packages, entitlements, users] = await Promise.all([
      Purchase.find({}).sort({ createdAt: -1 }),
      Payment.find({}).sort({ createdAt: -1 }),
      Package.find({}).sort({ displayOrder: 1 }),
      Entitlement.find({}).sort({ createdAt: -1 }),
      User.find({}),
    ]);
    const userMap = new Map((users as any[]).map((u) => [String(u._id), u]));
    const payMap = new Map((payments as any[]).map((p) => [String(p.purchaseId), p]));

    const hydratedPurchases = (purchases as any[]).map((pur) => {
      const plain = pur.toObject ? pur.toObject() : pur;
      const u = userMap.get(String(plain.userId));
      const pay = payMap.get(String(plain._id));
      return {
        ...plain,
        studentName: u?.name || 'Student',
        studentEmail: u?.email || '',
        paymentId: pay?._id || '',
        paymentMethod: pay?.method || 'upi',
        paymentStatus: pay?.status || plain.status,
        razorpayOrderId: pay?.razorpayOrderId || '',
        failureReason: pay?.failureReason || '',
      };
    });

    res.json({ purchases: hydratedPurchases, packages, entitlements });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/packages/:id', async (req: AuthRequest, res) => {
  try {
    const updated = await Package.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          priceInr: Number(req.body.priceInr),
          validityMonths: Number(req.body.validityMonths || 6),
          isActive: req.body.isActive !== false,
        },
      },
      { new: true }
    );
    await recordAudit({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: 'admin',
      action: 'PACKAGE_CONFIG_UPDATED',
      entityType: 'Package',
      entityId: req.params.id,
      summary: `Updated package pricing to ₹${req.body.priceInr}`,
    });
    res.json({ package: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/purchases/:id/refund', async (req: AuthRequest, res) => {
  try {
    const purchase: any = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ error: 'Purchase not found' });
    if (purchase.status !== 'paid') return res.status(400).json({ error: 'Only paid purchases can be refunded' });

    const reason = sanitizeString(req.body.reason || 'Approved refund by administrator', 200);
    const refundId = `rfnd_${crypto.randomBytes(6).toString('hex')}`;

    await Purchase.findByIdAndUpdate(String(purchase._id), { $set: { status: 'refunded' } });
    await Payment.updateMany(
      { purchaseId: String(purchase._id) },
      { $set: { status: 'refunded', refundId, refundReason: reason, refundedAt: new Date().toISOString() } }
    );
    await Entitlement.updateMany(
      { purchaseId: String(purchase._id) },
      { $set: { status: 'revoked_refund' } }
    );

    await createNotification({
      userId: purchase.userId,
      type: 'system',
      title: 'Refund Processed',
      message: `Refund of ₹${purchase.finalAmountInr} (Ref: ${refundId}) processed for receipt ${purchase.receiptNumber}.`,
      link: '/student/packages',
    });

    await recordAudit({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: 'admin',
      action: 'PAYMENT_REFUNDED',
      entityType: 'Purchase',
      entityId: String(purchase._id),
      summary: `Refunded ₹${purchase.finalAmountInr} for ${purchase.receiptNumber}`,
    });

    res.json({ message: 'Refund processed and entitlement revoked.', refundId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Support & Campus Feedback Messages Inbox
router.get('/messages', async (_req, res) => {
  try {
    const messages = await ContactMessage.find({}).sort({ createdAt: -1 });
    res.json({ messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/messages/:id', async (req: AuthRequest, res) => {
  try {
    const status = String(req.body.status || '');
    if (!['new', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid inquiry status.' });
    }
    const updated = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Message not found' });
    await recordAudit({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: 'admin',
      action: 'SUPPORT_MESSAGE_UPDATED',
      entityType: 'ContactMessage',
      entityId: req.params.id,
      summary: `Marked support message as ${status}`,
    });
    res.json({ entry: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
