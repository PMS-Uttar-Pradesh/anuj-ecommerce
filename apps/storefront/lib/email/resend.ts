import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  const emailEnabled = process.env.EMAIL_ENABLED !== "false";

  if (!emailEnabled) {
    return null;
  }

  if (!apiKey) {
    console.error(
      "Missing RESEND_API_KEY environment variable. Please configure it in your .env file, or set EMAIL_ENABLED=false to disable email functionality."
    );
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}
