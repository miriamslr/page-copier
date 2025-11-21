import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";

interface CreditPackage {
  credits: number;
  price: number;
  popular?: boolean;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { credits: 10, price: 10 },
  { credits: 50, price: 45, popular: true },
  { credits: 100, price: 80 },
  { credits: 200, price: 150 },
];

export default function BuyCredits() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { credits, reloadCredits } = useCredits(user?.id);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerCpfCnpj, setCustomerCpfCnpj] = useState("");

  useEffect(() => {
    checkAuth();
    loadUserData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("user_id", session.user.id)
      .single();

    if (profile) {
      setCustomerName(profile.name || "");
      setCustomerEmail(profile.email || "");
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      toast.error("Selecione um pacote de créditos");
      return;
    }

    if (!customerName || !customerEmail || !customerCpfCnpj) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada");
        navigate("/auth");
        return;
      }

      // Chamar edge function para criar cobrança no Asaas
      const { data, error } = await supabase.functions.invoke("create-asaas-payment", {
        body: {
          credits: selectedPackage.credits,
          amount: selectedPackage.price,
          customer: {
            name: customerName,
            email: customerEmail,
            cpfCnpj: customerCpfCnpj,
          },
        },
      });

      if (error) throw error;

      if (data?.invoiceUrl) {
        toast.success("Cobrança criada! Redirecionando para pagamento...");
        window.open(data.invoiceUrl, "_blank");
      }
    } catch (error: any) {
      console.error("Error creating payment:", error);
      toast.error(error.message || "Erro ao processar pagamento");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Comprar Créditos</h1>
              <p className="text-sm text-muted-foreground">Saldo atual: {credits} créditos</p>
            </div>
            <Button onClick={() => navigate("/dashboard")} variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold mb-4">Escolha seu pacote</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {CREDIT_PACKAGES.map((pkg) => (
                <Card
                  key={pkg.credits}
                  className={`cursor-pointer transition-all ${
                    selectedPackage?.credits === pkg.credits
                      ? "ring-2 ring-primary"
                      : "hover:border-primary"
                  } ${pkg.popular ? "relative" : ""}`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                        Mais popular
                      </span>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span>{pkg.credits} créditos</span>
                      {selectedPackage?.credits === pkg.credits && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </CardTitle>
                    <CardDescription>R$ {pkg.price.toFixed(2)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      R$ {(pkg.price / pkg.credits).toFixed(2)} por crédito
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Dados para pagamento</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Informações do Cliente
                </CardTitle>
                <CardDescription>
                  Estes dados serão usados para gerar a cobrança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome completo"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                  <Input
                    id="cpfCnpj"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={customerCpfCnpj}
                    onChange={(e) => setCustomerCpfCnpj(e.target.value)}
                  />
                </div>

                {selectedPackage && (
                  <div className="pt-4 border-t">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Créditos:</span>
                      <span className="font-semibold">{selectedPackage.credits}</span>
                    </div>
                    <div className="flex justify-between mb-4">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="text-xl font-bold">
                        R$ {selectedPackage.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handlePurchase}
                  disabled={isLoading || !selectedPackage}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Comprar Créditos
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Pagamento processado via Asaas. Você receberá um link para realizar o pagamento.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
