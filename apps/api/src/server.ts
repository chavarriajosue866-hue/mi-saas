import 'dotenv/config';
import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { Resend } from 'resend';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

const app = Fastify({ logger: true });

// Middleware de aislamiento multi-tenant
const tenantIsolationMiddleware = async (request: any, reply: any) => {
  const tenantId = request.headers['x-tenant-id'];
  if (!tenantId) {
    return reply.status(400).send({ error: 'Tenant ID is required' });
  }
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return reply.status(404).send({ error: 'Tenant not found' });
  }
  request.tenantId = tenantId;
};

// Función para verificar rutas públicas (incluye Swagger)
const isPublicRoute = (url: string) => {
  const publicPaths = [
    '/health', 
    '/register', 
    '/api/auth', 
    '/uploads', 
    '/auth/',
    '/docs',
    '/documentation'
  ];
  return publicPaths.some(path => url.startsWith(path));
};

// Aplicar middleware solo en rutas protegidas
app.addHook('preHandler', async (request, reply) => {
  if (!isPublicRoute(request.url)) {
    await tenantIsolationMiddleware(request, reply);
  }
});

// Función principal async
async function main() {
  // Registrar plugin para manejar uploads de archivos
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB máximo
    }
  });

  // Registrar plugin para servir archivos estáticos
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  await app.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/',
  });

  // Configurar CORS
  await app.register(cors, {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-user-email'],
  });

  // Configurar Swagger
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'SaaS Multi-tenant API',
        description: 'API documentation for SaaS Dashboard',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            name: 'x-tenant-id',
            in: 'header',
          },
        },
      },
    },
  });

  await app.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: false,
    transformSpecificationClone: true,
  });

  // Health check
  app.get(
    '/health',
    {
      schema: {
        description: 'Health check endpoint',
        tags: ['System'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    }
  );

  // Registro de nuevo tenant + usuario admin
  app.post(
    '/register',
    {
      schema: {
        description: 'Register a new tenant and admin user',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['tenantName', 'email', 'password'],
          properties: {
            tenantName: { type: 'string' },
            email: { type: 'string' },
            password: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              tenantId: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { tenantName, email, password } = request.body as {
        tenantName: string;
        email: string;
        password: string;
      };

      if (!tenantName || !email || !password) {
        return reply.status(400).send({ error: 'Faltan datos requeridos' });
      }

      try {
        const slug = tenantName.toLowerCase().replace(/\s+/g, '-');
        const newTenant = await prisma.tenant.create({
          data: { name: tenantName, slug, plan: 'free' }
        });

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name: email.split('@')[0],
            role: 'admin',
            tenantId: newTenant.id,
          }
        });

        return reply.status(201).send({
          message: 'Registro exitoso',
          tenantId: newTenant.id
        });
      } catch (error: any) {
        if (error.code === 'P2002') {
          return reply.status(409).send({ error: 'El email ya está registrado' });
        }
        return reply.status(500).send({ error: 'Error interno del servidor' });
      }
    }
  );

  // Invitar usuarios (solo admin)
  app.post(
    '/invite',
    {
      schema: {
        description: 'Invite a user to the tenant',
        tags: ['Users'],
        headers: {
          type: 'object',
          required: ['x-tenant-id', 'x-user-email'],
          properties: {
            'x-tenant-id': { type: 'string' },
            'x-user-email': { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['email', 'role'],
          properties: {
            email: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'member'] },
          },
        },
      },
    },
    async (request, reply) => {
      const { tenantId } = request as any;
      const { email, role } = request.body as { email: string; role: string };

      if (!email || !['admin', 'member'].includes(role)) {
        return reply.status(400).send({ error: 'Email y rol válido requeridos' });
      }

      const inviter = await prisma.user.findFirst({
        where: { tenantId, email: (request.headers as any)['x-user-email'] }
      });

      if (!inviter || inviter.role !== 'admin') {
        return reply.status(403).send({ error: 'Solo admins pueden invitar' });
      }

      const existingUser = await prisma.user.findFirst({
        where: { email, tenantId }
      });

      if (existingUser) {
        return reply.status(409).send({ error: 'El usuario ya está en este tenant' });
      }

      const { v4: uuidv4 } = await import('uuid');
      const token = uuidv4();
      const invitation = await prisma.invitation.create({
        data: {
          email,
          role,
          tenantId,
          token,
          invitedBy: inviter.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      return {
        message: 'Invitación creada',
        invitationLink: `http://localhost:3000/accept-invite?token=${token}`
      };
    }
  );

  // Verificar invitación
  app.get('/invitations/:token', async (request, reply) => {
    const { token } = request.params as { token: string };
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { tenant: true }
    });

    if (!invitation) {
      return reply.status(404).send({ error: 'Invitación no encontrada' });
    }

    if (invitation.accepted) {
      return reply.status(400).send({ error: 'Esta invitación ya fue aceptada' });
    }

    if (new Date() > invitation.expiresAt) {
      return reply.status(400).send({ error: 'La invitación ha expirado' });
    }

    return {
      email: invitation.email,
      role: invitation.role,
      tenantName: invitation.tenant.name
    };
  });

  // Aceptar invitación
  app.post('/accept-invitation', async (request, reply) => {
    const { token, email, password } = request.body as {
      token: string;
      email: string;
      password: string;
    };

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { tenant: true }
    });

    if (!invitation || invitation.accepted) {
      return reply.status(400).send({ error: 'Invitación inválida o ya aceptada' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: email.split('@')[0],
        role: invitation.role,
        tenantId: invitation.tenantId,
      }
    });

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { accepted: true }
    });

    return { message: 'Usuario creado exitosamente' };
  });

  // Listar proyectos del tenant
  app.get(
    '/projects',
    {
      schema: {
        description: 'Get all projects for current tenant',
        tags: ['Projects'],
        headers: {
          type: 'object',
          required: ['x-tenant-id'],
          properties: {
            'x-tenant-id': { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    tenantId: { type: 'string' },
                    createdAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request) => {
      const { tenantId } = request as any;
      const projects = await prisma.project.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' }
      });
      return { data: projects };
    }
  );

  // Listar usuarios del tenant
  app.get(
    '/users',
    {
      schema: {
        description: 'Get all users for current tenant',
        tags: ['Users'],
        headers: {
          type: 'object',
          required: ['x-tenant-id'],
          properties: {
            'x-tenant-id': { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    role: { type: 'string' },
                    createdAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request) => {
      const { tenantId } = request as any;
      const users = await prisma.user.findMany({
        where: { tenantId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' }
      });
      return { data: users };
    }
  );

  // Subir archivo genérico
  app.post('/upload', async (request, reply) => {
    const { tenantId } = request as any;
    const file = await request.file();

    if (!file) {
      return reply.status(400).send({ error: 'No se proporcionó ningún archivo' });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return reply.status(400).send({ error: 'Tipo de archivo no permitido' });
    }

    const ext = file.filename.split('.').pop();
    const filename = `${tenantId}-${Date.now()}.${ext}`;
    const filepath = path.join(__dirname, '../uploads', filename);

    const writeStream = fs.createWriteStream(filepath);
    file.file.pipe(writeStream);

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    return {
      message: 'Archivo subido exitosamente',
      filename,
      url: `http://localhost:3001/uploads/${filename}`
    };
  });

  // Subir avatar de usuario
  app.post('/users/avatar', async (request, reply) => {
    const { tenantId } = request as any;
    const file = await request.file();

    if (!file) {
      return reply.status(400).send({ error: 'No se proporcionó ningún archivo' });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return reply.status(400).send({ error: 'Solo se permiten imágenes' });
    }

    const ext = file.filename.split('.').pop();
    const filename = `avatar-${tenantId}-${Date.now()}.${ext}`;
    const filepath = path.join(__dirname, '../uploads', filename);

    const writeStream = fs.createWriteStream(filepath);
    file.file.pipe(writeStream);

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    const avatarUrl = `http://localhost:3001/uploads/${filename}`;

    const userEmail = (request.headers as any)['x-user-email'];
    if (userEmail) {
      await prisma.user.update({
        where: { email: userEmail },
        data: { avatar: avatarUrl }
      });
    }

    return {
      message: 'Avatar actualizado',
      avatar: avatarUrl
    };
  });

  // 1. Solicitar reset de contraseña
  app.post(
    '/auth/forgot-password',
    {
      schema: {
        description: 'Request password reset email',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { email } = request.body as { email: string };

      if (!email) {
        return reply.status(400).send({ error: 'Email requerido' });
      }

      const user = await prisma.user.findUnique({ where: { email } });

      // Siempre responder 200 para no revelar si el email existe (seguridad)
      if (!user) {
        return { message: 'Si el email existe, recibirás un enlace de recuperación' };
      }

      // Generar token seguro
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hora

      await prisma.passwordReset.create({
        data: {
          email,
          token,
          expiresAt,
        }
      });

      // Enviar email
      const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: 'Recuperación de contraseña - SaaS Dashboard',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Recuperación de contraseña</h2>
              <p>Hola ${user.name || 'Usuario'},</p>
              <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                Restablecer contraseña
              </a>
              <p style="color: #6b7280; font-size: 14px;">Este enlace expira en 1 hora.</p>
              <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este cambio, ignora este email.</p>
            </div>
          `
        });
        console.log('✅ Email de recuperación enviado a:', email);
      } catch (error) {
        console.error('❌ Error enviando email:', error);
      }

      // SIEMPRE mostrar el token en consola (para desarrollo)
      console.log('🔑 Token de recuperación:', token);
      console.log(' URL completa:', resetUrl);

      return { message: 'Si el email existe, recibirás un enlace de recuperación' };
    }
  );

  // 2. Verificar token de reset
  app.get('/auth/reset-password/:token', async (request, reply) => {
    const { token } = request.params as { token: string };

    const reset = await prisma.passwordReset.findUnique({ where: { token } });

    if (!reset) {
      return reply.status(400).send({ error: 'Token inválido' });
    }

    if (reset.used) {
      return reply.status(400).send({ error: 'Este token ya fue utilizado' });
    }

    if (new Date() > reset.expiresAt) {
      return reply.status(400).send({ error: 'El token ha expirado' });
    }

    return { valid: true, email: reset.email };
  });

  // 3. Actualizar contraseña con token
  app.post('/auth/reset-password', async (request, reply) => {
    const { token, password } = request.body as { token: string; password: string };

    if (!token || !password) {
      return reply.status(400).send({ error: 'Token y contraseña requeridos' });
    }

    if (password.length < 6) {
      return reply.status(400).send({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const reset = await prisma.passwordReset.findUnique({ where: { token } });

    if (!reset || reset.used) {
      return reply.status(400).send({ error: 'Token inválido o ya utilizado' });
    }

    if (new Date() > reset.expiresAt) {
      return reply.status(400).send({ error: 'El token ha expirado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email: reset.email },
      data: { password: hashedPassword }
    });

    await prisma.passwordReset.update({
      where: { id: reset.id },
      data: { used: true }
    });

    return { message: 'Contraseña actualizada exitosamente' };
  });

  // Iniciar servidor
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 API corriendo en http://localhost:3001');
    console.log('📚 Swagger docs disponibles en http://localhost:3001/docs');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();