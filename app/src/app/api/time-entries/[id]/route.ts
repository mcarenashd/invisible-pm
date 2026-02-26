import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/api-utils";

// DELETE /api/time-entries/:id (soft delete)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;

  const existing = await prisma.timeEntry.findFirst({
    where: { id, deleted_at: null, user_id: session!.user.id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Registro no encontrado" },
      { status: 404 }
    );
  }

  await prisma.timeEntry.update({
    where: { id },
    data: { deleted_at: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      user_id: session!.user.id,
      entity_type: "TimeEntry",
      entity_id: id,
      action: "DELETE",
    },
  });

  return NextResponse.json({ success: true });
}
