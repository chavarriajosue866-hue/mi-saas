import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@mi-saas/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invitations = await prisma.invitation.findMany({
    include: {
      inviter: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(invitations);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, role = "member" } = body;

    // Verificar que el email no esté registrado
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: "This email is already registered" 
      }, { status: 400 });
    }

    // Create invitación (expira en 7 días)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        invitedBy: (session.user as any).id,
        expiresAt
      },
      include: {
        inviter: {
          select: { name: true, email: true }
        }
      }
    });

    // TODO: Enviar email with link de aceptación
    // await sendInvitationEmail(invitation);

    return NextResponse.json({ 
      success: true, 
      invitation 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}