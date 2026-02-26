import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import { getTestPrisma } from "../helpers/db";

const prisma = getTestPrisma();

async function createProjectWithWorkspace() {
  const workspace = await prisma.workspace.create({
    data: { name: "Test Workspace", domain: `test-${randomUUID().slice(0, 8)}.com` },
  });
  const project = await prisma.project.create({
    data: { name: "Test Project", workspace_id: workspace.id },
  });
  return { workspace, project };
}

describe("Tasks - CRUD", () => {
  it("should create a task with default values", async () => {
    const { project } = await createProjectWithWorkspace();

    const task = await prisma.task.create({
      data: {
        title: "Test Task",
        project_id: project.id,
        position: 0,
      },
    });

    expect(task.id).toBeDefined();
    expect(task.title).toBe("Test Task");
    expect(task.status).toBe("BACKLOG");
    expect(task.priority).toBe("MEDIUM");
    expect(task.assignee_id).toBeNull();
    expect(task.deleted_at).toBeNull();
  });

  it("should create a task with all fields", async () => {
    const { project } = await createProjectWithWorkspace();
    const user = await prisma.user.create({
      data: { email: `dev-${randomUUID().slice(0, 8)}@test.com`, full_name: "Dev User", password_hash: "x" },
    });

    const task = await prisma.task.create({
      data: {
        title: "Full Task",
        description: "Detailed description",
        project_id: project.id,
        status: "IN_PROGRESS",
        priority: "HIGH",
        assignee_id: user.id,
        estimated_hours: 8,
        due_date: new Date("2026-06-15"),
        position: 0,
      },
    });

    expect(task.description).toBe("Detailed description");
    expect(task.status).toBe("IN_PROGRESS");
    expect(task.priority).toBe("HIGH");
    expect(task.assignee_id).toBe(user.id);
    expect(task.due_date).toBeInstanceOf(Date);
  });

  it("should soft delete a task", async () => {
    const { project } = await createProjectWithWorkspace();

    const task = await prisma.task.create({
      data: { title: "Delete Me", project_id: project.id, position: 0 },
    });

    await prisma.task.update({
      where: { id: task.id },
      data: { deleted_at: new Date() },
    });

    const active = await prisma.task.findFirst({
      where: { id: task.id, deleted_at: null },
    });
    expect(active).toBeNull();
  });

  it("should update task status and priority", async () => {
    const { project } = await createProjectWithWorkspace();

    const task = await prisma.task.create({
      data: { title: "Move Me", project_id: project.id, position: 0 },
    });

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: { status: "DONE", priority: "URGENT" },
    });

    expect(updated.status).toBe("DONE");
    expect(updated.priority).toBe("URGENT");
  });

  it("should assign and unassign a user", async () => {
    const { project } = await createProjectWithWorkspace();
    const user = await prisma.user.create({
      data: { email: `assign-${randomUUID().slice(0, 8)}@test.com`, full_name: "Assignee", password_hash: "x" },
    });

    const task = await prisma.task.create({
      data: { title: "Assign Test", project_id: project.id, position: 0 },
    });

    // Assign
    const assigned = await prisma.task.update({
      where: { id: task.id },
      data: { assignee_id: user.id },
    });
    expect(assigned.assignee_id).toBe(user.id);

    // Unassign
    const unassigned = await prisma.task.update({
      where: { id: task.id },
      data: { assignee_id: null },
    });
    expect(unassigned.assignee_id).toBeNull();
  });
});
