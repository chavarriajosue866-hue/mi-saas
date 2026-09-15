import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * System prompt for the AI assistant
 * Customized for SaaS multi-tenant context
 */
const SYSTEM_PROMPT = `You are a helpful AI assistant for a SaaS multi-tenant platform. 
You help users manage their projects, understand their data, and answer questions about the platform.
Always be professional, concise, and helpful.
If asked about billing or invoices, guide users to check their dashboard.
Respond in the same language the user writes in.`;

/**
 * Create a new AI conversation
 */
export async function createConversation(tenantId: string, userId: string, title: string) {
  return prisma.aiConversation.create({
    data: {
      tenantId,
      userId,
      title,
    },
  });
}

/**
 * Send a message to Claude and get response
 */
export async function sendMessage(
  conversationId: string,
  userMessage: string
) {
  // Get conversation to access tenant context
  const conversation = await prisma.aiConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 10, // Last 10 messages for context
      },
    },
  });

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Build message history for Claude
  const messageHistory = conversation.messages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));

  // Call Claude API
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      ...messageHistory,
      { role: 'user', content: userMessage },
    ],
  });

  // Extract response text
  const assistantMessage = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as any).text)
    .join('\n');

  // Calculate tokens used
  const tokensUsed = (response.usage?.input_tokens || 0) + 
                     (response.usage?.output_tokens || 0);

  // Save user message
  await prisma.aiMessage.create({
    data: {
      conversationId,
      role: 'user',
      content: userMessage,
      tokensUsed: 0,
    },
  });

  // Save assistant message
  await prisma.aiMessage.create({
    data: {
      conversationId,
      role: 'assistant',
      content: assistantMessage,
      tokensUsed,
    },
  });

  return {
    message: assistantMessage,
    tokensUsed,
  };
}

/**
 * Get all conversations for a tenant
 */
export async function getConversations(tenantId: string) {
  return prisma.aiConversation.findMany({
    where: { tenantId },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Get messages for a specific conversation
 */
export async function getMessages(conversationId: string) {
  return prisma.aiMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
}