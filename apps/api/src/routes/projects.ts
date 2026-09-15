import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function projectRoutes(fastify: FastifyInstance) {
  
  fastify.get('/projects', {
    schema: {
      tags: ['Projects'],
      headers: {
        type: 'object',
        required: ['x-tenant-id'],
        properties: {
          'x-tenant-id': { type: 'string', description: 'Tenant ID' },
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
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const tenantId = request.tenantId;
      const projects = await prisma.project.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });
      return { data: projects };
    } catch (error) {
      console.error('Error fetching projects:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.post('/projects', {
    schema: {
      tags: ['Projects'],
      headers: {
        type: 'object',
        required: ['x-tenant-id'],
        properties: {
          'x-tenant-id': { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { name } = request.body as { name: string };

    if (!name) {
      return reply.status(400).send({ error: 'Project name is required' });
    }

    try {
      const tenantId = request.tenantId;
      const project = await prisma.project.create({
        data: { name, tenantId },
      });
      return { data: project };
    } catch (error) {
      console.error('Error creating project:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.put('/projects/:id', {
    schema: {
      tags: ['Projects'],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
      body: {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name } = request.body as { name: string };

    try {
      const tenantId = request.tenantId;
      const existingProject = await prisma.project.findFirst({
        where: { id, tenantId },
      });

      if (!existingProject) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      const project = await prisma.project.update({
        where: { id },
        data: { name },
      });
      return { data: project };
    } catch (error) {
      console.error('Error updating project:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.delete('/projects/:id', {
    schema: {
      tags: ['Projects'],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const tenantId = request.tenantId;
      const existingProject = await prisma.project.findFirst({
        where: { id, tenantId },
      });

      if (!existingProject) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      await prisma.project.delete({ where: { id } });
      return { message: 'Project deleted successfully' };
    } catch (error) {
      console.error('Error deleting project:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}