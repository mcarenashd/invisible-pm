-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "module_budget" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "module_time" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "module_workload" BOOLEAN NOT NULL DEFAULT false;
