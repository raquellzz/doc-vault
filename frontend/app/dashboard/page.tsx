import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, MessageSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/LogoutButton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Olá, {session.user?.name} 👋</h1>
            <p className="text-slate-500">O que você deseja fazer hoje?</p>
          </div>
          <Link href="/api/auth/signout">
            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </Link>
        </div>

        {/* Grid de Opções */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Card Documentos */}
          <Link href="/dashboard/documents" className="block group">
            <Card className="h-full hover:shadow-lg transition-shadow border-slate-200 cursor-pointer group-hover:border-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <FileText className="h-6 w-6" /> Gestão de Documentos
                </CardTitle>
                <CardDescription>
                  Faça upload, visualize e gerencie seus PDFs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  Acesse aqui para alimentar a base de conhecimento da IA com novos arquivos.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Card Chat */}
          <Link href="/dashboard/chat" className="block group">
            <Card className="h-full hover:shadow-lg transition-shadow border-slate-200 cursor-pointer group-hover:border-emerald-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-600">
                  <MessageSquare className="h-6 w-6" /> Chat Inteligente
                </CardTitle>
                <CardDescription>
                  Converse com seus documentos usando IA.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  Tire dúvidas, peça resumos e extraia informações dos seus arquivos.
                </p>
              </CardContent>
            </Card>
          </Link>

        </div>
      </div>
    </div>
  );
}