import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSessionOrUnauthorized,
  checkPermission,
  forbiddenResponse,
} from "@/lib/api-utils";

// GET /api/projects/:id/budget
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { allowed } = await checkPermission(session!.user.id, "budget:read");
  if (!allowed) return forbiddenResponse();

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, deleted_at: null },
    select: {
      total_budget: true,
      currency: true,
      module_budget: true,
    },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Proyecto no encontrado" },
      { status: 404 }
    );
  }

  if (!project.module_budget) {
    return NextResponse.json(
      { error: "Módulo de presupuesto no activo" },
      { status: 403 }
    );
  }

  // Fetch all time entries for this project's tasks
  const entries = await prisma.timeEntry.findMany({
    where: {
      deleted_at: null,
      task: {
        project_id: id,
        deleted_at: null,
      },
    },
    select: {
      hours: true,
      rate_snapshot: true,
      user_id: true,
      user: { select: { full_name: true } },
    },
  });

  // Aggregate per user
  const byUser = new Map<
    string,
    { name: string; hours: number; cost: number }
  >();

  for (const e of entries) {
    const existing = byUser.get(e.user_id) ?? {
      name: e.user.full_name,
      hours: 0,
      cost: 0,
    };
    const h = Number(e.hours);
    existing.hours += h;
    existing.cost += h * Number(e.rate_snapshot ?? 0);
    byUser.set(e.user_id, existing);
  }

  const totalCost = [...byUser.values()].reduce((s, u) => s + u.cost, 0);
  const totalHours = [...byUser.values()].reduce((s, u) => s + u.hours, 0);
  const totalBudget = Number(project.total_budget ?? 0);
  const remaining = totalBudget - totalCost;
  const percentageUsed =
    totalBudget > 0 ? Math.min(Math.round((totalCost / totalBudget) * 100), 100) : 0;

  const breakdown = [...byUser.entries()].map(([userId, data]) => ({
    user_id: userId,
    name: data.name,
    hours: Math.round(data.hours * 10) / 10,
    cost: Math.round(data.cost * 100) / 100,
  }));

  return NextResponse.json({
    total_budget: totalBudget,
    total_cost: Math.round(totalCost * 100) / 100,
    remaining: Math.round(remaining * 100) / 100,
    total_hours: Math.round(totalHours * 10) / 10,
    currency: project.currency,
    percentage_used: percentageUsed,
    breakdown,
  });
}
