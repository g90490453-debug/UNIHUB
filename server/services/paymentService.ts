import crypto from 'crypto';
import { env } from '../config/env.ts';
import { Entitlement, Package, Purchase } from '../models/index.ts';

export async function calculatePackageQuote(params: {
  userId: string;
  targetPackageId: string;
  universityId: string;
  semesterIds: string[];
}) {
  const pkg: any = await Package.findById(params.targetPackageId);
  if (!pkg || !pkg.isActive) {
    throw new Error('Selected semester package is not available');
  }

  const now = new Date().toISOString();
  const activeEntitlements: any[] = await Entitlement.find({
    userId: params.userId,
    status: 'active',
  });

  const validActive = activeEntitlements.filter((e) => e.expiresAt > now);

  // Check if user already has an active entitlement covering the exact same or broader package for this semester
  const targetSemSet = new Set(params.semesterIds.map(String));
  const overlapping = validActive.filter((e) =>
    (e.semesterIds || []).some((s: string) => targetSemSet.has(String(s)))
  );

  let isUpgrade = false;
  let upgradedFromPurchaseId: string | null = null;
  let creditAppliedInr = 0;

  for (const ent of overlapping) {
    if (ent.packageCode === pkg.code) {
      throw new Error(`You already have an active ${pkg.name} covering this semester.`);
    }
    if (ent.packageCode === 'complete_pass' && (pkg.code === 'pyq_pass' || pkg.code === 'test_pass')) {
      throw new Error('Your active Semester Complete Pass already includes all features of this pass.');
    }
    if (
      (ent.packageCode === 'pyq_pass' || ent.packageCode === 'test_pass') &&
      (pkg.code === 'complete_pass' || pkg.code === 'large_semester_pass')
    ) {
      const prevPurchase: any = await Purchase.findById(ent.purchaseId);
      const alreadyPaid = prevPurchase ? Number(prevPurchase.finalAmountInr) : 99;
      isUpgrade = true;
      upgradedFromPurchaseId = ent.purchaseId;
      creditAppliedInr = Math.min(alreadyPaid, pkg.priceInr);
      break;
    }
  }

  const finalAmountInr = Math.max(0, pkg.priceInr - creditAppliedInr);

  return {
    pkg,
    isUpgrade,
    upgradedFromPurchaseId,
    basePriceInr: pkg.priceInr,
    creditAppliedInr,
    finalAmountInr,
  };
}

export function createHmacSignature(orderId: string, paymentId: string): string {
  return crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = createHmacSignature(orderId, paymentId);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function createGatewayOrder(amountInr: number, receipt: string) {
  if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && !env.RAZORPAY_KEY_SECRET.includes('sandbox')) {
    const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const resp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amountInr * 100),
        currency: 'INR',
        receipt,
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Razorpay order creation failed: ${errText}`);
    }
    const order = (await resp.json()) as { id: string; amount: number; currency: string };
    return {
      orderId: order.id,
      gateway: 'razorpay' as const,
      keyId: env.RAZORPAY_KEY_ID,
    };
  }

  const sandboxOrderId = `order_rzp_${crypto.randomBytes(8).toString('hex')}`;
  return {
    orderId: sandboxOrderId,
    gateway: 'razorpay_sandbox' as const,
    keyId: 'rzp_test_unihub_sandbox',
  };
}
