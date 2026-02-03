import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, MessageSquare, ArrowRight } from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils"; 

interface CustomSession {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  roles?: string[];
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/");
  }

  const customSession = session as unknown as CustomSession;
  const roles = customSession.roles || [];
  const isAdmin = roles.includes("admin");

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 p-4 md:p-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8 mt-4">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900/50 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 backdrop-blur-sm transition-colors">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              Olá, {session.user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Bem-vindo ao seu cofre inteligente de documentos.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          
          {isAdmin && (
            <Link href="/dashboard/documents" className="group">
              <Card className="h-full hover:shadow-md transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-2 relative">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <FileText size={24} />
                  </div>
                  <CardTitle className="text-xl text-slate-800 dark:text-slate-100">Gestão de Documentos</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-slate-500 dark:text-slate-400 mb-4">
                    Faça upload, visualize e gerencie seus PDFs seguros na nuvem.
                  </p>
                  <span className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Acessar arquivos <ArrowRight size={16} />
                  </span>
                </CardContent>
              </Card>
            </Link>
          )}

          <Link 
            href="/dashboard/chat" 
            className={cn("group", !isAdmin && "md:col-span-2")}
          >
            <Card className="h-full hover:shadow-md transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-2 relative">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <MessageSquare size={24} />
                </div>
                <CardTitle className="text-xl text-slate-800 dark:text-slate-100">Chat Inteligente</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  Converse com seus documentos, peça resumos e extraia insights usando IA.
                </p>
                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Iniciar conversa <ArrowRight size={16} />
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}