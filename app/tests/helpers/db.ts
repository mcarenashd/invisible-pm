import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { execSync } from "child_process";

const TEST_DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://mcarenas136@localhost:5432/invisible_pm_test?schema=public";

let pool: Pool;
let prisma: PrismaClient;

export function getTestPrisma(): PrismaClient {
  if (!prisma) {
    pool = new Pool({ connectionString: TEST_DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

export async function resetDatabase(): Promise<void> {
  const client = getTestPrisma();

  // Delete in order respecting foreign keys
  await client.auditLog.deleteMany();
  await client.timeEntry.deleteMany();
  await client.taskRelation.deleteMany();
  await client.task.deleteMany();
  await client.project.deleteMany();
  await client.workspaceUser.deleteMany();
  await client.workspace.deleteMany();
  await client.user.deleteMany();
  await client.role.deleteMany();
}

export async function disconnectTestDb(): Promise<void> {
  if (pool) {
    await pool.end();
  }
}

export function applyMigrations(): void {
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    cwd: process.cwd(),
    stdio: "pipe",
  });
}
