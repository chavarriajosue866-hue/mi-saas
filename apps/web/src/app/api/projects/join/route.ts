import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@mi-saas/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        _count: { select: { members: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Invalid project code" }, { status: 404 });
    }

    // Verificar si ya es miembro
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: (session.user as any).id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: "You are already a member of this project" }, { status: 400 });
    }

    // Agregar como miembro
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: (session.user as any).id,
        role: "member",
      },
    });

    return NextResponse.json({
      message: "Successfully joined project",
      project: {
        ...project,
        memberCount: project._count.members + 1,
        userRole: "member",
      },
    });
  } catch (error) {
    console.error("Error joining project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}