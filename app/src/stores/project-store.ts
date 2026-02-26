import { create } from "zustand";

interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  total_budget: string | null;
  currency: string;
  workspace_id: string;
  created_at: string;
  _count: { tasks: number };
  _tasksByStatus: Record<string, number>;
}

interface ProjectStore {
  projects: ProjectSummary[];
  loading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  createProject: (data: {
    name: string;
    description?: string;
    workspace_id: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    total_budget?: number;
  }) => Promise<ProjectSummary | null>;
  updateProject: (
    id: string,
    data: Partial<ProjectSummary>
  ) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Error al cargar proyectos");
      const data = await res.json();
      set({ projects: data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createProject: async (data) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al crear proyecto");
      const project = await res.json();
      await get().fetchProjects();
      return project;
    } catch (err) {
      set({ error: (err as Error).message });
      return null;
    }
  },

  updateProject: async (id, data) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al actualizar proyecto");
      await get().fetchProjects();
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  deleteProject: async (id) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar proyecto");
      set({ projects: get().projects.filter((p) => p.id !== id) });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
