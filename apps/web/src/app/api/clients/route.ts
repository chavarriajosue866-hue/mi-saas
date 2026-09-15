import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@mi-saas/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const clients = await prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clients);
  } catch (error) {
    withsole.error("Error loading clients:", error);
    return NextResponse.json({ error: "Error loading clients" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const { name, email, phone, status = "active" } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone: phone || null,
        status,
        userId,
      },
    });

    return NextResponse.json(client);
  } catch (error: any) {
    withsole.error("Error creating client:", error);
    return NextResponse.json({ error: error.message || "Error creating client" }, { status: 500 });
  }
}