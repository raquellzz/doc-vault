import { Construction, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  return (
    <div className="h-full min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-amber-100 dark:bg-amber-900/30 p-6 rounded-3xl mb-6">
        <Construction className="h-12 w-12 text-amber-600 dark:text-amber-500" />
      </div>
      
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
        Em Construção
      </h1>
      
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
        Estamos trabalhando duro para trazer essa funcionalidade para você em breve! 
        Aqui você poderá editar seus dados e preferências.
      </p>
      
      <Link href="/dashboard">
        <Button variant="outline" className="gap-2 border-slate-300 dark:border-slate-700">
          <ArrowLeft size={16} /> Voltar ao Dashboard
        </Button>
      </Link>
    </div>
  );
}