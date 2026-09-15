import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import path from 'path';
import fs from 'fs';
import { tenantIsolationMiddleware } from './middleware/tenant';
import rateLimit from '@fastify/rate-limit';
import billingRoutes from './routes/billing';

// Import routes
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import userRoutes from './routes/users';
import aiRoutes from './routes/ai';
import invoiceRoutes from './routes/invoices';
import whatsappRoutes from './routes/whatsapp';

const app = Fastify({ 
  logger: true,
});

const publicRoutes = [
  '/register',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/docs',
  '/uploads',
  '/health',
  '/index.html',
  '/static',
  '/favicon.ico',
  '/billing/webhook', // ← Agrega esta línea
];

// 1. Register Plugins
app.register(cors, {
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-user-email'],
});

app.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Swagger configuration
app.register(swagger, {
  openapi: {
    info: {
      title: 'Mi SaaS API',
      version: '1.0.0',
      description: 'API documentation for Mi SaaS',
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
          description: 'Tenant ID header',
        },
      },
    },
    security: [{ apiKey: [] }],
  },
});

app.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false,
  },
  staticCSP: true,
  transformSpecification: (swaggerObject) => {
    return swaggerObject;
  },
  transformSpecificationClone: true,
});

// 2. Global Middleware
app.addHook('preHandler', async (request, reply) => {
  // Rutas públicas que NO requieren tenant
  const publicRoutes = [
    '/register',
    '/login',
    '/forgot-password',
    '/reset-password',
    '/docs',
    '/uploads',
    '/health',
    '/index.html',
    '/static',
    '/favicon.ico',
  ];
  
  const isPublic = publicRoutes.some(route => request.url.startsWith(route));

  if (!isPublic) {
    await tenantIsolationMiddleware(request, reply);
  }
});

// 3. Serve static uploads
app.get('/uploads/:filename', async (request, reply) => {
  const { filename } = request.params as { filename: string };
  const filePath = path.join(__dirname, '../uploads', filename);

  if (!fs.existsSync(filePath)) {
    return reply.status(404).send({ error: 'File not found' });
  }

  const stream = fs.createReadStream(filePath);
  reply.type('image/png').send(stream);
});

// 4. Health Check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// 5. Register routes
app.register(authRoutes, { prefix: '' });
app.register(projectRoutes, { prefix: '' });
app.register(userRoutes, { prefix: '' });
app.register(aiRoutes, { prefix: '' });
app.register(invoiceRoutes, { prefix: '' });
app.register(whatsappRoutes, { prefix: '' });
app.register(billingRoutes, { prefix: '' });

// 6. Start
const start = async () => {
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 API running on http://localhost:3001');
    console.log(' Swagger docs on http://localhost:3001/docs');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();