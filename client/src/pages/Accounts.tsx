import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Plus, Wallet, CreditCard, Trash2, Building2, PiggyBank, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Accounts() {
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  
  const [accountForm, setAccountForm] = useState({
    name: "",
    bankName: "",
    accountType: "checking" as "checking" | "savings" | "investment",
    balance: "",
    color: "#3b82f6",
  });

  const [cardForm, setCardForm] = useState({
    name: "",
    lastFourDigits: "",
    brand: "",
    creditLimit: "",
    closingDay: "",
    dueDay: "",
    color: "#8b5cf6",
  });

  const utils = trpc.useUtils();
  const { data: accounts, isLoading: accountsLoading } = trpc.bankAccounts.list.useQuery();
  const { data: cards, isLoading: cardsLoading } = trpc.creditCards.list.useQuery();

  const createAccountMutation = trpc.bankAccounts.create.useMutation({
    onSuccess: () => {
      utils.bankAccounts.list.invalidate();
      setAccountDialogOpen(false);
      resetAccountForm();
      toast.success("Conta criada com sucesso!");
    },
  });

  const deleteAccountMutation = trpc.bankAccounts.delete.useMutation({
    onSuccess: () => {
      utils.bankAccounts.list.invalidate();
      toast.success("Conta excluída!");
    },
  });

  const createCardMutation = trpc.creditCards.create.useMutation({
    onSuccess: () => {
      utils.creditCards.list.invalidate();
      setCardDialogOpen(false);
      resetCardForm();
      toast.success("Cartão criado com sucesso!");
    },
  });

  const deleteCardMutation = trpc.creditCards.delete.useMutation({
    onSuccess: () => {
      utils.creditCards.list.invalidate();
      toast.success("Cartão excluído!");
    },
  });

  const resetAccountForm = () => {
    setAccountForm({
      name: "",
      bankName: "",
      accountType: "checking",
      balance: "",
      color: "#3b82f6",
    });
  };

  const resetCardForm = () => {
    setCardForm({
      name: "",
      lastFourDigits: "",
      brand: "",
      creditLimit: "",
      closingDay: "",
      dueDay: "",
      color: "#8b5cf6",
    });
  };

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.name) {
      toast.error("Nome da conta é obrigatório");
      return;
    }
    createAccountMutation.mutate({
      name: accountForm.name,
      bankName: accountForm.bankName || undefined,
      accountType: accountForm.accountType,
      balance: accountForm.balance || "0",
      color: accountForm.color,
    });
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardForm.name) {
      toast.error("Nome do cartão é obrigatório");
      return;
    }
    createCardMutation.mutate({
      name: cardForm.name,
      lastFourDigits: cardForm.lastFourDigits || undefined,
      brand: cardForm.brand || undefined,
      creditLimit: cardForm.creditLimit || "0",
      closingDay: cardForm.closingDay ? parseInt(cardForm.closingDay) : undefined,
      dueDay: cardForm.dueDay ? parseInt(cardForm.dueDay) : undefined,
      color: cardForm.color,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalBalance = accounts?.reduce((sum, acc) => sum + parseFloat(acc.balance || "0"), 0) || 0;
  const totalLimit = cards?.reduce((sum, card) => sum + parseFloat(card.creditLimit || "0"), 0) || 0;
  const totalCardBalance = cards?.reduce((sum, card) => sum + parseFloat(card.currentBalance || "0"), 0) || 0;

  const accountTypeIcons = {
    checking: Wallet,
    savings: PiggyBank,
    investment: TrendingUp,
  };

  const accountTypeLabels = {
    checking: "Conta Corrente",
    savings: "Poupança",
    investment: "Investimento",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contas e Cartões</h1>
        <p className="text-muted-foreground">Gerencie suas contas bancárias e cartões de crédito</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo em Contas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{accounts?.length || 0} contas</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Limite Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalLimit)}</div>
            <p className="text-xs text-muted-foreground mt-1">{cards?.length || 0} cartões</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fatura Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalCardBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalLimit > 0 ? `${((totalCardBalance / totalLimit) * 100).toFixed(0)}% do limite` : 'Sem limite'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts" className="gap-2">
            <Wallet className="h-4 w-4" />
            Contas Bancárias
          </TabsTrigger>
          <TabsTrigger value="cards" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Cartões de Crédito
          </TabsTrigger>
        </TabsList>

        {/* Bank Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Conta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Conta Bancária</DialogTitle>
                  <DialogDescription>Adicione uma conta para controlar seu saldo</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAccountSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="accountName">Nome da Conta *</Label>
                      <Input
                        id="accountName"
                        placeholder="Ex: Conta Principal, Reserva..."
                        value={accountForm.name}
                        onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="bankName">Banco</Label>
                      <Input
                        id="bankName"
                        placeholder="Ex: Nubank, Itaú..."
                        value={accountForm.bankName}
                        onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="accountType">Tipo de Conta</Label>
                      <Select
                        value={accountForm.accountType}
                        onValueChange={(value: "checking" | "savings" | "investment") => 
                          setAccountForm({ ...accountForm, accountType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Conta Corrente</SelectItem>
                          <SelectItem value="savings">Poupança</SelectItem>
                          <SelectItem value="investment">Investimento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="balance">Saldo Atual</Label>
                      <Input
                        id="balance"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={accountForm.balance}
                        onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Cor</Label>
                      <div className="flex gap-2">
                        {["#3b82f6", "#22c55e", "#f97316", "#8b5cf6", "#ef4444", "#ec4899"].map(color => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-full transition-transform ${accountForm.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setAccountForm({ ...accountForm, color })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setAccountDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createAccountMutation.isPending}>
                      {createAccountMutation.isPending ? "Salvando..." : "Criar Conta"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {accounts && accounts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map(account => {
                const Icon = accountTypeIcons[account.accountType || "checking"];
                const balance = parseFloat(account.balance || "0");
                
                return (
                  <Card key={account.id} className="border-0 shadow-sm overflow-hidden group">
                    <div className="h-2" style={{ backgroundColor: account.color || '#3b82f6' }} />
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${account.color || '#3b82f6'}20` }}
                          >
                            <Icon className="h-5 w-5" style={{ color: account.color || '#3b82f6' }} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{account.name}</CardTitle>
                            <CardDescription>
                              {account.bankName && `${account.bankName} • `}
                              {accountTypeLabels[account.accountType || "checking"]}
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            if (confirm("Excluir esta conta?")) {
                              deleteAccountMutation.mutate({ id: account.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${balance >= 0 ? 'text-foreground' : 'text-red-600'}`}>
                        {formatCurrency(balance)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conta cadastrada</p>
                <p className="text-sm mt-1">Adicione suas contas bancárias para controlar seus saldos</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Credit Cards Tab */}
        <TabsContent value="cards" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={cardDialogOpen} onOpenChange={setCardDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Cartão
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Cartão de Crédito</DialogTitle>
                  <DialogDescription>Adicione um cartão para controlar sua fatura</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCardSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cardName">Nome do Cartão *</Label>
                      <Input
                        id="cardName"
                        placeholder="Ex: Nubank, Itaú Platinum..."
                        value={cardForm.name}
                        onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="lastFour">Últimos 4 dígitos</Label>
                        <Input
                          id="lastFour"
                          maxLength={4}
                          placeholder="1234"
                          value={cardForm.lastFourDigits}
                          onChange={(e) => setCardForm({ ...cardForm, lastFourDigits: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="brand">Bandeira</Label>
                        <Select
                          value={cardForm.brand}
                          onValueChange={(value) => setCardForm({ ...cardForm, brand: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="visa">Visa</SelectItem>
                            <SelectItem value="mastercard">Mastercard</SelectItem>
                            <SelectItem value="elo">Elo</SelectItem>
                            <SelectItem value="amex">American Express</SelectItem>
                            <SelectItem value="hipercard">Hipercard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="creditLimit">Limite de Crédito</Label>
                      <Input
                        id="creditLimit"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={cardForm.creditLimit}
                        onChange={(e) => setCardForm({ ...cardForm, creditLimit: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="closingDay">Dia de Fechamento</Label>
                        <Input
                          id="closingDay"
                          type="number"
                          min="1"
                          max="31"
                          placeholder="15"
                          value={cardForm.closingDay}
                          onChange={(e) => setCardForm({ ...cardForm, closingDay: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="dueDay">Dia de Vencimento</Label>
                        <Input
                          id="dueDay"
                          type="number"
                          min="1"
                          max="31"
                          placeholder="25"
                          value={cardForm.dueDay}
                          onChange={(e) => setCardForm({ ...cardForm, dueDay: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Cor</Label>
                      <div className="flex gap-2">
                        {["#8b5cf6", "#3b82f6", "#22c55e", "#f97316", "#ef4444", "#ec4899"].map(color => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-full transition-transform ${cardForm.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setCardForm({ ...cardForm, color })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCardDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createCardMutation.isPending}>
                      {createCardMutation.isPending ? "Salvando..." : "Criar Cartão"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {cards && cards.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cards.map(card => {
                const limit = parseFloat(card.creditLimit || "0");
                const balance = parseFloat(card.currentBalance || "0");
                const usage = limit > 0 ? (balance / limit) * 100 : 0;
                
                return (
                  <Card key={card.id} className="border-0 shadow-sm overflow-hidden group">
                    <div className="h-2" style={{ backgroundColor: card.color || '#8b5cf6' }} />
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${card.color || '#8b5cf6'}20` }}
                          >
                            <CreditCard className="h-5 w-5" style={{ color: card.color || '#8b5cf6' }} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{card.name}</CardTitle>
                            <CardDescription>
                              {card.brand && `${card.brand.toUpperCase()} `}
                              {card.lastFourDigits && `•••• ${card.lastFourDigits}`}
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            if (confirm("Excluir este cartão?")) {
                              deleteCardMutation.mutate({ id: card.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Fatura: {formatCurrency(balance)}</span>
                          <span className="text-muted-foreground">Limite: {formatCurrency(limit)}</span>
                        </div>
                        <Progress 
                          value={usage} 
                          className={`h-2 ${usage > 80 ? '[&>div]:bg-red-500' : usage > 50 ? '[&>div]:bg-yellow-500' : ''}`}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        {card.closingDay && <span>Fecha dia {card.closingDay}</span>}
                        {card.dueDay && <span>Vence dia {card.dueDay}</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum cartão cadastrado</p>
                <p className="text-sm mt-1">Adicione seus cartões de crédito para controlar suas faturas</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
