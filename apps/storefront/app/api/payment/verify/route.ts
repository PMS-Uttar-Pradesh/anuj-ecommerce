export const runtime = "nodejs";
import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { createOrderFromCart } from "@/lib/orders/create-order";
import { validateCheckout } from "@/lib/checkout/validate-checkout";

interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

class PaymentVerificationError extends Error {
  constructor(
    message: string,
    readonly status: number = 400
  ) {
    super(message);
    this.name = "PaymentVerificationError";
  }
}

function isVerifyPaymentPayload(
  value: unknown
): value is VerifyPaymentPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;

  return (
    typeof payload.razorpay_order_id === "string" &&
    payload.razorpay_order_id.trim().length > 0 &&
    typeof payload.razorpay_payment_id === "string" &&
    payload.razorpay_payment_id.trim().length > 0 &&
    typeof payload.razorpay_signature === "string" &&
    payload.razorpay_signature.trim().length > 0
  );
}

function getRazorpayKeySecret(): string {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new Error(
      "Missing required Razorpay environment variable: RAZORPAY_KEY_SECRET"
    );
  }

  return keySecret;
}

function verifyRazorpaySignature(
  payload: VerifyPaymentPayload
): boolean {
  try {
    const expectedSignature = createHmac(
      "sha256",
      getRazorpayKeySecret()
    )
      .update(
        `${payload.razorpay_order_id}|${payload.razorpay_payment_id}`
      )
      .digest("hex");

    const expected = Buffer.from(expectedSignature, "hex");
    const received = Buffer.from(
      payload.razorpay_signature,
      "hex"
    );

    if (expected.length !== received.length) {
      return false;
    }

    return timingSafeEqual(expected, received);
  } catch (error) {
    console.error(
      "[verify-razorpay-signature] Invalid signature payload:",
      error
    );

    return false;
  }
}


async function createOrderFromVerifiedPayment(
  userId: string,
  payload: VerifyPaymentPayload,
  deliveryMethod: string
) {
  try {
    const checkout = await validateCheckout(userId, deliveryMethod);
    if (!checkout.valid) {
      throw new PaymentVerificationError("Checkout verification failed: " + checkout.errors.join(" "));
    }

    return await createOrderFromCart({
      userId,
      paymentMethod: PaymentMethod.ONLINE,
      paymentStatus: PaymentStatus.COMPLETED,
      status: OrderStatus.PROCESSING,
      razorpayOrderId: payload.razorpay_order_id,
      razorpayPaymentId: payload.razorpay_payment_id,
      subtotal: checkout.subtotal,
      discountAmount: checkout.discount,
      shippingFee: checkout.shipping,
    });
  } catch (error: any) {
    throw new PaymentVerificationError(error.message || "Payment verification failed.");
  }
}


export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        {
          success: false,
        },
        {
          status: 401,
        }
      );
    }

    const body: any = await request.json().catch(() => null);

    if (!isVerifyPaymentPayload(body)) {
      return NextResponse.json(
        {
          success: false,
        },
        {
          status: 400,
        }
      );
    }

    const isValidSignature = verifyRazorpaySignature(body);

    if (!isValidSignature) {
      return NextResponse.json(
        {
          success: false,
        },
        {
          status: 400,
        }
      );
    }

    const deliveryMethod = (body as any).deliveryMethod || "standard";
    const order = await createOrderFromVerifiedPayment(user.id, body, deliveryMethod);

    await sendOrderConfirmationEmail({ orderId: order.id });

    return NextResponse.json({
      success: true,
      verified: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    if (error instanceof PaymentVerificationError) {
      return NextResponse.json(
        {
          success: false,
        },
        {
          status: error.status,
        }
      );
    }

    console.error(
      "[verify-razorpay-payment] Unexpected error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}
