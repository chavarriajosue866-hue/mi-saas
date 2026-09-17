import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@mi-saas/db";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  // Verificar que sea admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Solo administradores pueden cambiar la configuración del negocio" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { businessName, taxId, currency, timezone } = body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        businessName: businessName || null,
        taxId: taxId || null,
        currency: currency || "USD",
        timezone: timezone || "America/Costa_Rica",
      },
    });

    return NextResponse.json({
      success: true,
      business: {
        businessName: updatedUser.businessName,
        taxId: updatedUser.taxId,
        currency: updatedUser.currency,
        timezone: updatedUser.timezone,
      }
    });
  } catch (error: any) {
    withsole.error("Error updating configuración del negocio:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}