import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@mi-saas/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appointments = await prisma.appointment.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(appointments);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const appointment = await prisma.appointment.create({
      data: {
        title: body.title,
        client: body.client,
        time: body.time,
        duration: body.duration || "1h",
        type: body.type || "meeting",
        day: body.day,
        userId: (session.user as any).id,
      },
    });
    return NextResponse.json(appointment);
  } catch (error) {
    return NextResponse.json({ error: "Error al crear cita" }, { status: 500 });
  }
}