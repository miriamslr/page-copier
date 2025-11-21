import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Save, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ActionCosts {
  download_html: number;
  download_zip: number;
  copy_code: number;
  edit_page: number;
  save_page: number;
}

interface UserWithCredits {
  user_id: string;
  credits: number;
  email: string;
  name: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAuth();
  const [actionCosts, setActionCosts] = useState<ActionCosts>({
    download_html: 1,
    download_zip: 2,
    copy_code: 1,
    edit_page: 0,
    save_page: 1,
  });
  const [users, setUsers] = useState<UserWithCredits[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast.error("Acesso negado. Apenas administradores.");
      navigate("/");
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadSettings();
      loadUsers();
    }
  }, [isAdmin]);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "action_costs")
      .single();

    if (data?.value) {
      setActionCosts(data.value as unknown as ActionCosts);
    }
  };

  const loadUsers = async () => {
    const { data: creditsData } = await supabase
      .from("user_credits")
      .select("user_id, credits");

    if (creditsData) {
      const usersWithEmails = await Promise.all(
        creditsData.map(async (credit) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, name")
            .eq("user_id", credit.user_id)
            .single();

          return {
            user_id: credit.user_id,
            credits: credit.credits,
            email: profile?.email || "N/A",
            name: profile?.name || "N/A",
          };
        })
      );

      setUsers(usersWithEmails);
    }
  };

  const handleSaveCosts = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("admin_settings")
        .update({ value: actionCosts as any })
        .eq("key", "action_costs");

      if (error) throw error;

      toast.success("Custos atualizados com sucesso!");
    } catch (error: any) {
      console.error("Error saving costs:", error);
      toast.error("Erro ao salvar custos");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUserCredits = async (userId: string, newCredits: number) => {
    try {
      const { error } = await supabase
        .from("user_credits")
        .update({ credits: newCredits })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Créditos atualizados!");
      loadUsers();
    } catch (error: any) {
      console.error("Error updating credits:", error);
      toast.error("Erro ao atualizar créditos");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
            <Button onClick={() => navigate("/")} variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="costs" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="costs">Custos de Ações</TabsTrigger>
            <TabsTrigger value="users">Gerenciar Usuários</TabsTrigger>
          </TabsList>

          <TabsContent value="costs">
            <Card>
              <CardHeader>
                <CardTitle>Configurar Custos de Ações</CardTitle>
                <CardDescription>
                  Define quantos créditos cada ação irá consumir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="download_html">Download HTML</Label>
                    <Input
                      id="download_html"
                      type="number"
                      min="0"
                      value={actionCosts.download_html}
                      onChange={(e) =>
                        setActionCosts({
                          ...actionCosts,
                          download_html: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="download_zip">Download ZIP com Recursos</Label>
                    <Input
                      id="download_zip"
                      type="number"
                      min="0"
                      value={actionCosts.download_zip}
                      onChange={(e) =>
                        setActionCosts({
                          ...actionCosts,
                          download_zip: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="copy_code">Copiar Código</Label>
                    <Input
                      id="copy_code"
                      type="number"
                      min="0"
                      value={actionCosts.copy_code}
                      onChange={(e) =>
                        setActionCosts({
                          ...actionCosts,
                          copy_code: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_page">Editar Página</Label>
                    <Input
                      id="edit_page"
                      type="number"
                      min="0"
                      value={actionCosts.edit_page}
                      onChange={(e) =>
                        setActionCosts({
                          ...actionCosts,
                          edit_page: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="save_page">Salvar Página</Label>
                    <Input
                      id="save_page"
                      type="number"
                      min="0"
                      value={actionCosts.save_page}
                      onChange={(e) =>
                        setActionCosts({
                          ...actionCosts,
                          save_page: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <Button onClick={handleSaveCosts} disabled={isSaving} className="w-full">
                  {isSaving ? (
                    "Salvando..."
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gerenciar Créditos dos Usuários
                </CardTitle>
                <CardDescription>
                  Visualize e modifique os créditos de cada usuário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum usuário cadastrado ainda
                    </p>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.user_id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`credits-${user.user_id}`} className="text-sm">
                            Créditos:
                          </Label>
                          <Input
                            id={`credits-${user.user_id}`}
                            type="number"
                            min="0"
                            value={user.credits}
                            onChange={(e) =>
                              handleUpdateUserCredits(
                                user.user_id,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-24"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
