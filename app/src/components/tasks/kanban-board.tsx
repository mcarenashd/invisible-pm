"use client";

import { useEffect } from "react";
import { useTaskStore, type TaskItem } from "@/stores/task-store";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const COLUMNS = [
  { key: "BACKLOG", label: "Backlog", color: "border-t-gray-400" },
  { key: "TODO", label: "Por hacer", color: "border-t-blue-400" },
  { key: "IN_PROGRESS", label: "En progreso", color: "border-t-yellow-400" },
  { key: "IN_REVIEW", label: "En revisión", color: "border-t-purple-400" },
  { key: "DONE", label: "Hecho", color: "border-t-green-400" },
];

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

interface KanbanBoardProps {
  projectId: string;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { tasks, loading, fetchTasks, updateTask } = useTaskStore();

  useEffect(() => {
    fetchTasks(projectId);
  }, [projectId, fetchTasks]);

  function handleDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.setData("taskId", taskId);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function handleDrop(e: React.DragEvent, newStatus: string) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      await updateTask(taskId, { status: newStatus } as Partial<TaskItem>);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cargando tareas...</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.key);

        return (
          <div
            key={column.key}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-lg border border-t-4 bg-muted/30",
              column.color
            )}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.key)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium">{column.label}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {columnTasks.length}
                </span>
              </div>
              <CreateTaskDialog
                projectId={projectId}
                defaultStatus={column.key}
              />
            </div>

            {/* Cards */}
            <div className="flex flex-1 flex-col gap-2 p-2">
              {columnTasks.map((task) => (
                <Card
                  key={task.id}
                  className="cursor-grab p-3 active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                >
                  <p className="text-sm font-medium">{task.title}</p>
                  {task.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px]",
                        PRIORITY_COLORS[task.priority]
                      )}
                    >
                      {PRIORITY_LABELS[task.priority] || task.priority}
                    </Badge>
                    {task.assignee && (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {task.assignee.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
