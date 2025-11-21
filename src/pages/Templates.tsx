import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package, User, BookOpen, Plus } from "lucide-react";
import { HeaderTemplateManager, TemplateLibrary } from "@/components/HeaderTemplateManager";
import { Separator } from "@/components/ui/separator";

export default function Templates() {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Templates de Headers</h1>
              <p className="text-sm text-muted-foreground">
                Templates genéricos e personalizados para autenticação
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8 space-y-8">
        {/* Seção 1: Templates Prontos */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Templates Prontos</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Templates genéricos por tipo de autenticação. Use diretamente ou duplique para personalizar.
          </p>
          <TemplateLibrary />
        </section>

        <Separator />

        {/* Seção 2: Meus Templates */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Meus Templates</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Templates personalizados criados por você.
          </p>
          <HeaderTemplateManager />
        </section>

        <Separator />

        {/* Seção 3: Tutorial */}
        <section>
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Como Criar Templates Personalizados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">1. Usando Variáveis</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Use <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">
                  {'{{NOME_VARIAVEL}}'}</code> para criar placeholders que serão preenchidos depois.
                </p>
                <p className="text-sm text-muted-foreground">
                  Exemplo: <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">
                  Authorization: Bearer {'{{TOKEN}}'}</code>
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">2. Encontrando Headers</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Abra DevTools (F12) &gt; Network</li>
                  <li>• Recarregue a página ou faça login</li>
                  <li>• Clique em uma requisição</li>
                  <li>• Vá até a aba "Headers"</li>
                  <li>• Copie os headers necessários (Cookie, Authorization, etc.)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">3. Exemplos Comuns</h4>
                <div className="bg-background p-3 rounded text-xs font-mono space-y-1">
                  <div>Cookie: session={'{{SESSION}}'}</div>
                  <div>Authorization: Bearer {'{{TOKEN}}'}</div>
                  <div>X-API-Key: {'{{API_KEY}}'}</div>
                  <div>User-Agent: Mozilla/5.0...</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">4. Dicas</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Variáveis devem estar em MAIÚSCULAS</li>
                  <li>• Use nomes descritivos: {'{{API_TOKEN}}'} em vez de {'{{T}}'}</li>
                  <li>• Duplique templates prontos para começar mais rápido</li>
                  <li>• Teste sempre antes de salvar</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
