import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission, getUserRole, type RoleName } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

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

export async function checkPermission(
  userId: string,
  permission: string
): Promise<{ allowed: boolean; role: RoleName | null }> {
  // Get user's first workspace (for MVP - will support multi-workspace later)
  const workspaceUser = await prisma.workspaceUser.findFirst({
    where: { user_id: userId, deleted_at: null },
    include: { role: { select: { name: true } } },
  });

  if (!workspaceUser) {
    return { allowed: false, role: null };
  }

  const role = workspaceUser.role.name as RoleName;
  return { allowed: hasPermission(role, permission), role };
}

export function forbiddenResponse() {
  return NextResponse.json(
    { error: "No tienes permisos para esta acción" },
    { status: 403 }
  );
}

// Re-export for convenience
export { getUserRole, hasPermission, type RoleName } from "@/lib/permissions";
