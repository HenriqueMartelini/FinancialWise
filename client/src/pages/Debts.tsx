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
import { Plus, CreditCard, Trash2, AlertCircle, CheckCircle, Clock, DollarSign } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Debts() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    creditor: "",
    description: "",
    totalAmount: "",
    remainingAmount: "",
    totalInstallments: "",
    installmentAmount: "",
    dueDay: "",
    interestRate: "",
    status: "open" as "open" | "negotiating" | "completed",
  });

  const utils = trpc.useUtils();
  const { data: debts, isLoading } = trpc.debts.list.useQuery();

  const createMutation = trpc.debts.create.useMutation({
    onSuccess: () => {
      utils.debts.list.invalidate();
      setIsOpen(false);
      resetForm();
      toast.success("Dívida cadastrada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar dívida: " + error.message);
    },
  });

  const updateMutation = trpc.debts.update.useMutation({
    onSuccess: () => {
      utils.debts.list.invalidate();
      toast.success("Dívida atualizada!");
    },
  });

  const deleteMutation = trpc.debts.delete.useMutation({
    onSuccess: () => {
      utils.debts.list.invalidate();
      toast.success("Dívida excluída!");
    },
  });

  const addPaymentMutation = trpc.debts.addPayment.useMutation({
    onSuccess: () => {
      utils.debts.list.invalidate();
      toast.success("Pagamento registrado!");
    },
  });

  const resetForm = () => {
    setFormData({
      creditor: "",
      description: "",
      totalAmount: "",
      remainingAmount: "",
      totalInstallments: "",
      installmentAmount: "",
      dueDay: "",
      interestRate: "",
      status: "open",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.creditor || !formData.totalAmount || !formData.remainingAmount) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createMutation.mutate({
      creditor: formData.creditor,
      description: formData.description,
      totalAmount: formData.totalAmount,
      remainingAmount: formData.remainingAmount,
      totalInstallments: formData.totalInstallments ? parseInt(formData.totalInstallments) : undefined,
      installmentAmount: formData.installmentAmount || undefined,
      dueDay: formData.dueDay ? parseInt(formData.dueDay) : undefined,
      interestRate: formData.interestRate || undefined,
      status: formData.status,
    });
  };

  const handlePayInstallment = (debt: any) => {
    const amount = prompt("Valor do pagamento:", debt.installmentAmount || "");
    if (amount && !isNaN(parseFloat(amount))) {
      const newRemaining = Math.max(0, parseFloat(debt.remainingAmount) - parseFloat(amount));
      const newPaidInstallments = (debt.paidInstallments || 0) + 1;
      
      addPaymentMutation.mutate({
        debtId: debt.id,
        amount,
        paymentDate: new Date().toISOString().split("T")[0],
        installmentNumber: newPaidInstallments,
      });

      updateMutation.mutate({
        id: debt.id,
        remainingAmount: String(newRemaining),
        paidInstallments: newPaidInstallments,
        status: newRemaining <= 0 ? "completed" : debt.status,
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const openDebts = debts?.filter(d => d.status === "open") || [];
  const negotiatingDebts = debts?.filter(d => d.status === "negotiating") || [];
  const completedDebts = debts?.filter(d => d.status === "completed") || [];

  const totalDebt = debts?.reduce((sum, d) => sum + parseFloat(d.remainingAmount), 0) || 0;
  const totalOpenDebt = openDebts.reduce((sum, d) => sum + parseFloat(d.remainingAmount), 0);

  const statusConfig = {
    open: { label: "Em Aberto", color: "bg-red-100 text-red-700", icon: AlertCircle },
    negotiating: { label: "Em Negociação", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    completed: { label: "Quitada", color: "bg-green-100 text-green-700", icon: CheckCircle },
  };

  const DebtCard = ({ debt }: { debt: any }) => {
    const total = parseFloat(debt.totalAmount);
    const remaining = parseFloat(debt.remainingAmount);
    const paid = total - remaining;
    const percentage = (paid / total) * 100;
    const config = statusConfig[debt.status as keyof typeof statusConfig];
    const StatusIcon = config.icon;

    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                {debt.creditor}
              </CardTitle>
              {debt.description && (
                <CardDescription className="mt-1">{debt.description}</CardDescription>
              )}
            </div>
            <Badge className={config.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Pago: {formatCurrency(paid)}</span>
              <span className="text-muted-foreground">Total: {formatCurrency(total)}</span>
            </div>
            <Progress value={percentage} className="h-2" />
            <p className="text-sm text-muted-foreground mt-1">
              {percentage.toFixed(0)}% quitado • Restam {formatCurrency(remaining)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {debt.totalInstallments && (
              <div>
                <p className="text-muted-foreground">Parcelas</p>
                <p className="font-medium">{debt.paidInstallments || 0}/{debt.totalInstallments}</p>
              </div>
            )}
            {debt.installmentAmount && (
              <div>
                <p className="text-muted-foreground">Valor Parcela</p>
                <p className="font-medium">{formatCurrency(parseFloat(debt.installmentAmount))}</p>
              </div>
            )}
            {debt.dueDay && (
              <div>
                <p className="text-muted-foreground">Vencimento</p>
                <p className="font-medium">Dia {debt.dueDay}</p>
              </div>
            )}
            {debt.interestRate && (
              <div>
                <p className="text-muted-foreground">Juros</p>
                <p className="font-medium">{debt.interestRate}%</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            {debt.status !== "completed" && (
              <>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handlePayInstallment(debt)}
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Pagar
                </Button>
                <Select
                  value={debt.status}
                  onValueChange={(value: "open" | "negotiating" | "completed") => 
                    updateMutation.mutate({ id: debt.id, status: value })
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Em Aberto</SelectItem>
                    <SelectItem value="negotiating">Negociando</SelectItem>
                    <SelectItem value="completed">Quitada</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("Excluir esta dívida?")) {
                  deleteMutation.mutate({ id: debt.id });
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rastreador de Dívidas</h1>
          <p className="text-muted-foreground">Controle e quite suas dívidas</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Dívida
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Dívida</DialogTitle>
              <DialogDescription>
                Adicione uma dívida para acompanhar o pagamento
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid gap-2">
                  <Label htmlFor="creditor">Credor *</Label>
                  <Input
                    id="creditor"
                    placeholder="Ex: Banco, Loja, Pessoa..."
                    value={formData.creditor}
                    onChange={(e) => setFormData({ ...formData, creditor: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Detalhes da dívida..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="totalAmount">Valor Total *</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value, remainingAmount: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="remainingAmount">Valor Restante *</Label>
                    <Input
                      id="remainingAmount"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.remainingAmount}
                      onChange={(e) => setFormData({ ...formData, remainingAmount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="totalInstallments">Nº de Parcelas</Label>
                    <Input
                      id="totalInstallments"
                      type="number"
                      placeholder="12"
                      value={formData.totalInstallments}
                      onChange={(e) => setFormData({ ...formData, totalInstallments: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="installmentAmount">Valor da Parcela</Label>
                    <Input
                      id="installmentAmount"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.installmentAmount}
                      onChange={(e) => setFormData({ ...formData, installmentAmount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dueDay">Dia do Vencimento</Label>
                    <Input
                      id="dueDay"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="15"
                      value={formData.dueDay}
                      onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="interestRate">Taxa de Juros (%)</Label>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.01"
                      placeholder="2.5"
                      value={formData.interestRate}
                      onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "open" | "negotiating" | "completed") => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Em Aberto</SelectItem>
                      <SelectItem value="negotiating">Em Negociação</SelectItem>
                      <SelectItem value="completed">Quitada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-sm bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Total em Dívidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{formatCurrency(totalDebt)}</div>
            <p className="text-xs text-red-600 mt-1">{debts?.length || 0} dívidas cadastradas</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Em Aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{formatCurrency(totalOpenDebt)}</div>
            <p className="text-xs text-yellow-600 mt-1">{openDebts.length} dívidas</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Quitadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{completedDebts.length}</div>
            <p className="text-xs text-green-600 mt-1">dívidas quitadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Debts Lists */}
      {openDebts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Em Aberto ({openDebts.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {openDebts.map(debt => <DebtCard key={debt.id} debt={debt} />)}
          </div>
        </div>
      )}

      {negotiatingDebts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Em Negociação ({negotiatingDebts.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {negotiatingDebts.map(debt => <DebtCard key={debt.id} debt={debt} />)}
          </div>
        </div>
      )}

      {completedDebts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Quitadas ({completedDebts.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completedDebts.map(debt => <DebtCard key={debt.id} debt={debt} />)}
          </div>
        </div>
      )}

      {(!debts || debts.length === 0) && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma dívida cadastrada</p>
            <p className="text-sm mt-1">Adicione suas dívidas para acompanhar o pagamento</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
