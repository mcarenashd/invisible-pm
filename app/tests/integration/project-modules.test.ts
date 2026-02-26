import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import { getTestPrisma } from "../helpers/db";

const prisma = getTestPrisma();

async function createWorkspace() {
  return prisma.workspace.create({
    data: { name: "Test Workspace", domain: `test-${randomUUID().slice(0, 8)}.com` },
  });
}

describe("Project Modules - Toggle fields", () => {
  it("should have correct default module values", async () => {
    const workspace = await createWorkspace();

    const project = await prisma.project.create({
      data: { name: "Module Defaults", workspace_id: workspace.id },
    });

    expect(project.module_budget).toBe(false);
    expect(project.module_time).toBe(true);
    expect(project.module_workload).toBe(false);
  });

  it("should create a project with custom module toggles", async () => {
    const workspace = await createWorkspace();

    const project = await prisma.project.create({
      data: {
        name: "Custom Modules",
        workspace_id: workspace.id,
        module_budget: true,
        module_time: false,
        module_workload: true,
      },
    });

    expect(project.module_budget).toBe(true);
    expect(project.module_time).toBe(false);
    expect(project.module_workload).toBe(true);
  });

  it("should update module toggles independently", async () => {
    const workspace = await createWorkspace();

    const project = await prisma.project.create({
      data: { name: "Toggle Test", workspace_id: workspace.id },
    });

    // Enable budget
    const updated1 = await prisma.project.update({
      where: { id: project.id },
      data: { module_budget: true },
    });
    expect(updated1.module_budget).toBe(true);
    expect(updated1.module_time).toBe(true); // unchanged
    expect(updated1.module_workload).toBe(false); // unchanged

    // Disable time, enable workload
    const updated2 = await prisma.project.update({
      where: { id: project.id },
      data: { module_time: false, module_workload: true },
    });
    expect(updated2.module_budget).toBe(true); // unchanged
    expect(updated2.module_time).toBe(false);
    expect(updated2.module_workload).toBe(true);
  });
});
