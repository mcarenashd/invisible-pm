import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ROLES = [
  {
    name: "Admin",
    description:
      "Administrador del workspace. Acceso total a configuración, usuarios y todos los módulos.",
  },
  {
    name: "PM",
    description:
      "Project Manager. Gestiona proyectos, asigna tareas, ve presupuestos y reportes.",
  },
  {
    name: "Consultor",
    description:
      "Miembro del equipo. Ve sus tareas asignadas, registra horas y actualiza progreso.",
  },
  {
    name: "Cliente",
    description:
      "Vista de solo lectura. Acceso limitado al estado general del proyecto y entregables.",
  },
];

async function main() {
  console.log("Seeding roles...");

  for (const role of ROLES) {
    const existing = await prisma.role.findUnique({
      where: { name: role.name },
    });

    if (!existing) {
      await prisma.role.create({ data: role });
      console.log(`  Created role: ${role.name}`);
    } else {
      console.log(`  Role already exists: ${role.name}`);
    }
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
