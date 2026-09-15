import { FastifyInstance } from 'fastify';
import {
  sendWhatsAppMessage,
  sendInvitationWhatsApp,
  getWhatsAppHistory,
} from '../services/whatsapp';
import { rbacMiddleware } from '../middleware/rbac';

export default async function whatsappRoutes(fastify: FastifyInstance) {
  
  fastify.post('/whatsapp/send', {
    schema: {
      tags: ['WhatsApp'],
      headers: {
        type: 'object',
        required: ['x-tenant-id'],
        properties: {
          'x-tenant-id': { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['toNumber', 'message'],
        properties: {
          toNumber: { type: 'string', description: 'Phone number with country code' },
          message: { type: 'string', description: 'Message to send' },
        },
      },
    },
    preHandler: rbacMiddleware('admin'),
  }, async (request) => {
    const tenantId = request.tenantId;
    const { toNumber, message } = request.body as { toNumber: string; message: string };

    const result = await sendWhatsAppMessage(tenantId!, toNumber, message);
    return result;
  });

  fastify.post('/whatsapp/invite', {
    schema: {
      tags: ['WhatsApp'],
      headers: {
        type: 'object',
        required: ['x-tenant-id'],
        properties: {
          'x-tenant-id': { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['toNumber', 'invitationLink', 'inviterName'],
        properties: {
          toNumber: { type: 'string' },
          invitationLink: { type: 'string' },
          inviterName: { type: 'string' },
        },
      },
    },
    preHandler: rbacMiddleware('admin'),
  }, async (request) => {
    const tenantId = request.tenantId;
    const { toNumber, invitationLink, inviterName } = request.body as { 
      toNumber: string; 
      invitationLink: string; 
      inviterName: string; 
    };

    const result = await sendInvitationWhatsApp(tenantId!, toNumber, invitationLink, inviterName);
    return result;
  });

  fastify.get('/whatsapp/history', {
    schema: {
      tags: ['WhatsApp'],
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
    const history = await getWhatsAppHistory(tenantId!);
    return { history };
  });
}