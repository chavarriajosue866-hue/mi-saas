import { FastifyInstance } from 'fastify';
import {
  createInvoice,
  issueInvoice,
  cancelInvoice,
  getInvoices,
  getInvoice,
} from '../services/invoice';
import { rbacMiddleware } from '../middleware/rbac';

export default async function invoiceRoutes(fastify: FastifyInstance) {
  
  fastify.post('/invoices', {
    schema: {
      tags: ['Invoices'],
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
        required: ['rfc', 'items'],
        properties: {
          rfc: { type: 'string', description: 'RFC of the client' },
          items: { 
            type: 'array', 
            items: { type: 'object' },
            description: 'List of invoice items'
          },
        },
      },
    },
    preHandler: rbacMiddleware('admin'),
  }, async (request, reply) => {
    const tenantId = request.tenantId;
    const userEmail = request.headers['x-user-email'] as string;
    const { rfc, items } = request.body as { rfc: string; items: any[] };

    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const user = await prisma.user.findUnique({ where: { email: userEmail } });
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      const invoice = await createInvoice(tenantId!, user.id, rfc, items);
      return { invoice };
    } catch (error) {
      console.error('Error creating invoice:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.post('/invoices/:id/issue', {
    schema: {
      tags: ['Invoices'],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
    },
    preHandler: rbacMiddleware('admin'),
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const invoice = await issueInvoice(id);
      return { invoice };
    } catch (error) {
      return reply.status(400).send({ 
        error: error instanceof Error ? error.message : 'Failed to issue invoice' 
      });
    }
  });

  fastify.post('/invoices/:id/cancel', {
    schema: {
      tags: ['Invoices'],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
    },
    preHandler: rbacMiddleware('admin'),
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const invoice = await cancelInvoice(id);
      return { invoice };
    } catch (error) {
      return reply.status(400).send({ 
        error: error instanceof Error ? error.message : 'Failed to cancel invoice' 
      });
    }
  });

  fastify.get('/invoices', {
    schema: {
      tags: ['Invoices'],
      headers: {
        type: 'object',
        required: ['x-tenant-id'],
        properties: {
          'x-tenant-id': { type: 'string' },
        },
      },
    },
  }, async (request) => {
    const tenantId = request.tenantId;
    const invoices = await getInvoices(tenantId!);
    return { invoices };
  });

  fastify.get('/invoices/:id', {
    schema: {
      tags: ['Invoices'],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const invoice = await getInvoice(id);
      if (!invoice) {
        return reply.status(404).send({ error: 'Invoice not found' });
      }
      return { invoice };
    } catch (error) {
      return reply.status(404).send({ error: 'Invoice not found' });
    }
  });
}