"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, FileText, Download, Upload, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner"; 

interface Document {
  id: string;
  filename: string;
  status: string;
  created_at: string;
}


export default function DocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  
  useEffect(() => {
    if (status === "loading") return;
    
    const isAdmin = session?.roles?.includes("admin");
    
    if (!isAdmin) {
        toast.error("Acesso restrito a administradores.");
        router.push("/dashboard/chat");
    }
  }, [session, status, router]);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/v1/documents");
      setDocs(res.data);
    } catch (error) {
      console.error("Erro ao buscar docs", error);
      toast.error("Não foi possível carregar os documentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.roles?.includes("admin")) {
        fetchDocs();
    }
  }, [status, session]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/v1/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      toast.success("Arquivo enviado com sucesso!"); 
      
      setOpenDialog(false);
      setFile(null);
      fetchDocs(); 
    } catch (error) {
      toast.error("Falha ao fazer upload do arquivo.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    toast("Tem certeza?", {
        action: {
            label: "Excluir",
            onClick: async () => {
                try {
                    await api.delete(`/v1/documents/${id}`);
                    setDocs(docs.filter((d) => d.id !== id));
                    toast.success("Documento removido.");
                } catch (error) {
                    toast.error("Erro ao deletar.");
                }
            }
        }
    });
  };

  const handleDownload = async (id: string, filename: string) => {
    try {
      const response = await api.get(`/v1/documents/${id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename); 
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Download iniciado.");
    } catch (error) {
      toast.error("Erro ao baixar arquivo.");
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Biblioteca de Arquivos
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                Gerencie os PDFs que alimentam a inteligência artificial.
            </p>
        </div>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm">
                    <Plus size={18} /> Novo Upload
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="text-slate-900 dark:text-slate-100">Enviar Documento</DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400">
                        Selecione um arquivo PDF do seu computador.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-slate-400" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {file ? file.name : "Clique para selecionar ou arraste aqui"}
                                </p>
                            </div>
                            <Input 
                                id="file-upload" 
                                type="file" 
                                accept=".pdf"
                                className="hidden" 
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                        </label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenDialog(false)} disabled={uploading}>Cancelar</Button>
                    <Button onClick={handleUpload} disabled={!file || uploading} className="bg-blue-600 text-white">
                        {uploading ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : null}
                        {uploading ? "Enviando..." : "Enviar Arquivo"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="rounded-none border-0">
            <Table>
              <TableHeader className="bg-transparent border-b border-slate-100 dark:border-slate-800">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-[40%] text-slate-900 dark:text-slate-100 font-semibold pl-6 h-12">Nome do Arquivo</TableHead>
                  <TableHead className="text-slate-900 dark:text-slate-100 font-semibold h-12">Data de Envio</TableHead>
                  <TableHead className="text-slate-900 dark:text-slate-100 font-semibold h-12">Status</TableHead>
                  <TableHead className="text-right text-slate-900 dark:text-slate-100 font-semibold pr-6 h-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-slate-500">Carregando documentos...</TableCell>
                    </TableRow>
                ) : docs.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-slate-500 dark:text-slate-400">
                            Nenhum documento encontrado. Faça seu primeiro upload!
                        </TableCell>
                    </TableRow>
                ) : (
                    docs.map((doc) => (
                    <TableRow key={doc.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                        <TableCell className="font-medium text-slate-700 dark:text-slate-200 pl-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                <FileText size={18} />
                              </div>
                              <span className="truncate max-w-[200px] md:max-w-md font-medium" title={doc.filename}>{doc.filename}</span>
                           </div>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                            {new Date(doc.created_at).toLocaleDateString('pt-BR')} 
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100 border-0 font-medium">
                            Processado
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDownload(doc.id, doc.filename)}
                                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
                                title="Baixar"
                              >
                                <Download size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDelete(doc.id)}
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </Button>
                          </div>
                        </TableCell>
                    </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}