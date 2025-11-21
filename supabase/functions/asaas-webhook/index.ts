import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AsaasWebhookPayload {
  event: string;
  payment: {
    id: string;
    customer: string;
    value: number;
    status: string;
    description: string;
    externalReference: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Configuração do Supabase não encontrada");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: AsaasWebhookPayload = await req.json();

    console.log("Webhook recebido:", payload);

    // Processar apenas pagamentos confirmados
    if (payload.event === "PAYMENT_CONFIRMED" || payload.event === "PAYMENT_RECEIVED") {
      const userId = payload.payment.externalReference.split("_")[0];
      
      // Extrair quantidade de créditos da descrição
      const creditsMatch = payload.payment.description.match(/(\d+) créditos/);
      const credits = creditsMatch ? parseInt(creditsMatch[1]) : 0;

      if (!credits) {
        throw new Error("Não foi possível extrair quantidade de créditos");
      }

      // Adicionar créditos ao usuário
      const { data: currentCredits } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("user_id", userId)
        .single();

      if (currentCredits) {
        const { error: updateError } = await supabase
          .from("user_credits")
          .update({ credits: currentCredits.credits + credits })
          .eq("user_id", userId);

        if (updateError) {
          console.error("Erro ao atualizar créditos:", updateError);
          throw updateError;
        }

        // Registrar transação de compra
        const { error: transactionError } = await supabase
          .from("credit_transactions")
          .insert({
            user_id: userId,
            amount: credits,
            action_type: "purchase",
            description: `Compra confirmada: ${credits} créditos (Pagamento ID: ${payload.payment.id})`,
          });

        if (transactionError) {
          console.error("Erro ao registrar transação:", transactionError);
        }

        console.log(`Créditos adicionados com sucesso: ${credits} para usuário ${userId}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in asaas-webhook:", error);
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
