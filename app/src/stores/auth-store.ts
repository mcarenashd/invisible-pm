import { create } from "zustand";
import type { RoleName } from "@/lib/permissions";

interface AuthState {
  role: RoleName | null;
  workspaceId: string | null;
  workspaceName: string | null;
  userId: string | null;
  loaded: boolean;
  loading: boolean;

  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  role: null,
  workspaceId: null,
  workspaceName: null,
  userId: null,
  loaded: false,
  loading: false,

  fetchMe: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/me");
      if (!res.ok) throw new Error("Failed to load user context");
      const data = await res.json();
      set({
        role: data.role,
        workspaceId: data.workspace_id,
        workspaceName: data.workspace_name,
        userId: data.id,
        loaded: true,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },
}));
