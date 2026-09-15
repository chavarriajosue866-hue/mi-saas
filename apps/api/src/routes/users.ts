import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { rbacMiddleware } from '../middleware/rbac';

const prisma = new PrismaClient();

export default async function userRoutes(fastify: FastifyInstance) {
  
  fastify.get('/users', {
    schema: {
      tags: ['Users'],
      headers: {
        type: 'object',
        required: ['x-tenant-id', 'x-user-email'],
        properties: {
          'x-tenant-id': { type: 'string' },
          'x-user-email': { type: 'string' },
        },
      },
    },
    preHandler: rbacMiddleware('admin'),
  }, async (request, reply) => {
    try {
      const tenantId = request.tenantId;
      const users = await prisma.user.findMany({
        where: { tenantId },
        select: { id: true, email: true, name: true, role: true, avatar: true, createdAt: true },
      });
      return { data: users };
    } catch (error) {
      console.error('Error fetching users:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.get('/users/me', {
    schema: {
      tags: ['Users'],
      headers: {
        type: 'object',
        required: ['x-tenant-id', 'x-user-email'],
        properties: {
          'x-tenant-id': { type: 'string' },
          'x-user-email': { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const userEmail = request.headers['x-user-email'] as string;
      const tenantId = request.tenantId;

      const user = await prisma.user.findFirst({
        where: { email: userEmail, tenantId },
        select: { id: true, email: true, name: true, role: true, avatar: true, createdAt: true },
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return { data: user };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.post('/users/avatar', {
    schema: {
      tags: ['Users'],
      headers: {
        type: 'object',
        required: ['x-tenant-id', 'x-user-email'],
        properties: {
          'x-tenant-id': { type: 'string' },
          'x-user-email': { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const tenantId = request.tenantId;
      const file = await request.file();

      if (!file) {
        return reply.status(400).send({ error: 'No file provided' });
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        return reply.status(400).send({ error: 'Only images allowed' });
      }

      const ext = file.filename.split('.').pop();
      const filename = `avatar-${tenantId}-${Date.now()}.${ext}`;
      const uploadsDir = path.join(__dirname, '../../uploads');
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const filepath = path.join(uploadsDir, filename);
      const writeStream = fs.createWriteStream(filepath);
      file.file.pipe(writeStream);

      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      const avatarUrl = `http://localhost:3001/uploads/${filename}`;

      const userEmail = request.headers['x-user-email'] as string;
      if (userEmail) {
        await prisma.user.update({
          where: { email: userEmail },
          data: { avatar: avatarUrl }
        });
      }

      return { message: 'Avatar updated', avatar: avatarUrl };
    } catch (error) {
      console.error('Avatar upload error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
      /**
   * TEMPORAL: Get tenant ID (solo para desarrollo)
   */
  fastify.get('/debug/me', async (request) => {
    return {
      tenantId: request.tenantId,
      userEmail: request.headers['x-user-email'],
    };
  });
  });
}


