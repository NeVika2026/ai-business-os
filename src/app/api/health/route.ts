import { NextResponse } from "next/server";

import { createClient } from "@/services/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
