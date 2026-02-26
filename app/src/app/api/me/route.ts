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

// PATCH /api/me — Update own profile (name, email)
export async function PATCH(request: Request) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const userId = session!.user.id;
  const body = await request.json();
  const { full_name, email } = body;

  if (!full_name && !email) {
    return NextResponse.json(
      { error: "Debe enviar al menos full_name o email" },
      { status: 400 }
    );
  }

  // Validate email uniqueness if changing
  if (email && email !== session!.user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "El email ya está en uso" },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(full_name && { full_name }),
      ...(email && { email }),
    },
    select: { id: true, email: true, full_name: true },
  });

  await prisma.auditLog.create({
    data: {
      user_id: userId,
      entity_type: "User",
      entity_id: userId,
      action: "UPDATE",
      changes: {
        ...(full_name && { full_name }),
        ...(email && { email }),
      },
    },
  });

  return NextResponse.json(updated);
}
