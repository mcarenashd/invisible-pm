import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAccessToken } from "@/lib/graph-token";
import { getGraphClient } from "@/lib/graph-client";

/**
 * GET /api/integrations/me
 * Verify Microsoft Graph connection by fetching the user's profile.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const accessToken = await getAccessToken(session.user.id);
  if (!accessToken) {
    return NextResponse.json(
      { error: "No hay cuenta de Microsoft vinculada" },
      { status: 404 }
    );
  }

  try {
    const client = getGraphClient(accessToken);
    const profile = await client.api("/me").get();

    return NextResponse.json({
      displayName: profile.displayName,
      email: profile.mail || profile.userPrincipalName,
      jobTitle: profile.jobTitle,
      connected: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al conectar con Microsoft Graph" },
      { status: 502 }
    );
  }
}
