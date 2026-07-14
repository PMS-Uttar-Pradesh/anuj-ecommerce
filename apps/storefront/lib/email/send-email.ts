import { render } from "@react-email/render";
import React from "react";
import prisma from "@/lib/prisma";
import { getResendClient } from "./resend";
import WelcomeEmail from "./templates/welcome-email";
import OrderConfirmationEmail from "./templates/order-confirmation";
import OrderStatusEmail from "./templates/order-status";
import ContactAdminEmail from "./templates/contact-admin";
import ContactReceivedEmail from "./templates/contact-received";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://anuj-ecommerce-pi.vercel.app";

interface SendMailPayload {
  to: string;
  subject: string;
  reactElement: React.ReactElement;
}

/**
 * Common sender utility that wraps Resend calls.
 * Safe try/catch wrapper that never throws fatal exceptions.
 */
async function sendMail({ to, subject, reactElement }: SendMailPayload) {
  const emailEnabled = process.env.EMAIL_ENABLED !== "false";
  
  if (!emailEnabled) {
    console.log(`[Email Bypassed] To: ${to} | Subject: "${subject}"`);
    return { success: true, bypassed: true };
  }

  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const resend = getResendClient();

  if (!resend) {
    console.error("[Email Error] Resend client is not initialized.");
    return { success: false, error: "Resend client not initialized" };
  }

  try {
    const html = await render(reactElement);

    const response = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (response.error) {
      console.error(`[Email Error] Resend returned error:`, response.error);
      return { success: false, error: response.error };
    }

    return { success: true, data: response.data };
  } catch (error) {
    console.error(`[Email Error] Exception while sending email:`, error);
    return { success: false, error };
  }
}

/**
 * Sends a welcome email to a newly signed up user.
 */
export async function sendWelcomeEmail(props: { email: string; firstName: string }) {
  try {
    const reactElement = React.createElement(WelcomeEmail, {
      firstName: props.firstName,
      storeUrl: SITE_URL,
    });

    return await sendMail({
      to: props.email,
      subject: "Welcome to PMS!",
      reactElement,
    });
  } catch (error) {
    console.error("[sendWelcomeEmail] Failed to process welcome email:", error);
    return { success: false, error };
  }
}

/**
 * Fetches order details and sends a confirmation email to the customer.
 */
export async function sendOrderConfirmationEmail(props: { orderId: string }) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: props.orderId },
      include: {
        user: {
          include: {
            addresses: true,
          },
        },
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!order) {
      console.error(`[sendOrderConfirmationEmail] Order ${props.orderId} not found.`);
      return { success: false, error: "Order not found" };
    }

    if (!order.user || !order.user.email) {
      console.error(`[sendOrderConfirmationEmail] User email not found for order ${props.orderId}.`);
      return { success: false, error: "User email not found" };
    }

    // Determine shipping address
    const defaultAddress = order.user.addresses.find(addr => addr.isDefault) || order.user.addresses[0];
    const shippingAddress = {
      name: `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim() || "Customer",
      line1: defaultAddress?.line1 || "N/A",
      line2: defaultAddress?.line2 || null,
      city: defaultAddress?.city || "N/A",
      state: defaultAddress?.state || "N/A",
      pincode: defaultAddress?.pincode || "N/A",
    };

    // Format items
    const items = order.items.map(item => {
      const variantName = item.variant 
        ? `${item.variant.optionName}: ${item.variant.optionValue}`
        : undefined;

      return {
        name: item.product.name,
        variantName,
        quantity: item.quantity,
        price: item.price,
      };
    });

    const reactElement = React.createElement(OrderConfirmationEmail, {
      orderNumber: order.orderNumber,
      customerName: `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim() || "Customer",
      orderDate: order.createdAt.toLocaleDateString(),
      paymentMethod: order.paymentMethod,
      items,
      subtotal: order.subtotal,
      discount: order.discountAmount,
      shipping: order.shippingFee,
      total: order.totalAmount,
      shippingAddress,
    });

    return await sendMail({
      to: order.user.email,
      subject: `Order Confirmation - PMS #${order.orderNumber}`,
      reactElement,
    });
  } catch (error) {
    console.error("[sendOrderConfirmationEmail] Failed to process order confirmation email:", error);
    return { success: false, error };
  }
}

/**
 * Sends an order status update email to the customer.
 */
export async function sendOrderStatusEmail(props: { orderId: string; status: "PROCESSING" | "SHIPPED" | "DELIVERED" }) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: props.orderId },
      include: {
        user: true,
      },
    });

    if (!order) {
      console.error(`[sendOrderStatusEmail] Order ${props.orderId} not found.`);
      return { success: false, error: "Order not found" };
    }

    if (!order.user || !order.user.email) {
      console.error(`[sendOrderStatusEmail] User email not found for order ${props.orderId}.`);
      return { success: false, error: "User/Email not found" };
    }

    const reactElement = React.createElement(OrderStatusEmail, {
      orderNumber: order.orderNumber,
      customerName: `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim() || "Customer",
      status: props.status,
      storeUrl: SITE_URL,
    });

    return await sendMail({
      to: order.user.email,
      subject: `Order Update - PMS #${order.orderNumber}`,
      reactElement,
    });
  } catch (error) {
    console.error("[sendOrderStatusEmail] Failed to process order status update email:", error);
    return { success: false, error };
  }
}

/**
 * Sends a notification email to the admin regarding a new contact request.
 */
export async function sendContactAdminEmail(props: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  try {
    const to = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || "admin@pms.com";
    const reactElement = React.createElement(ContactAdminEmail, {
      name: props.name,
      email: props.email,
      subject: props.subject,
      message: props.message,
    });

    return await sendMail({
      to,
      subject: `New Support Request: ${props.subject}`,
      reactElement,
    });
  } catch (error) {
    console.error("[sendContactAdminEmail] Failed to process admin contact email:", error);
    return { success: false, error };
  }
}

/**
 * Sends an automated confirmation reply to the customer when they submit the contact form.
 */
export async function sendContactReceivedEmail(props: {
  to: string;
  name: string;
  subject: string;
  message: string;
}) {
  try {
    const reactElement = React.createElement(ContactReceivedEmail, {
      name: props.name,
      subject: props.subject,
      message: props.message,
    });

    return await sendMail({
      to: props.to,
      subject: `Support Request Received: ${props.subject}`,
      reactElement,
    });
  } catch (error) {
    console.error("[sendContactReceivedEmail] Failed to process customer contact receipt email:", error);
    return { success: false, error };
  }
}
