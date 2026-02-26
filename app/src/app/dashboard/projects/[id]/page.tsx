import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { ProjectHeader } from "@/components/projects/project-header";
import { BudgetPanel } from "@/components/projects/budget-panel";

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
    module_budget: project.module_budget,
    module_time: project.module_time,
    module_workload: project.module_workload,
  };

  return (
    <div className="space-y-6">
      <ProjectHeader project={projectData} />
      <BudgetPanel
        projectId={project.id}
        totalBudget={project.total_budget ? Number(project.total_budget) : null}
        currency={project.currency}
        moduleBudget={project.module_budget}
      />
      <KanbanBoard projectId={project.id} />
    </div>
  );
}
