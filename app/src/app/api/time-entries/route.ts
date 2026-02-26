import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized, checkPermission } from "@/lib/api-utils";

// GET /api/time-entries?user_id=xxx&task_id=xxx&from=date&to=date
export async function GET(request: Request) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  let userId = searchParams.get("user_id") || session!.user.id;

  // Consultor can only see their own entries
  const { role } = await checkPermission(session!.user.id, "time-entry:read");
  if (role === "Consultor") {
    userId = session!.user.id;
  }
  const taskId = searchParams.get("task_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const entries = await prisma.timeEntry.findMany({
    where: {
      deleted_at: null,
      user_id: userId,
      ...(taskId ? { task_id: taskId } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          project: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  // Enrich with computed cost
  const enriched = entries.map((e) => ({
    ...e,
    cost: e.rate_snapshot
      ? Number(e.hours) * Number(e.rate_snapshot)
      : null,
  }));

  return NextResponse.json(enriched);
}

// POST /api/time-entries
export async function POST(request: Request) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const body = await request.json();
  const { task_id, date, hours, source } = body;

  if (!task_id || !date || !hours) {
    return NextResponse.json(
      { error: "task_id, date y hours son requeridos" },
      { status: 400 }
    );
  }

  if (Number(hours) <= 0 || Number(hours) > 24) {
    return NextResponse.json(
      { error: "hours debe estar entre 0 y 24" },
      { status: 400 }
    );
  }

  // Verify task exists
  const task = await prisma.task.findFirst({
    where: { id: task_id, deleted_at: null },
  });

  if (!task) {
    return NextResponse.json(
      { error: "Tarea no encontrada" },
      { status: 404 }
    );
  }

  // Snapshot the user's current hourly rate for cost calculation
  const currentUser = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { hourly_rate: true },
  });

  const entry = await prisma.timeEntry.create({
    data: {
      task_id,
      user_id: session!.user.id,
      date: new Date(date),
      hours: Number(hours),
      source: source || "MANUAL",
      rate_snapshot: currentUser?.hourly_rate ?? null,
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          project: { select: { id: true, name: true } },
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      user_id: session!.user.id,
      entity_type: "TimeEntry",
      entity_id: entry.id,
      action: "CREATE",
      changes: { task_id, date, hours },
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
