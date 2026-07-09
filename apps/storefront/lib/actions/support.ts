"use server";

import prisma from "@/lib/prisma";
import { sendContactAdminEmail, sendContactReceivedEmail } from "@/lib/email/send-email";

export interface SupportSubmissionData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function submitSupportRequest(formData: SupportSubmissionData) {
  // 1. Validation using existing simple patterns
  if (!formData.name?.trim()) {
    return { success: false, error: "Name is required." };
  }
  if (formData.name.trim().length > 100) {
    return { success: false, error: "Name must be 100 characters or fewer." };
  }
  if (!formData.email?.trim()) {
    return { success: false, error: "Email is required." };
  }
  if (formData.email.trim().length > 150) {
    return { success: false, error: "Email must be 150 characters or fewer." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email.trim())) {
    return { success: false, error: "Please enter a valid email address." };
  }

  if (!formData.subject?.trim()) {
    return { success: false, error: "Subject is required." };
  }
  if (formData.subject.trim().length > 150) {
    return { success: false, error: "Subject must be 150 characters or fewer." };
  }
  if (!formData.message?.trim()) {
    return { success: false, error: "Message is required." };
  }
  if (formData.message.trim().length > 3000) {
    return { success: false, error: "Message must be 3000 characters or fewer." };
  }

  try {
    // 2. Persist in database first
    const supportRequest = await prisma.supportRequest.create({
      data: {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        status: "OPEN",
      },
    });

    // 3. Trigger non-blocking emails asynchronously
    // Send admin notification
    sendContactAdminEmail({
      name: supportRequest.name,
      email: supportRequest.email,
      subject: supportRequest.subject,
      message: supportRequest.message,
    }).catch((err) => {
      console.error("[submitSupportRequest] Failed to send admin email:", err);
    });

    // Send customer confirmation
    sendContactReceivedEmail({
      to: supportRequest.email,
      name: supportRequest.name,
      subject: supportRequest.subject,
      message: supportRequest.message,
    }).catch((err) => {
      console.error("[submitSupportRequest] Failed to send customer auto-reply email:", err);
    });

    return {
      success: true,
      message: "Thank you! Your support request has been submitted successfully.",
    };
  } catch (error: any) {
    console.error("[submitSupportRequest] Database creation failed:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred while saving your request. Please try again.",
    };
  }
}
