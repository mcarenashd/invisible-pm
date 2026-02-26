import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/api-utils";

// GET /api/me — Returns current user with role and workspace context
export async function GET() {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const userId = session!.user.id;

  const workspaceUser = await prisma.workspaceUser.findFirst({
    where: { user_id: userId, deleted_at: null },
    include: {
      role: { select: { id: true, name: true } },
      workspace: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    id: userId,
    email: session!.user.email,
    name: session!.user.name,
    role: workspaceUser?.role.name ?? null,
    workspace_id: workspaceUser?.workspace.id ?? null,
    workspace_name: workspaceUser?.workspace.name ?? null,
  });
}
