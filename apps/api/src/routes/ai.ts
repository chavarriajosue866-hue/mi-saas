import { FastifyInstance } from 'fastify';
import {
  createConversation,
  sendMessage,
  getConversations,
  getMessages,
} from '../services/claude';

export default async function aiRoutes(fastify: FastifyInstance) {
  
  fastify.post('/ai/conversations', {
    schema: {
      tags: ['AI Assistant'],
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
        required: ['title'],
        properties: {
          title: { type: 'string', description: 'Title of the conversation' },
        },
      },
    },
  }, async (request, reply) => {
    const tenantId = request.tenantId;
    const userEmail = request.headers['x-user-email'] as string;
    const { title } = request.body as { title: string };

    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const user = await prisma.user.findUnique({ where: { email: userEmail } });
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      const conversation = await createConversation(tenantId!, user.id, title);
      return { conversation };
    } catch (error) {
      console.error('Error creating conversation:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.post('/ai/conversations/:id/messages', {
    schema: {
      tags: ['AI Assistant'],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
      body: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', description: 'Message to send to AI' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { message } = request.body as { message: string };

    try {
      const response = await sendMessage(id, message);
      return response;
    } catch (error) {
      return reply.status(400).send({ 
        error: error instanceof Error ? error.message : 'Failed to send message' 
      });
    }
  });

  fastify.get('/ai/conversations', {
    schema: {
      tags: ['AI Assistant'],
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
    const conversations = await getConversations(tenantId!);
    return { conversations };
  });

  fastify.get('/ai/conversations/:id/messages', {
    schema: {
      tags: ['AI Assistant'],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    try {
      const messages = await getMessages(id);
      return { messages };
    } catch (error) {
      return reply.status(404).send({ error: 'Conversation not found' });
    }
  });
}