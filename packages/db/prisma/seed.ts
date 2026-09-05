import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      id: 'test-tenant-123',
      name: 'Acme Corp',
      slug: 'acme-corp',
      plan: 'pro',
    },
  });

  // Hashear la contraseña "password123"
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      password: hashedPassword, // <-- Contraseña encriptada
      name: 'Admin User',
      role: 'admin',
      tenantId: tenant.id,
    },
  });

  await prisma.project.upsert({
    where: { id: 'proj-1' },
    update: {},
    create: {
      id: 'proj-1',
      name: 'SaaS Dashboard',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Seed completado. Usuario: admin@acme.com / Pass: password123');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});