import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';

// Extender el tipo de Request para incluir el tenantId
declare module 'fastify' {
  interface FastifyRequest {
    tenantId: string;
  }
}

export async function tenantIsolationMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // En producción, esto se extrae del payload del JWT (ej. request.user.tenantId)
  // Para pruebas, lo leemos de un header seguro.
  const tenantId = request.headers['x-tenant-id'] as string;

  if (!tenantId) {
    return reply.status(401).send({ error: 'Tenant ID is required' });
  }

  // Inyectar en el contexto
  request.tenantId = tenantId;
}