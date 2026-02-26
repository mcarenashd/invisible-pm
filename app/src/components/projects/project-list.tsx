"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useProjectStore } from "@/stores/project-store";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FolderKanban } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planificación",
  ACTIVE: "Activo",
  ON_HOLD: "En pausa",
  COMPLETED: "Completado",
  ARCHIVED: "Archivado",
};

export function ProjectList() {
  const { projects, loading, fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cargando proyectos...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="text-lg font-medium">No hay proyectos</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Crea tu primer proyecto para empezar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/dashboard/projects/${project.id}`}
        >
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{project.name}</CardTitle>
                <Badge
                  variant="secondary"
                  className={STATUS_COLORS[project.status] || ""}
                >
                  {STATUS_LABELS[project.status] || project.status}
                </Badge>
              </div>
              {project.description && (
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {project._count.tasks} tarea{project._count.tasks !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
