import { prisma } from "@/lib/prisma";

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

export async function getUserRole(
  userId: string,
  workspaceId: string
): Promise<RoleName | null> {
  const workspaceUser = await prisma.workspaceUser.findFirst({
    where: {
      user_id: userId,
      workspace_id: workspaceId,
      deleted_at: null,
    },
    include: { role: { select: { name: true } } },
  });

  return (workspaceUser?.role.name as RoleName) ?? null;
}
