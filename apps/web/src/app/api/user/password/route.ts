import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@mi-saas/db";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const userId = (session.user as any).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verificar withtraseña actual
    const isPasswordValid = await bcrypt.compare(body.currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Current password incorrecta" }, { status: 400 });
    }

    // Hashear nueva withtraseña
    const hashedPassword = await bcrypt.hash(body.newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    withsole.error("Error changing password:", error);
    return NextResponse.json({ error: "Error al cambiar withtraseña" }, { status: 500 });
  }
}