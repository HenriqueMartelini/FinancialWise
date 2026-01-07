import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Palette, User, Check, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const colorThemes = [
  { id: "blue", name: "Azul", primary: "#3b82f6", bg: "bg-blue-500" },
  { id: "pink", name: "Rosa", primary: "#ec4899", bg: "bg-pink-500" },
  { id: "yellow", name: "Amarelo", primary: "#eab308", bg: "bg-yellow-500" },
  { id: "cyan", name: "Azul Claro", primary: "#06b6d4", bg: "bg-cyan-500" },
  { id: "orange", name: "Laranja", primary: "#f97316", bg: "bg-orange-500" },
  { id: "purple", name: "Lilás", primary: "#8b5cf6", bg: "bg-purple-500" },
  { id: "dark", name: "Preto", primary: "#18181b", bg: "bg-zinc-900" },
  { id: "green", name: "Verde", primary: "#22c55e", bg: "bg-green-500" },
];

export default function Settings() {
  const { user } = useAuth();
  const [selectedTheme, setSelectedTheme] = useState("blue");

  const updateThemeMutation = trpc.user.updateTheme.useMutation({
    onSuccess: () => {
      toast.success("Tema atualizado com sucesso!");
      // Apply theme to document
      applyTheme(selectedTheme);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar tema: " + error.message);
    },
  });

  const applyTheme = (themeId: string) => {
    const theme = colorThemes.find(t => t.id === themeId);
    if (theme) {
      document.documentElement.style.setProperty('--primary', theme.primary);
      // Store in localStorage for persistence
      localStorage.setItem('finwise-theme', themeId);
    }
  };

  useEffect(() => {
    // Load saved theme on mount
    const savedTheme = localStorage.getItem('finwise-theme');
    if (savedTheme) {
      setSelectedTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    applyTheme(themeId);
    updateThemeMutation.mutate({ themeColor: themeId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Personalize sua experiência no FinWise</p>
      </div>

      {/* Profile Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil
          </CardTitle>
          <CardDescription>Suas informações de conta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{user?.name || "Usuário"}</h3>
              <p className="text-muted-foreground">{user?.email || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Selection */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Tema de Cores
          </CardTitle>
          <CardDescription>Escolha a cor principal do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {colorThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all
                  ${selectedTheme === theme.id 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  <div 
                    className={`w-12 h-12 rounded-full ${theme.bg} flex items-center justify-center`}
                  >
                    {selectedTheme === theme.id && (
                      <Check className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{theme.name}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Pré-visualização
          </CardTitle>
          <CardDescription>Veja como o tema ficará</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 rounded-xl bg-muted/50 space-y-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colorThemes.find(t => t.id === selectedTheme)?.primary }}
              >
                <Palette className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">Exemplo de Card</p>
                <p className="text-sm text-muted-foreground">Com a cor selecionada</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm"
                style={{ backgroundColor: colorThemes.find(t => t.id === selectedTheme)?.primary }}
              >
                Botão Primário
              </Button>
              <Button variant="outline" size="sm">
                Botão Secundário
              </Button>
            </div>
            <div 
              className="h-2 rounded-full"
              style={{ backgroundColor: `${colorThemes.find(t => t.id === selectedTheme)?.primary}30` }}
            >
              <div 
                className="h-full w-2/3 rounded-full"
                style={{ backgroundColor: colorThemes.find(t => t.id === selectedTheme)?.primary }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Gerenciamento de Dados</CardTitle>
          <CardDescription>Exporte ou gerencie seus dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Exportar Dados</p>
              <p className="text-sm text-muted-foreground">Baixe todas as suas transações em CSV</p>
            </div>
            <Button variant="outline" onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
              Exportar
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Backup Automático</p>
              <p className="text-sm text-muted-foreground">Seus dados são salvos automaticamente na nuvem</p>
            </div>
            <span className="text-sm text-green-600 font-medium">Ativo</span>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Sobre o FinWise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>Versão:</strong> 1.0.0</p>
          <p>
            FinWise é um sistema completo de gestão financeira pessoal e familiar.
            Controle suas receitas, despesas, orçamentos, metas e dívidas em um só lugar.
          </p>
          <p className="pt-2">
            Desenvolvido com React, TypeScript, tRPC e TailwindCSS.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
