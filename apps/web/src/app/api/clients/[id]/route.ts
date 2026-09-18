import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@mi-saas/db";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const { name, email, phone, status } = body;

    const client = await prisma.client.update({
      where: { 
        id: params.id,
        userId,
      },
      data: {
        name,
        email,
        phone,
        status,
      },
    });

    return NextResponse.json(client);
  } catch (error: any) {
    console.error("Error updating cliente:", error);
    return NextResponse.json({ error: error.message || "Error updating cliente" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    await prisma.client.delete({
      where: {
        id: params.id,
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting client:", error);
    return NextResponse.json({ error: error.message || "Error deleting client" }, { status: 500 });
  }
}