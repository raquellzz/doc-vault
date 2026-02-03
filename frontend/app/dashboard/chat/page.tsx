"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Plus, MessageSquare, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await api.get("/v1/conversations");
      setConversations(res.data);
      
      if (res.data.length > 0 && !activeId) {
        selectConversation(res.data[0].id);
      }
    } catch (error) {
      console.error("Erro ao buscar conversas", error);
    }
  };

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

  const handleNewChat = async () => {
    try {
      const res = await api.post("/v1/conversations", { title: "Nova Conversa" });
      const newChat = res.data;
      
      setConversations([newChat, ...conversations]);
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

  const handleSend = async () => {
    if (!input.trim() || !activeId) return;
    const userText = input;
    setInput("");
    setLoading(true);

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

  const executeDelete = async (idToDelete: string) => {
    try {
      await api.delete(`/v1/conversations/${idToDelete}`);
      
      const newList = conversations.filter(c => c.id !== idToDelete);
      setConversations(newList);
      toast.success("Conversa apagada com sucesso.");

      if (activeId === idToDelete) {
        if (newList.length > 0) selectConversation(newList[0].id);
        else {
            setActiveId(null);
            setMessages([]);
        }
      }
    } catch (error) {
      toast.error("Erro ao apagar conversa.");
    }
  };

  const handleDeleteRequest = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    toast("Tem certeza absoluta?", {
      description: "Essa ação apagará todo o histórico dessa conversa permanentemente.",
      classNames: {
        toast: "bg-white border-2 border-red-100 shadow-2xl p-6 w-full max-w-md",
        title: "text-red-600 text-lg font-bold items-center gap-2",
        description: "text-slate-100 text-base mt-2 font-medium",
        actionButton: "bg-red-600 hover:bg-red-700 text-white font-bold h-10 px-6 rounded-md",
        cancelButton: "bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium h-10 px-4 rounded-md",
      },
      action: {
        label: "SIM, EXCLUIR",
        onClick: () => executeDelete(id),
      },
      cancel: {
        label: "Cancelar",
        onClick: () => {},
      },
      duration: 12000,
    });
  };

  const startEditing = (e: React.MouseEvent, chat: Conversation) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const saveTitle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingId || !editTitle.trim()) return;

    try {
      await api.patch(`/v1/conversations/${editingId}`, { title: editTitle });
      
      setConversations(conversations.map(c => 
        c.id === editingId ? { ...c, title: editTitle } : c
      ));
      
      setEditingId(null);
      toast.success("Título atualizado!");
    } catch (error) {
      toast.error("Erro ao renomear.");
    }
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 md:gap-4 max-w-7xl mx-auto md:p-4 transition-colors">
      
      <aside className="hidden md:flex w-72 flex-col gap-4 bg-white dark:bg-slate-950 border-r md:border dark:border-slate-800 md:rounded-2xl p-4 shadow-sm h-full transition-colors">
        <Button onClick={handleNewChat} className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 gap-2 shadow-sm">
          <Plus size={16} /> Nova Conversa
        </Button>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {conversations.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Nenhuma conversa.</p>
          )}
          
          {conversations.map((chat) => (
            <div
              key={chat.id}
              onClick={() => editingId !== chat.id && selectConversation(chat.id)}
              className={cn(
                "group relative w-full p-3 rounded-xl text-sm transition-all border cursor-pointer flex items-center gap-2",
                activeId === chat.id 
                  ? "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-medium shadow-sm" 
                  : "bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
              )}
            >
              <MessageSquare size={18} className={cn("shrink-0", activeId === chat.id ? "opacity-100" : "opacity-70")} />

              {editingId === chat.id ? (
                <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                  <Input 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-8 text-xs px-2 py-0 bg-white dark:bg-slate-900 dark:border-slate-700"
                    autoFocus
                  />
                  <button onClick={saveTitle} className="text-emerald-600 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-950/50 p-1.5 rounded"><Check size={14} /></button>
                  <button onClick={cancelEditing} className="text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950/50 p-1.5 rounded"><X size={14} /></button>
                </div>
              ) : (
                <>
                  <span className="truncate flex-1">{chat.title || "Sem título"}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-inherit">
                    <button onClick={(e) => startEditing(e, chat)} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded" title="Renomear">
                      <Pencil size={14} />
                    </button>
                    <button onClick={(e) => handleDeleteRequest(e, chat.id)} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded" title="Apagar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-white dark:bg-slate-900 md:border dark:border-slate-800 md:rounded-2xl shadow-sm h-full overflow-hidden transition-colors">
        <div className="p-4 border-b dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-950/50 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Bot size={18} /> 
            </div>
            <div>
                <h2 className="font-semibold text-slate-800 dark:text-slate-100 leading-none">Assistente IA</h2>
                {activeId && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">ID: {activeId.slice(0,8)}</p>}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-950 dark:bg-dot-white/[0.05] bg-dot-black/[0.05]">
          <div className="space-y-8 max-w-3xl mx-auto"> 
            {!activeId && (
              <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 dark:text-slate-600">
                <Bot size={64} className="mb-6 opacity-20" />
                <p className="text-lg font-medium">Selecione uma conversa ou inicie uma nova.</p>
                <p className="text-sm mt-2">Seus documentos estão prontos para serem analisados.</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-4 w-full", msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto flex-row")}>
                <Avatar className="h-8 w-8 shrink-0 mt-1 border dark:border-slate-800 shadow-sm">
                  <AvatarFallback className={msg.sender === "assistant" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"}>
                    {msg.sender === "assistant" ? <Bot size={16}/> : <User size={16}/>}
                  </AvatarFallback>
                </Avatar>

                <div className={cn("max-w-[85%] rounded-2xl p-4 text-sm shadow-sm leading-relaxed", 
                  msg.sender === "user" 
                    ? "bg-blue-600 dark:bg-blue-700 text-white rounded-tr-sm" 
                    : "bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm"
                )}>
                  <p className="whitespace-pre-wrap">{msg.content}</p> 
                  <span className={cn("text-[10px] block mt-2 opacity-70 font-medium text-right", msg.sender === "user" ? "text-blue-100" : "text-slate-400 dark:text-slate-500")}>{msg.created_at}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-4 mr-auto max-w-3xl animate-pulse">
                  <Avatar className="h-8 w-8 shrink-0"><AvatarFallback className="bg-emerald-100 dark:bg-emerald-950 text-emerald-600"><Bot size={16}/></AvatarFallback></Avatar>
                  <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400 dark:text-slate-500" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">A IA está digitando...</span>
                  </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800 relative z-10">
          <div className="flex gap-2 max-w-3xl mx-auto relative">
            <Input
              placeholder={activeId ? "Envie uma mensagem para a IA..." : "Inicie uma conversa primeiro"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={loading || !activeId}
              className="flex-1 pr-12 py-6 text-base shadow-sm dark:bg-slate-950 dark:border-slate-800 focus-visible:ring-blue-500"
            />
            <Button 
              onClick={handleSend} 
              disabled={loading || !input.trim() || !activeId} 
              className="absolute right-2 top-2 h-9 w-9 p-0 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-transform active:scale-95 disabled:opacity-50"
            >
              <Send className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}