import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@mi-saas/db";
import Groq from "groq-sdk";

// Inicializar cliente de Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export async function POST(req: Request) {
  // 1. Verificar autenticación
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log("📥 Request received:", body);

    // 2. Normalizar los mensajes (acepta array de mensajes o un solo string)
    let messages: { role: string; content: string }[] = [];
    if (Array.isArray(body.messages)) {
      messages = body.messages;
    } else if (body.message) {
      messages = [{ role: "user", content: body.message }];
    }

    if (messages.length === 0) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // 3. Obtener datos del negocio para personalizar el prompt
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { businessName: true, currency: true },
    });

    const businessName = user?.businessName || "your company";
    const currency = user?.currency || "USD";

    // 4. System Prompt mejorado y detallado
    const systemPrompt = `You are an expert AI business assistant integrated into a SaaS platform for "${businessName}".
Your goal is to help the user manage their business operations, such as clients, invoices, projects, and appointments.
The business operates using ${currency} as its primary currency.

Guidelines:
- Always answer in English.
- Be professional, concise, and helpful.
- If asked about features of the platform, explain how to use the dashboard, manage clients, or create invoices.
- If the user asks something completely unrelated to business management or this platform, politely steer the conversation back to business topics.
- Do not invent financial data; advise the user to check their dashboard for real-time stats.`;

    // 5. Verificar API Key
    if (!process.env.GROQ_API_KEY) {
      console.error(" GROQ_API_KEY is missing");
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    console.log(`🤖 Calling Groq API (Model: openai/gpt-oss-20b) for user: ${session.user.email}`);

    // 6. Llamada a la API de Groq
    const startTime = Date.now();
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      model: "openai/gpt-oss-20b", // Puedes cambiar a "llama3-8b-8192" o "mixtral-8x7b-32768" si prefieres
      temperature: 0.7,
      max_tokens: 1024,
    });

    const elapsed = Date.now() - startTime;
    const response = completion.choices[0]?.message?.content;

    console.log(`✅ Response received in ${elapsed}ms`);

    if (!response) {
      console.warn("⚠️ Empty response from Groq API");
      return NextResponse.json({
        content: "I received your message but couldn't generate a response. Please try again!",
      });
    }

    // 7. Retornar respuesta
    return NextResponse.json({
      content: response,
    });

  } catch (error: any) {
    console.error("❌ AI Chat Error:", error);
    return NextResponse.json(
      {
        content: `⚠️ **Error:** ${error.message || "Failed to process request"}`,
      },
      { status: 500 }
    );
  }
}