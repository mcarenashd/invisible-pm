import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { ProjectHeader } from "@/components/projects/project-header";

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

  // Serialize for client component
  const projectData = {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    start_date: project.start_date?.toISOString() ?? null,
    end_date: project.end_date?.toISOString() ?? null,
    total_budget: project.total_budget ? String(project.total_budget) : null,
    currency: project.currency,
  };

  return (
    <div className="space-y-6">
      <ProjectHeader project={projectData} />
      <KanbanBoard projectId={project.id} />
    </div>
  );
}
