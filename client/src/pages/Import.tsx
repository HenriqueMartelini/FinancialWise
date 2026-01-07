import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUp, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function Import() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ total: number; imported: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const importMutation = trpc.import.parseCSV.useMutation({
    onSuccess: (data) => {
      setResult({ total: data.totalTransactions, imported: data.importedTransactions });
      utils.transactions.list.invalidate();
      utils.transactions.getMonthlyStats.invalidate();
      utils.transactions.getCategoryStats.invalidate();
      toast.success(`${data.importedTransactions} transações importadas com sucesso!`);
    },
    onError: (error) => {
      toast.error("Erro ao importar: " + error.message);
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  const handleFile = async (file: File) => {
    if (!file) return;

    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    const validExtensions = ['.csv', '.ofx', '.txt'];
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      toast.error("Formato de arquivo não suportado. Use CSV ou OFX.");
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const content = await file.text();
      importMutation.mutate({
        content,
        fileName: file.name,
      });
    } catch (error) {
      toast.error("Erro ao ler o arquivo");
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importar Extrato</h1>
        <p className="text-muted-foreground">Importe transações de extratos bancários ou faturas de cartão</p>
      </div>

      {/* Upload Area */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Upload de Arquivo</CardTitle>
          <CardDescription>
            Arraste e solte um arquivo CSV ou OFX, ou clique para selecionar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`
              border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
              ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}
              ${isProcessing ? 'pointer-events-none opacity-50' : ''}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.ofx,.txt"
              className="hidden"
              onChange={handleFileSelect}
            />
            
            {isProcessing ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                <div>
                  <p className="font-medium">Processando arquivo...</p>
                  <p className="text-sm text-muted-foreground">Aguarde enquanto analisamos suas transações</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                  <FileUp className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Arraste seu arquivo aqui</p>
                  <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar</p>
                </div>
                <div className="flex justify-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium">CSV</span>
                  <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium">OFX</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className="border-0 shadow-sm bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800">Importação concluída!</p>
                <p className="text-sm text-green-700">
                  {result.imported} de {result.total} transações importadas com sucesso
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Extrato Bancário (CSV)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Para importar seu extrato bancário:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Acesse o internet banking do seu banco</li>
              <li>Vá em Extrato ou Movimentações</li>
              <li>Selecione o período desejado</li>
              <li>Exporte em formato CSV ou OFX</li>
              <li>Faça upload do arquivo aqui</li>
            </ol>
            <p className="text-xs">
              Bancos suportados: Nubank, Itaú, Bradesco, Santander, Inter, C6 Bank e outros
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Fatura de Cartão (CSV)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Para importar sua fatura de cartão:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Acesse o app ou site do seu cartão</li>
              <li>Vá em Fatura ou Detalhes da fatura</li>
              <li>Procure a opção de exportar/baixar</li>
              <li>Selecione formato CSV ou PDF</li>
              <li>Faça upload do arquivo aqui</li>
            </ol>
            <p className="text-xs">
              Cartões suportados: Nubank, Itaú, Bradesco, Inter, C6 Bank e outros
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Format Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Formato Esperado do CSV</CardTitle>
          <CardDescription>
            Se seu arquivo não for reconhecido automaticamente, use este formato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <p className="text-muted-foreground"># Formato esperado (separador: vírgula ou ponto-e-vírgula)</p>
            <p className="mt-2">Descrição,Valor,Data</p>
            <p>Supermercado Extra,-150.00,2026-01-05</p>
            <p>Salário,5000.00,2026-01-01</p>
            <p>Uber,-25.50,2026-01-03</p>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            * Valores negativos são tratados como despesas, positivos como receitas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
