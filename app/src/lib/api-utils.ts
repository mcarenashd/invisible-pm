import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function getSessionOrUnauthorized() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }
  return { session, error: null };
}
