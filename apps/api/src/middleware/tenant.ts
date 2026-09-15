import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend FastifyRequest to include tenantId
declare module 'fastify' {
  interface FastifyRequest {
    tenantId?: string;
  }
}

/**
 * Middleware to validate tenant isolation.
 * Ensures every request has a valid x-tenant-id header.
 */
export async function tenantIsolationMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const tenantId = request.headers['x-tenant-id'] as string;

  if (!tenantId) {
    return reply.status(400).send({ error: 'Tenant ID is required' });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return reply.status(404).send({ error: 'Tenant not found' });
    }

    // Attach tenantId to the request object for use in routes
    request.tenantId = tenantId;
  } catch (error) {
    console.error('Tenant validation error:', error);
    return reply.status(500).send({ error: 'Internal server error during tenant validation' });
  }
}