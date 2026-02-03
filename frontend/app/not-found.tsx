import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 text-center">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-full mb-6 shadow-sm border border-slate-100 dark:border-slate-800">
        <FileQuestion className="h-16 w-16 text-blue-500 dark:text-blue-400" />
      </div>
      
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">
        Página não encontrada
      </h1>
      
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8 text-lg">
        Ops! A página que você está procurando não existe ou ainda está em desenvolvimento.
      </p>
      
      <Link href="/dashboard">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-8 h-12 text-lg rounded-full shadow-lg shadow-blue-600/20">
          <Home size={20} /> Voltar para o Início
        </Button>
      </Link>
    </div>
  );
}