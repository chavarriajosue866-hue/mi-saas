import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@mi-saas/db";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

// Definimos el tipo estricto para satisfacer a TypeScript y al SDK de Groq
type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log("📥 Request received:", body);

    // 1. Normalizar y tipar correctamente los mensajes
    let messages: ChatMessage[] = [];
    if (Array.isArray(body.messages)) {
      messages = body.messages.map((m: any) => ({
        role: (m.role as "system" | "user" | "assistant") || "user",
        content: String(m.content || ""),
      }));
    } else if (body.message) {
      messages = [{ role: "user", content: String(body.message) }];
    }

    if (messages.length === 0) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // 2. Obtener datos del negocio
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { businessName: true, currency: true },
    });

    const businessName = user?.businessName || "this business";
    const currency = user?.currency || "USD";

    const systemPrompt = `You are a helpful AI business assistant for ${businessName}. 
The business uses ${currency} as its currency. 
Answer questions concisely, professionally, and in English.`;

    if (!process.env.GROQ_API_KEY) {
      console.error("❌ GROQ_API_KEY is missing");
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    console.log("🤖 Calling Groq API with model: openai/gpt-oss-20b");

    // 3. Llamada a la API (Ahora TypeScript estará feliz con el tipo de messages)
    const startTime = Date.now();
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      model: "openai/gpt-oss-20b",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const elapsed = Date.now() - startTime;
    const response = completion.choices[0]?.message?.content;

    console.log(`✅ Response received in ${elapsed}ms`);

    if (!response) {
      return NextResponse.json({ 
        content: "I received your message but couldn't generate a response. Please try again!" 
      });
    }

    return NextResponse.json({ content: response });

  } catch (error: any) {
    console.error("❌ AI Chat Error:", error.message);
    return NextResponse.json({ 
      content: `⚠️ **Error:** ${error.message || "Failed to process request"}` 
    }, { status: 500 });
  }
}