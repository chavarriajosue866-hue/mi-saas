import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@mi-saas/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice no enwithtrada" }, { status: 404 });
    }

    // Envío del email
    const { data, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>", // Cambia esto cuando verifiques tu dominio en Resend
      to: "cliente@ejemplo.com", // En un caso real, esto vendría de un campo "email" en la factura o cliente
      subject: `Invoice ${invoice.invoiceId} - My SaaS`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Invoice ${invoice.invoiceId}</h2>
          <p>Estimado/a <strong>${invoice.client}</strong>,</p>
          <p>Adjuntamos los detalles de su factura:</p>
          <ul>
            <li><strong>Amount:</strong> $${invoice.amount.toLocaleString()}</li>
            <li><strong>Issue date:</strong> ${invoice.date}</li>
            <li><strong>Due date:</strong> ${invoice.dueDate}</li>
            <li><strong>Status:</strong> ${invoice.status === 'paid' ? 'Paid' : 'Pending'}</li>
          </ul>
          <p style="margin-top: 30px; color: #666;">Gracias por withfiar en nuestros servicios.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Error de Resend:", error);
      return NextResponse.json({ error: "Error al enviar el email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (error) {
    console.error("Error en API de envío:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}