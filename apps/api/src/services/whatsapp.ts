import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lazy initialization - only create client when needed
let twilioClient: any = null;

function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
    }

    if (!accountSid.startsWith('AC')) {
      throw new Error('TWILIO_ACCOUNT_SID must start with "AC". Check your .env file.');
    }

    // Dynamic import to avoid loading twilio at startup
    const twilio = require('twilio');
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

const WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

/**
 * Send WhatsApp message to a user
 */
export async function sendWhatsAppMessage(
  tenantId: string,
  toNumber: string,
  message: string
) {
  try {
    const client = getTwilioClient();

    // Send via Twilio
    const twilioMessage = await client.messages.create({
      from: WHATSAPP_NUMBER,
      to: `whatsapp:${toNumber}`,
      body: message,
    });

    // Log the message
    await prisma.whatsAppMessage.create({
      data: {
        tenantId,
        toNumber,
        message,
        status: 'sent',
        sid: twilioMessage.sid,
      },
    });

    return {
      success: true,
      sid: twilioMessage.sid,
    };
  } catch (error) {
    // Log failed attempt
    await prisma.whatsAppMessage.create({
      data: {
        tenantId,
        toNumber,
        message,
        status: 'failed',
      },
    });

    console.error('WhatsApp send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send invitation via WhatsApp
 */
export async function sendInvitationWhatsApp(
  tenantId: string,
  toNumber: string,
  invitationLink: string,
  inviterName: string
) {
  const message = `Hi! ${inviterName} has invited you to join their team on SaaS Dashboard. 

Click here to accept: ${invitationLink}

This link expires in 7 days.`;

  return sendWhatsAppMessage(tenantId, toNumber, message);
}

/**
 * Send invoice notification via WhatsApp
 */
export async function sendInvoiceWhatsApp(
  tenantId: string,
  toNumber: string,
  invoiceNumber: string,
  total: number
) {
  const message = `Your invoice #${invoiceNumber} has been issued.

Total: $${total.toFixed(2)} MXN

You can download it from your dashboard.`;

  return sendWhatsAppMessage(tenantId, toNumber, message);
}

/**
 * Get WhatsApp message history for a tenant
 */
export async function getWhatsAppHistory(tenantId: string) {
  return prisma.whatsAppMessage.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}