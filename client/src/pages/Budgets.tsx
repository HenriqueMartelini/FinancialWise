import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Budgets() {
  const [currentDate] = useState(() => new Date());
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: "",
    amount: "",
    alertThreshold: "80",
  });

  const utils = trpc.useUtils();
  const { data: budgets, isLoading } = trpc.budgets.list.useQuery({ month, year });
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: categoryStats } = trpc.transactions.getCategoryStats.useQuery({ month, year });

  const createMutation = trpc.budgets.create.useMutation({
    onSuccess: () => {
      utils.budgets.list.invalidate();
      setIsOpen(false);
      resetForm();
      toast.success("Orçamento criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar orçamento: " + error.message);
    },
  });

  const deleteMutation = trpc.budgets.delete.useMutation({
    onSuccess: () => {
      utils.budgets.list.invalidate();
      toast.success("Orçamento excluído!");
    },
  });

  const resetForm = () => {
    setFormData({
      categoryId: "",
      amount: "",
      alertThreshold: "80",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.amount) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createMutation.mutate({
      categoryId: parseInt(formData.categoryId),
      amount: formData.amount,
      month,
      year,
      alertThreshold: parseInt(formData.alertThreshold),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const expenseCategories = categories?.filter(c => c.type === "expense") || [];
  const usedCategoryIds = budgets?.map(b => b.budget.categoryId) || [];
  const availableCategories = expenseCategories.filter(c => !usedCategoryIds.includes(c.id));

  // Calculate spent amounts from categoryStats
  const getSpentAmount = (categoryId: number) => {
    const stat = categoryStats?.find(s => s.categoryId === categoryId);
    return stat ? parseFloat(stat.total || "0") : 0;
  };

  const totalBudget = budgets?.reduce((sum, b) => sum + parseFloat(b.budget.amount), 0) || 0;
  const totalSpent = budgets?.reduce((sum, b) => sum + getSpentAmount(b.budget.categoryId), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-muted-foreground">
            Planeje seus gastos para {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentDate)}
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={availableCategories.length === 0}>
              <Plus className="h-4 w-4" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Novo Orçamento</DialogTitle>
              <DialogDescription>
                Defina um limite de gastos para uma categoria
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Limite Mensal *</Label>
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
                  <Label htmlFor="threshold">Alerta em (%)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.alertThreshold}
                    onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Você será alertado quando atingir este percentual do limite
                  </p>
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orçado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalSpent > totalBudget ? 'text-red-600' : ''}`}>
              {formatCurrency(totalSpent)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disponível</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalBudget - totalSpent < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(totalBudget - totalSpent)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budgets List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Orçamentos por Categoria</CardTitle>
          <CardDescription>
            Acompanhe seus gastos em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : budgets && budgets.length > 0 ? (
            <div className="space-y-4">
              {budgets.map(({ budget, category }) => {
                const spent = getSpentAmount(budget.categoryId);
                const limit = parseFloat(budget.amount);
                const percentage = (spent / limit) * 100;
                const isOverBudget = percentage > 100;
                const isWarning = percentage >= (budget.alertThreshold || 80);
                
                return (
                  <div 
                    key={budget.id} 
                    className={`p-4 rounded-xl border ${
                      isOverBudget ? 'border-red-200 bg-red-50' : 
                      isWarning ? 'border-yellow-200 bg-yellow-50' : 
                      'border-border bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                          style={{ backgroundColor: category?.color ? `${category.color}20` : '#f3f4f6' }}
                        >
                          {category?.icon || '📦'}
                        </div>
                        <div>
                          <h3 className="font-semibold">{category?.name || 'Categoria'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(spent)} de {formatCurrency(limit)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOverBudget ? (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        ) : isWarning ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja excluir este orçamento?")) {
                              deleteMutation.mutate({ id: budget.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className={isOverBudget ? 'text-red-600 font-medium' : ''}>
                          {percentage.toFixed(0)}% utilizado
                        </span>
                        <span className="text-muted-foreground">
                          Restam {formatCurrency(Math.max(0, limit - spent))}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className={`h-2 ${isOverBudget ? '[&>div]:bg-red-500' : isWarning ? '[&>div]:bg-yellow-500' : ''}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum orçamento definido</p>
              <p className="text-sm mt-1">Crie orçamentos para controlar seus gastos por categoria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
