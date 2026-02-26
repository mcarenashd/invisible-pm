export type RoleName = "Admin" | "PM" | "Consultor" | "Cliente";

// Define what each role can do
const PERMISSIONS: Record<RoleName, string[]> = {
  Admin: [
    "project:create",
    "project:read",
    "project:update",
    "project:delete",
    "task:create",
    "task:read",
    "task:update",
    "task:delete",
    "task:assign",
    "time-entry:create",
    "time-entry:read",
    "time-entry:read-all",
    "time-entry:delete",
    "user:read",
    "user:manage",
    "workspace:manage",
    "budget:read",
  ],
  PM: [
    "project:create",
    "project:read",
    "project:update",
    "task:create",
    "task:read",
    "task:update",
    "task:delete",
    "task:assign",
    "time-entry:create",
    "time-entry:read",
    "time-entry:read-all",
    "time-entry:delete",
    "user:read",
    "budget:read",
  ],
  Consultor: [
    "project:read",
    "task:read",
    "task:update", // own tasks only
    "time-entry:create",
    "time-entry:read",
    "time-entry:delete", // own entries only
    "user:read",
  ],
  Cliente: [
    "project:read",
    "task:read",
  ],
};

export function hasPermission(role: RoleName, permission: string): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}
