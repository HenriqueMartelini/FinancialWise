import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, Trash2, Edit, Calendar, TrendingUp, Pause, Play, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Goals() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetAmount: "",
    currentAmount: "0",
    targetDate: "",
    priority: "medium" as "low" | "medium" | "high",
    color: "#3b82f6",
  });

  const utils = trpc.useUtils();
  const { data: goals, isLoading } = trpc.goals.list.useQuery();

  const createMutation = trpc.goals.create.useMutation({
    onSuccess: () => {
      utils.goals.list.invalidate();
      setIsOpen(false);
      resetForm();
      toast.success("Meta criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar meta: " + error.message);
    },
  });

  const updateMutation = trpc.goals.update.useMutation({
    onSuccess: () => {
      utils.goals.list.invalidate();
      toast.success("Meta atualizada!");
    },
  });

  const deleteMutation = trpc.goals.delete.useMutation({
    onSuccess: () => {
      utils.goals.list.invalidate();
      toast.success("Meta excluída!");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      targetAmount: "",
      currentAmount: "0",
      targetDate: "",
      priority: "medium",
      color: "#3b82f6",
    });
    setEditingGoal(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      targetAmount: formData.targetAmount,
      currentAmount: formData.currentAmount,
      targetDate: formData.targetDate || undefined,
      priority: formData.priority,
      color: formData.color,
    });
  };

  const handleAddAmount = (goalId: number, currentAmount: string) => {
    const amount = prompt("Quanto você quer adicionar à meta?");
    if (amount && !isNaN(parseFloat(amount))) {
      const newAmount = parseFloat(currentAmount) + parseFloat(amount);
      updateMutation.mutate({
        id: goalId,
        currentAmount: String(newAmount),
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateDaysRemaining = (targetDate: string | Date | null) => {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const today = new Date();
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const calculateMonthlyNeeded = (remaining: number, days: number | null) => {
    if (!days || days <= 0) return null;
    const months = days / 30;
    return remaining / months;
  };

  const activeGoals = goals?.filter(g => g.status === "active") || [];
  const completedGoals = goals?.filter(g => g.status === "completed") || [];
  const pausedGoals = goals?.filter(g => g.status === "paused") || [];

  const priorityColors = {
    low: "bg-blue-100 text-blue-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };

  const priorityLabels = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Metas Financeiras</h1>
          <p className="text-muted-foreground">Visualize e acompanhe seus objetivos</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nova Meta</DialogTitle>
              <DialogDescription>
                Defina um objetivo financeiro para alcançar
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome da Meta *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Viagem para Europa, Carro novo..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva sua meta..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="targetAmount">Valor Alvo *</Label>
                    <Input
                      id="targetAmount"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="currentAmount">Valor Atual</Label>
                    <Input
                      id="currentAmount"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.currentAmount}
                      onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="targetDate">Data Alvo</Label>
                    <Input
                      id="targetDate"
                      type="date"
                      value={formData.targetDate}
                      onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: "low" | "medium" | "high") => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">Cor</Label>
                  <div className="flex gap-2">
                    {["#3b82f6", "#22c55e", "#f97316", "#8b5cf6", "#ef4444", "#ec4899", "#06b6d4", "#eab308"].map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full transition-transform ${formData.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Criar Meta"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Goals */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Metas Ativas ({activeGoals.length})
        </h2>
        {activeGoals.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeGoals.map(goal => {
              const current = parseFloat(goal.currentAmount || "0");
              const target = parseFloat(goal.targetAmount);
              const percentage = (current / target) * 100;
              const remaining = target - current;
              const daysRemaining = calculateDaysRemaining(goal.targetDate);
              const monthlyNeeded = calculateMonthlyNeeded(remaining, daysRemaining);

              return (
                <Card 
                  key={goal.id} 
                  className="border-0 shadow-sm overflow-hidden group"
                >
                  <div className="h-2" style={{ backgroundColor: goal.color || '#3b82f6' }} />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                        {goal.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {goal.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge className={priorityColors[goal.priority || "medium"]}>
                        {priorityLabels[goal.priority || "medium"]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{formatCurrency(current)}</span>
                        <span className="text-muted-foreground">{formatCurrency(target)}</span>
                      </div>
                      <Progress value={Math.min(percentage, 100)} className="h-3" />
                      <p className="text-sm text-muted-foreground mt-1">
                        {percentage.toFixed(0)}% concluído • Faltam {formatCurrency(remaining)}
                      </p>
                    </div>

                    {daysRemaining !== null && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {daysRemaining > 0 ? (
                          <span>{daysRemaining} dias restantes</span>
                        ) : (
                          <span className="text-red-500">Prazo vencido</span>
                        )}
                      </div>
                    )}

                    {monthlyNeeded && monthlyNeeded > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>Guardar {formatCurrency(monthlyNeeded)}/mês</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleAddAmount(goal.id, goal.currentAmount || "0")}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateMutation.mutate({ id: goal.id, status: "paused" })}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Marcar meta como concluída?")) {
                            updateMutation.mutate({ id: goal.id, status: "completed" });
                          }
                        }}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Excluir esta meta?")) {
                            deleteMutation.mutate({ id: goal.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma meta ativa</p>
              <p className="text-sm mt-1">Crie uma meta para começar a acompanhar seus objetivos</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Paused Goals */}
      {pausedGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Pause className="h-5 w-5 text-muted-foreground" />
            Metas Pausadas ({pausedGoals.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pausedGoals.map(goal => {
              const current = parseFloat(goal.currentAmount || "0");
              const target = parseFloat(goal.targetAmount);
              const percentage = (current / target) * 100;

              return (
                <Card key={goal.id} className="border-0 shadow-sm opacity-75">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{goal.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={percentage} className="h-2 mb-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(current)} / {formatCurrency(target)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateMutation.mutate({ id: goal.id, status: "active" })}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Retomar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Metas Concluídas ({completedGoals.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedGoals.map(goal => (
              <Card key={goal.id} className="border-0 shadow-sm bg-green-50/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-lg">{goal.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-green-600 font-semibold">
                    {formatCurrency(parseFloat(goal.targetAmount))}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
