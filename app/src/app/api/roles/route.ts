import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/api-utils";

export async function GET() {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const roles = await prisma.role.findMany({
    where: { deleted_at: null },
    select: { id: true, name: true, description: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(roles);
}
