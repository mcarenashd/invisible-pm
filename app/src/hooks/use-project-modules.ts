export interface ProjectModules {
  module_budget: boolean;
  module_time: boolean;
  module_workload: boolean;
}

export function useProjectModules(project: ProjectModules | null) {
  return {
    hasBudget: project?.module_budget ?? false,
    hasTime: project?.module_time ?? true,
    hasWorkload: project?.module_workload ?? false,
  };
}
