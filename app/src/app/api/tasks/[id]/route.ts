import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/api-utils";

// PATCH /api/tasks/:id
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.task.findFirst({
    where: { id, deleted_at: null },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Tarea no encontrada" },
      { status: 404 }
    );
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.assignee_id !== undefined && { assignee_id: body.assignee_id }),
      ...(body.estimated_hours !== undefined && {
        estimated_hours: body.estimated_hours,
      }),
      ...(body.due_date !== undefined && {
        due_date: body.due_date ? new Date(body.due_date) : null,
      }),
      ...(body.position !== undefined && { position: body.position }),
    },
    include: {
      assignee: { select: { id: true, full_name: true, email: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      user_id: session!.user.id,
      entity_type: "Task",
      entity_id: id,
      action: "UPDATE",
      changes: body,
    },
  });

  return NextResponse.json(task);
}

// DELETE /api/tasks/:id (soft delete)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;

  const existing = await prisma.task.findFirst({
    where: { id, deleted_at: null },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Tarea no encontrada" },
      { status: 404 }
    );
  }

  await prisma.task.update({
    where: { id },
    data: { deleted_at: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      user_id: session!.user.id,
      entity_type: "Task",
      entity_id: id,
      action: "DELETE",
    },
  });

  return NextResponse.json({ success: true });
}
