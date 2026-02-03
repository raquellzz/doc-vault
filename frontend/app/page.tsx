"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-950 text-white">
      <div className="text-center space-y-6 max-w-lg">
        <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          DocVault
        </h1>
        <p className="text-slate-400 text-lg">
          Sua base de conhecimento inteligente. Faça upload de documentos e converse com eles usando IA.
        </p>
        
        <Button 
          size="lg" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8"
          onClick={() => signIn("keycloak", { callbackUrl: "/dashboard" })}
        >
          Entrar na Plataforma <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </main>
  );
}