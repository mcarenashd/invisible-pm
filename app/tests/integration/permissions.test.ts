import { describe, it, expect } from "vitest";
import { hasPermission, type RoleName } from "@/lib/permissions";

describe("Permissions - RBAC", () => {
  it("Admin should have all permissions", () => {
    expect(hasPermission("Admin", "project:create")).toBe(true);
    expect(hasPermission("Admin", "project:delete")).toBe(true);
    expect(hasPermission("Admin", "task:create")).toBe(true);
    expect(hasPermission("Admin", "task:update")).toBe(true);
    expect(hasPermission("Admin", "time-entry:create")).toBe(true);
    expect(hasPermission("Admin", "user:manage")).toBe(true);
    expect(hasPermission("Admin", "workspace:manage")).toBe(true);
  });

  it("PM should manage projects and tasks", () => {
    expect(hasPermission("PM", "project:create")).toBe(true);
    expect(hasPermission("PM", "project:update")).toBe(true);
    expect(hasPermission("PM", "task:create")).toBe(true);
    expect(hasPermission("PM", "task:update")).toBe(true);
    expect(hasPermission("PM", "task:delete")).toBe(true);
    expect(hasPermission("PM", "time-entry:create")).toBe(true);
  });

  it("PM should NOT delete projects or manage users", () => {
    expect(hasPermission("PM", "project:delete")).toBe(false);
    expect(hasPermission("PM", "user:manage")).toBe(false);
    expect(hasPermission("PM", "workspace:manage")).toBe(false);
  });

  it("Consultor should log time and update tasks", () => {
    expect(hasPermission("Consultor", "task:read")).toBe(true);
    expect(hasPermission("Consultor", "task:update")).toBe(true);
    expect(hasPermission("Consultor", "time-entry:create")).toBe(true);
    expect(hasPermission("Consultor", "time-entry:read")).toBe(true);
  });

  it("Consultor should NOT create/delete projects or create tasks", () => {
    expect(hasPermission("Consultor", "project:create")).toBe(false);
    expect(hasPermission("Consultor", "project:delete")).toBe(false);
    expect(hasPermission("Consultor", "task:create")).toBe(false);
    expect(hasPermission("Consultor", "task:delete")).toBe(false);
  });

  it("Cliente should only have read access", () => {
    expect(hasPermission("Cliente", "project:read")).toBe(true);
    expect(hasPermission("Cliente", "task:read")).toBe(true);
    expect(hasPermission("Cliente", "project:create")).toBe(false);
    expect(hasPermission("Cliente", "task:create")).toBe(false);
    expect(hasPermission("Cliente", "time-entry:create")).toBe(false);
    expect(hasPermission("Cliente", "user:manage")).toBe(false);
  });

  it("Unknown role should have no permissions", () => {
    expect(hasPermission("Unknown" as RoleName, "project:create")).toBe(false);
    expect(hasPermission("Unknown" as RoleName, "task:create")).toBe(false);
  });
});
