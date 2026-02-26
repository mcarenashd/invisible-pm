"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTaskStore, type TaskItem } from "@/stores/task-store";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: "Backlog",
  TODO: "Por hacer",
  IN_PROGRESS: "En progreso",
  IN_REVIEW: "En revisión",
  DONE: "Hecho",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

interface UserOption {
  id: string;
  full_name: string;
  email: string;
}

interface TaskDetailSheetProps {
  task: TaskItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
}: TaskDetailSheetProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("BACKLOG");
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [saving, setSaving] = useState(false);

  const { updateTask } = useTaskStore();
  const { isReadOnly, isRole, userId } = usePermissions();

  // Consultor can only edit own tasks
  const isConsultor = isRole("Consultor");
  const isOwnTask = task?.assignee_id === userId;
  const canEdit = !isReadOnly && (!isConsultor || isOwnTask);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeId(task.assignee_id || "unassigned");
      setEstimatedHours(task.estimated_hours ? String(task.estimated_hours) : "");
      setDueDate(task.due_date ? task.due_date.split("T")[0] : "");
    }
  }, [task]);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then(setUsers)
      .catch(() => {});
  }, []);

  async function handleSave() {
    if (!task || !title.trim()) return;

    setSaving(true);
    try {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        assignee_id: assigneeId === "unassigned" ? null : assigneeId,
        estimated_hours: estimatedHours ? Number(estimatedHours) : null,
        due_date: dueDate || null,
      } as unknown as Partial<TaskItem>);
      toast.success("Tarea actualizada");
      onOpenChange(false);
    } catch {
      toast.error("Error al actualizar la tarea");
    } finally {
      setSaving(false);
    }
  }

  if (!task) return null;

  // Read-only view for Cliente or Consultor viewing other's tasks
  if (!canEdit) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalle de tarea</SheetTitle>
            <SheetDescription>
              Creada el{" "}
              {new Date(task.created_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Título</Label>
              <p className="text-sm font-medium">{task.title}</p>
            </div>

            {task.description && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Descripción</Label>
                <p className="text-sm">{task.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Estado</Label>
                <p className="text-sm">{STATUS_LABELS[task.status] || task.status}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Prioridad</Label>
                <Badge variant="secondary" className="text-xs">
                  {PRIORITY_LABELS[task.priority] || task.priority}
                </Badge>
              </div>
            </div>

            {task.assignee && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Asignado a</Label>
                <p className="text-sm">{task.assignee.full_name}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {task.estimated_hours && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Horas estimadas</Label>
                  <p className="text-sm">{task.estimated_hours}h</p>
                </div>
              )}
              {task.due_date && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Fecha límite</Label>
                  <p className="text-sm">
                    {new Date(task.due_date).toLocaleDateString("es-ES")}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Detalle de tarea</SheetTitle>
          <SheetDescription>
            Creada el{" "}
            {new Date(task.created_at).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">Título</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="task-desc">Descripción</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Descripción de la tarea..."
            />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BACKLOG">Backlog</SelectItem>
                  <SelectItem value="TODO">Por hacer</SelectItem>
                  <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
                  <SelectItem value="IN_REVIEW">En revisión</SelectItem>
                  <SelectItem value="DONE">Hecho</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baja</SelectItem>
                  <SelectItem value="MEDIUM">Media</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label>Asignado a</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger>
                <SelectValue placeholder="Sin asignar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estimated hours + Due date row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-hours">Horas estimadas</Label>
              <Input
                id="task-hours"
                type="number"
                min="0"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Fecha límite</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !title.trim()}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
