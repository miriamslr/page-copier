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

// Helper function to verify webhook signature
async function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) return false;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );
  
  const computedSignature = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  return computedSignature === signature;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("ASAAS_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Configuração do Supabase não encontrada");
    }

    if (!webhookSecret) {
      console.error("ASAAS_WEBHOOK_SECRET não configurado");
      throw new Error("Webhook secret não configurado");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-asaas-signature") || req.headers.get("asaas-signature");

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    const payload: AsaasWebhookPayload = JSON.parse(rawBody);

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
