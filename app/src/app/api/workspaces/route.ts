import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/api-utils";

// GET /api/workspaces
export async function GET() {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const workspaces = await prisma.workspace.findMany({
    where: { deleted_at: null },
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json(workspaces);
}
