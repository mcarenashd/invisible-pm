import { prisma } from "@/lib/prisma";
import { ProjectList } from "@/components/projects/project-list";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";

export default async function ProjectsPage() {
  // Get first workspace for the MVP (will be dynamic later with workspace selector)
  const workspace = await prisma.workspace.findFirst({
    where: { deleted_at: null },
    orderBy: { created_at: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proyectos</h1>
          <p className="text-muted-foreground">
            Gestiona los proyectos de tu espacio de trabajo
          </p>
        </div>
        {workspace && <CreateProjectDialog workspaceId={workspace.id} />}
      </div>
      <ProjectList />
    </div>
  );
}
