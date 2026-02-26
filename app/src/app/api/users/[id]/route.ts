import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSessionOrUnauthorized,
  checkPermission,
  forbiddenResponse,
} from "@/lib/api-utils";

// PATCH /api/users/:id — update hourly_rate and/or role
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { allowed } = await checkPermission(session!.user.id, "user:manage");
  if (!allowed) return forbiddenResponse();

  const { id } = await params;
  const body = await request.json();
  const { hourly_rate, role_name } = body;

  // Verify user exists
  const user = await prisma.user.findFirst({
    where: { id, deleted_at: null },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  // Update hourly_rate if provided
  if (hourly_rate !== undefined) {
    if (hourly_rate !== null && Number(hourly_rate) < 0) {
      return NextResponse.json(
        { error: "La tarifa debe ser mayor o igual a 0" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id },
      data: {
        hourly_rate: hourly_rate !== null ? Number(hourly_rate) : null,
      },
    });
  }

  // Update role if provided
  if (role_name) {
    const role = await prisma.role.findUnique({
      where: { name: role_name },
    });

    if (!role) {
      return NextResponse.json(
        { error: "Rol no encontrado" },
        { status: 400 }
      );
    }

    // Find user's workspace membership
    const workspaceUser = await prisma.workspaceUser.findFirst({
      where: { user_id: id, deleted_at: null },
    });

    if (workspaceUser) {
      await prisma.workspaceUser.update({
        where: { id: workspaceUser.id },
        data: { role_id: role.id },
      });
    }
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      user_id: session!.user.id,
      entity_type: "User",
      entity_id: id,
      action: "UPDATE",
      changes: {
        ...(hourly_rate !== undefined && { hourly_rate }),
        ...(role_name && { role_name }),
      },
    },
  });

  // Return updated user with role
  const updated = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      full_name: true,
      hourly_rate: true,
      is_active: true,
    },
  });

  const membership = await prisma.workspaceUser.findFirst({
    where: { user_id: id, deleted_at: null },
    include: { role: { select: { id: true, name: true } } },
  });

  return NextResponse.json({
    ...updated,
    role: membership?.role ?? null,
  });
}
