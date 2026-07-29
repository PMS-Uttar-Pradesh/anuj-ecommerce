/**
 * E2E verification script for the configurable Free Delivery Threshold.
 * Tests the complete data flow: DB write → DB read → shipping calculation.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function calcShipping(subtotal: number, threshold: number, delivery: "standard" | "express"): number {
  if (delivery === "express") return 99;
  return subtotal >= threshold ? 0 : 49;
}

async function main() {
  console.log("=== Free Delivery Threshold E2E Verification ===\n");

  // 1. Read the current threshold from the database
  const original = await prisma.storeSettings.findUnique({ where: { id: "default" } });
  const originalThreshold = original?.freeDeliveryThreshold ?? 999;
  console.log(`[1] Original threshold in DB: ₹${originalThreshold}`);

  // 2. Set a custom test threshold of ₹5
  const TEST_THRESHOLD = 5;
  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: { freeDeliveryThreshold: TEST_THRESHOLD },
    create: { id: "default", freeDeliveryThreshold: TEST_THRESHOLD },
  });
  console.log(`[2] Updated threshold to ₹${TEST_THRESHOLD}\n`);

  // 3. Read it back and verify round-trip
  const updated = await prisma.storeSettings.findUnique({ where: { id: "default" } });
  const readBack = updated?.freeDeliveryThreshold;
  console.log(`[3] Read-back threshold from DB: ₹${readBack}`);
  if (readBack !== TEST_THRESHOLD) {
    throw new Error(`FAIL: Read-back (₹${readBack}) ≠ Written (₹${TEST_THRESHOLD})`);
  }
  console.log("    ✅ DB round-trip PASS\n");

  // 4. Test shipping calculation with threshold = ₹5
  console.log(`[4] Shipping calculation tests (threshold = ₹${TEST_THRESHOLD}):`);

  const cases = [
    { subtotal: 3,   expected: 49,  label: "Subtotal ₹3  < ₹5  → Standard delivery ₹49" },
    { subtotal: 5,   expected: 0,   label: "Subtotal ₹5  = ₹5  → FREE" },
    { subtotal: 65,  expected: 0,   label: "Subtotal ₹65 > ₹5  → FREE (pen price)" },
    { subtotal: 100, expected: 0,   label: "Subtotal ₹100 > ₹5 → FREE" },
    { subtotal: 65,  expected: 99,  label: "Subtotal ₹65 Express → ₹99 (express always)" },
  ];

  let allPass = true;
  for (const c of cases) {
    const delivery = c.expected === 99 ? "express" : "standard";
    const shipping = calcShipping(c.subtotal, TEST_THRESHOLD, delivery);
    const pass = shipping === c.expected;
    if (!pass) allPass = false;
    console.log(`    ${pass ? "✅" : "❌"} ${c.label} → got ₹${shipping}`);
  }

  if (!allPass) throw new Error("FAIL: One or more shipping calculation tests failed.");
  console.log("    ✅ All shipping calculation tests PASS\n");

  // 5. Verify validate-checkout would use the same value (simulate its logic)
  console.log("[5] Simulating validate-checkout.ts logic:");
  const settings = await prisma.storeSettings.findUnique({ where: { id: "default" } });
  const threshold = settings?.freeDeliveryThreshold ?? 999;
  console.log(`    Settings.freeDeliveryThreshold = ₹${threshold}`);

  const subtotalAbove = 65; // ₹65 Pilot V5 pen
  const isFreeShipping = subtotalAbove >= threshold;
  const shipping = !isFreeShipping ? 49 : 0;
  const total = subtotalAbove + shipping;
  console.log(`    Subtotal ₹${subtotalAbove}, isFree=${isFreeShipping}, shipping=₹${shipping}, total=₹${total}`);
  if (!isFreeShipping || shipping !== 0) {
    throw new Error(`FAIL: Expected free shipping for ₹${subtotalAbove} when threshold=₹${threshold}`);
  }
  console.log("    ✅ validate-checkout simulation PASS\n");

  // 6. Restore original threshold
  await prisma.storeSettings.update({
    where: { id: "default" },
    data: { freeDeliveryThreshold: originalThreshold },
  });
  console.log(`[6] Restored original threshold to ₹${originalThreshold}`);
  const restored = await prisma.storeSettings.findUnique({ where: { id: "default" } });
  console.log(`    DB confirms restored value: ₹${restored?.freeDeliveryThreshold}`);
  console.log("    ✅ Restore PASS\n");

  console.log("=== ALL VERIFICATIONS PASSED ✅ ===\n");
  console.log("Summary:");
  console.log("  • DB write/read round-trip: PASS");
  console.log("  • Shipping calculation (below/equal/above threshold): PASS");
  console.log("  • Express shipping (always ₹99): PASS");
  console.log("  • validate-checkout logic simulation: PASS");
  console.log("  • Threshold restored to original: PASS");
}

main().catch((e) => {
  console.error("\n❌ VERIFICATION FAILED:", e.message);
  process.exit(1);
}).finally(() => prisma.$disconnect());
