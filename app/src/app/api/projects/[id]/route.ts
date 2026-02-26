import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized, checkPermission, forbiddenResponse } from "@/lib/api-utils";

// GET /api/projects/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, deleted_at: null },
    include: {
      tasks: {
        where: { deleted_at: null },
        include: {
          assignee: { select: { id: true, full_name: true, email: true } },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Proyecto no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(project);
}

// PATCH /api/projects/:id
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { allowed } = await checkPermission(session!.user.id, "project:update");
  if (!allowed) return forbiddenResponse();

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.project.findFirst({
    where: { id, deleted_at: null },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Proyecto no encontrado" },
      { status: 404 }
    );
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.start_date !== undefined && {
        start_date: body.start_date ? new Date(body.start_date) : null,
      }),
      ...(body.end_date !== undefined && {
        end_date: body.end_date ? new Date(body.end_date) : null,
      }),
      ...(body.total_budget !== undefined && {
        total_budget: body.total_budget,
      }),
      ...(body.currency !== undefined && { currency: body.currency }),
      ...(body.module_budget !== undefined && { module_budget: body.module_budget }),
      ...(body.module_time !== undefined && { module_time: body.module_time }),
      ...(body.module_workload !== undefined && { module_workload: body.module_workload }),
    },
  });

  await prisma.auditLog.create({
    data: {
      user_id: session!.user.id,
      entity_type: "Project",
      entity_id: id,
      action: "UPDATE",
      changes: body,
    },
  });

  return NextResponse.json(project);
}

// DELETE /api/projects/:id (soft delete)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { allowed } = await checkPermission(session!.user.id, "project:delete");
  if (!allowed) return forbiddenResponse();

  const { id } = await params;

  const existing = await prisma.project.findFirst({
    where: { id, deleted_at: null },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Proyecto no encontrado" },
      { status: 404 }
    );
  }

  await prisma.project.update({
    where: { id },
    data: { deleted_at: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      user_id: session!.user.id,
      entity_type: "Project",
      entity_id: id,
      action: "DELETE",
    },
  });

  return NextResponse.json({ success: true });
}
