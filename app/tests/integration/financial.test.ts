import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID } from "crypto";
import { getTestPrisma } from "../helpers/db";

const prisma = getTestPrisma();

async function createBudgetProject() {
  const workspace = await prisma.workspace.create({
    data: { name: "Finance WS", domain: `fin-${randomUUID().slice(0, 8)}.com` },
  });
  const project = await prisma.project.create({
    data: {
      name: "Budget Project",
      workspace_id: workspace.id,
      total_budget: 10000,
      currency: "USD",
      module_budget: true,
      module_time: true,
    },
  });
  return { workspace, project };
}

async function createUserWithRate(rate: number) {
  return prisma.user.create({
    data: {
      email: `fin-${randomUUID().slice(0, 8)}@test.com`,
      full_name: `User Rate ${rate}`,
      password_hash: "x",
      hourly_rate: rate,
    },
  });
}

describe("Financial - Rate Snapshot & Budget", () => {
  it("should store rate_snapshot on time entry", async () => {
    const { project } = await createBudgetProject();
    const user = await createUserWithRate(50);
    const task = await prisma.task.create({
      data: { title: "Finance Task", project_id: project.id, position: 0 },
    });

    const entry = await prisma.timeEntry.create({
      data: {
        user_id: user.id,
        task_id: task.id,
        date: new Date("2026-02-26"),
        hours: 4,
        source: "MANUAL",
        rate_snapshot: user.hourly_rate,
      },
    });

    expect(Number(entry.rate_snapshot)).toBe(50);
  });

  it("should compute cost as hours * rate_snapshot", async () => {
    const { project } = await createBudgetProject();
    const user = await createUserWithRate(75);
    const task = await prisma.task.create({
      data: { title: "Cost Task", project_id: project.id, position: 0 },
    });

    const entry = await prisma.timeEntry.create({
      data: {
        user_id: user.id,
        task_id: task.id,
        date: new Date("2026-02-26"),
        hours: 3,
        source: "MANUAL",
        rate_snapshot: 75,
      },
    });

    const cost = Number(entry.hours) * Number(entry.rate_snapshot);
    expect(cost).toBe(225);
  });

  it("should aggregate budget consumption across multiple users", async () => {
    const { project } = await createBudgetProject();
    const user1 = await createUserWithRate(50);
    const user2 = await createUserWithRate(100);
    const task = await prisma.task.create({
      data: { title: "Multi User Task", project_id: project.id, position: 0 },
    });

    await prisma.timeEntry.createMany({
      data: [
        { user_id: user1.id, task_id: task.id, date: new Date("2026-02-24"), hours: 8, source: "MANUAL", rate_snapshot: 50 },
        { user_id: user1.id, task_id: task.id, date: new Date("2026-02-25"), hours: 6, source: "MANUAL", rate_snapshot: 50 },
        { user_id: user2.id, task_id: task.id, date: new Date("2026-02-26"), hours: 4, source: "MANUAL", rate_snapshot: 100 },
      ],
    });

    const entries = await prisma.timeEntry.findMany({
      where: { task: { project_id: project.id }, deleted_at: null },
      select: { hours: true, rate_snapshot: true },
    });

    const totalCost = entries.reduce(
      (sum, e) => sum + Number(e.hours) * Number(e.rate_snapshot ?? 0),
      0
    );

    // user1: (8*50) + (6*50) = 700, user2: (4*100) = 400 => 1100
    expect(totalCost).toBe(1100);
  });

  it("should preserve original rate_snapshot when user rate changes", async () => {
    const { project } = await createBudgetProject();
    const user = await createUserWithRate(60);
    const task = await prisma.task.create({
      data: { title: "Rate Change Task", project_id: project.id, position: 0 },
    });

    // Create entry with original rate
    const entry = await prisma.timeEntry.create({
      data: {
        user_id: user.id,
        task_id: task.id,
        date: new Date("2026-02-26"),
        hours: 5,
        source: "MANUAL",
        rate_snapshot: 60,
      },
    });

    // Simulate rate change
    await prisma.user.update({
      where: { id: user.id },
      data: { hourly_rate: 80 },
    });

    // Verify entry still has original rate
    const unchanged = await prisma.timeEntry.findUnique({
      where: { id: entry.id },
    });

    expect(Number(unchanged!.rate_snapshot)).toBe(60);

    // Verify user now has new rate
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(Number(updatedUser!.hourly_rate)).toBe(80);
  });

  it("should exclude soft-deleted entries from budget calculation", async () => {
    const { project } = await createBudgetProject();
    const user = await createUserWithRate(100);
    const task = await prisma.task.create({
      data: { title: "Soft Delete Budget", project_id: project.id, position: 0 },
    });

    const [active, deleted] = await Promise.all([
      prisma.timeEntry.create({
        data: {
          user_id: user.id, task_id: task.id,
          date: new Date("2026-02-25"), hours: 3, source: "MANUAL", rate_snapshot: 100,
        },
      }),
      prisma.timeEntry.create({
        data: {
          user_id: user.id, task_id: task.id,
          date: new Date("2026-02-26"), hours: 5, source: "MANUAL", rate_snapshot: 100,
          deleted_at: new Date(),
        },
      }),
    ]);

    const entries = await prisma.timeEntry.findMany({
      where: { task: { project_id: project.id }, deleted_at: null },
      select: { hours: true, rate_snapshot: true },
    });

    const totalCost = entries.reduce(
      (sum, e) => sum + Number(e.hours) * Number(e.rate_snapshot ?? 0),
      0
    );

    expect(totalCost).toBe(300); // only active: 3 * 100
  });
});
