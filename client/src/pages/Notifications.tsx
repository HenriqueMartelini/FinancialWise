import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Mail, AlertTriangle, Target, CreditCard, Trash2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Notifications() {
  const [settings, setSettings] = useState({
    budgetAlerts: true,
    goalAlerts: true,
    debtAlerts: true,
    weeklyReport: true,
    monthlyReport: true,
    email: "",
  });

  const { data: notifications, isLoading } = trpc.notifications.list.useQuery();
  const utils = trpc.useUtils();

  const markAsReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
    },
  });

  const deleteNotificationMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      toast.success("Notificação excluída");
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      toast.success("Todas as notificações foram marcadas como lidas");
    },
  });

  const formatDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "budget_alert":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "goal_progress":
        return <Target className="h-5 w-5 text-green-600" />;
      case "debt_reminder":
        return <CreditCard className="h-5 w-5 text-red-600" />;
      default:
        return <Bell className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotificationBg = (type: string, isRead: boolean) => {
    if (isRead) return "bg-muted/30";
    switch (type) {
      case "budget_alert":
        return "bg-yellow-50";
      case "goal_progress":
        return "bg-green-50";
      case "debt_reminder":
        return "bg-red-50";
      default:
        return "bg-blue-50";
    }
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificações</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} notificações não lidas` : "Todas as notificações lidas"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notifications List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Histórico de Notificações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : notifications && notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg transition-colors ${getNotificationBg(notification.type, notification.isRead || false)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className={`font-medium ${notification.isRead ? 'text-muted-foreground' : ''}`}>
                                {notification.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatDate(notification.createdAt)}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => markAsReadMutation.mutate({ id: notification.id })}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => deleteNotificationMutation.mutate({ id: notification.id })}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma notificação</p>
                  <p className="text-sm mt-1">Você receberá alertas sobre orçamentos, metas e dívidas aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Configurações de Alertas</CardTitle>
              <CardDescription>Escolha quais notificações deseja receber</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="budget-alerts" className="font-medium">Alertas de Orçamento</Label>
                  <p className="text-xs text-muted-foreground">
                    Quando ultrapassar limites de categoria
                  </p>
                </div>
                <Switch
                  id="budget-alerts"
                  checked={settings.budgetAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, budgetAlerts: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="goal-alerts" className="font-medium">Alertas de Metas</Label>
                  <p className="text-xs text-muted-foreground">
                    Progresso e conclusão de metas
                  </p>
                </div>
                <Switch
                  id="goal-alerts"
                  checked={settings.goalAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, goalAlerts: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="debt-alerts" className="font-medium">Alertas de Dívidas</Label>
                  <p className="text-xs text-muted-foreground">
                    Lembretes de vencimento
                  </p>
                </div>
                <Switch
                  id="debt-alerts"
                  checked={settings.debtAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, debtAlerts: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Relatórios por Email
              </CardTitle>
              <CardDescription>Receba resumos periódicos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email para notificações</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weekly-report" className="font-medium">Relatório Semanal</Label>
                  <p className="text-xs text-muted-foreground">
                    Resumo das transações da semana
                  </p>
                </div>
                <Switch
                  id="weekly-report"
                  checked={settings.weeklyReport}
                  onCheckedChange={(checked) => setSettings({ ...settings, weeklyReport: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="monthly-report" className="font-medium">Relatório Mensal</Label>
                  <p className="text-xs text-muted-foreground">
                    Análise completa do mês
                  </p>
                </div>
                <Switch
                  id="monthly-report"
                  checked={settings.monthlyReport}
                  onCheckedChange={(checked) => setSettings({ ...settings, monthlyReport: checked })}
                />
              </div>

              <Button className="w-full" onClick={() => toast.success("Configurações salvas!")}>
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
