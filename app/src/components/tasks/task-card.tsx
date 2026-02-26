"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, UserPlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTaskStore, type TaskItem } from "@/stores/task-store";
import { toast } from "sonner";

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

interface UserOption {
  id: string;
  full_name: string;
  email: string;
}

interface TaskCardProps {
  task: TaskItem;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onClick?: () => void;
  readOnly?: boolean;
}

export function TaskCard({ task, onDragStart, onClick, readOnly }: TaskCardProps) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const { updateTask, deleteTask } = useTaskStore();

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then(setUsers)
      .catch(() => {});
  }, []);

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <Card
      className={cn(
        "group relative cursor-pointer p-3 transition-shadow hover:shadow-md",
        !readOnly && "active:cursor-grabbing"
      )}
      draggable={!readOnly}
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onClick}
    >
      {/* Actions menu */}
      {!readOnly && (
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="rounded p-1 hover:bg-muted"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {/* Assign user submenu */}
            {users.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Asignar a
                </div>
                {users.map((user) => (
                  <DropdownMenuItem
                    key={user.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTask(task.id, {
                        assignee_id: user.id,
                      } as Partial<TaskItem>);
                      toast.success(`Asignado a ${user.full_name}`);
                    }}
                  >
                    <UserPlus className="mr-2 h-3.5 w-3.5" />
                    {user.full_name}
                    {task.assignee_id === user.id && (
                      <span className="ml-auto text-xs text-primary">
                        actual
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
                {task.assignee_id && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTask(task.id, {
                        assignee_id: null,
                      } as unknown as Partial<TaskItem>);
                      toast.success("Asignación removida");
                    }}
                  >
                    <UserPlus className="mr-2 h-3.5 w-3.5" />
                    Sin asignar
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                deleteTask(task.id);
                toast.success("Tarea eliminada");
              }}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      )}

      <p className={cn("text-sm font-medium", !readOnly && "pr-6")}>{task.title}</p>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {task.description}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <Badge
          variant="secondary"
          className={cn("text-[10px]", PRIORITY_COLORS[task.priority])}
        >
          {PRIORITY_LABELS[task.priority] || task.priority}
        </Badge>
        {task.assignee && (
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px]">
              {getInitials(task.assignee.full_name)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </Card>
  );
}
