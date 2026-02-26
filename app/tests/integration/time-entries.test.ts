import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import { getTestPrisma } from "../helpers/db";

const prisma = getTestPrisma();

async function createTaskWithUser() {
  const workspace = await prisma.workspace.create({
    data: { name: "Test Workspace", domain: `test-${randomUUID().slice(0, 8)}.com` },
  });
  const project = await prisma.project.create({
    data: { name: "Test Project", workspace_id: workspace.id },
  });
  const user = await prisma.user.create({
    data: { email: `worker-${randomUUID().slice(0, 8)}@test.com`, full_name: "Worker", password_hash: "x" },
  });
  const task = await prisma.task.create({
    data: { title: "Test Task", project_id: project.id, position: 0 },
  });
  return { workspace, project, user, task };
}

describe("TimeEntries - CRUD", () => {
  it("should create a time entry", async () => {
    const { user, task } = await createTaskWithUser();

    const entry = await prisma.timeEntry.create({
      data: {
        user_id: user.id,
        task_id: task.id,
        date: new Date("2026-02-26"),
        hours: 2.5,
        source: "MANUAL",
      },
    });

    expect(entry.id).toBeDefined();
    expect(Number(entry.hours)).toBe(2.5);
    expect(entry.source).toBe("MANUAL");
    expect(entry.deleted_at).toBeNull();
  });

  it("should soft delete a time entry", async () => {
    const { user, task } = await createTaskWithUser();

    const entry = await prisma.timeEntry.create({
      data: {
        user_id: user.id,
        task_id: task.id,
        date: new Date(),
        hours: 1,
        source: "MANUAL",
      },
    });

    await prisma.timeEntry.update({
      where: { id: entry.id },
      data: { deleted_at: new Date() },
    });

    const active = await prisma.timeEntry.findFirst({
      where: { id: entry.id, deleted_at: null },
    });
    expect(active).toBeNull();
  });

  it("should aggregate hours per user", async () => {
    const { user, task } = await createTaskWithUser();

    await prisma.timeEntry.createMany({
      data: [
        { user_id: user.id, task_id: task.id, date: new Date("2026-02-24"), hours: 3, source: "MANUAL" },
        { user_id: user.id, task_id: task.id, date: new Date("2026-02-25"), hours: 4.5, source: "MANUAL" },
        { user_id: user.id, task_id: task.id, date: new Date("2026-02-26"), hours: 2, source: "MANUAL" },
      ],
    });

    const total = await prisma.timeEntry.aggregate({
      where: { user_id: user.id, deleted_at: null },
      _sum: { hours: true },
    });

    expect(Number(total._sum.hours)).toBe(9.5);
  });

  it("should filter entries by date range", async () => {
    const { user, task } = await createTaskWithUser();

    await prisma.timeEntry.createMany({
      data: [
        { user_id: user.id, task_id: task.id, date: new Date("2026-02-01"), hours: 2, source: "MANUAL" },
        { user_id: user.id, task_id: task.id, date: new Date("2026-02-15"), hours: 3, source: "MANUAL" },
        { user_id: user.id, task_id: task.id, date: new Date("2026-03-01"), hours: 4, source: "MANUAL" },
      ],
    });

    const february = await prisma.timeEntry.findMany({
      where: {
        user_id: user.id,
        deleted_at: null,
        date: {
          gte: new Date("2026-02-01"),
          lt: new Date("2026-03-01"),
        },
      },
    });

    expect(february).toHaveLength(2);
  });
});
