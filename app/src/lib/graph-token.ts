import { prisma } from "@/lib/prisma";

const MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com";

/**
 * Get a valid Microsoft access token for a user.
 * Refreshes automatically if expired.
 * Returns null if user has no Microsoft account linked.
 */
export async function getAccessToken(
  userId: string
): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: {
      user_id: userId,
      provider: "microsoft-entra-id",
    },
  });

  if (!account?.access_token) return null;

  // Check if token is still valid (with 5 min buffer)
  const isExpired =
    account.expires_at && account.expires_at * 1000 < Date.now() - 5 * 60 * 1000;

  if (!isExpired) {
    return account.access_token;
  }

  // Token expired — try to refresh
  if (!account.refresh_token) return null;

  const tenantId =
    process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID || "common";

  const response = await fetch(
    `${MICROSOFT_TOKEN_URL}/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
        client_secret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
        grant_type: "refresh_token",
        refresh_token: account.refresh_token,
        scope:
          "openid profile email User.Read Calendars.Read offline_access",
      }),
    }
  );

  if (!response.ok) {
    return null;
  }

  const tokens = await response.json();

  // Update tokens in DB
  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? account.refresh_token,
      expires_at: tokens.expires_in
        ? Math.floor(Date.now() / 1000) + tokens.expires_in
        : account.expires_at,
    },
  });

  return tokens.access_token;
}

/**
 * Check if a user has a Microsoft account linked.
 */
export async function hasMicrosoftAccount(
  userId: string
): Promise<boolean> {
  const count = await prisma.account.count({
    where: {
      user_id: userId,
      provider: "microsoft-entra-id",
    },
  });
  return count > 0;
}
