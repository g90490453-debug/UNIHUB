import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import { env } from '../config/env.ts';
import { optionalAuth, requireAuth, type AuthRequest } from '../middleware/auth.ts';
import {
  Branch,
  CurriculumScheme,
  Entitlement,
  PYQPaper,
  Programme,
  Semester,
  Subject,
  University,
} from '../models/index.ts';
import { streamPyqPdf } from '../services/pdfService.ts';

const router = Router();

async function hydratePyqs(papers: any[]) {
  const [unis, progs, branches, sems, schemes, subjects] = await Promise.all([
    University.find({}),
    Programme.find({}),
    Branch.find({}),
    Semester.find({}),
    CurriculumScheme.find({}),
    Subject.find({}),
  ]);
  const mapById = (arr: any[]) => new Map(arr.map((i) => [String(i._id), i]));
  const uMap = mapById(unis);
  const pMap = mapById(progs);
  const bMap = mapById(branches);
  const sMap = mapById(sems);
  const scMap = mapById(schemes);
  const subMap = mapById(subjects);

  return papers.map((p) => {
    const plain = p.toObject ? p.toObject() : p;
    return {
      ...plain,
      universityName: uMap.get(String(plain.universityId))?.name || '',
      universityCode: uMap.get(String(plain.universityId))?.code || '',
      programmeName: pMap.get(String(plain.programmeId))?.name || '',
      branchName: bMap.get(String(plain.branchId))?.name || '',
      semesterName: sMap.get(String(plain.semesterId))?.name || '',
      curriculumSchemeName: scMap.get(String(plain.curriculumSchemeId))?.name || '',
      subjectName: subMap.get(String(plain.subjectId))?.name || '',
      subjectCode: subMap.get(String(plain.subjectId))?.code || '',
    };
  });
}

async function userHasPyqAccess(userId: string | undefined, paper: any): Promise<boolean> {
  if (paper.isSampleFree) return true;
  if (!userId) return false;
  const now = new Date().toISOString();
  const entitlements: any[] = await Entitlement.find({ userId, status: 'active' });
  return entitlements.some(
    (e) =>
      e.expiresAt > now &&
      e.includesPyqs &&
      String(e.universityId) === String(paper.universityId) &&
      ((e.semesterIds || []).length === 0 || (e.semesterIds || []).map(String).includes(String(paper.semesterId)))
  );
}

router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const {
      universityId,
      programmeId,
      branchId,
      semesterId,
      curriculumSchemeId,
      subjectId,
      examYear,
      examSession,
      q,
      sort,
      scopeToProfile,
    } = req.query as Record<string, string>;

    const filter: Record<string, any> = {
      qualityStatus: 'approved',
      permissionStatus: 'verified_public',
    };

    // Never leak resources from the wrong university or curriculum scheme when student profile is scoped
    if (req.user?.role === 'student' && req.user.academicProfile?.universityId && scopeToProfile !== 'false') {
      filter.universityId = universityId || req.user.academicProfile.universityId;
      if (curriculumSchemeId || req.user.academicProfile.curriculumSchemeId) {
        filter.curriculumSchemeId = curriculumSchemeId || req.user.academicProfile.curriculumSchemeId;
      }
      if (programmeId) filter.programmeId = programmeId;
      if (branchId) filter.branchId = branchId;
      if (semesterId) filter.semesterId = semesterId;
    } else {
      if (universityId) filter.universityId = universityId;
      if (programmeId) filter.programmeId = programmeId;
      if (branchId) filter.branchId = branchId;
      if (semesterId) filter.semesterId = semesterId;
      if (curriculumSchemeId) filter.curriculumSchemeId = curriculumSchemeId;
    }

    if (subjectId) filter.subjectId = subjectId;
    if (examYear) filter.examYear = Number(examYear);
    if (examSession) filter.examSession = examSession;

    const sortDir = sort === 'oldest' ? 1 : -1;
    let papers: any[] = await PYQPaper.find(filter).sort({ examYear: sortDir, createdAt: sortDir });

    if (q) {
      const needle = q.toLowerCase();
      const hydrated = await hydratePyqs(papers);
      const filtered = hydrated.filter(
        (p) =>
          p.title.toLowerCase().includes(needle) ||
          p.paperCode.toLowerCase().includes(needle) ||
          p.subjectName.toLowerCase().includes(needle) ||
          p.subjectCode.toLowerCase().includes(needle)
      );
      const enriched = await Promise.all(
        filtered.map(async (p) => ({
          ...p,
          canDownload: await userHasPyqAccess(req.user?.id, p),
        }))
      );
      return res.json({ papers: enriched });
    }

    const hydrated = await hydratePyqs(papers);
    const enriched = await Promise.all(
      hydrated.map(async (p) => ({
        ...p,
        canDownload: await userHasPyqAccess(req.user?.id, p),
      }))
    );

    res.json({ papers: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const paper: any = await PYQPaper.findById(req.params.id);
    if (!paper || paper.qualityStatus !== 'approved' || paper.permissionStatus !== 'verified_public') {
      if (!req.user || !['admin', 'reviewer'].includes(req.user.role)) {
        return res.status(404).json({ error: 'Question paper not found or pending verification.' });
      }
    }
    if (!paper) return res.status(404).json({ error: 'Question paper not found.' });
    const [hydrated] = await hydratePyqs([paper]);
    const canDownload = await userHasPyqAccess(req.user?.id, paper);
    res.json({ paper: { ...hydrated, canDownload } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/pdf', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const paper: any = await PYQPaper.findById(req.params.id);
    if (!paper) return res.status(404).json({ error: 'Paper not found.' });

    const isAdminOrReviewer = req.user && ['admin', 'reviewer'].includes(req.user.role);
    if (!isAdminOrReviewer && (paper.qualityStatus !== 'approved' || paper.permissionStatus !== 'verified_public')) {
      return res.status(403).json({ error: 'Only approved and permission-checked papers can be accessed.' });
    }

    const isDownload = req.query.download === '1';
    if (isDownload) {
      const allowed = isAdminOrReviewer || (await userHasPyqAccess(req.user?.id, paper));
      if (!allowed) {
        return res.status(403).json({
          error: 'An active Semester PYQ Pass or Complete Pass is required to download this paper.',
        });
      }
      await PYQPaper.findByIdAndUpdate(String(paper._id), { $inc: { downloadCount: 1 } });
    }

    if (paper.storedFilename) {
      const filePath = path.join(env.UPLOAD_DIR, paper.storedFilename);
      if (fs.existsSync(filePath)) {
        res.setHeader(
          'Content-Disposition',
          `${isDownload ? 'attachment' : 'inline'}; filename="${paper.storedFilename}"`
        );
        return res.sendFile(filePath);
      }
    }

    const [hydrated] = await hydratePyqs([paper]);
    streamPyqPdf(res, hydrated, isDownload ? 'attachment' : 'inline');
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/bookmark-check', requireAuth, async (req, res) => {
  res.json({ ok: true });
});

export default router;
