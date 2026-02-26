import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized, checkPermission } from "@/lib/api-utils";
import { hasMicrosoftAccount } from "@/lib/graph-token";

// GET /api/dashboard/stats
export async function GET() {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const userId = session!.user.id;

  // Start of current week (Monday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const [activeProjects, pendingTasks, hoursThisWeek, teamMembers, recentTasks] =
    await Promise.all([
      // Active projects count
      prisma.project.count({
        where: { status: "ACTIVE", deleted_at: null },
      }),

      // Pending tasks assigned to user (not DONE)
      prisma.task.count({
        where: {
          assignee_id: userId,
          status: { not: "DONE" },
          deleted_at: null,
        },
      }),

      // Hours logged this week by user
      prisma.timeEntry.aggregate({
        where: {
          user_id: userId,
          date: { gte: monday },
          deleted_at: null,
        },
        _sum: { hours: true },
      }),

      // Team members count (all active users)
      prisma.user.count({
        where: { is_active: true, deleted_at: null },
      }),

      // Recent tasks (assigned to user, last updated)
      prisma.task.findMany({
        where: {
          assignee_id: userId,
          deleted_at: null,
        },
        include: {
          project: { select: { id: true, name: true } },
        },
        orderBy: { updated_at: "desc" },
        take: 5,
      }),
    ]);

  // Role-aware budget stats for managers
  const { role } = await checkPermission(userId, "project:read");
  let budgetStats = null;

  if (role === "Admin" || role === "PM") {
    const budgetProjects = await prisma.project.findMany({
      where: { deleted_at: null, status: "ACTIVE", module_budget: true },
      select: { id: true, total_budget: true },
    });

    const totalBudget = budgetProjects.reduce(
      (sum, p) => sum + Number(p.total_budget || 0),
      0
    );

    // Calculate total consumed cost across budget-enabled projects
    const projectIds = budgetProjects.map((p) => p.id);
    const allEntries = projectIds.length > 0
      ? await prisma.timeEntry.findMany({
          where: {
            deleted_at: null,
            task: {
              deleted_at: null,
              project_id: { in: projectIds },
            },
          },
          select: { hours: true, rate_snapshot: true, date: true },
        })
      : [];

    const totalConsumed = allEntries.reduce(
      (sum, e) => sum + Number(e.hours) * Number(e.rate_snapshot ?? 0),
      0
    );

    // Burn rate: cost in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyBurn = allEntries
      .filter((e) => new Date(e.date) >= sevenDaysAgo)
      .reduce(
        (sum, e) => sum + Number(e.hours) * Number(e.rate_snapshot ?? 0),
        0
      );

    budgetStats = {
      totalBudget,
      totalConsumed: Math.round(totalConsumed * 100) / 100,
      remaining: Math.round((totalBudget - totalConsumed) * 100) / 100,
      weeklyBurn: Math.round(weeklyBurn * 100) / 100,
      projectCount: budgetProjects.length,
    };
  }

  const hasMicrosoft = await hasMicrosoftAccount(userId);

  return NextResponse.json({
    activeProjects,
    pendingTasks,
    hoursThisWeek: Number(hoursThisWeek._sum.hours || 0),
    teamMembers,
    recentTasks,
    role,
    budgetStats,
    hasMicrosoft,
  });
}
