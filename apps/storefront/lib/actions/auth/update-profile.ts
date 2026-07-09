"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export interface UpdateProfileState {
  success?: boolean;
  error?: string;
  errors?: {
    firstName?: string;
    lastName?: string;
  };
}

export async function updateProfile(
  prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const firstName = (formData.get("firstName") as string | null)?.trim() ?? "";
  const lastName = (formData.get("lastName") as string | null)?.trim() ?? "";

  // Validate
  const errors: { firstName?: string; lastName?: string } = {};
  if (!firstName) {
    errors.firstName = "First name is required.";
  } else if (firstName.length > 50) {
    errors.firstName = "First name must be at most 50 characters.";
  }

  if (!lastName) {
    errors.lastName = "Last name is required.";
  } else if (lastName.length > 50) {
    errors.lastName = "Last name must be at most 50 characters.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "You must be logged in to update your profile." };
    }

    // 1. Update Supabase user metadata
    const { error: updateAuthError } = await supabase.auth.updateUser({
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      },
    });

    if (updateAuthError) {
      console.error("[updateProfile] Supabase update failed:", updateAuthError);
      return { error: "Failed to update profile in authentication system." };
    }

    // 2. Update Prisma user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
    });

    revalidatePath("/account/profile");
    return { success: true };
  } catch (error) {
    console.error("[updateProfile] Unhandled error:", error);
    return { error: "An unexpected error occurred while updating your profile." };
  }
}
