import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowUpRight, ArrowDownRight, Search, Filter, Trash2, Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Transactions() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    categoryId: "",
    isPaid: true,
  });

  const utils = trpc.useUtils();
  const { data: transactions, isLoading } = trpc.transactions.list.useQuery({});
  const { data: categories } = trpc.categories.list.useQuery();
  
  const createMutation = trpc.transactions.create.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      utils.transactions.getMonthlyStats.invalidate();
      utils.transactions.getCategoryStats.invalidate();
      setIsOpen(false);
      resetForm();
      toast.success("Transação criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar transação: " + error.message);
    },
  });

  const deleteMutation = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      utils.transactions.getMonthlyStats.invalidate();
      utils.transactions.getCategoryStats.invalidate();
      toast.success("Transação excluída!");
    },
  });

  const resetForm = () => {
    setFormData({
      type: "expense",
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      categoryId: "",
      isPaid: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createMutation.mutate({
      ...formData,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const filteredTransactions = transactions?.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const expenseCategories = categories?.filter(c => c.type === "expense") || [];
  const incomeCategories = categories?.filter(c => c.type === "income") || [];
  const currentCategories = formData.type === "expense" ? expenseCategories : incomeCategories;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground">Gerencie suas receitas e despesas</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
              <DialogDescription>
                Adicione uma nova receita ou despesa
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formData.type === "expense" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setFormData({ ...formData, type: "expense", categoryId: "" })}
                    >
                      <ArrowDownRight className="h-4 w-4 mr-2" />
                      Despesa
                    </Button>
                    <Button
                      type="button"
                      variant={formData.type === "income" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setFormData({ ...formData, type: "income", categoryId: "" })}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Receita
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Valor *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    placeholder="Ex: Supermercado, Salário..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentCategories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
          <CardDescription>
            {filteredTransactions?.length || 0} transações encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredTransactions && filteredTransactions.length > 0 ? (
            <div className="space-y-2">
              {filteredTransactions.map((t) => {
                const category = categories?.find(c => c.id === t.categoryId);
                return (
                  <div 
                    key={t.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        t.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {t.type === 'income' ? (
                          <ArrowUpRight className="h-6 w-6 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-6 w-6 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{t.description || 'Sem descrição'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">{formatDate(t.date)}</span>
                          {category && (
                            <Badge variant="secondary" className="text-xs">
                              {category.icon} {category.name}
                            </Badge>
                          )}
                          {t.source === "whatsapp" && (
                            <Badge variant="outline" className="text-xs">WhatsApp</Badge>
                          )}
                          {t.source === "import" && (
                            <Badge variant="outline" className="text-xs">Importado</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-bold text-lg ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(t.amount))}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir esta transação?")) {
                            deleteMutation.mutate({ id: t.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma transação encontrada</p>
              <p className="text-sm mt-1">Clique em "Nova Transação" para começar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
