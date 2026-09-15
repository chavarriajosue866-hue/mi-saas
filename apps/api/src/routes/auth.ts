import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

export default async function authRoutes(fastify: FastifyInstance) {
  
  /**
   * Register a new user and create a new tenant
   */
  fastify.post('/register', {
    schema: {
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['tenantName', 'email', 'password'],
        properties: {
          tenantName: { type: 'string', description: 'Name of your organization' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
              },
            },
            tenant: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { tenantName, email, password } = request.body as { 
      tenantName: string; 
      email: string; 
      password: string; 
    };

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.status(409).send({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const slug = `${tenantName.toLowerCase().replace(/\s+/g, '-')}-${crypto.randomUUID().split('-')[0]}`;

      const result = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: { name: tenantName, slug, plan: 'free' },
        });

        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            role: 'admin',
            tenantId: tenant.id,
          },
        });

        return { tenant, user };
      });

      return { 
        message: 'User registered successfully', 
        user: { id: result.user.id, email: result.user.email, role: result.user.role },
        tenant: { id: result.tenant.id, name: result.tenant.name }
      };

    } catch (error) {
      console.error('Registration error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  /**
   * Login user (Rate limited: 5 attempts per minute)
   */
  fastify.post('/login', {
    schema: {
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                tenantId: { type: 'string' },
                tenantName: { type: 'string' },
              },
            },
          },
        },
      },
    },
    config: {
      rateLimit: {
        max: 5,
        timeWindow: 60000, // 1 minute in milliseconds
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };

    try {
      const user = await prisma.user.findUnique({ 
        where: { email },
        include: { tenant: true }
      });

      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      return {
        message: 'Login successful',
        user: { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenant.name
        }
      };

    } catch (error) {
      console.error('Login error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  /**
   * Request password reset
   */
  fastify.post('/forgot-password', {
    schema: {
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
    },
  }, async (request, reply) => {
    const { email } = request.body as { email: string };

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        return { message: 'If the email exists, a reset link has been sent.' };
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000);

      await prisma.passwordReset.create({
        data: { email, token, expiresAt }
      });

      return { message: 'If the email exists, a reset link has been sent.' };

    } catch (error) {
      console.error('Forgot password error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  /**
   * Reset password using token
   */
  fastify.post('/reset-password', {
    schema: {
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: {
          token: { type: 'string' },
          newPassword: { type: 'string', minLength: 6 },
        },
      },
    },
  }, async (request, reply) => {
    const { token, newPassword } = request.body as { token: string; newPassword: string };

    try {
      const resetRecord = await prisma.passwordReset.findUnique({ where: { token } });

      if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
        return reply.status(400).send({ error: 'Invalid or expired token' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.$transaction([
        prisma.user.update({
          where: { email: resetRecord.email },
          data: { password: hashedPassword }
        }),
        prisma.passwordReset.update({
          where: { id: resetRecord.id },
          data: { used: true }
        })
      ]);

      return { message: 'Password updated successfully' };

    } catch (error) {
      console.error('Reset password error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}