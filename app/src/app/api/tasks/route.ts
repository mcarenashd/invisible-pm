import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/api-utils";

// GET /api/tasks?project_id=xxx
export async function GET(request: Request) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");

  if (!projectId) {
    return NextResponse.json(
      { error: "project_id es requerido" },
      { status: 400 }
    );
  }

  const tasks = await prisma.task.findMany({
    where: {
      project_id: projectId,
      deleted_at: null,
    },
    include: {
      assignee: { select: { id: true, full_name: true, email: true } },
    },
    orderBy: [{ status: "asc" }, { position: "asc" }],
  });

  return NextResponse.json(tasks);
}

// POST /api/tasks
export async function POST(request: Request) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const body = await request.json();
  const {
    project_id,
    title,
    description,
    status,
    priority,
    assignee_id,
    estimated_hours,
    due_date,
    parent_task_id,
  } = body;

  if (!project_id || !title) {
    return NextResponse.json(
      { error: "project_id y title son requeridos" },
      { status: 400 }
    );
  }

  // Get max position for this project+status
  const maxPosition = await prisma.task.aggregate({
    where: { project_id, status: status || "BACKLOG", deleted_at: null },
    _max: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      project_id,
      title,
      description: description || null,
      status: status || "BACKLOG",
      priority: priority || "MEDIUM",
      assignee_id: assignee_id || null,
      estimated_hours: estimated_hours || null,
      due_date: due_date ? new Date(due_date) : null,
      parent_task_id: parent_task_id || null,
      position: (maxPosition._max.position ?? -1) + 1,
    },
    include: {
      assignee: { select: { id: true, full_name: true, email: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      user_id: session!.user.id,
      entity_type: "Task",
      entity_id: task.id,
      action: "CREATE",
      changes: body,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
