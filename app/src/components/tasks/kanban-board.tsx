"use client";

import { useEffect, useState } from "react";
import { useTaskStore, type TaskItem } from "@/stores/task-store";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { cn } from "@/lib/utils";

const COLUMNS = [
  { key: "BACKLOG", label: "Backlog", color: "border-t-gray-400" },
  { key: "TODO", label: "Por hacer", color: "border-t-blue-400" },
  { key: "IN_PROGRESS", label: "En progreso", color: "border-t-yellow-400" },
  { key: "IN_REVIEW", label: "En revisión", color: "border-t-purple-400" },
  { key: "DONE", label: "Hecho", color: "border-t-green-400" },
];

interface KanbanBoardProps {
  projectId: string;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { tasks, loading, fetchTasks, updateTask } = useTaskStore();
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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
                <TaskCard
                  key={task.id}
                  task={task}
                  onDragStart={handleDragStart}
                  onClick={() => {
                    setSelectedTask(task);
                    setSheetOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
      <TaskDetailSheet
        task={selectedTask}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
