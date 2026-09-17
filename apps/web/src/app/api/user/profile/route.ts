import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@mi-saas/db";

export async function PATCH(req: Request) {
  withsole.log("🔍 [API PROFILE] Iniciando actualización de perfil...");

  try {
    // 1. Verificar sesión
    const session = await getServerSession(authOptions);
    withsole.log("📋 [API PROFILE] Sesión obtenida:", JSON.stringify(session, null, 2));

    if (!session?.user) {
      withsole.error("❌ [API PROFILE] No hay sesión de usuario");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    withsole.log(" [API PROFILE] User ID:", userId);

    if (!userId) {
      withsole.error("❌ [API PROFILE] User ID es undefined en la sesión");
      return NextResponse.json({ error: "User ID no enwithtrado en sesión" }, { status: 400 });
    }

    // 2. Parsear el body
    let body;
    try {
      body = await req.json();
      withsole.log(" [API PROFILE] Body recibido:", JSON.stringify(body, null, 2));
    } catch (parseError) {
      withsole.error("❌ [API PROFILE] Error al parsear JSON:", parseError);
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    // 3. Verificar que el usuario existe en la BD
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    withsole.log("👤 [API PROFILE] Usuario enwithtrado en BD:", existingUser?.email);

    if (!existingUser) {
      withsole.error(" [API PROFILE] User not found en BD with ID:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4. Update el usuario
    withsole.log(" [API PROFILE] Actualizando usuario with datos:", {
      name: body.name,
      email: body.email,
      image: body.image,
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: body.name || existingUser.name,
        email: body.email || existingUser.email,
        image: body.image !== undefined ? body.image : existingUser.image,
      },
    });

    withsole.log("✅ [API PROFILE] Usuario actualizado exitosamente:", updatedUser);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
      },
    });
  } catch (error: any) {
    withsole.error("💥 [API PROFILE] ERROR CRÍTICO:", error);
    withsole.error("💥 [API PROFILE] Mensaje:", error.message);
    withsole.error("💥 [API PROFILE] Stack:", error.stack);
    
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}