"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Plus, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // Utilitário do shadcn para classes condicionais

// Tipos
interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export default function ChatPage() {
  // Estados Gerais
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Estados do Chat Ativo
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Carregar lista de conversas ao abrir a página
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await api.get("/v1/conversations");
      setConversations(res.data);
      
      // Se tiver conversas e nenhuma selecionada, seleciona a primeira automaticamente
      if (res.data.length > 0 && !activeId) {
        selectConversation(res.data[0].id);
      }
    } catch (error) {
      console.error("Erro ao buscar conversas", error);
    }
  };

  // 2. Selecionar uma conversa e carregar histórico
  const selectConversation = async (id: string) => {
    setActiveId(id);
    setLoading(true);
    try {
      const res = await api.get(`/v1/conversations/${id}`);
      setMessages(res.data);
    } catch (error) {
      toast.error("Erro ao carregar mensagens.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Criar Nova Conversa
  const handleNewChat = async () => {
    try {
      const res = await api.post("/v1/conversations", { title: "Nova Conversa" });
      const newChat = res.data;
      
      setConversations([newChat, ...conversations]); // Adiciona no topo da lista
      setActiveId(newChat.id);
      setMessages([{
        id: "welcome",
        sender: "assistant",
        content: "Olá! Nova conversa iniciada. Sobre qual documento vamos falar?",
        created_at: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      toast.error("Erro ao criar nova conversa.");
    }
  };

  // 4. Enviar Mensagem
  const handleSend = async () => {
    if (!input.trim() || !activeId) return;

    const userText = input;
    setInput("");
    setLoading(true);

    // Otimista: Mostra msg do usuário antes de confirmar
    const tempUserMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      content: userText,
      created_at: new Date().toLocaleTimeString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.post(`/v1/conversations/${activeId}/messages`, {
        content: userText
      });
      setMessages((prev) => [...prev, res.data]);
    } catch (error) {
      toast.error("Erro ao enviar mensagem.");
    } finally {
      setLoading(false);
    }
  };

  // Scroll automático
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.24))] gap-4 max-w-7xl mx-auto p-4">
      
      {/* --- BARRA LATERAL (Histórico) --- */}
      <aside className="w-64 flex flex-col gap-4 bg-white border rounded-lg p-4 shadow-sm h-full">
        <Button onClick={handleNewChat} className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus size={16} /> Nova Conversa
        </Button>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {conversations.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">Nenhuma conversa anterior.</p>
          )}
          
          {conversations.map((chat) => (
            <button
              key={chat.id}
              onClick={() => selectConversation(chat.id)}
              className={cn(
                "w-full text-left p-3 rounded-md text-sm transition-colors flex items-center gap-3 border",
                activeId === chat.id 
                  ? "bg-blue-50 border-blue-200 text-blue-700 font-medium" 
                  : "bg-slate-50 border-transparent hover:bg-slate-100 text-slate-600"
              )}
            >
              <MessageSquare size={16} className="shrink-0" />
              <span className="truncate">{chat.title || "Sem título"}</span>
            </button>
          ))}
        </div>
      </aside>


      {/* --- ÁREA PRINCIPAL DO CHAT --- */}
      <main className="flex-1 flex flex-col bg-slate-50 border rounded-lg shadow-sm h-full overflow-hidden">
        
        {/* Header do Chat */}
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bot className="text-emerald-600" /> 
            <span className="font-semibold text-slate-700">Assistente IA</span>
          </div>
          {activeId && (
            <span className="text-xs text-slate-400">ID: {activeId.slice(0,8)}...</span>
          )}
        </div>

        {/* Lista de Mensagens */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* MUDANÇA: 'space-y-6' aqui adiciona o espaço entre as mensagens */}
          <div className="space-y-6"> 
            {!activeId && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 mt-20">
                <Bot size={48} className="mb-4 opacity-20" />
                <p>Selecione uma conversa ou inicie uma nova.</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-4 w-full max-w-3xl",
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
                )}
              >
                {/* Avatar */}
                <Avatar className="h-8 w-8 shrink-0 mt-1">
                  <AvatarFallback className={msg.sender === "assistant" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"}>
                    {msg.sender === "assistant" ? <Bot size={16}/> : <User size={16}/>}
                  </AvatarFallback>
                </Avatar>

                {/* Balão */}
                <div className={cn(
                  "rounded-2xl p-4 text-sm shadow-sm leading-relaxed",
                  msg.sender === "user" 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-white border text-slate-800 rounded-tl-none"
                )}>
                  {/* renderiza quebras de linha corretamente */}
                  <p className="whitespace-pre-wrap">{msg.content}</p> 
                  <span className={cn(
                    "text-[10px] block mt-2 opacity-70",
                    msg.sender === "user" ? "text-blue-100" : "text-slate-400"
                  )}>
                    {msg.created_at}
                  </span>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
               <div className="flex gap-4 mr-auto max-w-3xl">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-emerald-600 text-white"><Bot size={16}/></AvatarFallback>
                  </Avatar>
                  <div className="bg-white border rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    <span className="text-xs text-slate-400">Escrevendo...</span>
                  </div>
               </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Input
              placeholder={activeId ? "Digite sua pergunta..." : "Crie uma conversa para começar"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={loading || !activeId}
              className="flex-1"
            />
            <Button 
              onClick={handleSend} 
              disabled={loading || !input.trim() || !activeId} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

      </main>
    </div>
  );
}