import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/api-utils";

// PATCH /api/me/password — Change own password
export async function PATCH(request: Request) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const userId = session!.user.id;
  const { current_password, new_password } = await request.json();

  if (!current_password || !new_password) {
    return NextResponse.json(
      { error: "current_password y new_password son requeridos" },
      { status: 400 }
    );
  }

  if (new_password.length < 8) {
    return NextResponse.json(
      { error: "La nueva contraseña debe tener al menos 8 caracteres" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password_hash: true },
  });

  if (!user?.password_hash) {
    return NextResponse.json(
      { error: "Usuario sin contraseña configurada" },
      { status: 400 }
    );
  }

  const isValid = await bcrypt.compare(current_password, user.password_hash);
  if (!isValid) {
    return NextResponse.json(
      { error: "La contraseña actual es incorrecta" },
      { status: 401 }
    );
  }

  const password_hash = await bcrypt.hash(new_password, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password_hash },
  });

  await prisma.auditLog.create({
    data: {
      user_id: userId,
      entity_type: "User",
      entity_id: userId,
      action: "UPDATE",
      changes: { password: "changed" },
    },
  });

  return NextResponse.json({ message: "Contraseña actualizada correctamente" });
}
