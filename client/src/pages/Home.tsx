import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Target,
  CreditCard
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useEffect, useState } from "react";

export default function Home() {
  const [currentDate] = useState(() => new Date());
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data: stats, isLoading: statsLoading } = trpc.transactions.getMonthlyStats.useQuery({ month, year });
  const { data: categoryStats, isLoading: categoryLoading } = trpc.transactions.getCategoryStats.useQuery({ month, year });
  const { data: transactions, isLoading: transactionsLoading } = trpc.transactions.list.useQuery({ limit: 5 });
  const { data: goals } = trpc.goals.list.useQuery();
  const { data: debts } = trpc.debts.list.useQuery();
  const { data: accounts } = trpc.bankAccounts.list.useQuery();
  const { data: cards } = trpc.creditCards.list.useQuery();

  const seedMutation = trpc.seed.categories.useMutation();

  useEffect(() => {
    seedMutation.mutate();
  }, []);

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
      month: 'short'
    }).format(date);
  };

  const totalBalance = accounts?.reduce((sum, acc) => sum + parseFloat(acc.balance || "0"), 0) || 0;
  const totalCardBalance = cards?.reduce((sum, card) => sum + parseFloat(card.currentBalance || "0"), 0) || 0;
  const activeGoals = goals?.filter(g => g.status === "active") || [];
  const openDebts = debts?.filter(d => d.status !== "completed") || [];

  const pieColors = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#eab308'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das suas finanças em {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentDate)}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receitas</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats?.income || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <ArrowUpRight className="inline h-3 w-3 text-green-500" /> Este mês
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats?.expense || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <ArrowDownRight className="inline h-3 w-3 text-red-500" /> Este mês
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo do Mês</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${(stats?.balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(stats?.balance || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Receitas - Despesas
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Total</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <PiggyBank className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Em todas as contas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Category Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Gastos por Categoria</CardTitle>
            <CardDescription>Distribuição das despesas do mês</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryLoading ? (
              <div className="h-[250px] flex items-center justify-center">
                <Skeleton className="h-[200px] w-[200px] rounded-full" />
              </div>
            ) : categoryStats && categoryStats.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryStats.map((cat, i) => ({
                        name: cat.categoryName || 'Outros',
                        value: parseFloat(cat.total || "0"),
                        color: cat.categoryColor || pieColors[i % pieColors.length]
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryStats.map((cat, index) => (
                        <Cell key={`cell-${index}`} fill={cat.categoryColor || pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: 'none', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhuma despesa registrada este mês
              </div>
            )}
            {categoryStats && categoryStats.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {categoryStats.slice(0, 6).map((cat, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: cat.categoryColor || pieColors[i % pieColors.length] }}
                    />
                    <span className="truncate">{cat.categoryIcon} {cat.categoryName}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Transações Recentes</CardTitle>
            <CardDescription>Últimas movimentações</CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        t.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {t.type === 'income' ? (
                          <ArrowUpRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{t.description || 'Sem descrição'}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(t.amount))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhuma transação registrada
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Goals Summary */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Metas</CardTitle>
              <CardDescription>{activeGoals.length} metas ativas</CardDescription>
            </div>
            <Target className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {activeGoals.length > 0 ? (
              <div className="space-y-3">
                {activeGoals.slice(0, 3).map(goal => {
                  const progress = (parseFloat(goal.currentAmount || "0") / parseFloat(goal.targetAmount)) * 100;
                  return (
                    <div key={goal.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium truncate">{goal.name}</span>
                        <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhuma meta cadastrada</p>
            )}
          </CardContent>
        </Card>

        {/* Debts Summary */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Dívidas</CardTitle>
              <CardDescription>{openDebts.length} dívidas em aberto</CardDescription>
            </div>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {openDebts.length > 0 ? (
              <div className="space-y-3">
                {openDebts.slice(0, 3).map(debt => (
                  <div key={debt.id} className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm truncate">{debt.creditor}</p>
                      <p className="text-xs text-muted-foreground">
                        {debt.paidInstallments}/{debt.totalInstallments} parcelas
                      </p>
                    </div>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(parseFloat(debt.remainingAmount))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhuma dívida cadastrada</p>
            )}
          </CardContent>
        </Card>

        {/* Cards Summary */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Cartões</CardTitle>
              <CardDescription>Fatura atual</CardDescription>
            </div>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {cards && cards.length > 0 ? (
              <div className="space-y-3">
                {cards.slice(0, 3).map(card => {
                  const usage = (parseFloat(card.currentBalance || "0") / parseFloat(card.creditLimit || "1")) * 100;
                  return (
                    <div key={card.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{card.name}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(parseFloat(card.currentBalance || "0"))}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${usage > 80 ? 'bg-red-500' : usage > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(usage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhum cartão cadastrado</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
