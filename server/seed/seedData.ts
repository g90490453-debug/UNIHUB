import bcrypt from 'bcryptjs';
import {
  AcademicYear,
  AuditLog,
  Branch,
  ContributorProfile,
  CurriculumScheme,
  Entitlement,
  MockTest,
  Notification,
  PYQPaper,
  Package,
  Payment,
  PlatformSetting,
  Programme,
  Purchase,
  Question,
  ResourceSubmission,
  Review,
  RewardLedger,
  Semester,
  Solution,
  Subject,
  TestAttempt,
  Topic,
  University,
  User,
} from '../models/index.ts';

export async function seedDatabaseIfEmpty() {
  const existingUnis = await University.countDocuments();
  if (existingUnis > 0) {
    return;
  }

  console.log('Seeding initial UNIHUB academic catalogue and platform records...');

  // 1. Platform Settings
  await PlatformSetting.create({
    key: 'default',
    rewardRates: {
      pyq_paper: 15,
      complete_semester_set: 75,
      syllabus_document: 10,
      revision_notes: 35,
      mock_question: 4,
    },
    allowPilotPricingNotice: true,
  });

  // 2. Academic Years
  const ay2324: any = await AcademicYear.create({ label: '2023-24', startYear: 2023, endYear: 2024, isCurrent: false });
  const ay2425: any = await AcademicYear.create({ label: '2024-25', startYear: 2024, endYear: 2025, isCurrent: false });
  const ay2526: any = await AcademicYear.create({ label: '2025-26', startYear: 2025, endYear: 2026, isCurrent: true });

  // 3. Universities
  const aktu: any = await University.create({
    code: 'AKTU',
    name: 'Dr. A.P.J. Abdul Kalam Technical University',
    shortName: 'AKTU Lucknow',
    location: 'Lucknow, Uttar Pradesh',
    type: 'State Technical',
    website: 'https://aktu.ac.in',
  });

  const ipu: any = await University.create({
    code: 'IPU',
    name: 'Guru Gobind Singh Indraprastha University',
    shortName: 'GGSIPU Delhi',
    location: 'New Delhi',
    type: 'State Public',
    website: 'https://ipu.ac.in',
  });

  const iimt: any = await University.create({
    code: 'IIMT',
    name: 'IIMT University',
    shortName: 'IIMT Meerut',
    location: 'Meerut, Uttar Pradesh',
    type: 'Private',
    website: 'https://iimtu.edu.in',
  });

  // 4. Programmes
  const aktuBtech: any = await Programme.create({ universityId: aktu._id, code: 'BTECH', name: 'B.Tech', durationSemesters: 8 });
  const aktuBca: any = await Programme.create({ universityId: aktu._id, code: 'BCA', name: 'BCA', durationSemesters: 6 });
  const ipuBtech: any = await Programme.create({ universityId: ipu._id, code: 'BTECH', name: 'B.Tech', durationSemesters: 8 });
  const ipuBba: any = await Programme.create({ universityId: ipu._id, code: 'BBA', name: 'BBA', durationSemesters: 6 });
  const iimtBcom: any = await Programme.create({ universityId: iimt._id, code: 'BCOM', name: 'B.Com', durationSemesters: 6 });
  const iimtBtech: any = await Programme.create({ universityId: iimt._id, code: 'BTECH', name: 'B.Tech', durationSemesters: 8 });

  // 5. Branches
  const aktuCse: any = await Branch.create({ universityId: aktu._id, programmeId: aktuBtech._id, code: 'CSE', name: 'Computer Science & Engineering' });
  const aktuIt: any = await Branch.create({ universityId: aktu._id, programmeId: aktuBtech._id, code: 'IT', name: 'Information Technology' });
  const aktuEce: any = await Branch.create({ universityId: aktu._id, programmeId: aktuBtech._id, code: 'ECE', name: 'Electronics & Communication' });
  const aktuCa: any = await Branch.create({ universityId: aktu._id, programmeId: aktuBca._id, code: 'CA', name: 'Computer Applications' });

  const ipuCse: any = await Branch.create({ universityId: ipu._id, programmeId: ipuBtech._id, code: 'CSE', name: 'Computer Science & Engineering' });
  const ipuMgmt: any = await Branch.create({ universityId: ipu._id, programmeId: ipuBba._id, code: 'BBA-GEN', name: 'General Management' });

  const iimtCom: any = await Branch.create({ universityId: iimt._id, programmeId: iimtBcom._id, code: 'BCOM-H', name: 'Commerce & Accounting' });
  const iimtCse: any = await Branch.create({ universityId: iimt._id, programmeId: iimtBtech._id, code: 'CSE', name: 'Computer Science & Engineering' });

  // 6. Semesters
  const aktuSem3: any = await Semester.create({ universityId: aktu._id, programmeId: aktuBtech._id, number: 3, name: 'Semester 3' });
  const aktuSem4: any = await Semester.create({ universityId: aktu._id, programmeId: aktuBtech._id, number: 4, name: 'Semester 4' });
  const aktuSem5: any = await Semester.create({ universityId: aktu._id, programmeId: aktuBtech._id, number: 5, name: 'Semester 5' });
  const aktuBcaSem3: any = await Semester.create({ universityId: aktu._id, programmeId: aktuBca._id, number: 3, name: 'Semester 3' });

  const ipuSem4: any = await Semester.create({ universityId: ipu._id, programmeId: ipuBtech._id, number: 4, name: 'Semester 4' });
  const ipuBbaSem2: any = await Semester.create({ universityId: ipu._id, programmeId: ipuBba._id, number: 2, name: 'Semester 2' });

  const iimtBcomSem2: any = await Semester.create({ universityId: iimt._id, programmeId: iimtBcom._id, number: 2, name: 'Semester 2' });
  const iimtBtechSem3: any = await Semester.create({ universityId: iimt._id, programmeId: iimtBtech._id, number: 3, name: 'Semester 3' });

  // 7. Curriculum Schemes
  const aktuSchemeAicte: any = await CurriculumScheme.create({
    universityId: aktu._id,
    programmeId: aktuBtech._id,
    code: 'BCS-2022',
    name: 'AICTE NEP-2022 (BCS Series)',
    effectiveFromYear: 2022,
  });
  const aktuSchemeKcs: any = await CurriculumScheme.create({
    universityId: aktu._id,
    programmeId: aktuBtech._id,
    code: 'KCS-2018',
    name: 'AKTU Revised Choice Based (KCS Series)',
    effectiveFromYear: 2018,
  });
  const aktuBcaScheme: any = await CurriculumScheme.create({
    universityId: aktu._id,
    programmeId: aktuBca._id,
    code: 'BCA-NEP2020',
    name: 'AKTU BCA NEP-2020',
    effectiveFromYear: 2021,
  });
  const ipuScheme2021: any = await CurriculumScheme.create({
    universityId: ipu._id,
    programmeId: ipuBtech._id,
    code: 'GGSIPU-2021',
    name: 'IPU AICTE Outcome Scheme 2021',
    effectiveFromYear: 2021,
  });
  const ipuBbaScheme: any = await CurriculumScheme.create({
    universityId: ipu._id,
    programmeId: ipuBba._id,
    code: 'IPU-BBA-2022',
    name: 'IPU Management NEP Scheme',
    effectiveFromYear: 2022,
  });
  const iimtComScheme: any = await CurriculumScheme.create({
    universityId: iimt._id,
    programmeId: iimtBcom._id,
    code: 'IIMT-CBCS-2022',
    name: 'IIMT Commerce CBCS 2022',
    effectiveFromYear: 2022,
  });
  const iimtBtechScheme: any = await CurriculumScheme.create({
    universityId: iimt._id,
    programmeId: iimtBtech._id,
    code: 'IIMT-BTECH-2022',
    name: 'IIMT Engineering Scheme 2022',
    effectiveFromYear: 2022,
  });

  // 8. Subjects & Topics (AKTU B.Tech CSE Sem 4 + Sem 3 + IPU + IIMT)
  const subjDs: any = await Subject.create({
    universityId: aktu._id,
    programmeId: aktuBtech._id,
    branchId: aktuCse._id,
    semesterId: aktuSem4._id,
    curriculumSchemeId: aktuSchemeAicte._id,
    code: 'BCS401',
    name: 'Operating Systems',
    credits: 4,
    syllabusUnits: ['Process Management & CPU Scheduling', 'Deadlocks & Synchronization', 'Memory Management & Paging', 'File Systems & Disk Scheduling'],
  });
  const subjDbms: any = await Subject.create({
    universityId: aktu._id,
    programmeId: aktuBtech._id,
    branchId: aktuCse._id,
    semesterId: aktuSem4._id,
    curriculumSchemeId: aktuSchemeAicte._id,
    code: 'BCS402',
    name: 'Database Management Systems',
    credits: 4,
    syllabusUnits: ['ER Model & Relational Algebra', 'SQL & Normalization (1NF-BCNF)', 'Transaction Management & Concurrency', 'Indexing & B+ Trees'],
  });
  const subjTafl: any = await Subject.create({
    universityId: aktu._id,
    programmeId: aktuBtech._id,
    branchId: aktuCse._id,
    semesterId: aktuSem4._id,
    curriculumSchemeId: aktuSchemeAicte._id,
    code: 'BCS403',
    name: 'Theory of Automata & Formal Languages',
    credits: 4,
    syllabusUnits: ['DFA, NFA & Regular Expressions', 'Context-Free Grammars & Pushdown Automata', 'Turing Machines & Decidability'],
  });
  const subjDsaSem3: any = await Subject.create({
    universityId: aktu._id,
    programmeId: aktuBtech._id,
    branchId: aktuCse._id,
    semesterId: aktuSem3._id,
    curriculumSchemeId: aktuSchemeAicte._id,
    code: 'BCS301',
    name: 'Data Structures',
    credits: 4,
    syllabusUnits: ['Arrays, Stacks & Queues', 'Linked Lists & Trees', 'Graphs & Traversals', 'Sorting & Hashing'],
  });
  const subjIpuAlgo: any = await Subject.create({
    universityId: ipu._id,
    programmeId: ipuBtech._id,
    branchId: ipuCse._id,
    semesterId: ipuSem4._id,
    curriculumSchemeId: ipuScheme2021._id,
    code: 'CIC-206',
    name: 'Design & Analysis of Algorithms',
    credits: 4,
    syllabusUnits: ['Asymptotic Analysis & Recurrences', 'Divide & Conquer / Greedy', 'Dynamic Programming', 'NP-Completeness'],
  });
  const subjIimtFin: any = await Subject.create({
    universityId: iimt._id,
    programmeId: iimtBcom._id,
    branchId: iimtCom._id,
    semesterId: iimtBcomSem2._id,
    curriculumSchemeId: iimtComScheme._id,
    code: 'BCM-201',
    name: 'Corporate Accounting',
    credits: 4,
    syllabusUnits: ['Issue & Forfeiture of Shares', 'Valuation of Goodwill', 'Amalgamation & Consolidation'],
  });

  // Keep references used cleanly
  void ay2324;
  void ay2425;
  void aktuIt;
  void aktuEce;
  void aktuCa;
  void ipuMgmt;
  void iimtCse;
  void aktuSem5;
  void aktuBcaSem3;
  void ipuBbaSem2;
  void iimtBtechSem3;
  void aktuSchemeKcs;
  void aktuBcaScheme;
  void ipuBbaScheme;
  void iimtBtechScheme;

  // Topics
  const tOsCpu: any = await Topic.create({ subjectId: subjDs._id, unitNumber: 1, name: 'CPU Scheduling Algorithms', syllabusWeightagePercent: 25 });
  const tOsDeadlock: any = await Topic.create({ subjectId: subjDs._id, unitNumber: 2, name: 'Banker’s Algorithm & Deadlocks', syllabusWeightagePercent: 25 });
  const tOsPaging: any = await Topic.create({ subjectId: subjDs._id, unitNumber: 3, name: 'Virtual Memory & Page Replacement', syllabusWeightagePercent: 30 });
  const tOsDisk: any = await Topic.create({ subjectId: subjDs._id, unitNumber: 4, name: 'Disk Scheduling & File Allocation', syllabusWeightagePercent: 20 });

  const tDbmsNorm: any = await Topic.create({ subjectId: subjDbms._id, unitNumber: 2, name: 'Normalization & Functional Dependencies', syllabusWeightagePercent: 35 });
  const tDbmsAcid: any = await Topic.create({ subjectId: subjDbms._id, unitNumber: 3, name: 'ACID, Serializability & 2PL', syllabusWeightagePercent: 35 });
  const tDbmsBtree: any = await Topic.create({ subjectId: subjDbms._id, unitNumber: 4, name: 'B+ Trees & Indexing', syllabusWeightagePercent: 30 });

  const tTaflFa: any = await Topic.create({ subjectId: subjTafl._id, unitNumber: 1, name: 'Finite Automata & Pumping Lemma', syllabusWeightagePercent: 40 });
  const tTaflCfg: any = await Topic.create({ subjectId: subjTafl._id, unitNumber: 2, name: 'CFG Simplification & CNF', syllabusWeightagePercent: 35 });
  const tTaflTm: any = await Topic.create({ subjectId: subjTafl._id, unitNumber: 3, name: 'Turing Machines & Halting Problem', syllabusWeightagePercent: 25 });

  const tIpuDp: any = await Topic.create({ subjectId: subjIpuAlgo._id, unitNumber: 3, name: 'Dynamic Programming & LCS', syllabusWeightagePercent: 35 });

  // 9. Users (All 5 Roles)
  const passwordHash = await bcrypt.hash('Unihub@2026', 10);

  const studentUser: any = await User.create({
    name: 'Aarav Sharma',
    email: 'aarav.sharma@aktu.ac.in',
    passwordHash,
    role: 'student',
    status: 'active',
    collegeName: 'JSS Academy of Technical Education, Noida',
    onboardingCompleted: true,
    academicProfile: {
      universityId: aktu._id,
      programmeId: aktuBtech._id,
      branchId: aktuCse._id,
      academicYearId: ay2526._id,
      semesterId: aktuSem4._id,
      curriculumSchemeId: aktuSchemeAicte._id,
    },
  });

  const contributorUser: any = await User.create({
    name: 'Priya Verma',
    email: 'priya.verma@aktu.ac.in',
    passwordHash,
    role: 'contributor',
    status: 'active',
    collegeName: 'AKGEC Ghaziabad',
    onboardingCompleted: true,
    academicProfile: {
      universityId: aktu._id,
      programmeId: aktuBtech._id,
      branchId: aktuCse._id,
      academicYearId: ay2526._id,
      semesterId: aktuSem4._id,
      curriculumSchemeId: aktuSchemeAicte._id,
    },
  });

  const campusLeadUser: any = await User.create({
    name: 'Rohan Mehta',
    email: 'rohan.mehta@ipu.ac.in',
    passwordHash,
    role: 'campus_lead',
    status: 'active',
    collegeName: 'MAIT New Delhi',
    onboardingCompleted: true,
    academicProfile: {
      universityId: aktu._id,
      programmeId: aktuBtech._id,
      branchId: aktuCse._id,
      academicYearId: ay2526._id,
      semesterId: aktuSem4._id,
      curriculumSchemeId: aktuSchemeAicte._id,
    },
  });

  const reviewerUser: any = await User.create({
    name: 'Dr. Kavita Nair',
    email: 'dr.kavita.nair@unihub.edu',
    passwordHash,
    role: 'reviewer',
    status: 'active',
    collegeName: 'UNIHUB Academic Review Board',
    onboardingCompleted: true,
  });

  const adminUser: any = await User.create({
    name: 'Vikramaditya Rao',
    email: 'admin@unihub.edu',
    passwordHash,
    role: 'admin',
    status: 'active',
    collegeName: 'UNIHUB Central Operations',
    onboardingCompleted: true,
  });

  // 10. Semester Packages
  const pkgFree: any = await Package.create({
    code: 'free',
    name: 'Free Access',
    tagline: 'Explore curriculum catalogue and sample resources',
    priceInr: 0,
    validityMonths: 12,
    semesterSlots: 1,
    includesPyqs: false,
    includesMockTests: false,
    includesTrendPractice: false,
    includesDetailedAnalytics: false,
    features: ['Browse university catalogue', 'Subject syllabus overview', 'Sample PYQ preview', '1 sample mock test'],
    isPilotPrice: true,
    displayOrder: 1,
  });

  const pkgPyq: any = await Package.create({
    code: 'pyq_pass',
    name: 'Semester PYQ Pass',
    tagline: 'Complete previous year papers and verified solutions',
    priceInr: 99,
    validityMonths: 6,
    semesterSlots: 1,
    includesPyqs: true,
    includesMockTests: false,
    includesTrendPractice: false,
    includesDetailedAnalytics: false,
    features: ['All approved PYQs for selected semester', 'PDF preview & downloads', 'Verified step-by-step solutions', 'Basic historical topic frequency'],
    isPilotPrice: true,
    displayOrder: 2,
  });

  const pkgTest: any = await Package.create({
    code: 'test_pass',
    name: 'Semester Test Pass',
    tagline: 'Subject-wise and full-semester timed mock tests',
    priceInr: 99,
    validityMonths: 6,
    semesterSlots: 1,
    includesPyqs: false,
    includesMockTests: true,
    includesTrendPractice: false,
    includesDetailedAnalytics: false,
    features: ['Subject-wise timed mock tests', 'Full-semester exam simulations', 'Objective auto-scoring & review', 'Complete attempt history'],
    isPilotPrice: true,
    displayOrder: 3,
  });

  const pkgComplete: any = await Package.create({
    code: 'complete_pass',
    name: 'Semester Complete Pass',
    tagline: 'PYQs, mock tests, verified solutions & deep analytics',
    priceInr: 199,
    validityMonths: 6,
    semesterSlots: 1,
    includesPyqs: true,
    includesMockTests: true,
    includesTrendPractice: true,
    includesDetailedAnalytics: true,
    features: ['Everything in PYQ Pass & Test Pass', 'Trend-based practice question sets', 'Detailed topic-wise performance analytics', 'Upgrade credit from PYQ or Test Pass'],
    isPilotPrice: true,
    displayOrder: 4,
  });

  const pkgLarge: any = await Package.create({
    code: 'large_semester_pass',
    name: 'Larger Semester Package',
    tagline: 'For semesters with 7+ core papers or expanded lab/theory banks',
    priceInr: 279,
    validityMonths: 6,
    semesterSlots: 1,
    includesPyqs: true,
    includesMockTests: true,
    includesTrendPractice: true,
    includesDetailedAnalytics: true,
    features: ['Full Complete Pass coverage', 'Extended 7+ subject question banks', 'Multi-year supplementary paper archive', 'Priority descriptive rubric review'],
    isPilotPrice: true,
    displayOrder: 5,
  });

  const pkgTwoSem: any = await Package.create({
    code: 'two_semester_bundle',
    name: 'Two-Semester Bundle',
    tagline: 'Full academic year coverage across two selected semesters',
    priceInr: 349,
    validityMonths: 12,
    semesterSlots: 2,
    includesPyqs: true,
    includesMockTests: true,
    includesTrendPractice: true,
    includesDetailedAnalytics: true,
    features: ['Covers 2 consecutive semesters', 'All PYQs, mock tests & verified solutions', 'Full year trend comparison charts', '12-month validity'],
    isPilotPrice: true,
    displayOrder: 6,
  });

  void pkgFree;
  void pkgTest;
  void pkgComplete;
  void pkgLarge;
  void pkgTwoSem;

  // Give Aarav an active Semester PYQ Pass (₹99) so upgrade difference to Complete Pass (₹100) can be demonstrated immediately!
  const purchaseAarav: any = await Purchase.create({
    userId: studentUser._id,
    packageId: pkgPyq._id,
    packageCode: 'pyq_pass',
    universityId: aktu._id,
    semesterIds: [aktuSem4._id],
    isUpgrade: false,
    basePriceInr: 99,
    creditAppliedInr: 0,
    finalAmountInr: 99,
    status: 'paid',
    autoRenewConsent: false,
    receiptNumber: 'UH-2026-1042',
  });

  await Payment.create({
    purchaseId: purchaseAarav._id,
    userId: studentUser._id,
    gateway: 'razorpay_sandbox',
    method: 'upi',
    razorpayOrderId: 'order_rzp_seeded_1042',
    razorpayPaymentId: 'pay_rzp_seeded_1042',
    razorpaySignature: 'verified_hmac_seed',
    signatureVerified: true,
    amountInr: 99,
    currency: 'INR',
    status: 'captured',
  });

  const now = new Date();
  const sixMonthsLater = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
  await Entitlement.create({
    userId: studentUser._id,
    purchaseId: purchaseAarav._id,
    packageId: pkgPyq._id,
    packageCode: 'pyq_pass',
    packageName: 'Semester PYQ Pass',
    universityId: aktu._id,
    semesterIds: [aktuSem4._id],
    includesPyqs: true,
    includesMockTests: false,
    includesTrendPractice: false,
    includesDetailedAnalytics: false,
    activatedAt: now.toISOString(),
    expiresAt: sixMonthsLater.toISOString(),
    status: 'active',
  });

  // 11. PYQ Papers (AKTU Sem 4, Sem 3, IPU, IIMT)
  const pyqOs2025: any = await PYQPaper.create({
    title: 'Operating Systems — End-Semester Examination 2025',
    universityId: aktu._id,
    programmeId: aktuBtech._id,
    branchId: aktuCse._id,
    semesterId: aktuSem4._id,
    curriculumSchemeId: aktuSchemeAicte._id,
    subjectId: subjDs._id,
    examYear: 2025,
    examSession: 'Even Semester',
    paperCode: 'BCS401-2025',
    totalMarks: 70,
    durationMinutes: 180,
    source: 'AKTU Examination Archive (Verified Scan)',
    uploaderId: contributorUser._id,
    uploaderName: 'Priya Verma',
    qualityStatus: 'approved',
    permissionStatus: 'verified_public',
    isSampleFree: true,
    downloadCount: 342,
    sectionsSummary: ['Section A: 7 compulsory 2-mark conceptual questions (14 Marks)', 'Section B: Attempt any 3 of 5 analytical questions (21 Marks)', 'Section C: 5 unit-wise long problems with internal choice (35 Marks)'],
    sampleQuestions: [
      'Differentiate between preemptive and non-preemptive CPU scheduling with a Gantt chart for SRTF.',
      'State the four necessary conditions for deadlock and apply Banker’s safety algorithm to the given allocation matrix.',
      'Calculate page faults for the reference string 7,0,1,2,0,3,0,4,2,3 using LRU and Optimal page replacement (3 frames).',
      'Compare SSTF, SCAN, and C-SCAN disk scheduling algorithms with total head movement calculations.',
    ],
    topicTagIds: [tOsCpu._id, tOsDeadlock._id, tOsPaging._id, tOsDisk._id],
  });

  const pyqOs2024: any = await PYQPaper.create({
    title: 'Operating Systems — End-Semester Examination 2024',
    universityId: aktu._id,
    programmeId: aktuBtech._id,
    branchId: aktuCse._id,
    semesterId: aktuSem4._id,
    curriculumSchemeId: aktuSchemeAicte._id,
    subjectId: subjDs._id,
    examYear: 2024,
    examSession: 'Even Semester',
    paperCode: 'BCS401-2024',
    totalMarks: 70,
    durationMinutes: 180,
    source: 'AKTU Examination Archive',
    uploaderId: contributorUser._id,
    uploaderName: 'Priya Verma',
    qualityStatus: 'approved',
    permissionStatus: 'verified_public',
    isSampleFree: false,
    downloadCount: 518,
    sectionsSummary: ['Section A: 14 Marks', 'Section B: 21 Marks', 'Section C: 35 Marks'],
    sampleQuestions: [
      'Explain Belady’s Anomaly with a concrete FIFO page reference example.',
      'Solve the Producer-Consumer problem using counting and binary semaphores.',
      'Analyze multi-level feedback queue scheduling and starvation prevention via aging.',
    ],
    topicTagIds: [tOsCpu._id, tOsDeadlock._id, tOsPaging._id],
  });

  const pyqDbms2025: any = await PYQPaper.create({
    title: 'Database Management Systems — End-Semester Examination 2025',
    universityId: aktu._id,
    programmeId: aktuBtech._id,
    branchId: aktuCse._id,
    semesterId: aktuSem4._id,
    curriculumSchemeId: aktuSchemeAicte._id,
    subjectId: subjDbms._id,
    examYear: 2025,
    examSession: 'Even Semester',
    paperCode: 'BCS402-2025',
    totalMarks: 70,
    durationMinutes: 180,
    source: 'AKTU Examination Archive',
    uploaderId: contributorUser._id,
    uploaderName: 'Priya Verma',
    qualityStatus: 'approved',
    permissionStatus: 'verified_public',
    isSampleFree: true,
    downloadCount: 410,
    sectionsSummary: ['Section A: Short definitions (14 Marks)', 'Section B: SQL & Normalization (21 Marks)', 'Section C: Transactions & B+ Trees (35 Marks)'],
    sampleQuestions: [
      'Decompose relation R(A,B,C,D,E) into BCNF while verifying dependency preservation and lossless join.',
      'Test the schedule S for conflict serializability using precedence graphs and verify Strict 2PL.',
      'Construct a B+ Tree of order 4 for keys: 12, 5, 24, 31, 8, 19, 42, 3.',
    ],
    topicTagIds: [tDbmsNorm._id, tDbmsAcid._id, tDbmsBtree._id],
  });

  const pyqDbms2023: any = await PYQPaper.create({
    title: 'Database Management Systems — End-Semester Examination 2023',
    universityId: aktu._id,
    programmeId: aktuBtech._id,
    branchId: aktuCse._id,
    semesterId: aktuSem4._id,
    curriculumSchemeId: aktuSchemeAicte._id,
    subjectId: subjDbms._id,
    examYear: 2023,
    examSession: 'Even Semester',
    paperCode: 'KCS402-2023',
    totalMarks: 100,
    durationMinutes: 180,
    source: 'AKTU Departmental Library',
    uploaderId: adminUser._id,
    uploaderName: 'UNIHUB Academic Team',
    qualityStatus: 'approved',
    permissionStatus: 'verified_public',
    isSampleFree: false,
    downloadCount: 289,
    sectionsSummary: ['Section A: 20 Marks', 'Section B: 30 Marks', 'Section C: 50 Marks'],
    sampleQuestions: [
      'Differentiate between BCNF and 3NF with an example relation that is in 3NF but not BCNF.',
      'Explain ARIES log-based recovery protocol phases: Analysis, Redo, and Undo.',
    ],
    topicTagIds: [tDbmsNorm._id, tDbmsAcid._id],
  });

  const pyqTafl2024: any = await PYQPaper.create({
    title: 'Theory of Automata & Formal Languages — End-Semester 2024',
    universityId: aktu._id,
    programmeId: aktuBtech._id,
    branchId: aktuCse._id,
    semesterId: aktuSem4._id,
    curriculumSchemeId: aktuSchemeAicte._id,
    subjectId: subjTafl._id,
    examYear: 2024,
    examSession: 'Even Semester',
    paperCode: 'BCS403-2024',
    totalMarks: 70,
    durationMinutes: 180,
    source: 'AKTU Examination Archive',
    uploaderId: contributorUser._id,
    uploaderName: 'Priya Verma',
    qualityStatus: 'approved',
    permissionStatus: 'verified_public',
    isSampleFree: false,
    downloadCount: 274,
    sectionsSummary: ['Section A: 14 Marks', 'Section B: 21 Marks', 'Section C: 35 Marks'],
    sampleQuestions: [
      'Minimize the given 6-state DFA using Myhill-Nerode / equivalence partitioning.',
      'Convert the Context-Free Grammar into Chomsky Normal Form (CNF).',
      'Design a Turing Machine that accepts L = { a^n b^n c^n | n >= 1 }.',
    ],
    topicTagIds: [tTaflFa._id, tTaflCfg._id, tTaflTm._id],
  });

  const pyqDsa2024: any = await PYQPaper.create({
    title: 'Data Structures — End-Semester Examination 2024',
    universityId: aktu._id,
    programmeId: aktuBtech._id,
    branchId: aktuCse._id,
    semesterId: aktuSem3._id,
    curriculumSchemeId: aktuSchemeAicte._id,
    subjectId: subjDsaSem3._id,
    examYear: 2024,
    examSession: 'Odd Semester',
    paperCode: 'BCS301-2024',
    totalMarks: 70,
    durationMinutes: 180,
    source: 'AKTU Examination Archive',
    qualityStatus: 'approved',
    permissionStatus: 'verified_public',
    isSampleFree: true,
    downloadCount: 620,
    sampleQuestions: ['Write an algorithm to balance an AVL tree after deletion.', 'Perform Dijkstra’s shortest path trace on the weighted graph.'],
  });

  const pyqIpu2024: any = await PYQPaper.create({
    title: 'Design & Analysis of Algorithms — End-Term 2024',
    universityId: ipu._id,
    programmeId: ipuBtech._id,
    branchId: ipuCse._id,
    semesterId: ipuSem4._id,
    curriculumSchemeId: ipuScheme2021._id,
    subjectId: subjIpuAlgo._id,
    examYear: 2024,
    examSession: 'End-Semester',
    paperCode: 'CIC-206-2024',
    totalMarks: 75,
    durationMinutes: 180,
    source: 'GGSIPU Exam Cell Archive',
    qualityStatus: 'approved',
    permissionStatus: 'verified_public',
    isSampleFree: true,
    downloadCount: 198,
    sampleQuestions: ['Solve T(n) = 2T(n/2) + n log n using Master Theorem and recursion tree.', 'Implement Matrix Chain Multiplication using Dynamic Programming.'],
    topicTagIds: [tIpuDp._id],
  });

  const pyqIimt2024: any = await PYQPaper.create({
    title: 'Corporate Accounting — End-Semester 2024',
    universityId: iimt._id,
    programmeId: iimtBcom._id,
    branchId: iimtCom._id,
    semesterId: iimtBcomSem2._id,
    curriculumSchemeId: iimtComScheme._id,
    subjectId: subjIimtFin._id,
    examYear: 2024,
    examSession: 'End-Semester',
    paperCode: 'BCM-201-2024',
    totalMarks: 70,
    durationMinutes: 180,
    source: 'IIMT University Academic Repository',
    qualityStatus: 'approved',
    permissionStatus: 'verified_public',
    isSampleFree: true,
    downloadCount: 112,
    sampleQuestions: ['Pass journal entries for forfeiture and re-issue of 500 equity shares.', 'Calculate goodwill under super-profit method.'],
  });

  void pyqDsa2024;
  void pyqIimt2024;

  // 12. Structured Question Bank (MCQ, True/False, Short Answer, Descriptive)
  const q1: any = await Question.create({
    universityId: aktu._id,
    subjectId: subjDs._id,
    topicId: tOsCpu._id,
    pyqPaperId: pyqOs2025._id,
    statement: 'Which CPU scheduling algorithm achieves the provably minimum average waiting time for a given set of processes arriving simultaneously?',
    questionType: 'mcq',
    difficulty: 'easy',
    marks: 2,
    examYear: 2025,
    source: 'BCS401-2025 Section A',
    options: ['First-Come First-Served (FCFS)', 'Shortest Job First (SJF)', 'Round Robin (RR)', 'Priority Scheduling'],
    correctAnswer: 'Shortest Job First (SJF)',
    explanation: 'SJF (non-preemptive when all processes arrive at t=0, or SRTF for varying arrival times) minimizes average waiting time by executing shorter bursts first.',
    isVerifiedExplanation: true,
  });

  const q2: any = await Question.create({
    universityId: aktu._id,
    subjectId: subjDs._id,
    topicId: tOsPaging._id,
    pyqPaperId: pyqOs2024._id,
    statement: 'True or False: LRU (Least Recently Used) page replacement suffers from Belady’s Anomaly when the number of physical memory frames is increased.',
    questionType: 'true_false',
    difficulty: 'medium',
    marks: 2,
    examYear: 2024,
    source: 'BCS401-2024 Section A',
    options: ['True', 'False'],
    correctAnswer: 'False',
    explanation: 'LRU is a stack algorithm, meaning the set of pages in memory with n frames is always a subset of pages with n+1 frames. Only non-stack algorithms like FIFO suffer from Belady’s Anomaly.',
    isVerifiedExplanation: true,
  });

  const q3: any = await Question.create({
    universityId: aktu._id,
    subjectId: subjDs._id,
    topicId: tOsDeadlock._id,
    pyqPaperId: pyqOs2025._id,
    statement: 'What are the four Coffman conditions that must hold simultaneously for a deadlock to occur? State the condition broken by ordering resource acquisitions.',
    questionType: 'short_answer',
    difficulty: 'medium',
    marks: 5,
    examYear: 2025,
    source: 'BCS401-2025 Section B',
    correctAnswer: 'Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait; ordering breaks Circular Wait.',
    rubricPoints: ['Lists all 4 Coffman conditions accurately (3 marks)', 'Identifies Circular Wait as broken by total ordering (2 marks)'],
    explanation: 'Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait. Assigning a strict global numbering to resource types and requiring increasing acquisition order prevents circular wait.',
    isVerifiedExplanation: true,
  });

  const q4: any = await Question.create({
    universityId: aktu._id,
    subjectId: subjDbms._id,
    topicId: tDbmsNorm._id,
    pyqPaperId: pyqDbms2025._id,
    statement: 'A relation R is in BCNF if and only if for every non-trivial functional dependency X -> Y holding in R:',
    questionType: 'mcq',
    difficulty: 'medium',
    marks: 2,
    examYear: 2025,
    source: 'BCS402-2025 Section A',
    options: ['Y is a prime attribute', 'X is a superkey of R', 'X is a candidate key only', 'Y is transitively dependent on X'],
    correctAnswer: 'X is a superkey of R',
    explanation: 'By definition, Boyce-Codd Normal Form requires that the determinant X of every non-trivial FD X -> Y must be a superkey of the relation.',
    isVerifiedExplanation: true,
  });

  const q5: any = await Question.create({
    universityId: aktu._id,
    subjectId: subjDbms._id,
    topicId: tDbmsAcid._id,
    pyqPaperId: pyqDbms2023._id,
    statement: 'True or False: Every conflict-serializable schedule is guaranteed to be view-serializable, though the converse is not true.',
    questionType: 'true_false',
    difficulty: 'medium',
    marks: 2,
    examYear: 2023,
    source: 'KCS402-2023 Section A',
    options: ['True', 'False'],
    correctAnswer: 'True',
    explanation: 'Conflict serializability is a strictly stronger condition than view serializability. Schedules with blind writes can be view-serializable without being conflict-serializable.',
    isVerifiedExplanation: true,
  });

  const q6: any = await Question.create({
    universityId: aktu._id,
    subjectId: subjDbms._id,
    topicId: tDbmsBtree._id,
    pyqPaperId: pyqDbms2025._id,
    statement: 'Explain the structural difference between a B-Tree and a B+ Tree index, and describe why B+ Trees are preferred for database range queries.',
    questionType: 'descriptive',
    difficulty: 'hard',
    marks: 10,
    examYear: 2025,
    source: 'BCS402-2025 Section C',
    correctAnswer: '',
    rubricPoints: [
      'Data pointers only at leaf nodes in B+ Tree vs all nodes in B-Tree (3 marks)',
      'Higher fan-out & lower tree height for B+ Tree (3 marks)',
      'Doubly-linked leaf nodes enabling fast sequential range scans (4 marks)',
    ],
    explanation: 'B+ Trees store record pointers exclusively at leaf level and link leaf nodes sequentially, allowing higher branching factor in internal nodes and O(log n + k) range traversal.',
    isVerifiedExplanation: true,
  });

  const q7: any = await Question.create({
    universityId: aktu._id,
    subjectId: subjTafl._id,
    topicId: tTaflFa._id,
    pyqPaperId: pyqTafl2024._id,
    statement: 'Which class of formal languages is strictly accepted by a Deterministic Pushdown Automaton (DPDA) versus a Non-deterministic PDA?',
    questionType: 'mcq',
    difficulty: 'hard',
    marks: 2,
    examYear: 2024,
    source: 'BCS403-2024 Section A',
    options: [
      'Both accept exactly the same Context-Free Languages',
      'DPDA accepts Deterministic CFLs, a proper subset of CFLs',
      'DPDA accepts only Regular Languages',
      'NPDA accepts Context-Sensitive Languages',
    ],
    correctAnswer: 'DPDA accepts Deterministic CFLs, a proper subset of CFLs',
    explanation: 'Unlike finite automata (where DFA = NFA), DPDA is strictly weaker than NPDA. For example, L = { ww^R } requires non-determinism.',
    isVerifiedExplanation: true,
  });

  const q8: any = await Question.create({
    universityId: aktu._id,
    subjectId: subjTafl._id,
    topicId: tTaflCfg._id,
    pyqPaperId: pyqTafl2024._id,
    statement: 'True or False: Every Context-Free Grammar without epsilon productions can be converted into Chomsky Normal Form (CNF).',
    questionType: 'true_false',
    difficulty: 'easy',
    marks: 2,
    examYear: 2024,
    source: 'BCS403-2024 Section A',
    options: ['True', 'False'],
    correctAnswer: 'True',
    explanation: 'Any CFG generating a language without the empty string can be systematically transformed into CNF (A -> BC or A -> a) by eliminating unit productions and factoring long RHS.',
    isVerifiedExplanation: true,
  });

  await Question.create({
    universityId: ipu._id,
    subjectId: subjIpuAlgo._id,
    topicId: tIpuDp._id,
    pyqPaperId: pyqIpu2024._id,
    statement: 'What is the worst-case time complexity of solving Longest Common Subsequence (LCS) for strings of length m and n using dynamic programming?',
    questionType: 'mcq',
    difficulty: 'easy',
    marks: 2,
    examYear: 2024,
    source: 'CIC-206-2024',
    options: ['O(m + n)', 'O(m * n)', 'O(2^n)', 'O(n log m)'],
    correctAnswer: 'O(m * n)',
    explanation: 'The DP table has (m+1) x (n+1) entries, each computed in O(1) time.',
    isVerifiedExplanation: true,
  });

  // 13. Mock Tests
  const testSample: any = await MockTest.create({
    title: 'AKTU Sem 4 Sample Diagnostic Test (OS & DBMS)',
    description: 'Free diagnostic sample test covering core Operating Systems and DBMS concepts from 2024-2025 AKTU papers.',
    universityId: aktu._id,
    programmeId: aktuBtech._id,
    branchId: aktuCse._id,
    semesterId: aktuSem4._id,
    curriculumSchemeId: aktuSchemeAicte._id,
    subjectId: subjDs._id,
    testScope: 'sample',
    durationMinutes: 15,
    totalMarks: 8,
    randomizeQuestions: false,
    isPublished: true,
    isFreeSample: true,
    sections: [
      { name: 'Section A — Core Concepts (Objective)', instructions: 'Attempt all objective questions. No negative marking.', questionIds: [q1._id, q2._id, q4._id, q5._id] },
    ],
    questionIds: [q1._id, q2._id, q4._id, q5._id],
  });

  const testOsFull: any = await MockTest.create({
    title: 'BCS401 Operating Systems — Timed Unit & PYQ Assessment',
    description: 'Subject-wise timed test including objective questions plus descriptive rubric evaluation.',
    universityId: aktu._id,
    programmeId: aktuBtech._id,
    branchId: aktuCse._id,
    semesterId: aktuSem4._id,
    curriculumSchemeId: aktuSchemeAicte._id,
    subjectId: subjDs._id,
    testScope: 'subject',
    durationMinutes: 30,
    totalMarks: 9,
    randomizeQuestions: true,
    isPublished: true,
    isFreeSample: false,
    sections: [
      { name: 'Section A — Objective', instructions: 'Select the best option.', questionIds: [q1._id, q2._id] },
      { name: 'Section B — Short Answer (Rubric Graded)', instructions: 'Write clear technical points; evaluated by reviewer rubric.', questionIds: [q3._id] },
    ],
    questionIds: [q1._id, q2._id, q3._id],
  });

  const testFullSem: any = await MockTest.create({
    title: 'AKTU CSE Semester 4 — Full-Semester Combined Mock',
    description: 'Cross-subject mock examination spanning Operating Systems, DBMS, and Theory of Automata.',
    universityId: aktu._id,
    programmeId: aktuBtech._id,
    branchId: aktuCse._id,
    semesterId: aktuSem4._id,
    curriculumSchemeId: aktuSchemeAicte._id,
    subjectId: null,
    testScope: 'full_semester',
    durationMinutes: 45,
    totalMarks: 22,
    randomizeQuestions: false,
    isPublished: true,
    isFreeSample: false,
    sections: [
      { name: 'Part 1 — Objective Questions', instructions: 'Auto-scored immediately on submission.', questionIds: [q1._id, q2._id, q4._id, q5._id, q7._id, q8._id] },
      { name: 'Part 2 — Descriptive Theory', instructions: 'Evaluated manually via university marking rubric.', questionIds: [q6._id] },
    ],
    questionIds: [q1._id, q2._id, q4._id, q5._id, q7._id, q8._id, q6._id],
  });

  void testFullSem;

  // Seed historical TestAttempts for Aarav so his dashboard analytics charts are rich and authentic
  const dayAgo = new Date(Date.now() - 86400000 * 12).toISOString();
  const weekAgo = new Date(Date.now() - 86400000 * 6).toISOString();
  const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString();

  await TestAttempt.create({
    userId: studentUser._id,
    mockTestId: testSample._id,
    universityId: aktu._id,
    semesterId: aktuSem4._id,
    subjectId: subjDs._id,
    startedAt: dayAgo,
    submittedAt: dayAgo,
    timeSpentSeconds: 610,
    submissionReason: 'manual',
    answers: [
      { questionId: q1._id, userAnswer: 'Shortest Job First (SJF)', markedForReview: false, isObjective: true, isCorrect: true, awardedMarks: 2, maxMarks: 2, evaluationStatus: 'auto_graded' },
      { questionId: q2._id, userAnswer: 'True', markedForReview: false, isObjective: true, isCorrect: false, awardedMarks: 0, maxMarks: 2, evaluationStatus: 'auto_graded' },
      { questionId: q4._id, userAnswer: 'X is a superkey of R', markedForReview: false, isObjective: true, isCorrect: true, awardedMarks: 2, maxMarks: 2, evaluationStatus: 'auto_graded' },
      { questionId: q5._id, userAnswer: 'False', markedForReview: false, isObjective: true, isCorrect: false, awardedMarks: 0, maxMarks: 2, evaluationStatus: 'auto_graded' },
    ],
    objectiveScore: 4,
    objectiveMaxScore: 8,
    descriptiveScore: 0,
    descriptiveMaxScore: 0,
    totalAwardedScore: 4,
    totalMaxScore: 8,
    percentage: 50,
    hasPendingDescriptiveReview: false,
    descriptiveEvaluationStatus: 'not_applicable',
    topicBreakdown: [
      { topicId: tOsCpu._id, topicName: 'CPU Scheduling Algorithms', correct: 1, total: 1, accuracyPercent: 100 },
      { topicId: tOsPaging._id, topicName: 'Virtual Memory & Page Replacement', correct: 0, total: 1, accuracyPercent: 0 },
      { topicId: tDbmsNorm._id, topicName: 'Normalization & Functional Dependencies', correct: 1, total: 1, accuracyPercent: 100 },
      { topicId: tDbmsAcid._id, topicName: 'ACID, Serializability & 2PL', correct: 0, total: 1, accuracyPercent: 0 },
    ],
  });

  await TestAttempt.create({
    userId: studentUser._id,
    mockTestId: testOsFull._id,
    universityId: aktu._id,
    semesterId: aktuSem4._id,
    subjectId: subjDs._id,
    startedAt: weekAgo,
    submittedAt: weekAgo,
    timeSpentSeconds: 840,
    submissionReason: 'manual',
    answers: [
      { questionId: q1._id, userAnswer: 'Shortest Job First (SJF)', markedForReview: false, isObjective: true, isCorrect: true, awardedMarks: 2, maxMarks: 2, evaluationStatus: 'auto_graded' },
      { questionId: q2._id, userAnswer: 'False', markedForReview: false, isObjective: true, isCorrect: true, awardedMarks: 2, maxMarks: 2, evaluationStatus: 'auto_graded' },
      { questionId: q3._id, userAnswer: 'Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait. Total resource ordering breaks Circular Wait.', markedForReview: false, isObjective: false, isCorrect: false, awardedMarks: 4, maxMarks: 5, evaluationStatus: 'rubric_graded', reviewerComment: 'Clear Coffman conditions; add brief note on starvation.' },
    ],
    objectiveScore: 4,
    objectiveMaxScore: 4,
    descriptiveScore: 4,
    descriptiveMaxScore: 5,
    totalAwardedScore: 8,
    totalMaxScore: 9,
    percentage: 89,
    hasPendingDescriptiveReview: false,
    descriptiveEvaluationStatus: 'evaluated',
    topicBreakdown: [
      { topicId: tOsCpu._id, topicName: 'CPU Scheduling Algorithms', correct: 1, total: 1, accuracyPercent: 100 },
      { topicId: tOsPaging._id, topicName: 'Virtual Memory & Page Replacement', correct: 1, total: 1, accuracyPercent: 100 },
      { topicId: tOsDeadlock._id, topicName: 'Banker’s Algorithm & Deadlocks', correct: 1, total: 1, accuracyPercent: 100 },
    ],
  });

  await TestAttempt.create({
    userId: studentUser._id,
    mockTestId: testSample._id,
    universityId: aktu._id,
    semesterId: aktuSem4._id,
    subjectId: subjDbms._id,
    startedAt: twoDaysAgo,
    submittedAt: twoDaysAgo,
    timeSpentSeconds: 510,
    submissionReason: 'manual',
    answers: [
      { questionId: q1._id, userAnswer: 'Shortest Job First (SJF)', markedForReview: false, isObjective: true, isCorrect: true, awardedMarks: 2, maxMarks: 2, evaluationStatus: 'auto_graded' },
      { questionId: q2._id, userAnswer: 'False', markedForReview: false, isObjective: true, isCorrect: true, awardedMarks: 2, maxMarks: 2, evaluationStatus: 'auto_graded' },
      { questionId: q4._id, userAnswer: 'X is a superkey of R', markedForReview: false, isObjective: true, isCorrect: true, awardedMarks: 2, maxMarks: 2, evaluationStatus: 'auto_graded' },
      { questionId: q5._id, userAnswer: 'False', markedForReview: false, isObjective: true, isCorrect: false, awardedMarks: 0, maxMarks: 2, evaluationStatus: 'auto_graded' },
    ],
    objectiveScore: 6,
    objectiveMaxScore: 8,
    descriptiveScore: 0,
    descriptiveMaxScore: 0,
    totalAwardedScore: 6,
    totalMaxScore: 8,
    percentage: 75,
    hasPendingDescriptiveReview: false,
    descriptiveEvaluationStatus: 'not_applicable',
    topicBreakdown: [
      { topicId: tOsCpu._id, topicName: 'CPU Scheduling Algorithms', correct: 1, total: 1, accuracyPercent: 100 },
      { topicId: tOsPaging._id, topicName: 'Virtual Memory & Page Replacement', correct: 1, total: 1, accuracyPercent: 100 },
      { topicId: tDbmsNorm._id, topicName: 'Normalization & Functional Dependencies', correct: 1, total: 1, accuracyPercent: 100 },
      { topicId: tDbmsAcid._id, topicName: 'ACID, Serializability & 2PL', correct: 0, total: 1, accuracyPercent: 0 },
    ],
  });

  // 14. Verified & Under-Review Solutions
  await Solution.create({
    pyqPaperId: pyqOs2025._id,
    subjectId: subjDs._id,
    topicId: tOsDeadlock._id,
    universityId: aktu._id,
    title: 'Banker’s Algorithm Safety Sequence & Need Matrix Derivation',
    questionReference: 'BCS401-2025 · Section C · Q3(a)',
    steps: [
      { stepNumber: 1, heading: 'Compute the Need Matrix', content: 'For each process Pi and resource Rj, compute Need[i][j] = Max[i][j] - Allocation[i][j].' },
      { stepNumber: 2, heading: 'Initialize Work and Finish Vectors', content: 'Set Work = Available vector and Finish[i] = false for all i = 0..n-1.' },
      { stepNumber: 3, heading: 'Find Executable Process', content: 'Select Pi where Finish[i] == false and Need[i] <= Work. Update Work = Work + Allocation[i] and Finish[i] = true.' },
      { stepNumber: 4, heading: 'Verify Safe Sequence', content: 'Since all processes finish cleanly in sequence <P1, P3, P4, P0, P2>, the system is in a safe state.' },
    ],
    finalAnswerSummary: 'Safe sequence exists: <P1, P3, P4, P0, P2>. Additional request for P1 can be granted immediately.',
    verificationStatus: 'verified',
    reviewerId: reviewerUser._id,
    reviewerName: 'Dr. Kavita Nair',
    lastReviewedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    currentVersion: 2,
    isSampleFree: true,
    versionHistory: [
      { version: 1, updatedBy: 'Priya Verma', updatedAt: new Date(Date.now() - 86400000 * 8).toISOString(), changeNote: 'Initial step-by-step submission', verificationStatus: 'under_review' },
      { version: 2, updatedBy: 'Dr. Kavita Nair', updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(), changeNote: 'Verified matrix arithmetic against AKTU marking scheme', verificationStatus: 'verified' },
    ],
  });

  await Solution.create({
    pyqPaperId: pyqDbms2025._id,
    subjectId: subjDbms._id,
    topicId: tDbmsNorm._id,
    universityId: aktu._id,
    title: 'Lossless & Dependency-Preserving BCNF Decomposition',
    questionReference: 'BCS402-2025 · Section B · Q2(b)',
    steps: [
      { stepNumber: 1, heading: 'Find Candidate Keys', content: 'Compute attribute closures from the given FD set F = {AB -> C, C -> D, D -> A}. Candidate keys are AB, BC, BD.' },
      { stepNumber: 2, heading: 'Identify BCNF Violations', content: 'Check each FD X -> Y. C -> D violates BCNF because C is not a superkey.' },
      { stepNumber: 3, heading: 'Decompose Iteratively', content: 'Split R into R1(C, D) and R2(A, B, C). Verify lossless join via common attribute C being key of R1.' },
    ],
    finalAnswerSummary: 'Decomposed tables R1(C,D), R2(D,A), R3(A,B,C) satisfy BCNF with lossless join.',
    verificationStatus: 'verified',
    reviewerId: reviewerUser._id,
    reviewerName: 'Dr. Kavita Nair',
    lastReviewedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    currentVersion: 1,
    isSampleFree: true,
    versionHistory: [
      { version: 1, updatedBy: 'Dr. Kavita Nair', updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(), changeNote: 'Reviewed and approved', verificationStatus: 'verified' },
    ],
  });

  await Solution.create({
    pyqPaperId: pyqTafl2024._id,
    subjectId: subjTafl._id,
    topicId: tTaflCfg._id,
    universityId: aktu._id,
    title: 'CFG to Chomsky Normal Form (CNF) Transformation',
    questionReference: 'BCS403-2024 · Section C · Q4(a)',
    steps: [
      { stepNumber: 1, heading: 'Eliminate Null & Unit Productions', content: 'Remove nullable symbols and unit rules A -> B cleanly.' },
      { stepNumber: 2, heading: 'Introduce New Non-Terminals', content: 'Replace terminals inside rules of length >= 2 and split chains into binary rules.' },
    ],
    finalAnswerSummary: 'Draft solution awaiting final academic reviewer sign-off.',
    verificationStatus: 'under_review',
    reviewerId: reviewerUser._id,
    reviewerName: 'Pending Verification',
    currentVersion: 1,
    isSampleFree: false,
    versionHistory: [
      { version: 1, updatedBy: 'Priya Verma', updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(), changeNote: 'Submitted for peer verification', verificationStatus: 'under_review' },
    ],
  });

  // 15. Contributor Profile, Submissions, Reward Ledger & Reviews
  await ContributorProfile.create({
    userId: contributorUser._id,
    universityId: aktu._id,
    programmeId: aktuBtech._id,
    branchId: aktuCse._id,
    collegeName: 'AKGEC Ghaziabad',
    upiId: 'priya.verma@okaxis',
    assignedCampusLeadId: campusLeadUser._id,
    status: 'active',
    totalSubmissions: 3,
    approvedSubmissions: 2,
  });

  const sub1: any = await ResourceSubmission.create({
    contributorId: contributorUser._id,
    universityId: aktu._id,
    programmeId: aktuBtech._id,
    branchId: aktuCse._id,
    semesterId: aktuSem4._id,
    curriculumSchemeId: aktuSchemeAicte._id,
    subjectId: subjDs._id,
    resourceType: 'pyq_paper',
    title: 'Operating Systems End-Sem Paper 2025 (Clean Scan)',
    examYear: 2025,
    examSession: 'Even Semester',
    paperCode: 'BCS401-2025',
    sourceDescription: 'College library physical examination booklet scanned at 300 DPI',
    rightsDeclarationAccepted: true,
    notLeakedOrUnreleasedAttested: true,
    originalFilename: 'BCS401_2025_OS.pdf',
    status: 'approved',
    assignedReviewerId: reviewerUser._id,
    reviewerNotes: 'Crisp scan, all 3 sections legible, university & semester verified.',
    rewardAmountInr: 15,
    publishedPyqId: pyqOs2025._id,
  });

  const sub2: any = await ResourceSubmission.create({
    contributorId: contributorUser._id,
    universityId: aktu._id,
    programmeId: aktuBtech._id,
    branchId: aktuCse._id,
    semesterId: aktuSem4._id,
    curriculumSchemeId: aktuSchemeAicte._id,
    subjectId: subjDbms._id,
    resourceType: 'revision_notes',
    title: 'DBMS Normalization & B+ Tree Condensed Revision Guide',
    examYear: 2025,
    examSession: 'Even Semester',
    paperCode: 'BCS402-NOTES',
    sourceDescription: 'Original handwritten & typed notes authored by contributor',
    rightsDeclarationAccepted: true,
    notLeakedOrUnreleasedAttested: true,
    originalFilename: 'DBMS_Unit3_4_Notes.pdf',
    status: 'approved',
    assignedReviewerId: reviewerUser._id,
    reviewerNotes: 'Original concise derivations verified.',
    rewardAmountInr: 35,
  });

  const sub3: any = await ResourceSubmission.create({
    contributorId: contributorUser._id,
    universityId: aktu._id,
    programmeId: aktuBtech._id,
    branchId: aktuCse._id,
    semesterId: aktuSem4._id,
    curriculumSchemeId: aktuSchemeAicte._id,
    subjectId: subjTafl._id,
    resourceType: 'pyq_paper',
    title: 'TAFL Back Paper Question Set 2024',
    examYear: 2024,
    examSession: 'Back Paper',
    paperCode: 'BCS403-BP-2024',
    sourceDescription: 'AKTU official odd/back paper booklet',
    rightsDeclarationAccepted: true,
    notLeakedOrUnreleasedAttested: true,
    originalFilename: 'BCS403_Back_2024.pdf',
    status: 'under_review',
    assignedReviewerId: reviewerUser._id,
    rewardAmountInr: 15,
  });

  await RewardLedger.create({
    contributorId: contributorUser._id,
    submissionId: sub1._id,
    resourceType: 'pyq_paper',
    amountInr: 15,
    status: 'approved',
    notes: 'Approved PYQ paper reward',
  });

  await RewardLedger.create({
    contributorId: contributorUser._id,
    submissionId: sub2._id,
    resourceType: 'revision_notes',
    amountInr: 35,
    status: 'approved',
    notes: 'Original revision notes reward',
  });

  await RewardLedger.create({
    contributorId: contributorUser._id,
    submissionId: sub3._id,
    resourceType: 'pyq_paper',
    amountInr: 15,
    status: 'pending',
    notes: 'Pending reviewer sign-off (not withdrawable until approved)',
  });

  await Review.create({
    targetType: 'submission',
    targetId: sub1._id,
    reviewerId: reviewerUser._id,
    reviewerName: 'Dr. Kavita Nair',
    decision: 'approved',
    checklist: {
      universityMappingVerified: true,
      readabilityChecked: true,
      authenticityChecked: true,
      permissionsCleared: true,
    },
    comments: 'Verified against AKTU BCS-2022 curriculum scheme.',
    versionNumber: 1,
  });

  // 16. Notifications & Audit Log
  await Notification.create({
    userId: studentUser._id,
    type: 'new_resource',
    title: 'New Verified PYQ Added',
    message: 'Operating Systems BCS401 (2025 Even Semester) is now available with verified Banker’s Algorithm solution.',
    link: '/student/pyqs',
  });

  await Notification.create({
    userId: studentUser._id,
    type: 'test_reminder',
    title: 'Resume Your DBMS Practice',
    message: 'Your recent attempt showed 0% on ACID & Serializability. Try the targeted DBMS questions.',
    link: '/student/tests',
  });

  await Notification.create({
    userId: contributorUser._id,
    type: 'reward_approved',
    title: '₹35 Reward Credited to Approved Balance',
    message: 'Your DBMS Normalization Revision Guide passed academic verification.',
    link: '/contributor',
  });

  await AuditLog.create({
    actorId: adminUser._id,
    actorEmail: adminUser.email,
    actorRole: 'admin',
    action: 'SYSTEM_SEED',
    entityType: 'Platform',
    summary: 'Initialized UNIHUB academic catalogue, sample PYQs, mock tests, and role accounts.',
  });

  console.log('UNIHUB initial dataset seeded cleanly.');
}
