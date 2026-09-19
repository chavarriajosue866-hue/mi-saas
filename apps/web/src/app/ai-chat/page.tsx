"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, Bot, User } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AiChatPage() {
  // 1. PATRÓN DEFENSIVO para useSession (evita crashes en SSG de Vercel)
  const sessionHook = useSession();
  const status = sessionHook?.status ?? "loading";
  const session = sessionHook?.data ?? null;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "¡Hola! Soy tu asistente de IA. ¿En qué puedo ayudarte hoy con tu SaaS?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // 2. Manejo de estados de sesión
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando sesión...</span>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Acceso restringido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Debes iniciar sesión para usar el asistente de IA.
            </p>
            <Button onClick={() => (window.location.href = "/login")}>
              Ir al inicio de sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. Lógica del chat (ahora 'session' está 100% garantizado que existe)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          // Puedes pasar el ID del usuario o tenant si tu API lo necesita
          userId: (session.user as any)?.id,
        }),
      });

      if (!res.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const data = await res.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || data.message || "Lo siento, no pude procesar tu solicitud.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error al enviar mensaje al chat de IA:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Lo siento, ocurrió un error al procesar tu mensaje. Por favor, inténtalo de nuevo.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 h-[calc(100vh-2rem)] flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b bg-muted/30 py-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-primary" />
            Asistente de IA
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    {msg.role === "user" ? (
                      <>
                        <AvatarImage src={(session.user as any)?.image || undefined} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span className="text-[10px] opacity-70 mt-1 block text-right">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 flex-row">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-4 bg-background">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}