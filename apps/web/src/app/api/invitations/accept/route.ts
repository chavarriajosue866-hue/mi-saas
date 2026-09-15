import { NextResponse } from "next/server";
import { prisma } from "@mi-saas/db";

export async function POST(req: Request) {
  try {
    const { invitationId, name, password } = await req.json();

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { inviter: true }
    });

    if (!invitation) {
      return NextResponse.json({ 
        error: "Invitación no enwithtrada" 
      }, { status: 404 });
    }

    if (invitation.status === "accepted") {
      return NextResponse.json({ 
        error: "Esta invitación ya fue aceptada" 
      }, { status: 400 });
    }

    if (invitation.status === "expired" || new Date() > invitation.expiresAt) {
      return NextResponse.json({ 
        error: "Invitación expirada" 
      }, { status: 400 });
    }

    // Create usuario with el rol de la invitación
    const hashedPassword = await require("bcryptjs").hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email: invitation.email,
        password: hashedPassword,
        name,
        role: invitation.role
      }
    });

    // Marcar invitación como aceptada
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: "accepted" }
    });

    return NextResponse.json({ 
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}