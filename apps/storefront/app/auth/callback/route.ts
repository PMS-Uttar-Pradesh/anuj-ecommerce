import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUserToPrisma } from "@/lib/auth/sync-user";
import { isValidRedirectPath } from "@/lib/utils";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);

    const code = searchParams.get("code");
    let next = (searchParams.get("next") ?? "/").trim();

    if (!isValidRedirectPath(next)) {
        next = "/";
    }

    if (code) {
        const supabase = await createClient();
        const { data } = await supabase.auth.exchangeCodeForSession(code);
        if (data?.user) {
            await syncUserToPrisma(data.user);
        }
    }

    return NextResponse.redirect(`${origin}${next}`);
}