import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized, checkPermission, forbiddenResponse } from "@/lib/api-utils";

// GET /api/projects - List all projects
export async function GET(request: Request) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const projects = await prisma.project.findMany({
    where: {
      deleted_at: null,
      ...(status ? { status: status as never } : {}),
    },
    include: {
      tasks: {
        where: { deleted_at: null },
        select: { id: true, status: true },
      },
    },
    orderBy: { created_at: "desc" },
  });

  // Add task count summary
  const result = projects.map((project) => {
    const { tasks, ...rest } = project;
    return {
      ...rest,
      _count: { tasks: tasks.length },
      _tasksByStatus: tasks.reduce(
        (acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  });

  return NextResponse.json(result);
}

// POST /api/projects - Create a project
export async function POST(request: Request) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { allowed } = await checkPermission(session!.user.id, "project:create");
  if (!allowed) return forbiddenResponse();

  const body = await request.json();
  const { name, description, status, start_date, end_date, total_budget, currency, workspace_id } = body;

  if (!name || !workspace_id) {
    return NextResponse.json(
      { error: "name y workspace_id son requeridos" },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      name,
      description,
      status: status || "PLANNING",
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      total_budget: total_budget || null,
      currency: currency || "USD",
      workspace_id,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      user_id: session!.user.id,
      entity_type: "Project",
      entity_id: project.id,
      action: "CREATE",
      changes: body,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
