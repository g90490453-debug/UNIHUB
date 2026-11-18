import crypto from 'crypto';
import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';
import {
  Entitlement,
  Package,
  Payment,
  Purchase,
  Semester,
  University,
  User,
} from '../models/index.ts';
import { createNotification, recordAudit } from '../services/auditService.ts';
import { sendEmailNotification } from '../services/emailService.ts';
import {
  calculatePackageQuote,
  createGatewayOrder,
  createHmacSignature,
  verifyRazorpaySignature,
} from '../services/paymentService.ts';
import { streamPaymentReceiptPdf } from '../services/pdfService.ts';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const packages = await Package.find({ isActive: true }).sort({ displayOrder: 1 });
    res.json({ packages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/quote', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { packageId, semesterIds } = req.body;
    const ap = req.user!.academicProfile || {};
    const universityId = req.body.universityId || ap.universityId;
    const resolvedSemIds =
      Array.isArray(semesterIds) && semesterIds.length > 0
        ? semesterIds
        : ap.semesterId
          ? [ap.semesterId]
          : [];

    if (!universityId || resolvedSemIds.length === 0) {
      return res.status(400).json({ error: 'Complete your university and semester profile before purchasing.' });
    }

    const quote = await calculatePackageQuote({
      userId: req.user!.id,
      targetPackageId: packageId,
      universityId,
      semesterIds: resolvedSemIds,
    });

    res.json({ quote });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/checkout/create-order', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { packageId, semesterIds, paymentMethod = 'upi', autoRenewConsent = false } = req.body;
    const ap = req.user!.academicProfile || {};
    const universityId = req.body.universityId || ap.universityId;
    const resolvedSemIds =
      Array.isArray(semesterIds) && semesterIds.length > 0
        ? semesterIds
        : ap.semesterId
          ? [ap.semesterId]
          : [];

    if (!universityId || resolvedSemIds.length === 0) {
      return res.status(400).json({ error: 'Please select your university and semester before checkout.' });
    }

    const quote = await calculatePackageQuote({
      userId: req.user!.id,
      targetPackageId: packageId,
      universityId,
      semesterIds: resolvedSemIds,
    });

    if (quote.finalAmountInr === 0 && quote.pkg.code === 'free') {
      return res.status(400).json({ error: 'Free Access is active by default without payment.' });
    }

    const receiptNumber = `UH-${new Date().getFullYear()}-${crypto.randomInt(1000, 9999)}`;
    const purchase: any = await Purchase.create({
      userId: req.user!.id,
      packageId: String(quote.pkg._id),
      packageCode: quote.pkg.code,
      universityId: String(universityId),
      semesterIds: resolvedSemIds.map(String),
      isUpgrade: quote.isUpgrade,
      upgradedFromPurchaseId: quote.upgradedFromPurchaseId,
      basePriceInr: quote.basePriceInr,
      creditAppliedInr: quote.creditAppliedInr,
      finalAmountInr: quote.finalAmountInr,
      status: 'created',
      autoRenewConsent: Boolean(autoRenewConsent),
      receiptNumber,
    });

    const order = await createGatewayOrder(quote.finalAmountInr, receiptNumber);

    const payment: any = await Payment.create({
      purchaseId: String(purchase._id),
      userId: req.user!.id,
      gateway: order.gateway,
      method: paymentMethod,
      razorpayOrderId: order.orderId,
      amountInr: quote.finalAmountInr,
      currency: 'INR',
      status: 'pending',
    });

    // For sandbox verification testing, generate test payment reference payload only to simulate Razorpay callback
    const sandboxPaymentId =
      order.gateway === 'razorpay_sandbox' ? `pay_rzp_${crypto.randomBytes(6).toString('hex')}` : undefined;
    const sandboxSignature =
      order.gateway === 'razorpay_sandbox' && sandboxPaymentId
        ? createHmacSignature(order.orderId, sandboxPaymentId)
        : undefined;

    res.status(201).json({
      purchase,
      payment,
      razorpay: {
        keyId: order.keyId,
        orderId: order.orderId,
        amountPaise: Math.round(quote.finalAmountInr * 100),
        currency: 'INR',
        gateway: order.gateway,
        sandboxPaymentId,
        sandboxSignature,
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/checkout/verify', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { purchaseId, razorpayOrderId, razorpayPaymentId, razorpaySignature, method = 'upi' } = req.body;
    const purchase: any = await Purchase.findById(purchaseId);
    if (!purchase || String(purchase.userId) !== req.user!.id) {
      return res.status(404).json({ error: 'Purchase record not found.' });
    }
    if (purchase.status === 'paid') {
      return res.status(400).json({ error: 'This purchase has already been verified and activated.' });
    }

    const payment: any = await Payment.findOne({ purchaseId: String(purchase._id), razorpayOrderId });
    if (!payment) {
      return res.status(404).json({ error: 'Matching payment order not found.' });
    }

    const validSignature = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!validSignature) {
      await Payment.findByIdAndUpdate(String(payment._id), {
        $set: { status: 'failed', failureReason: 'Invalid Razorpay HMAC-SHA256 signature' },
      });
      await Purchase.findByIdAndUpdate(String(purchase._id), { $set: { status: 'failed' } });
      await createNotification({
        userId: req.user!.id,
        type: 'payment_failed',
        title: 'Payment Verification Failed',
        message: 'Signature verification failed. Your entitlement was not activated and no duplicate charge was recorded.',
        link: '/student/packages',
      });
      return res.status(400).json({ error: 'Payment signature verification failed. Access was not activated.' });
    }

    const pkg: any = await Package.findById(purchase.packageId);
    if (!pkg) return res.status(404).json({ error: 'Package definition missing.' });

    await Payment.findByIdAndUpdate(String(payment._id), {
      $set: {
        razorpayPaymentId,
        razorpaySignature,
        signatureVerified: true,
        method,
        status: 'captured',
      },
    });

    await Purchase.findByIdAndUpdate(String(purchase._id), {
      $set: { status: 'paid' },
    });

    if (purchase.isUpgrade && purchase.upgradedFromPurchaseId) {
      await Entitlement.updateMany(
        { userId: req.user!.id, purchaseId: purchase.upgradedFromPurchaseId, status: 'active' },
        { $set: { status: 'upgraded' } }
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + (pkg.validityMonths || 6) * 30 * 24 * 60 * 60 * 1000).toISOString();

    const entitlement: any = await Entitlement.create({
      userId: req.user!.id,
      purchaseId: String(purchase._id),
      packageId: String(pkg._id),
      packageCode: pkg.code,
      packageName: pkg.name,
      universityId: purchase.universityId,
      semesterIds: purchase.semesterIds,
      includesPyqs: Boolean(pkg.includesPyqs),
      includesMockTests: Boolean(pkg.includesMockTests),
      includesTrendPractice: Boolean(pkg.includesTrendPractice),
      includesDetailedAnalytics: Boolean(pkg.includesDetailedAnalytics),
      activatedAt: now.toISOString(),
      expiresAt,
      status: 'active',
    });

    await createNotification({
      userId: req.user!.id,
      type: 'payment_confirmation',
      title: `${pkg.name} Activated`,
      message: `Payment of ₹${purchase.finalAmountInr} verified (Receipt ${purchase.receiptNumber}). Valid until ${new Date(expiresAt).toLocaleDateString('en-IN')}.`,
      link: '/student/packages',
    });

    await sendEmailNotification({
      to: req.user!.email,
      subject: `UNIHUB Receipt ${purchase.receiptNumber} — ${pkg.name} Activated`,
      text: `Your payment of INR ${purchase.finalAmountInr} is confirmed. Package valid until ${new Date(expiresAt).toDateString()}.`,
    });

    await recordAudit({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'PAYMENT_VERIFIED_ENTITLEMENT_ACTIVATED',
      entityType: 'Entitlement',
      entityId: String(entitlement._id),
      summary: `${pkg.name} activated for ₹${purchase.finalAmountInr} (upgrade=${purchase.isUpgrade})`,
    });

    res.json({ purchase: { ...purchase, status: 'paid' }, entitlement, receiptNumber: purchase.receiptNumber });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Verification failed' });
  }
});

router.post('/checkout/fail', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { purchaseId, reason = 'Cancelled or declined at payment gateway' } = req.body;
    const purchase: any = await Purchase.findById(purchaseId);
    if (!purchase || String(purchase.userId) !== req.user!.id) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    await Purchase.findByIdAndUpdate(String(purchase._id), { $set: { status: 'failed' } });
    await Payment.updateMany({ purchaseId: String(purchase._id) }, { $set: { status: 'failed', failureReason: reason } });

    await createNotification({
      userId: req.user!.id,
      type: 'payment_failed',
      title: 'Payment Not Completed',
      message: `Transaction for ${purchase.receiptNumber} was not completed (${reason}).`,
      link: '/student/packages',
    });

    res.json({ message: 'Failed payment recorded.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/transactions/my', requireAuth, async (req: AuthRequest, res) => {
  try {
    const [purchases, payments, entitlements, packages] = await Promise.all([
      Purchase.find({ userId: req.user!.id }).sort({ createdAt: -1 }),
      Payment.find({ userId: req.user!.id }).sort({ createdAt: -1 }),
      Entitlement.find({ userId: req.user!.id }).sort({ createdAt: -1 }),
      Package.find({}),
    ]);

    const pkgMap = new Map((packages as any[]).map((p) => [String(p._id), p]));
    const payMap = new Map((payments as any[]).map((p) => [String(p.purchaseId), p]));

    const transactions = (purchases as any[]).map((pur) => {
      const plain = pur.toObject ? pur.toObject() : pur;
      const pay = payMap.get(String(plain._id));
      const pkg = pkgMap.get(String(plain.packageId));
      return {
        ...plain,
        packageName: pkg?.name || plain.packageCode,
        paymentMethod: pay?.method || 'upi',
        paymentStatus: pay?.status || plain.status,
        razorpayOrderId: pay?.razorpayOrderId || '',
        razorpayPaymentId: pay?.razorpayPaymentId || '',
        failureReason: pay?.failureReason || '',
      };
    });

    res.json({ transactions, entitlements });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/receipt/:purchaseId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const purchase: any = await Purchase.findById(req.params.purchaseId);
    if (!purchase) return res.status(404).json({ error: 'Receipt not found' });
    if (String(purchase.userId) !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (purchase.status !== 'paid') {
      return res.status(400).json({ error: 'Receipts are available only for confirmed paid transactions.' });
    }

    const [user, pkg, uni, sems, payment, ent]: any[] = await Promise.all([
      User.findById(purchase.userId),
      Package.findById(purchase.packageId),
      University.findById(purchase.universityId),
      Semester.find({ _id: { $in: purchase.semesterIds || [] } }),
      Payment.findOne({ purchaseId: String(purchase._id) }),
      Entitlement.findOne({ purchaseId: String(purchase._id) }),
    ]);

    streamPaymentReceiptPdf(res, {
      receiptNumber: purchase.receiptNumber || String(purchase._id),
      issuedAt: purchase.createdAt,
      studentName: user?.name || req.user!.name,
      studentEmail: user?.email || req.user!.email,
      universityName: uni?.name || 'University',
      packageName: pkg?.name || purchase.packageCode,
      semesterLabels: (sems || []).map((s: any) => s.name),
      basePriceInr: purchase.basePriceInr,
      creditAppliedInr: purchase.creditAppliedInr,
      finalAmountInr: purchase.finalAmountInr,
      paymentMethod: payment?.method || 'upi',
      razorpayOrderId: payment?.razorpayOrderId || 'N/A',
      razorpayPaymentId: payment?.razorpayPaymentId || 'N/A',
      validUntil: ent?.expiresAt || new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
