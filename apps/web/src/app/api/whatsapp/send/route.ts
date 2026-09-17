import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { phone, message } = await req.json();

    // Usando WhatsApp Business API (Meta)
    // O usando Twilio WhatsApp API
    const response = await fetch(
      "https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer YOUR_WHATSAPP_TOKEN`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: message }
        })
      }
    );

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}