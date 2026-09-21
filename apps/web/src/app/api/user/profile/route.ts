import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@mi-saas/db";

// GET: Obtener datos del perfil
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        currency: true,
        image: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Actualizar datos del perfil (incluyendo la foto)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, businessName, currency, image } = body;

    console.log("📝 Updating profile with data:", { name, businessName, currency, image });

    // Actualizar solo los campos que vienen en el request
    const updatedUser = await prisma.user.update({
      where: { id: (session.user as any).id },
      data: {
        ...(name !== undefined && { name }),
        ...(businessName !== undefined && { businessName }),
        ...(currency !== undefined && { currency }),
        ...(image !== undefined && { image }),
      },
    });

    console.log("✅ Profile updated successfully:", updatedUser.email);

    return NextResponse.json({ 
      user: updatedUser,
      message: "Profile updated successfully"
    });
  } catch (error: any) {
    console.error(" Error updating profile:", error);
    console.error("Error details:", error.message);
    return NextResponse.json({ 
      error: "Failed to update profile",
      details: error.message 
    }, { status: 500 });
  }
}