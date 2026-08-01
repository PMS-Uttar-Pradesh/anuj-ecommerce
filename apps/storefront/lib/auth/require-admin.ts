/**
 * require-admin.ts
 *
 * Auth guard for all pages under /admin/*.
 * Calls requireAdmin() at the top of any admin page or layout.
 *
 * Redirects:
 * - Unauthenticated -> /admin/login
 * - Authenticated but not ADMIN -> / (silently, back to storefront)
 */

import { redirect } from "next/navigation";
import { getUser } from "./get-user";
import prisma from "@/lib/prisma";
import type { User as PrismaUser } from "@prisma/client";

export async function requireAdmin(): Promise<PrismaUser> {
  const user = await getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user!.id },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    // Non-admin users are redirected back to the storefront home page.
    redirect("/");
  }

  return dbUser;
}

