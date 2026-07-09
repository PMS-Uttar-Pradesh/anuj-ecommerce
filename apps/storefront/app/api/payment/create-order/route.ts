import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCheckout } from "@/lib/checkout/validate-checkout";
import { generateOrderNumber } from "@/lib/orders/generate-order-number";
import { razorpay } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const deliveryMethod = body?.deliveryMethod || "standard";

    const checkout = await validateCheckout(user.id, deliveryMethod);

    console.log("CHECKOUT RESULT: valid =", checkout.valid, "total =", checkout.total, "errors =", checkout.errors);

    if (!checkout.valid) {
      return NextResponse.json(
        {
          success: false,
          errors: checkout.errors,
        },
        { status: 400 },
      );
    }

    const amount = Math.round(checkout.total * 100);
    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid checkout amount.",
        },
        {
          status: 400,
        },
      );
    }
    const currency = "INR";
    const receipt = generateOrderNumber();

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("[create-razorpay-order] Unexpected error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to create payment order." },
      { status: 500 },
    );
  }
}
