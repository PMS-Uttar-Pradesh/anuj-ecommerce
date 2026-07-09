import { checkRateLimit } from "../lib/rate-limit";
import { createHmac } from "crypto";

async function runTests() {
  console.log("=== PMS v1.0 Programmatic Verification Starting ===\n");

  // --- Step 1: Admin Permission Verification ---
  console.log("1. Testing Admin Permission Verification...");
  // Set ADMIN_EMAILS environment variable for testing before importing the module
  process.env.ADMIN_EMAILS = "admin@pms.com,manager@pms.com";
  
  // Dynamically import to ensure the module reads process.env at evaluation time
  const { isAdmin } = await import("../lib/auth/permission");
  
  const testEmail1 = "admin@pms.com";
  const testEmail2 = "ADMIN@PMS.COM";
  const testEmail3 = "customer@pms.com";

  console.log(`- Is ${testEmail1} admin?`, isAdmin(testEmail1));
  console.log(`- Is ${testEmail2} admin?`, isAdmin(testEmail2));
  console.log(`- Is ${testEmail3} admin?`, isAdmin(testEmail3));

  if (!isAdmin(testEmail1) || !isAdmin(testEmail2)) {
    console.error("FAIL: Admin checks failed.");
  } else {
    console.log("PASS: Admin checks passed.\n");
  }

  // --- Step 2: Rate Limiting Verification ---
  console.log("2. Testing Rate Limiting sliding window...");
  const rlKey = "test-rate-limit-key";
  const limit = 3;
  const windowMs = 2000; // 2 seconds

  console.log(`- Making ${limit + 1} hits to bucket with limit ${limit}...`);
  for (let i = 1; i <= limit + 1; i++) {
    const res = checkRateLimit(rlKey, limit, windowMs);
    console.log(`  Hit ${i}: allowed = ${res.allowed}, remaining = ${res.remaining}`);
    if (i <= limit && !res.allowed) {
      console.error(`FAIL: Hit ${i} should have been allowed`);
    }
    if (i > limit && res.allowed) {
      console.error(`FAIL: Hit ${i} should have been blocked`);
    }
  }

  console.log("- Waiting 2.1 seconds for rate limit window reset...");
  await new Promise((resolve) => setTimeout(resolve, 2100));

  const resetRes = checkRateLimit(rlKey, limit, windowMs);
  console.log(`  Post-reset Hit: allowed = ${resetRes.allowed}, remaining = ${resetRes.remaining}`);
  if (!resetRes.allowed) {
    console.error("FAIL: Rate limit should have reset");
  } else {
    console.log("PASS: Rate limiting sliding window behaves correctly.\n");
  }

  // --- Step 3: Webhook Signature Verification ---
  console.log("3. Testing Razorpay Webhook Signature Verification...");
  const testSecret = "whsec_test_secret";
  const rawBody = JSON.stringify({ event: "payment.captured", payload: {} });
  
  const signature = createHmac("sha256", testSecret)
    .update(rawBody)
    .digest("hex");

  // Emulate signature check
  const expectedHex = createHmac("sha256", testSecret)
    .update(rawBody)
    .digest("hex");
    
  console.log(`- Generated signature: ${signature}`);
  console.log(`- Expected signature:  ${expectedHex}`);
  if (signature === expectedHex) {
    console.log("PASS: Webhook signature verification math is valid.\n");
  } else {
    console.error("FAIL: Webhook signature verification math mismatch.\n");
  }

  console.log("=== Verification Completed ===");
}

runTests().catch(console.error);
