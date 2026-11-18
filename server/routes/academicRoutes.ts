import { Router } from 'express';
import {
  AcademicYear,
  Branch,
  CurriculumScheme,
  MockTest,
  PYQPaper,
  Programme,
  Semester,
  Subject,
  Topic,
  University,
} from '../models/index.ts';

const router = Router();

router.get('/universities', async (_req, res) => {
  try {
    const universities = await University.find({ isActive: true }).sort({ name: 1 });
    res.json({ universities });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cascade', async (req, res) => {
  try {
    const { universityId, programmeId, branchId, semesterId, curriculumSchemeId, subjectId } = req.query as Record<
      string,
      string
    >;

    const [universities, academicYears] = await Promise.all([
      University.find({ isActive: true }).sort({ name: 1 }),
      AcademicYear.find({}).sort({ startYear: -1 }),
    ]);

    const programmes = universityId
      ? await Programme.find({ universityId, isActive: true }).sort({ name: 1 })
      : [];

    const branches = programmeId
      ? await Branch.find({ ...(universityId ? { universityId } : {}), programmeId, isActive: true }).sort({ name: 1 })
      : [];

    const semesters = programmeId
      ? await Semester.find({ ...(universityId ? { universityId } : {}), programmeId, isActive: true }).sort({ number: 1 })
      : [];

    const curriculumSchemes = programmeId
      ? await CurriculumScheme.find({ ...(universityId ? { universityId } : {}), programmeId, isActive: true }).sort({
          effectiveFromYear: -1,
        })
      : [];

    const subjectFilter: Record<string, any> = { isActive: true };
    if (universityId) subjectFilter.universityId = universityId;
    if (programmeId) subjectFilter.programmeId = programmeId;
    if (branchId) subjectFilter.branchId = branchId;
    if (semesterId) subjectFilter.semesterId = semesterId;
    if (curriculumSchemeId) subjectFilter.curriculumSchemeId = curriculumSchemeId;

    const subjects =
      universityId && programmeId
        ? await Subject.find(subjectFilter).sort({ code: 1 })
        : [];

    const topics = subjectId ? await Topic.find({ subjectId }).sort({ unitNumber: 1 }) : [];

    res.json({
      universities,
      academicYears,
      programmes,
      branches,
      semesters,
      curriculumSchemes,
      subjects,
      topics,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/public-preview', async (req, res) => {
  try {
    const { universityId, semesterId } = req.query as Record<string, string>;
    const [universities, programmes, semesters, subjects] = await Promise.all([
      University.find({ isActive: true }).sort({ name: 1 }),
      Programme.find({ isActive: true }).sort({ name: 1 }),
      Semester.find({ isActive: true }).sort({ number: 1 }),
      Subject.find({
        isActive: true,
        ...(universityId ? { universityId } : {}),
        ...(semesterId ? { semesterId } : {}),
      }).sort({ code: 1 }),
    ]);

    const pyqCount = await PYQPaper.countDocuments({
      qualityStatus: 'approved',
      permissionStatus: 'verified_public',
      ...(universityId ? { universityId } : {}),
      ...(semesterId ? { semesterId } : {}),
    });

    const mockTestCount = await MockTest.countDocuments({
      isPublished: true,
      ...(universityId ? { universityId } : {}),
      ...(semesterId ? { semesterId } : {}),
    });

    res.json({
      universities,
      programmes,
      semesters,
      subjects: subjects.slice(0, 8),
      counts: { pyqCount, mockTestCount, subjectCount: subjects.length },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
