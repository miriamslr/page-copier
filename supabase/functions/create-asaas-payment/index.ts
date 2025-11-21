import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  credits: number;
  amount: number;
  customer: {
    name: string;
    email: string;
    cpfCnpj: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    if (!asaasApiKey) {
      throw new Error("ASAAS_API_KEY não configurada");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Configuração do Supabase não encontrada");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Não autorizado");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Usuário não autenticado");
    }

    const { credits, amount, customer }: PaymentRequest = await req.json();

    // Criar ou buscar cliente no Asaas
    const customerResponse = await fetch("https://sandbox.asaas.com/api/v3/customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": asaasApiKey,
      },
      body: JSON.stringify({
        name: customer.name,
        email: customer.email,
        cpfCnpj: customer.cpfCnpj,
        externalReference: user.id,
      }),
    });

    if (!customerResponse.ok) {
      const errorData = await customerResponse.json();
      console.error("Erro ao criar cliente:", errorData);
      throw new Error("Erro ao criar cliente no Asaas");
    }

    const customerData = await customerResponse.json();

    // Criar cobrança
    const paymentResponse = await fetch("https://sandbox.asaas.com/api/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": asaasApiKey,
      },
      body: JSON.stringify({
        customer: customerData.id,
        billingType: "PIX",
        value: amount,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        description: `Compra de ${credits} créditos`,
        externalReference: `${user.id}_${Date.now()}`,
      }),
    });

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json();
      console.error("Erro ao criar cobrança:", errorData);
      throw new Error("Erro ao criar cobrança no Asaas");
    }

    const paymentData = await paymentResponse.json();

    // Registrar transação pendente (será confirmada via webhook)
    const { error: transactionError } = await supabase
      .from("credit_transactions")
      .insert({
        user_id: user.id,
        amount: 0, // Será atualizado quando o pagamento for confirmado
        action_type: "purchase",
        description: `Compra de ${credits} créditos - Aguardando pagamento (ID: ${paymentData.id})`,
      });

    if (transactionError) {
      console.error("Erro ao registrar transação:", transactionError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: paymentData.id,
        invoiceUrl: paymentData.invoiceUrl,
        pixQrCode: paymentData.qrCode,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in create-asaas-payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
