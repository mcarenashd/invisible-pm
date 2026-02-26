"use client";

import { useEffect, useState } from "react";
import { Calendar, Check, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Suggestion {
  event_id: string;
  subject: string;
  date: string;
  hours: number;
  organizer: string | null;
}

interface TaskOption {
  id: string;
  title: string;
  project: { id: string; name: string };
}

export function CalendarSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Record<string, string>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch("/api/integrations/calendar/suggestions").then((r) =>
        r.ok ? r.json() : { suggestions: [] }
      ),
      fetch("/api/projects")
        .then((r) => r.json())
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
          return allTasks;
        }),
    ])
      .then(([sugData, taskList]) => {
        setSuggestions(sugData.suggestions || []);
        setTasks(taskList);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAccept(suggestion: Suggestion) {
    const taskId = selectedTasks[suggestion.event_id];
    if (!taskId) {
      toast.error("Selecciona una tarea primero");
      return;
    }

    setAccepting(suggestion.event_id);

    const res = await fetch("/api/integrations/calendar/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task_id: taskId,
        date: suggestion.date,
        hours: suggestion.hours,
        external_event_id: suggestion.event_id,
      }),
    });

    setAccepting(null);

    if (res.ok) {
      setSuggestions((prev) =>
        prev.filter((s) => s.event_id !== suggestion.event_id)
      );
      toast.success("Horas registradas desde calendario");
    } else {
      const data = await res.json();
      toast.error(data.error || "Error al registrar");
    }
  }

  function handleDismiss(eventId: string) {
    setDismissed((prev) => new Set(prev).add(eventId));
  }

  const visibleSuggestions = suggestions.filter(
    (s) => !dismissed.has(s.event_id)
  );

  if (loading) return null;
  if (visibleSuggestions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          <div>
            <CardTitle className="text-lg">
              Sugerencias del calendario
            </CardTitle>
            <CardDescription>
              Eventos recientes de Outlook sin registro de horas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleSuggestions.map((suggestion) => (
          <div
            key={suggestion.event_id}
            className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {suggestion.subject}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(suggestion.date).toLocaleDateString("es-ES", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}{" "}
                — {suggestion.hours}h
                {suggestion.organizer && ` — ${suggestion.organizer}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedTasks[suggestion.event_id] || ""}
                onValueChange={(val) =>
                  setSelectedTasks((prev) => ({
                    ...prev,
                    [suggestion.event_id]: val,
                  }))
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Asignar tarea..." />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.project.name} — {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={() => handleAccept(suggestion)}
                disabled={
                  accepting === suggestion.event_id ||
                  !selectedTasks[suggestion.event_id]
                }
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDismiss(suggestion.event_id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
