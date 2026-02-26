"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogTimeDialog } from "@/components/tasks/log-time-dialog";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency } from "@/lib/format";

interface TimeEntryItem {
  id: string;
  date: string;
  hours: string;
  source: string;
  cost: number | null;
  rate_snapshot: string | null;
  task: {
    id: string;
    title: string;
    project: { id: string; name: string };
  };
}

export default function TimeEntriesPage() {
  const [entries, setEntries] = useState<TimeEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { can, isManager } = usePermissions();
  const canCreate = can("time-entry:create");
  const canDelete = can("time-entry:delete");

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/time-entries");
    if (res.ok) {
      setEntries(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEntries(entries.filter((e) => e.id !== id));
      toast.success("Registro eliminado");
    } else {
      toast.error("Error al eliminar registro");
    }
  }

  const totalHours = entries.reduce(
    (sum, e) => sum + Number(e.hours),
    0
  );

  const totalCost = entries.reduce(
    (sum, e) => sum + (e.cost ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Registro de Horas</h1>
          <p className="text-muted-foreground">
            {totalHours.toFixed(1)}h registradas en total
            {isManager && totalCost > 0 && (
              <span> — Costo: {formatCurrency(totalCost)}</span>
            )}
          </p>
        </div>
        {canCreate && <LogTimeDialog onCreated={fetchEntries} />}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">No hay registros</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra tus primeras horas de trabajo.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div>
                  <CardTitle className="text-sm font-medium">
                    {entry.task.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {entry.task.project.name} —{" "}
                    {new Date(entry.date).toLocaleDateString("es-ES", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <CardContent className="p-0 text-right">
                    <span className="text-lg font-semibold">
                      {Number(entry.hours).toFixed(1)}h
                    </span>
                    {isManager && entry.cost != null && entry.cost > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(entry.cost)}
                      </p>
                    )}
                  </CardContent>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
