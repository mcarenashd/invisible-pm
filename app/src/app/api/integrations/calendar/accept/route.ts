import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/api-utils";

/**
 * POST /api/integrations/calendar/accept
 * Accept a calendar suggestion and create a time entry with source OUTLOOK.
 */
export async function POST(request: Request) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const body = await request.json();
  const { task_id, date, hours, external_event_id } = body;

  if (!task_id || !date || !hours || !external_event_id) {
    return NextResponse.json(
      { error: "task_id, date, hours y external_event_id son requeridos" },
      { status: 400 }
    );
  }

  if (Number(hours) <= 0 || Number(hours) > 24) {
    return NextResponse.json(
      { error: "hours debe estar entre 0 y 24" },
      { status: 400 }
    );
  }

  // Check for duplicate
  const existing = await prisma.timeEntry.findFirst({
    where: {
      user_id: session!.user.id,
      external_event_id,
      deleted_at: null,
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Este evento ya fue registrado" },
      { status: 409 }
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

  // Snapshot user rate
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { hourly_rate: true },
  });

  const entry = await prisma.timeEntry.create({
    data: {
      task_id,
      user_id: session!.user.id,
      date: new Date(date),
      hours: Number(hours),
      source: "OUTLOOK",
      external_event_id,
      rate_snapshot: user?.hourly_rate ?? null,
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
      changes: { task_id, date, hours, source: "OUTLOOK", external_event_id },
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
