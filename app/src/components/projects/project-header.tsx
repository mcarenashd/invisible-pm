"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planificación",
  ACTIVE: "Activo",
  ON_HOLD: "En pausa",
  COMPLETED: "Completado",
  ARCHIVED: "Archivado",
};

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-gray-100 text-gray-700",
  ACTIVE: "bg-green-100 text-green-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  ARCHIVED: "bg-red-100 text-red-700",
};

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  total_budget: string | null;
  currency: string;
}

interface ProjectHeaderProps {
  project: ProjectData;
}

export function ProjectHeader({ project: initial }: ProjectHeaderProps) {
  const router = useRouter();
  const [project, setProject] = useState(initial);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [status, setStatus] = useState(project.status);
  const [startDate, setStartDate] = useState(
    project.start_date ? project.start_date.split("T")[0] : ""
  );
  const [endDate, setEndDate] = useState(
    project.end_date ? project.end_date.split("T")[0] : ""
  );
  const [totalBudget, setTotalBudget] = useState(
    project.total_budget ? String(project.total_budget) : ""
  );
  const [currency, setCurrency] = useState(project.currency);

  function resetForm() {
    setName(project.name);
    setDescription(project.description || "");
    setStatus(project.status);
    setStartDate(project.start_date ? project.start_date.split("T")[0] : "");
    setEndDate(project.end_date ? project.end_date.split("T")[0] : "");
    setTotalBudget(project.total_budget ? String(project.total_budget) : "");
    setCurrency(project.currency);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);

    const body = {
      name: name.trim(),
      description: description.trim() || null,
      status,
      start_date: startDate || null,
      end_date: endDate || null,
      total_budget: totalBudget ? Number(totalBudget) : null,
      currency,
    };

    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (res.ok) {
      const updated = await res.json();
      setProject({
        ...project,
        ...updated,
        start_date: updated.start_date,
        end_date: updated.end_date,
      });
      toast.success("Proyecto actualizado");
      setEditOpen(false);
    } else {
      toast.error("Error al actualizar el proyecto");
    }
  }

  async function handleDelete() {
    if (!confirm("¿Estás seguro de que quieres eliminar este proyecto?")) {
      return;
    }

    const res = await fetch(`/api/projects/${project.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Proyecto eliminado");
      router.push("/dashboard/projects");
    } else {
      const data = await res.json();
      toast.error(data.error || "Error al eliminar el proyecto");
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div>
      <Link
        href="/dashboard/projects"
        className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Proyectos
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge
              variant="secondary"
              className={STATUS_COLORS[project.status] || ""}
            >
              {STATUS_LABELS[project.status] || project.status}
            </Badge>
          </div>
          {project.description && (
            <p className="mt-1 text-muted-foreground">{project.description}</p>
          )}

          {/* Metadata row */}
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {(project.start_date || project.end_date) && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(project.start_date) || "—"} →{" "}
                {formatDate(project.end_date) || "—"}
              </span>
            )}
            {project.total_budget && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {Number(project.total_budget).toLocaleString("es-ES")}{" "}
                {project.currency}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog
            open={editOpen}
            onOpenChange={(open) => {
              setEditOpen(open);
              if (open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Editar proyecto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="proj-name">Nombre</Label>
                  <Input
                    id="proj-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proj-desc">Descripción</Label>
                  <Textarea
                    id="proj-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PLANNING">Planificación</SelectItem>
                        <SelectItem value="ACTIVE">Activo</SelectItem>
                        <SelectItem value="ON_HOLD">En pausa</SelectItem>
                        <SelectItem value="COMPLETED">Completado</SelectItem>
                        <SelectItem value="ARCHIVED">Archivado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Moneda</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="MXN">MXN</SelectItem>
                        <SelectItem value="COP">COP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proj-start">Fecha inicio</Label>
                    <Input
                      id="proj-start"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proj-end">Fecha fin</Label>
                    <Input
                      id="proj-end"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proj-budget">Presupuesto total</Label>
                  <Input
                    id="proj-budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !name.trim()}
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}
