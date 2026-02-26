import { useAuthStore } from "@/stores/auth-store";
import { hasPermission, type RoleName } from "@/lib/permissions";

export function usePermissions() {
  const { role, workspaceId, workspaceName, userId, loaded } = useAuthStore();

  return {
    role,
    workspaceId,
    workspaceName,
    userId,
    loaded,

    can: (permission: string): boolean => {
      if (!role) return false;
      return hasPermission(role, permission);
    },

    isRole: (...roles: RoleName[]): boolean => {
      if (!role) return false;
      return roles.includes(role);
    },

    isManager: role === "Admin" || role === "PM",

    isReadOnly: role === "Cliente",
  };
}
