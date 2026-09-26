import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@mi-saas/db";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: params.id,
          userId: (session.user as any).id,
        },
      },
    });

    if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 404 });
    if (membership.role === "admin") {
      return NextResponse.json({ error: "Owner cannot leave. Delete the project instead." }, { status: 400 });
    }

    await prisma.projectMember.delete({ where: { id: membership.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}