import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import { getTestPrisma } from "../helpers/db";

const prisma = getTestPrisma();

async function createWorkspace() {
  return prisma.workspace.create({
    data: { name: "Test Workspace", domain: `test-${randomUUID().slice(0, 8)}.com` },
  });
}

describe("Projects - CRUD", () => {
  it("should create a project with default values", async () => {
    const workspace = await createWorkspace();

    const project = await prisma.project.create({
      data: {
        name: "Test Project",
        workspace_id: workspace.id,
      },
    });

    expect(project.id).toBeDefined();
    expect(project.name).toBe("Test Project");
    expect(project.status).toBe("PLANNING");
    expect(project.currency).toBe("USD");
    expect(project.deleted_at).toBeNull();
  });

  it("should create a project with all optional fields", async () => {
    const workspace = await createWorkspace();

    const project = await prisma.project.create({
      data: {
        name: "Full Project",
        description: "A test project",
        workspace_id: workspace.id,
        status: "ACTIVE",
        start_date: new Date("2026-01-01"),
        end_date: new Date("2026-12-31"),
        total_budget: 50000,
        currency: "EUR",
      },
    });

    expect(project.description).toBe("A test project");
    expect(project.status).toBe("ACTIVE");
    expect(project.total_budget).toEqual(expect.any(Object)); // Decimal
    expect(project.currency).toBe("EUR");
    expect(project.start_date).toBeInstanceOf(Date);
    expect(project.end_date).toBeInstanceOf(Date);
  });

  it("should soft delete a project", async () => {
    const workspace = await createWorkspace();

    const project = await prisma.project.create({
      data: { name: "To Delete", workspace_id: workspace.id },
    });

    const deleted = await prisma.project.update({
      where: { id: project.id },
      data: { deleted_at: new Date() },
    });

    expect(deleted.deleted_at).toBeInstanceOf(Date);

    // Should not appear in active queries
    const active = await prisma.project.findFirst({
      where: { id: project.id, deleted_at: null },
    });
    expect(active).toBeNull();
  });

  it("should update project fields", async () => {
    const workspace = await createWorkspace();

    const project = await prisma.project.create({
      data: { name: "Original", workspace_id: workspace.id },
    });

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: { name: "Updated", status: "ACTIVE" },
    });

    expect(updated.name).toBe("Updated");
    expect(updated.status).toBe("ACTIVE");
  });
});
