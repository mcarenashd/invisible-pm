"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface TaskOption {
  id: string;
  title: string;
  project: { id: string; name: string };
}

interface LogTimeDialogProps {
  onCreated?: () => void;
}

export function LogTimeDialog({ onCreated }: LogTimeDialogProps) {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [taskId, setTaskId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [hours, setHours] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      // Fetch all projects, then get tasks
      fetch("/api/projects")
        .then((res) => res.json())
        .then(async (projects) => {
          const allTasks: TaskOption[] = [];
          for (const project of projects) {
            const res = await fetch(`/api/tasks?project_id=${project.id}`);
            const projectTasks = await res.json();
            allTasks.push(
              ...projectTasks.map((t: { id: string; title: string }) => ({
                id: t.id,
                title: t.title,
                project: { id: project.id, name: project.name },
              }))
            );
          }
          setTasks(allTasks);
        })
        .catch(() => {});
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskId || !hours) return;

    setLoading(true);
    const res = await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId, date, hours: Number(hours) }),
    });
    setLoading(false);

    if (res.ok) {
      setTaskId("");
      setHours("");
      setOpen(false);
      onCreated?.();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Registrar horas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar horas</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tarea</label>
            <Select value={taskId} onValueChange={setTaskId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tarea..." />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.project.name} — {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">
                Fecha
              </label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="hours" className="text-sm font-medium">
                Horas
              </label>
              <Input
                id="hours"
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                placeholder="2.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !taskId}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
