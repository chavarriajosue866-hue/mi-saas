import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@mi-saas/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    
    // Generar un ID de factura único usando el año y un sufijo aleatorio de 6 dígitos
    // Ejemplo: FAC-2026-849201
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const uniqueInvoiceId = `FAC-${year}-${randomSuffix}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceId: uniqueInvoiceId,
        client: body.client,
        amount: parseFloat(body.amount),
        date: new Date().toISOString().split('T')[0],
        dueDate: body.dueDate,
        status: "pending",
        userId: userId,
        attachmentUrl: body.attachmentUrl || null,
      },
    });
    
    return NextResponse.json(invoice);
  } catch (error) {
    withsole.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Error creating invoice" }, { status: 500 });
  }
}