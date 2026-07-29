/**
 * POST /api/webhooks/razorpay
 *
 * Receives Razorpay webhook events and reconciles PMS payment state.
 *
 * Security
 * --------
 * - Signature verified with RAZORPAY_WEBHOOK_SECRET (separate from API key)
 * - timingSafeEqual prevents timing-oracle attacks
 * - No authentication required — Razorpay calls this, not a user
 *
 * Behaviour
 * ---------
 * - Returns HTTP 200 for every verified event to prevent Razorpay retries
 * - Returns HTTP 400 for missing/invalid signature
 * - Only acts on `payment.captured` events
 * - For `payment.captured`:
 *     • If a PMS order is found by razorpayPaymentId and paymentStatus ≠ COMPLETED
 *       → updates paymentStatus to COMPLETED (reconciliation path)
 *     • If order is already COMPLETED → idempotent no-op
 *     • If NO matching PMS order is found → emits structured warning log; does NOT create an order
 * - All other event types are acknowledged and ignored
 *
 * Required env variable
 * ---------------------
 * RAZORPAY_WEBHOOK_SECRET  — from Razorpay Dashboard → Settings → Webhooks
 */
export const runtime = "nodejs";
import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ── Signature verification ─────────────────────────────────────────────────

function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedHex = createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedHex, "hex");
    const receivedBuf = Buffer.from(signature, "hex");

    if (expectedBuf.length !== receivedBuf.length) return false;

    return timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

// ── Event handlers ─────────────────────────────────────────────────────────

async function handlePaymentCaptured(
  event: Record<string, unknown>
): Promise<void> {
  const payload = event?.payload as Record<string, unknown> | undefined;
  const paymentEntity = (
    payload?.payment as Record<string, unknown> | undefined
  )?.entity as Record<string, unknown> | undefined;

  const razorpayPaymentId = paymentEntity?.id as string | undefined;
  const razorpayOrderId = paymentEntity?.order_id as string | undefined;
  const amount = paymentEntity?.amount as number | undefined;

  if (!razorpayPaymentId) {
    console.warn(
      "[razorpay-webhook] payment.captured event received with missing payment entity ID."
    );
    return;
  }

  try {
    const existingOrder = await prisma.order.findUnique({
      where: { razorpayPaymentId },
      select: { id: true, orderNumber: true, paymentStatus: true },
    });

    if (!existingOrder) {
      // No PMS order found for this payment — log a structured warning for
      // manual reconciliation. Do NOT create an order here; order creation
      // is the responsibility of the verify route.
      console.warn(
        JSON.stringify({
          level: "WARN",
          source: "razorpay-webhook",
          event: "payment.captured",
          message:
            "No PMS order found for razorpayPaymentId — manual reconciliation may be required",
          razorpayPaymentId,
          razorpayOrderId: razorpayOrderId ?? null,
          amount: amount ?? null,
          eventId: (event?.id as string | undefined) ?? null,
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    if (existingOrder.paymentStatus === "COMPLETED") {
      // Already reconciled — idempotent no-op (duplicate webhook delivery)
      console.log(
        `[razorpay-webhook] Order ${existingOrder.orderNumber} already COMPLETED — skipping.`
      );
      return;
    }

    // Reconcile: update payment status to COMPLETED
    await prisma.order.update({
      where: { id: existingOrder.id },
      data: { paymentStatus: "COMPLETED" },
    });

    console.log(
      `[razorpay-webhook] Reconciled order ${existingOrder.orderNumber} — paymentStatus set to COMPLETED.`
    );
  } catch (error) {
    // Log but do not re-throw — the route handler still returns 200 to
    // prevent Razorpay from retrying endlessly on a transient DB error.
    console.error("[razorpay-webhook] Error handling payment.captured:", error);
  }
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Ensure webhook secret is configured
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error(
      "[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET is not set. " +
        "Configure it in Razorpay Dashboard → Settings → Webhooks."
    );
    // Return 500 so Razorpay retries (this is a server misconfiguration, not
    // a bad request from Razorpay)
    return NextResponse.json(
      { error: "Webhook endpoint not configured." },
      { status: 500 }
    );
  }

  // 2. Read raw body before anything else — signature verification requires
  //    the exact byte sequence that was sent by Razorpay
  const rawBody = await request.text();

  // 3. Validate presence of signature header
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // 4. Verify HMAC-SHA256 signature
  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    console.warn("[razorpay-webhook] Signature verification failed.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // 5. Parse event payload
  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const eventType = event?.event as string | undefined;

  // 6. Dispatch to handler
  if (eventType === "payment.captured") {
    await handlePaymentCaptured(event);
  } else {
    // Acknowledge all other events — log for observability and move on
    console.log(
      `[razorpay-webhook] Received event type "${eventType ?? "unknown"}" — acknowledged and ignored.`
    );
  }

  // Always return 200 for verified events to prevent Razorpay retry storms
  return NextResponse.json({ received: true });
}
