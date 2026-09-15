import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { rbacMiddleware } from '../middleware/rbac';

const prisma = new PrismaClient();

export default async function billingRoutes(fastify: FastifyInstance) {
  
  /**
   * Simular Checkout (Modo Local)
   * En producción, esto redirigiría a Stripe/Lemon Squeezy.
   * Localmente, actualiza el plan directamente para pruebas.
   */
  fastify.post('/billing/checkout', {
    schema: {
      tags: ['Billing'],
      headers: {
        type: 'object',
        required: ['x-tenant-id'],
        properties: { 'x-tenant-id': { type: 'string' } },
      },
      body: {
        type: 'object',
        required: ['plan'],
        properties: {
          plan: { type: 'string', enum: ['free', 'pro', 'enterprise'] },
        },
      },
    },
// preHandler: rbacMiddleware('admin'),  // Comentado temporalmente
  }, async (request, reply) => {
    const tenantId = request.tenantId;
    const { plan } = request.body as { plan: 'free' | 'pro' | 'enterprise' };

    try {
      // Simulación de pago exitoso
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: plan,
          stripeSubscriptionId: `local_sub_${Date.now()}`, // Mock ID
          stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 días
        },
      });

      return { 
        message: `Successfully upgraded to ${plan} plan (Local Mock)`,
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing?success=true`
      };
    } catch (error) {
      console.error('Checkout error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  /**
   * Cancelar suscripción (Modo Local)
   */
  fastify.post('/billing/cancel', {
    schema: {
      tags: ['Billing'],
      headers: {
        type: 'object',
        required: ['x-tenant-id'],
        properties: { 'x-tenant-id': { type: 'string' } },
      },
    },
    preHandler: rbacMiddleware('admin'),
  }, async (request, reply) => {
    const tenantId = request.tenantId;

    try {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: 'free',
          stripeSubscriptionId: null,
          stripeCurrentPeriodEnd: null,
        },
      });

      return { message: 'Subscription cancelled successfully (Local Mock)' };
    } catch (error) {
      console.error('Cancel error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  /**
   * Ver estado de la suscripción
   */
  fastify.get('/billing/status', {
    schema: {
      tags: ['Billing'],
      headers: {
        type: 'object',
        required: ['x-tenant-id'],
        properties: { 'x-tenant-id': { type: 'string' } },
      },
    },
  }, async (request) => {
    const tenantId = request.tenantId;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        plan: true,
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
      },
    });

    return { data: tenant };
  });
}