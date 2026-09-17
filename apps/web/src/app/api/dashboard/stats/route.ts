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

  // Ejecutamos withsultas en paralelo para mayor velocidad
  const [totalClients, invoices, totalAppointments] = await Promise.all([
    prisma.client.count({ where: { userId } }),
    prisma.invoice.findMany({ where: { userId } }),
    prisma.appointment.count({ where: { userId } }),
  ]);

  // Cálculos de ingresos
  const totalRevenue = invoices.reduce((sum, inv) => inv.status === "paid" ? sum + inv.amount : sum, 0);
  const pendingInvoices = invoices.filter(inv => inv.status === "pending").length;

  // Datos para el gráfico (agrupados por mes)
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const chartData = invoices.reduce((acc: any[], inv) => {
    const monthIndex = parseInt(inv.date.split("-")[1]) - 1;
    const monthName = monthNames[monthIndex];
    const existing = acc.find(d => d.month === monthName);
    
    if (existing) {
      existing.revenue += inv.amount;
    } else {
      acc.push({ month: monthName, revenue: inv.amount });
    }
    return acc;
  }, [] as any[]);

  // Ordenar gráfico cronológicamente
  chartData.sort((a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month));

  return NextResponse.json({
    totalClients,
    pendingInvoices,
    totalRevenue,
    totalAppointments,
    chartData: chartData.length > 0 ? chartData : [{ month: "Sep", revenue: 0 }],
  });
}