"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileUp, FileText, Download } from "lucide-react";
// MUDANÇA AQUI: Importamos 'toast' direto da lib sonner
import { toast } from "sonner"; 

interface Document {
  id: string;
  filename: string;
  status: string;
  created_at: string;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  // Removemos o hook 'useToast', o sonner não precisa disso.

  const fetchDocs = async () => {
    try {
      const res = await api.get("/v1/documents");
      setDocs(res.data);
    } catch (error) {
      console.error("Erro ao buscar docs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/v1/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      toast.success("Upload iniciado com sucesso!"); 
      
      setOpenDialog(false);
      setFile(null);
      fetchDocs(); 
    } catch (error) {
      toast.error("Falha ao fazer upload do arquivo.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar?")) return;
    try {
      await api.delete(`/v1/documents/${id}`);
      setDocs(docs.filter((d) => d.id !== id));
      toast.success("Documento removido.");
    } catch (error) {
      toast.error("Erro ao deletar documento.");
    }
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
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8 text-blue-600" /> Meus Documentos
        </h1>
        
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <FileUp className="mr-2 h-4 w-4" /> Novo Upload
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar PDF</DialogTitle>
              <DialogDescription>
                Selecione um arquivo PDF do seu computador para processamento pela IA.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input 
                type="file" 
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
              />
              <Button onClick={handleUpload} disabled={!file}>
                Enviar Agora
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg shadow-sm bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Arquivo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center h-24">Carregando...</TableCell></TableRow>
            ) : docs.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center h-24 text-gray-500">Nenhum documento encontrado.</TableCell></TableRow>
            ) : (
              docs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.filename}</TableCell>
                  <TableCell>{doc.created_at}</TableCell>
                  <TableCell>
                    <Badge variant={doc.status === "active" ? "default" : "secondary"} className={doc.status === "active" ? "bg-emerald-500" : "bg-yellow-500"}>
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                     <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDownload(doc.id, doc.filename)}
                      title="Baixar PDF"
                    >
                      <Download className="h-4 w-4 text-gray-600" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}