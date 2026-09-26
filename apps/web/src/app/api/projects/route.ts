import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@mi-saas/db";

// GET: Listar proyectos del usuario
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.projectMember.findMany({
      where: { userId: (session.user as any).id },
      include: {
        project: {
          include: {
            owner: { select: { name: true, email: true } },
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const projects = memberships.map((m) => ({
      ...m.project,
      userRole: m.role,
      memberCount: m.project._count.members,
    }));

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Crear nuevo proyecto
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    // Generar código único de 6 caracteres
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const project = await prisma.project.create({
      data: {
        name,
        code,
        ownerId: (session.user as any).id,
        members: {
          create: {
            userId: (session.user as any).id,
            role: "admin",
          },
        },
      },
      include: {
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json({
      project: {
        ...project,
        memberCount: project._count.members,
        userRole: "admin",
      },
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}