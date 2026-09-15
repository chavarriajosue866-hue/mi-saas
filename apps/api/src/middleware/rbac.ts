import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend FastifyRequest to include the user object
declare module 'fastify' {
  interface FastifyRequest {
    user?: any;
  }
}

/**
 * Middleware factory for Role-Based Access Control (RBAC).
 * @param requiredRole The minimum role required to access the route (e.g., 'admin').
 */
export function rbacMiddleware(requiredRole: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userEmail = request.headers['x-user-email'] as string;
    const tenantId = request.tenantId; // Injected by the previous tenant middleware

    if (!userEmail) {
      return reply.status(401).send({ error: 'User email is required' });
    }

    try {
      // Fetch the user and verify they belong to the current tenant
      const user = await prisma.user.findFirst({
        where: {
          email: userEmail,
          tenantId: tenantId,
        },
      });

      if (!user) {
        return reply.status(403).send({ error: 'User not authorized for this tenant' });
      }

      // Check if the user has the required role
      // (Simple hierarchy: 'admin' has access to 'admin' routes, 'member' does not)
      if (requiredRole === 'admin' && user.role !== 'admin') {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      // Attach the full user object to the request so routes don't have to query the DB again
      request.user = user;

    } catch (error) {
      console.error('RBAC validation error:', error);
      return reply.status(500).send({ error: 'Internal server error during RBAC validation' });
    }
  };
}