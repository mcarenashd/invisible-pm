import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/api-utils";

// GET /api/users?workspace_id=xxx
export async function GET(request: Request) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspace_id");

  if (!workspaceId) {
    // Return all active users (for now, will be workspace-scoped later)
    const users = await prisma.user.findMany({
      where: { deleted_at: null, is_active: true },
      select: {
        id: true,
        email: true,
        full_name: true,
        hourly_rate: true,
      },
      orderBy: { full_name: "asc" },
    });
    return NextResponse.json(users);
  }

  // Return workspace members with their roles
  const members = await prisma.workspaceUser.findMany({
    where: { workspace_id: workspaceId, deleted_at: null },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          full_name: true,
          hourly_rate: true,
          is_active: true,
        },
      },
      role: { select: { id: true, name: true } },
    },
  });

  const result = members.map((m) => ({
    ...m.user,
    role: m.role,
    workspace_user_id: m.id,
  }));

  return NextResponse.json(result);
}
