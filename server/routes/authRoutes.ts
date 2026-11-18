import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Router } from 'express';
import { requireAuth, signAuthToken, type AuthRequest } from '../middleware/auth.ts';
import { isValidEmail, sanitizeString, validatePasswordStrength } from '../middleware/validate.ts';
import {
  AcademicYear,
  Branch,
  ContributorProfile,
  CurriculumScheme,
  Entitlement,
  Programme,
  Semester,
  University,
  User,
} from '../models/index.ts';
import { createNotification, recordAudit } from '../services/auditService.ts';
import { sendEmailNotification } from '../services/emailService.ts';

const router = Router();

async function buildSafeUserPayload(user: any) {
  const ap = user.academicProfile || {};
  const [uni, prog, branch, ay, sem, scheme, entitlements] = await Promise.all([
    ap.universityId ? University.findById(ap.universityId) : null,
    ap.programmeId ? Programme.findById(ap.programmeId) : null,
    ap.branchId ? Branch.findById(ap.branchId) : null,
    ap.academicYearId ? AcademicYear.findById(ap.academicYearId) : null,
    ap.semesterId ? Semester.findById(ap.semesterId) : null,
    ap.curriculumSchemeId ? CurriculumScheme.findById(ap.curriculumSchemeId) : null,
    Entitlement.find({ userId: String(user._id), status: 'active' }),
  ]);

  const now = new Date().toISOString();
  const activeEntitlements = (entitlements as any[]).filter((e) => e.expiresAt > now);

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    phone: user.phone || '',
    collegeName: user.collegeName || '',
    onboardingCompleted: Boolean(user.onboardingCompleted),
    academicProfile: {
      universityId: ap.universityId || null,
      programmeId: ap.programmeId || null,
      branchId: ap.branchId || null,
      academicYearId: ap.academicYearId || null,
      semesterId: ap.semesterId || null,
      curriculumSchemeId: ap.curriculumSchemeId || null,
      universityName: (uni as any)?.name || '',
      universityCode: (uni as any)?.code || '',
      programmeName: (prog as any)?.name || '',
      branchName: (branch as any)?.name || '',
      academicYearLabel: (ay as any)?.label || '',
      semesterName: (sem as any)?.name || '',
      curriculumSchemeName: (scheme as any)?.name || '',
    },
    activeEntitlements,
    createdAt: user.createdAt,
  };
}

router.post('/register', async (req, res) => {
  try {
    const name = sanitizeString(req.body.name, 100);
    const email = sanitizeString(req.body.email, 150).toLowerCase();
    const password = String(req.body.password || '');
    const requestedRole = req.body.role === 'contributor' ? 'contributor' : 'student';
    const collegeName = sanitizeString(req.body.collegeName || '', 150);

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Please provide your full name (at least 2 characters).' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    const pwError = validatePasswordStrength(password);
    if (pwError) {
      return res.status(400).json({ error: pwError });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user: any = await User.create({
      name,
      email,
      passwordHash,
      role: requestedRole,
      status: 'active',
      collegeName,
      onboardingCompleted: false,
      lastLoginAt: new Date().toISOString(),
    });

    await createNotification({
      userId: String(user._id),
      type: 'system',
      title: 'Welcome to UNIHUB',
      message: 'Complete your university and semester profile to unlock curriculum-matched resources.',
      link: '/onboarding',
    });

    await recordAudit({
      actorId: String(user._id),
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: String(user._id),
      summary: `New ${requestedRole} registered: ${user.email}`,
    });

    const token = signAuthToken(user);
    const payload = await buildSafeUserPayload(user);
    res.status(201).json({ token, user: payload });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = sanitizeString(req.body.email, 150).toLowerCase();
    const password = String(req.body.password || '');

    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user: any = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'This account has been suspended by an administrator.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await User.findByIdAndUpdate(String(user._id), {
      $set: { lastLoginAt: new Date().toISOString() },
    });

    const token = signAuthToken(user);
    const payload = await buildSafeUserPayload(user);
    res.json({ token, user: payload });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const email = sanitizeString(req.body.email, 150).toLowerCase();
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const user: any = await User.findOne({ email });
    if (!user) {
      return res.json({
        message: 'If an account matches that email, a password reset code has been dispatched.',
      });
    }

    const resetToken = crypto.randomBytes(4).toString('hex').toUpperCase();
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await User.findByIdAndUpdate(String(user._id), {
      $set: { resetToken, resetTokenExpiry },
    });

    await sendEmailNotification({
      to: user.email,
      subject: 'UNIHUB Password Reset Code',
      text: `Your UNIHUB password reset code is ${resetToken}. It expires in 30 minutes.`,
    });

    res.json({
      message: 'Password reset instructions have been sent to your email address.',
      previewResetCode: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to initiate password reset' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const email = sanitizeString(req.body.email, 150).toLowerCase();
    const resetCode = sanitizeString(req.body.resetCode, 30).toUpperCase();
    const newPassword = String(req.body.newPassword || '');

    if (!isValidEmail(email) || !resetCode) {
      return res.status(400).json({ error: 'Email and reset code are required.' });
    }
    const pwErr = validatePasswordStrength(newPassword);
    if (pwErr) {
      return res.status(400).json({ error: pwErr });
    }

    const user: any = await User.findOne({ email });
    if (!user || !user.resetToken || user.resetToken !== resetCode) {
      return res.status(400).json({ error: 'Invalid or expired reset code.' });
    }
    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date().toISOString()) {
      return res.status(400).json({ error: 'This reset code has expired. Request a new one.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(String(user._id), {
      $set: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });

    await recordAudit({
      actorId: String(user._id),
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PASSWORD_RESET',
      entityType: 'User',
      entityId: String(user._id),
      summary: `Password reset completed for ${user.email}`,
    });

    res.json({ message: 'Your password has been updated. You can now sign in.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Password reset failed' });
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user: any = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const payload = await buildSafeUserPayload(user);
    res.json({ user: payload });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/onboarding', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      universityId,
      programmeId,
      branchId,
      academicYearId,
      semesterId,
      curriculumSchemeId,
      collegeName,
      upiId,
    } = req.body;

    if (!universityId || !programmeId || !branchId || !academicYearId || !semesterId || !curriculumSchemeId) {
      return res.status(400).json({
        error: 'All academic profile fields (University, Programme, Branch, Year, Semester, Curriculum Scheme) are required.',
      });
    }

    const [uni, prog, branch, sem, scheme]: any[] = await Promise.all([
      University.findById(universityId),
      Programme.findById(programmeId),
      Branch.findById(branchId),
      Semester.findById(semesterId),
      CurriculumScheme.findById(curriculumSchemeId),
    ]);

    if (!uni || !prog || !branch || !sem || !scheme) {
      return res.status(400).json({ error: 'One or more academic catalogue selections are invalid.' });
    }
    if (
      String(prog.universityId) !== String(uni._id) ||
      String(branch.programmeId) !== String(prog._id) ||
      String(sem.programmeId) !== String(prog._id) ||
      String(scheme.programmeId) !== String(prog._id)
    ) {
      return res.status(400).json({
        error: 'Selected programme, branch, semester, and curriculum scheme must belong to the same university hierarchy.',
      });
    }

    const updated: any = await User.findByIdAndUpdate(
      req.user!.id,
      {
        $set: {
          collegeName: sanitizeString(collegeName || '', 150),
          onboardingCompleted: true,
          academicProfile: {
            universityId: String(universityId),
            programmeId: String(programmeId),
            branchId: String(branchId),
            academicYearId: String(academicYearId),
            semesterId: String(semesterId),
            curriculumSchemeId: String(curriculumSchemeId),
          },
        },
      },
      { new: true }
    );

    if (req.user!.role === 'contributor') {
      const existingProfile = await ContributorProfile.findOne({ userId: req.user!.id });
      if (!existingProfile) {
        await ContributorProfile.create({
          userId: req.user!.id,
          universityId: String(universityId),
          programmeId: String(programmeId),
          branchId: String(branchId),
          collegeName: sanitizeString(collegeName || 'Campus Partner College', 150),
          upiId: sanitizeString(upiId || '', 80),
          status: 'active',
        });
      }
    }

    const payload = await buildSafeUserPayload(updated);
    res.json({ user: payload });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Onboarding save failed' });
  }
});

router.put('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const name = sanitizeString(req.body.name, 100);
    const phone = sanitizeString(req.body.phone, 20);
    const collegeName = sanitizeString(req.body.collegeName, 150);

    const updateSet: Record<string, any> = {};
    if (name && name.length >= 2) updateSet.name = name;
    if (req.body.phone !== undefined) updateSet.phone = phone;
    if (req.body.collegeName !== undefined) updateSet.collegeName = collegeName;

    if (req.body.academicProfile) {
      const ap = req.body.academicProfile;
      if (ap.universityId && ap.programmeId && ap.branchId && ap.academicYearId && ap.semesterId && ap.curriculumSchemeId) {
        updateSet.academicProfile = {
          universityId: String(ap.universityId),
          programmeId: String(ap.programmeId),
          branchId: String(ap.branchId),
          academicYearId: String(ap.academicYearId),
          semesterId: String(ap.semesterId),
          curriculumSchemeId: String(ap.curriculumSchemeId),
        };
        updateSet.onboardingCompleted = true;
      }
    }

    const updated = await User.findByIdAndUpdate(req.user!.id, { $set: updateSet }, { new: true });
    const payload = await buildSafeUserPayload(updated);
    res.json({ user: payload, message: 'Profile updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Profile update failed' });
  }
});

router.put('/change-password', requireAuth, async (req: AuthRequest, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');

    const user: any = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }
    const pwErr = validatePasswordStrength(newPassword);
    if (pwErr) {
      return res.status(400).json({ error: pwErr });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.user!.id, { $set: { passwordHash } });

    await recordAudit({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: req.user!.id,
      summary: 'User updated account password.',
    });

    res.json({ message: 'Password changed successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to change password' });
  }
});

router.post('/delete-account-request', requireAuth, async (req: AuthRequest, res) => {
  try {
    await User.findByIdAndUpdate(req.user!.id, {
      $set: {
        status: 'deletion_requested',
        deletionRequestedAt: new Date().toISOString(),
      },
    });
    await recordAudit({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'ACCOUNT_DELETION_REQUESTED',
      entityType: 'User',
      entityId: req.user!.id,
      summary: `Account deletion requested by ${req.user!.email}`,
    });
    res.json({ message: 'Your account deletion request has been logged for privacy compliance review.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
