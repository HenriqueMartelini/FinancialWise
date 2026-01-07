import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Sparkles, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function Insights() {
  const [currentDate] = useState(() => new Date());
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data: stats, isLoading: statsLoading } = trpc.transactions.getMonthlyStats.useQuery({ month, year });
  const { data: categoryStats, isLoading: categoryLoading } = trpc.transactions.getCategoryStats.useQuery({ month, year });
  
  const generateMutation = trpc.insights.generate.useMutation({
    onSuccess: () => {
      toast.success("Insights gerados com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar insights: " + error.message);
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const income = stats?.income || 0;
  const expense = stats?.expense || 0;
  const balance = stats?.balance || 0;
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  // Generate automatic insights based on data
  const getAutomaticInsights = () => {
    const insights: { type: "positive" | "negative" | "warning" | "tip"; title: string; description: string }[] = [];

    // Savings rate insight
    if (savingsRate >= 20) {
      insights.push({
        type: "positive",
        title: "Excelente taxa de poupança!",
        description: `Você está economizando ${savingsRate.toFixed(0)}% da sua renda. Continue assim para alcançar suas metas mais rápido.`
      });
    } else if (savingsRate >= 10) {
      insights.push({
        type: "tip",
        title: "Boa taxa de poupança",
        description: `Você está economizando ${savingsRate.toFixed(0)}% da sua renda. Tente aumentar para 20% para acelerar suas metas.`
      });
    } else if (savingsRate > 0) {
      insights.push({
        type: "warning",
        title: "Taxa de poupança baixa",
        description: `Você está economizando apenas ${savingsRate.toFixed(0)}% da sua renda. Revise seus gastos para aumentar sua poupança.`
      });
    } else if (savingsRate < 0) {
      insights.push({
        type: "negative",
        title: "Gastos acima da renda",
        description: `Você está gastando mais do que ganha. Revise urgentemente seus gastos para evitar dívidas.`
      });
    }

    // Category insights
    if (categoryStats && categoryStats.length > 0) {
      const topCategory = categoryStats[0];
      const topAmount = parseFloat(topCategory.total || "0");
      const topPercentage = expense > 0 ? (topAmount / expense) * 100 : 0;

      if (topPercentage > 40) {
        insights.push({
          type: "warning",
          title: `${topCategory.categoryName} representa ${topPercentage.toFixed(0)}% dos gastos`,
          description: `Considere revisar seus gastos com ${topCategory.categoryName?.toLowerCase()}. Uma concentração muito alta em uma categoria pode indicar oportunidades de economia.`
        });
      }

      // Food spending insight
      const foodCategory = categoryStats.find(c => 
        c.categoryName?.toLowerCase().includes("alimentação") || 
        c.categoryName?.toLowerCase().includes("restaurante")
      );
      if (foodCategory) {
        const foodAmount = parseFloat(foodCategory.total || "0");
        const foodPercentage = expense > 0 ? (foodAmount / expense) * 100 : 0;
        if (foodPercentage > 25) {
          insights.push({
            type: "tip",
            title: "Gastos com alimentação elevados",
            description: `${foodPercentage.toFixed(0)}% dos seus gastos são com alimentação. Cozinhar em casa pode ajudar a economizar.`
          });
        }
      }
    }

    // Balance insight
    if (balance > 0) {
      insights.push({
        type: "positive",
        title: `Saldo positivo de ${formatCurrency(balance)}`,
        description: "Você terminou o mês no azul. Considere investir o excedente ou direcioná-lo para suas metas."
      });
    }

    // Default tip if no insights
    if (insights.length === 0) {
      insights.push({
        type: "tip",
        title: "Comece a registrar suas transações",
        description: "Quanto mais transações você registrar, melhores serão os insights personalizados que podemos oferecer."
      });
    }

    return insights;
  };

  const automaticInsights = getAutomaticInsights();

  const InsightIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "positive":
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "negative":
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Lightbulb className="h-5 w-5 text-blue-600" />;
    }
  };

  const insightColors = {
    positive: "border-l-green-500 bg-green-50",
    negative: "border-l-red-500 bg-red-50",
    warning: "border-l-yellow-500 bg-yellow-50",
    tip: "border-l-blue-500 bg-blue-50",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Insights Financeiros</h1>
          <p className="text-muted-foreground">
            Análises e sugestões personalizadas para {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentDate)}
          </p>
        </div>
        <Button 
          onClick={() => generateMutation.mutate({ month, year })}
          disabled={generateMutation.isPending}
          className="gap-2"
        >
          {generateMutation.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Gerar Insights com IA
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{formatCurrency(income)}</div>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-red-600">{formatCurrency(expense)}</div>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(balance)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Poupança</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className={`text-2xl font-bold ${savingsRate >= 20 ? 'text-green-600' : savingsRate >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                {savingsRate.toFixed(0)}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Automatic Insights */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Insights Automáticos
          </CardTitle>
          <CardDescription>
            Análises baseadas nos seus dados financeiros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {automaticInsights.map((insight, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-l-4 ${insightColors[insight.type]}`}
              >
                <div className="flex items-start gap-3">
                  <InsightIcon type={insight.type} />
                  <div>
                    <h3 className="font-semibold">{insight.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Generated Insights */}
      {generateMutation.data && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Análise da IA
            </CardTitle>
            <CardDescription>
              Insights gerados por inteligência artificial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <Streamdown>{generateMutation.data.insights}</Streamdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Dicas de Economia</CardTitle>
          <CardDescription>Sugestões para melhorar sua saúde financeira</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">💡 Regra 50/30/20</h3>
              <p className="text-sm text-muted-foreground">
                Destine 50% para necessidades, 30% para desejos e 20% para poupança e investimentos.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">📊 Acompanhe seus gastos</h3>
              <p className="text-sm text-muted-foreground">
                Registre todas as transações para ter uma visão clara de para onde seu dinheiro está indo.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">🎯 Defina metas claras</h3>
              <p className="text-sm text-muted-foreground">
                Ter objetivos específicos ajuda a manter o foco e a motivação para economizar.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">🚨 Fundo de emergência</h3>
              <p className="text-sm text-muted-foreground">
                Mantenha de 3 a 6 meses de despesas em uma reserva de fácil acesso.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
