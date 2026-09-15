import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@mi-saas/db";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log("📥 Request received:", body);
    
    let messages: any[] = [];
    if (Array.isArray(body.messages)) {
      messages = body.messages;
    } else if (body.message) {
      messages = [{ role: "user", content: body.message }];
    }
    
    if (messages.length === 0) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { businessName: true, currency: true }
    });

    const systemPrompt = `You are a helpful AI business assistant for ${user?.businessName || "this business"}. 
    The business uses ${user?.currency || "USD"} as its currency. 
    Answer questions concisely, professionally, and in English.`;

    if (!process.env.GROQ_API_KEY) {
      console.error("❌ GROQ_API_KEY is missing");
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    console.log("🤖 Calling Groq API with model: openai/gpt-oss-20b");
    console.log("Messages to send:", JSON.stringify(messages, null, 2));

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
    
    console.log(`✅ Response received in ${elapsed}ms:`, response);

    if (!response) {
      console.warn("⚠️ Empty response from Groq API");
      return NextResponse.json({ 
        content: "I received your message but couldn't generate a response. Please try again!" 
      });
    }

    return NextResponse.json({ 
      content: response 
    });
  } catch (error: any) {
    console.error("❌ AI Chat Error:", error);
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error status:", error.status);
    
    return NextResponse.json({ 
      content: `⚠️ **Error:** ${error.message || "Failed to process request"}` 
    }, { status: 500 });
  }
}