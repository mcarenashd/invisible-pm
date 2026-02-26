import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planificación",
  ACTIVE: "Activo",
  ON_HOLD: "En pausa",
  COMPLETED: "Completado",
  ARCHIVED: "Archivado",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, deleted_at: null },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/projects"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Proyectos
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <Badge variant="secondary">
            {STATUS_LABELS[project.status] || project.status}
          </Badge>
        </div>
        {project.description && (
          <p className="mt-1 text-muted-foreground">{project.description}</p>
        )}
      </div>

      <KanbanBoard projectId={project.id} />
    </div>
  );
}
