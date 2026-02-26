import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/api-utils";

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

  return NextResponse.json({
    activeProjects,
    pendingTasks,
    hoursThisWeek: Number(hoursThisWeek._sum.hours || 0),
    teamMembers,
    recentTasks,
  });
}
