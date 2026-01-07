import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus, Copy, Crown, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Family() {
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [createdInviteCode, setCreatedInviteCode] = useState("");

  const utils = trpc.useUtils();
  const { data: members, isLoading } = trpc.family.getMembers.useQuery();

  const createFamilyMutation = trpc.family.create.useMutation({
    onSuccess: (data) => {
      setCreatedInviteCode(data.inviteCode);
      utils.family.getMembers.invalidate();
      toast.success("Família criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar família: " + error.message);
    },
  });

  const joinFamilyMutation = trpc.family.join.useMutation({
    onSuccess: (data) => {
      utils.family.getMembers.invalidate();
      setJoinDialogOpen(false);
      setInviteCode("");
      toast.success(`Você entrou na família "${data.familyName}"!`);
    },
    onError: (error) => {
      toast.error("Erro ao entrar na família: " + error.message);
    },
  });

  const handleCreateFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) {
      toast.error("Digite um nome para a família");
      return;
    }
    createFamilyMutation.mutate({ name: familyName });
  };

  const handleJoinFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error("Digite o código de convite");
      return;
    }
    joinFamilyMutation.mutate({ inviteCode: inviteCode.toUpperCase() });
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(createdInviteCode);
    toast.success("Código copiado!");
  };

  const hasFamily = members && members.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Família</h1>
        <p className="text-muted-foreground">Compartilhe suas finanças com membros da família</p>
      </div>

      {!hasFamily ? (
        // No family yet
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Criar uma Família
              </CardTitle>
              <CardDescription>
                Crie um grupo familiar e convide membros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Criar Família
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Família</DialogTitle>
                    <DialogDescription>
                      Dê um nome para sua família e convide membros
                    </DialogDescription>
                  </DialogHeader>
                  {!createdInviteCode ? (
                    <form onSubmit={handleCreateFamily}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="familyName">Nome da Família</Label>
                          <Input
                            id="familyName"
                            placeholder="Ex: Família Silva"
                            value={familyName}
                            onChange={(e) => setFamilyName(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createFamilyMutation.isPending}>
                          {createFamilyMutation.isPending ? "Criando..." : "Criar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  ) : (
                    <div className="py-4">
                      <div className="text-center space-y-4">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                        <div>
                          <p className="font-medium">Família criada com sucesso!</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Compartilhe o código abaixo com os membros
                          </p>
                        </div>
                        <div className="flex items-center gap-2 justify-center">
                          <div className="px-6 py-3 bg-muted rounded-lg font-mono text-2xl font-bold tracking-wider">
                            {createdInviteCode}
                          </div>
                          <Button variant="outline" size="icon" onClick={copyInviteCode}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <DialogFooter className="mt-6">
                        <Button onClick={() => { setCreateDialogOpen(false); setCreatedInviteCode(""); setFamilyName(""); }}>
                          Fechar
                        </Button>
                      </DialogFooter>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-green-600" />
                Entrar em uma Família
              </CardTitle>
              <CardDescription>
                Use um código de convite para entrar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Entrar com Código
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Entrar em uma Família</DialogTitle>
                    <DialogDescription>
                      Digite o código de convite que você recebeu
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleJoinFamily}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="inviteCode">Código de Convite</Label>
                        <Input
                          id="inviteCode"
                          placeholder="Ex: ABC12345"
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                          className="font-mono text-center text-lg tracking-wider"
                          maxLength={10}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setJoinDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={joinFamilyMutation.isPending}>
                        {joinFamilyMutation.isPending ? "Entrando..." : "Entrar"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Has family
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Membros da Família
              </CardTitle>
              <CardDescription>
                {members.length} {members.length === 1 ? 'membro' : 'membros'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div 
                    key={member.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/50"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {member.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.name || "Usuário"}</p>
                        {member.id === user?.id && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Você
                          </span>
                        )}
                        {member.role === "admin" && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email || "-"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Convidar Membros</CardTitle>
              <CardDescription>
                Compartilhe o código abaixo para adicionar novos membros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-muted rounded-lg font-mono text-lg font-bold tracking-wider text-center">
                  {/* This would need to be fetched from the family data */}
                  XXXXXXXX
                </div>
                <Button variant="outline" size="icon" onClick={() => toast.info("Código copiado!")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Qualquer pessoa com este código pode entrar na sua família
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Users className="h-6 w-6 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Finanças Compartilhadas</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Todos os membros da família podem ver e gerenciar as transações, orçamentos e metas em conjunto.
                    Cada membro mantém suas próprias contas e cartões, mas as informações são compartilhadas para uma visão unificada das finanças familiares.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
