import { Router } from 'express';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth.ts';
import { computeFileSha256, uploadMiddleware } from '../middleware/upload.ts';
import { containsLeakedKeyword, sanitizeString } from '../middleware/validate.ts';
import {
  ContributorProfile,
  PYQPaper,
  Payout,
  PlatformSetting,
  ResourceSubmission,
  RewardLedger,
  Subject,
  University,
} from '../models/index.ts';
import { createNotification, recordAudit } from '../services/auditService.ts';

const router = Router();

router.get('/dashboard', requireAuth, requireRole('contributor', 'campus_lead', 'admin'), async (req: AuthRequest, res) => {
  try {
    const [profile, submissions, ledger, payouts, setting, subjects, unis] = await Promise.all([
      ContributorProfile.findOne({ userId: req.user!.id }),
      ResourceSubmission.find({ contributorId: req.user!.id }).sort({ createdAt: -1 }),
      RewardLedger.find({ contributorId: req.user!.id }).sort({ createdAt: -1 }),
      Payout.find({ contributorId: req.user!.id }).sort({ createdAt: -1 }),
      PlatformSetting.findOne({ key: 'default' }),
      Subject.find({}),
      University.find({}),
    ]);

    const subMap = new Map((subjects as any[]).map((s) => [String(s._id), s]));
    const uniMap = new Map((unis as any[]).map((u) => [String(u._id), u]));

    const pendingRewardsInr = (ledger as any[])
      .filter((l) => l.status === 'pending')
      .reduce((sum, l) => sum + Number(l.amountInr || 0), 0);

    const approvedRewardsInr = (ledger as any[])
      .filter((l) => l.status === 'approved')
      .reduce((sum, l) => sum + Number(l.amountInr || 0), 0);

    const paidRewardsInr = (ledger as any[])
      .filter((l) => l.status === 'paid')
      .reduce((sum, l) => sum + Number(l.amountInr || 0), 0);

    const hydratedSubmissions = (submissions as any[]).map((s) => {
      const plain = s.toObject ? s.toObject() : s;
      return {
        ...plain,
        subjectName: subMap.get(String(plain.subjectId))?.name || '',
        subjectCode: subMap.get(String(plain.subjectId))?.code || '',
        universityCode: uniMap.get(String(plain.universityId))?.code || '',
      };
    });

    res.json({
      profile,
      submissions: hydratedSubmissions,
      wallet: {
        pendingRewardsInr,
        approvedRewardsInr,
        paidRewardsInr,
      },
      ledger,
      payouts,
      rewardRates: (setting as any)?.rewardRates || {
        pyq_paper: 15,
        complete_semester_set: 75,
        syllabus_document: 10,
        revision_notes: 35,
        mock_question: 4,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/profile', requireAuth, requireRole('contributor', 'campus_lead', 'admin'), async (req: AuthRequest, res) => {
  try {
    const existing: any = await ContributorProfile.findOne({ userId: req.user!.id });
    const ap = req.user!.academicProfile || {};
    const universityId = req.body.universityId || existing?.universityId || ap.universityId;
    const programmeId = req.body.programmeId || existing?.programmeId || ap.programmeId;
    const branchId = req.body.branchId || existing?.branchId || ap.branchId;
    const collegeName = req.body.collegeName ?? existing?.collegeName ?? (req.user as any)?.collegeName ?? '';
    const upiId = req.body.upiId !== undefined ? req.body.upiId : existing?.upiId || '';

    if (!universityId || !programmeId || !branchId || !String(collegeName).trim()) {
      return res.status(400).json({ error: 'University, programme, branch, and college name are required.' });
    }

    const profile = await ContributorProfile.findOneAndUpdate(
      { userId: req.user!.id },
      {
        $set: {
          userId: req.user!.id,
          universityId: String(universityId),
          programmeId: String(programmeId),
          branchId: String(branchId),
          collegeName: sanitizeString(collegeName, 150),
          upiId: sanitizeString(upiId, 80),
          status: 'active',
        },
      },
      { upsert: true, new: true }
    );

    res.json({ profile, message: 'Contributor profile saved.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post(
  '/submissions',
  requireAuth,
  requireRole('contributor', 'campus_lead', 'admin'),
  uploadMiddleware.single('file'),
  async (req: AuthRequest, res) => {
    try {
      const {
        universityId,
        programmeId,
        branchId,
        semesterId,
        curriculumSchemeId,
        subjectId,
        resourceType,
        title,
        examYear,
        examSession,
        paperCode,
        sourceDescription,
        rightsDeclarationAccepted,
        notLeakedOrUnreleasedAttested,
      } = req.body;

      const rightsAccepted = rightsDeclarationAccepted === true || rightsDeclarationAccepted === 'true';
      const notLeakedAccepted = notLeakedOrUnreleasedAttested === true || notLeakedOrUnreleasedAttested === 'true';

      if (!rightsAccepted || !notLeakedAccepted) {
        return res.status(400).json({
          error: 'You must accept the rights declaration and attest that the resource is not leaked, confidential, or unreleased.',
        });
      }

      if (containsLeakedKeyword(`${title} ${sourceDescription}`)) {
        return res.status(400).json({
          error: 'Submission blocked: UNIHUB strictly prohibits leaked, confidential, or unreleased examination papers.',
        });
      }

      if (!universityId || !programmeId || !branchId || !semesterId || !curriculumSchemeId || !subjectId || !title) {
        return res.status(400).json({ error: 'All academic metadata fields and title are required.' });
      }

      let fileUrl = '';
      let originalFilename = '';
      let fileHash = '';
      let duplicateWarning = '';

      if (req.file) {
        fileUrl = `/uploads/${req.file.filename}`;
        originalFilename = req.file.originalname;
        fileHash = computeFileSha256(req.file.path);

        const dupByHash = await ResourceSubmission.findOne({ fileHash });
        const dupPyq = await PYQPaper.findOne({ fileHash });
        if (dupByHash || dupPyq) {
          return res.status(409).json({
            error: 'Duplicate file detected (identical SHA-256 checksum already exists in UNIHUB archive).',
          });
        }
      }

      // Check metadata duplicate
      const existingSamePaper = await PYQPaper.findOne({
        universityId,
        subjectId,
        examYear: Number(examYear),
        examSession: examSession || 'End-Semester',
      });
      if (existingSamePaper && resourceType === 'pyq_paper') {
        duplicateWarning = 'Note: An approved paper already exists for this subject, year, and session; reviewer will verify if this is a distinct set.';
      }

      const setting: any = await PlatformSetting.findOne({ key: 'default' });
      const rates = setting?.rewardRates || {
        pyq_paper: 15,
        complete_semester_set: 75,
        syllabus_document: 10,
        revision_notes: 35,
        mock_question: 4,
      };
      const rewardAmountInr = Number(rates[resourceType] ?? 10);

      const submission: any = await ResourceSubmission.create({
        contributorId: req.user!.id,
        universityId: String(universityId),
        programmeId: String(programmeId),
        branchId: String(branchId),
        semesterId: String(semesterId),
        curriculumSchemeId: String(curriculumSchemeId),
        subjectId: String(subjectId),
        resourceType: resourceType || 'pyq_paper',
        title: sanitizeString(title, 200),
        examYear: Number(examYear) || new Date().getFullYear(),
        examSession: sanitizeString(examSession || 'End-Semester', 60),
        paperCode: sanitizeString(paperCode || '', 50),
        sourceDescription: sanitizeString(sourceDescription, 300),
        rightsDeclarationAccepted: rightsAccepted,
        notLeakedOrUnreleasedAttested: notLeakedAccepted,
        fileUrl,
        originalFilename,
        fileHash,
        duplicateWarning,
        status: 'submitted',
        rewardAmountInr,
      });

      // Pending reward entry (strictly non-withdrawable until approved by reviewer)
      await RewardLedger.create({
        contributorId: req.user!.id,
        submissionId: String(submission._id),
        resourceType: submission.resourceType,
        amountInr: rewardAmountInr,
        status: 'pending',
        notes: 'Pending academic review (not withdrawable until approved)',
      });

      await ContributorProfile.findOneAndUpdate(
        { userId: req.user!.id },
        { $inc: { totalSubmissions: 1 } }
      );

      await recordAudit({
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: 'CONTRIBUTION_SUBMITTED',
        entityType: 'ResourceSubmission',
        entityId: String(submission._id),
        summary: `Submitted ${submission.resourceType}: ${submission.title}`,
      });

      res.status(201).json({ submission, duplicateWarning });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Submission upload failed' });
    }
  }
);

router.patch('/submissions/:id/withdraw', requireAuth, requireRole('contributor', 'campus_lead', 'admin'), async (req: AuthRequest, res) => {
  try {
    const sub: any = await ResourceSubmission.findById(req.params.id);
    if (!sub || String(sub.contributorId) !== req.user!.id) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    if (sub.status === 'approved') {
      return res.status(400).json({ error: 'Approved submissions cannot be withdrawn by contributor; contact admin.' });
    }
    await ResourceSubmission.findByIdAndUpdate(String(sub._id), { $set: { status: 'withdrawn' } });
    await RewardLedger.updateMany({ submissionId: String(sub._id) }, { $set: { status: 'reversed' } });
    res.json({ message: 'Submission withdrawn.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch(
  '/submissions/:id/resubmit',
  requireAuth,
  requireRole('contributor', 'campus_lead', 'admin'),
  uploadMiddleware.single('file'),
  async (req: AuthRequest, res) => {
    try {
      const sub: any = await ResourceSubmission.findById(req.params.id);
      if (!sub || String(sub.contributorId) !== req.user!.id) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      if (!['needs_correction', 'submitted', 'rejected'].includes(sub.status)) {
        return res.status(400).json({ error: 'Only submissions needing correction or pending review can be updated.' });
      }

      const title = req.body.title ? sanitizeString(req.body.title, 200) : sub.title;
      const sourceDescription = req.body.sourceDescription
        ? sanitizeString(req.body.sourceDescription, 300)
        : sub.sourceDescription;
      if (containsLeakedKeyword(`${title} ${sourceDescription}`)) {
        return res.status(400).json({
          error: 'Submission blocked: UNIHUB strictly prohibits leaked, confidential, or unreleased examination papers.',
        });
      }

      const updates: Record<string, any> = {
        title,
        sourceDescription,
        paperCode: req.body.paperCode !== undefined ? sanitizeString(req.body.paperCode, 50) : sub.paperCode,
        examYear: req.body.examYear ? Number(req.body.examYear) : sub.examYear,
        examSession: req.body.examSession ? sanitizeString(req.body.examSession, 60) : sub.examSession,
        status: 'submitted',
        reviewerNotes: '',
      };

      if (req.file) {
        const fileHash = computeFileSha256(req.file.path);
        const dupByHash: any = await ResourceSubmission.findOne({ fileHash });
        const dupPyq = await PYQPaper.findOne({ fileHash });
        if ((dupByHash && String(dupByHash._id) !== String(sub._id)) || dupPyq) {
          return res.status(409).json({
            error: 'Duplicate file detected (identical SHA-256 checksum already exists in UNIHUB archive).',
          });
        }
        updates.fileUrl = `/uploads/${req.file.filename}`;
        updates.originalFilename = req.file.originalname;
        updates.fileHash = fileHash;
      }

      const updated = await ResourceSubmission.findByIdAndUpdate(String(sub._id), { $set: updates }, { new: true });
      await RewardLedger.updateMany(
        { submissionId: String(sub._id), status: { $ne: 'paid' } },
        { $set: { status: 'pending', notes: 'Resubmitted after corrections — awaiting review' } }
      );

      await recordAudit({
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: 'CONTRIBUTION_RESUBMITTED',
        entityType: 'ResourceSubmission',
        entityId: String(sub._id),
        summary: `Resubmitted corrected resource: ${title}`,
      });

      res.json({ submission: updated, message: 'Corrections saved and submission re-queued for academic review.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Resubmission failed' });
    }
  }
);

router.post('/payouts/request', requireAuth, requireRole('contributor', 'campus_lead', 'admin'), async (req: AuthRequest, res) => {
  try {
    const upiId = sanitizeString(req.body.upiId, 80);
    if (!upiId || !upiId.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid UPI ID (e.g., name@bank) for payout.' });
    }

    const approvedEntries: any[] = await RewardLedger.find({
      contributorId: req.user!.id,
      status: 'approved',
    });

    if (approvedEntries.length === 0) {
      return res.status(400).json({
        error: 'No withdrawable approved rewards available. Pending rewards cannot be withdrawn until verified.',
      });
    }

    const amountInr = approvedEntries.reduce((sum, e) => sum + Number(e.amountInr || 0), 0);
    const entryIds = approvedEntries.map((e) => String(e._id));

    const payout: any = await Payout.create({
      contributorId: req.user!.id,
      amountInr,
      upiId,
      ledgerEntryIds: entryIds,
      status: 'requested',
      notes: `Requested payout for ${entryIds.length} approved reward(s)`,
    });

    await RewardLedger.updateMany(
      { _id: { $in: entryIds } },
      { $set: { payoutId: String(payout._id) } }
    );

    await createNotification({
      userId: req.user!.id,
      type: 'system',
      title: 'Payout Request Submitted',
      message: `Your payout request of ₹${amountInr} to ${upiId} is queued for admin release.`,
      link: '/contributor',
    });

    res.status(201).json({ payout });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
