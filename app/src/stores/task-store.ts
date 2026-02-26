import { create } from "zustand";

interface TaskAssignee {
  id: string;
  full_name: string;
  email: string;
}

export interface TaskItem {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee_id: string | null;
  assignee: TaskAssignee | null;
  estimated_hours: string | null;
  position: number;
  due_date: string | null;
  parent_task_id: string | null;
  created_at: string;
}

interface TaskStore {
  tasks: TaskItem[];
  loading: boolean;
  error: string | null;

  fetchTasks: (projectId: string) => Promise<void>;
  createTask: (data: {
    project_id: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee_id?: string;
    estimated_hours?: number;
    due_date?: string;
  }) => Promise<TaskItem | null>;
  updateTask: (id: string, data: Partial<TaskItem>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/tasks?project_id=${projectId}`);
      if (!res.ok) throw new Error("Error al cargar tareas");
      const data = await res.json();
      set({ tasks: data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createTask: async (data) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al crear tarea");
      const task = await res.json();
      set({ tasks: [...get().tasks, task] });
      return task;
    } catch (err) {
      set({ error: (err as Error).message });
      return null;
    }
  },

  updateTask: async (id, data) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al actualizar tarea");
      const updated = await res.json();
      set({
        tasks: get().tasks.map((t) => (t.id === id ? updated : t)),
      });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  deleteTask: async (id) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar tarea");
      set({ tasks: get().tasks.filter((t) => t.id !== id) });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
