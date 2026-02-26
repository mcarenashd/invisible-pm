import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import { getTestPrisma } from "../helpers/db";

const prisma = getTestPrisma();

async function createWorkspaceWithRoles() {
  const workspace = await prisma.workspace.create({
    data: { name: "User Mgmt WS", domain: `mgmt-${randomUUID().slice(0, 8)}.com` },
  });

  // Ensure roles exist
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: { name: "Admin", description: "Administrator" },
  });
  const pmRole = await prisma.role.upsert({
    where: { name: "PM" },
    update: {},
    create: { name: "PM", description: "Project Manager" },
  });
  const consultorRole = await prisma.role.upsert({
    where: { name: "Consultor" },
    update: {},
    create: { name: "Consultor", description: "Consultant" },
  });

  return { workspace, roles: { admin: adminRole, pm: pmRole, consultor: consultorRole } };
}

describe("User Management", () => {
  it("should update user hourly_rate", async () => {
    const user = await prisma.user.create({
      data: {
        email: `mgmt-${randomUUID().slice(0, 8)}@test.com`,
        full_name: "Rate User",
        password_hash: "x",
        hourly_rate: 50,
      },
    });

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { hourly_rate: 75 },
    });

    expect(Number(updated.hourly_rate)).toBe(75);
  });

  it("should assign a role to a workspace user", async () => {
    const { workspace, roles } = await createWorkspaceWithRoles();
    const user = await prisma.user.create({
      data: {
        email: `role-${randomUUID().slice(0, 8)}@test.com`,
        full_name: "Role User",
        password_hash: "x",
      },
    });

    const wsUser = await prisma.workspaceUser.create({
      data: {
        user_id: user.id,
        workspace_id: workspace.id,
        role_id: roles.consultor.id,
      },
      include: { role: true },
    });

    expect(wsUser.role.name).toBe("Consultor");
  });

  it("should change a workspace user role", async () => {
    const { workspace, roles } = await createWorkspaceWithRoles();
    const user = await prisma.user.create({
      data: {
        email: `chgrole-${randomUUID().slice(0, 8)}@test.com`,
        full_name: "Change Role",
        password_hash: "x",
      },
    });

    const wsUser = await prisma.workspaceUser.create({
      data: {
        user_id: user.id,
        workspace_id: workspace.id,
        role_id: roles.consultor.id,
      },
    });

    const updated = await prisma.workspaceUser.update({
      where: { id: wsUser.id },
      data: { role_id: roles.pm.id },
      include: { role: true },
    });

    expect(updated.role.name).toBe("PM");
  });

  it("should list workspace members with roles", async () => {
    const { workspace, roles } = await createWorkspaceWithRoles();

    const user1 = await prisma.user.create({
      data: {
        email: `list1-${randomUUID().slice(0, 8)}@test.com`,
        full_name: "Member One",
        password_hash: "x",
        hourly_rate: 50,
      },
    });
    const user2 = await prisma.user.create({
      data: {
        email: `list2-${randomUUID().slice(0, 8)}@test.com`,
        full_name: "Member Two",
        password_hash: "x",
        hourly_rate: 100,
      },
    });

    await prisma.workspaceUser.createMany({
      data: [
        { user_id: user1.id, workspace_id: workspace.id, role_id: roles.admin.id },
        { user_id: user2.id, workspace_id: workspace.id, role_id: roles.consultor.id },
      ],
    });

    const members = await prisma.workspaceUser.findMany({
      where: { workspace_id: workspace.id, deleted_at: null },
      include: { user: true, role: true },
    });

    expect(members).toHaveLength(2);
    expect(members.map((m) => m.role.name).sort()).toEqual(["Admin", "Consultor"]);
  });

  it("should create an audit log for rate change", async () => {
    const user = await prisma.user.create({
      data: {
        email: `audit-${randomUUID().slice(0, 8)}@test.com`,
        full_name: "Audit User",
        password_hash: "x",
        hourly_rate: 40,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { hourly_rate: 60 },
    });

    const log = await prisma.auditLog.create({
      data: {
        user_id: user.id,
        entity_type: "User",
        entity_id: user.id,
        action: "UPDATE",
        changes: { hourly_rate: { from: 40, to: 60 } },
      },
    });

    expect(log.entity_type).toBe("User");
    expect(log.action).toBe("UPDATE");
  });
});
