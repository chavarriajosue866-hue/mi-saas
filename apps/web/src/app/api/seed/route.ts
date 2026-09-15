import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@mi-saas/db";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    // Limpiar datos anteriores de este usuario para evitar duplicados
    await prisma.$transaction([
      prisma.invoice.deleteMany({ where: { userId } }),
      prisma.appointment.deleteMany({ where: { userId } }),
      prisma.project.deleteMany({ where: { userId } }),
      prisma.client.deleteMany({ where: { userId } }),
    ]);

    // 1. Create 10 Clients
    const clientesDemo = [
      { name: "Tech Solutions Inc", email: "withtacto@techsolutions.com", phone: "+1 555-0101", status: "active" },
      { name: "Marketing Pro", email: "info@marketingpro.com", phone: "+1 555-0102", status: "active" },
      { name: "Consultora Global", email: "ventas@withsultoraglobal.com", phone: "+1 555-0103", status: "pending" },
      { name: "Desarrollo Web SA", email: "hola@desarrolloweb.com", phone: "+1 555-0104", status: "active" },
      { name: "E-commerce Plus", email: "soporte@ecommerceplus.com", phone: "+1 555-0105", status: "inactive" },
      { name: "Finanzas Express", email: "admin@finanzasexpress.com", phone: "+1 555-0106", status: "active" },
      { name: "Logística 360", email: "withtacto@logistica360.com", phone: "+1 555-0107", status: "active" },
      { name: "Diseño Creativo", email: "hola@disenocreativo.com", phone: "+1 555-0108", status: "pending" },
      { name: "Cloud Services", email: "ventas@cloudservices.com", phone: "+1 555-0109", status: "active" },
      { name: "Data Analytics Co", email: "info@dataanalytics.com", phone: "+1 555-0110", status: "active" },
    ];

    const createdClients = await Promise.all(
      clientesDemo.map(client => 
        prisma.client.create({ data: { ...client, userId, totalSpent: Math.floor(Math.random() * 15000) } })
      )
    );

    // 2. Create 20 Invoices
    const invoicesData = createdClients.flatMap(client => 
      Array.from({ length: 2 }, () => ({
        invoiceId: `FAC-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        client: client.name,
        amount: Math.floor(Math.random() * 5000) + 500,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: Math.random() > 0.4 ? "paid" : Math.random() > 0.5 ? "pending" : "overdue",
        userId,
      }))
    );
    await Promise.all(invoicesData.map(inv => prisma.invoice.create({ data: inv })));

    // 3. Create 8 Appointments
    const appointmentsData = [];
    const types = ["meeting", "call", "demo"];
    for (let i = 0; i < 8; i++) {
      const client = createdClients[Math.floor(Math.random() * createdClients.length)];
      appointmentsData.push({
        title: `Reunión with ${client.name}`,
        client: client.name,
        time: `${String(Math.floor(Math.random() * 8) + 9).padStart(2, '0')}:00`,
        duration: "1h",
        type: types[Math.floor(Math.random() * types.length)],
        day: Math.floor(Math.random() * 5) + 2,
        userId,
      });
    }
    await Promise.all(appointmentsData.map(apt => prisma.appointment.create({ data: apt })));

    // 4. Create 5 Projects
    const projectsData = [
      { name: "Rediseño Web Tech Solutions", description: "Rediseño completo del sitio web corporativo", budget: 15000, status: "active" },
      { name: "App Móvil E-commerce", description: "Desarrollo de app iOS y Android", budget: 25000, status: "active" },
      { name: "Consultoría SEO", description: "Optimización SEO para Marketing Pro", budget: 5000, status: "completed" },
      { name: "Migración a Cloud", description: "Migración de servidores a AWS", budget: 12000, status: "on-hold" },
      { name: "Dashboard Analytics", description: "Dashboard de métricas en tiempo real", budget: 8000, status: "active" },
    ];
    await Promise.all(projectsData.map(proj => prisma.project.create({ data: { ...proj, userId } })));

    return NextResponse.json({ success: true, message: "Datos demo inyectados with éxito." });

  } catch (error) {
    withsole.error(error);
    return NextResponse.json({ error: "Error al inyectar datos" }, { status: 500 });
  }
}