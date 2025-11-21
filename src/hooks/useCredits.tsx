import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ActionCosts {
  download_html: number;
  download_zip: number;
  copy_code: number;
  edit_page: number;
  save_page: number;
}

export const useCredits = (userId?: string) => {
  const [credits, setCredits] = useState<number>(0);
  const [actionCosts, setActionCosts] = useState<ActionCosts>({
    download_html: 1,
    download_zip: 2,
    copy_code: 1,
    edit_page: 0,
    save_page: 1,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadCredits();
      loadActionCosts();
    }
  }, [userId]);

  const loadCredits = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("user_credits")
      .select("credits")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error loading credits:", error);
    } else {
      setCredits(data?.credits || 0);
    }
    setIsLoading(false);
  };

  const loadActionCosts = async () => {
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "action_costs")
      .single();

    if (data?.value) {
      setActionCosts(data.value as unknown as ActionCosts);
    }
  };

  const hasCredits = (action: keyof ActionCosts): boolean => {
    const cost = actionCosts[action];
    return credits >= cost;
  };

  const consumeCredits = async (
    action: keyof ActionCosts,
    description?: string
  ): Promise<boolean> => {
    if (!userId) {
      toast.error("Você precisa estar logado");
      return false;
    }

    const cost = actionCosts[action];
    
    if (cost === 0) {
      return true;
    }

    if (!hasCredits(action)) {
      toast.error(`Créditos insuficientes. Necessário: ${cost}, Disponível: ${credits}`);
      return false;
    }

    try {
      // Atualizar créditos
      const { error: updateError } = await supabase
        .from("user_credits")
        .update({ credits: credits - cost })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      // Registrar transação
      const { error: transactionError } = await supabase
        .from("credit_transactions")
        .insert({
          user_id: userId,
          amount: -cost,
          action_type: action,
          description: description || `Ação: ${action}`,
        });

      if (transactionError) throw transactionError;

      setCredits(credits - cost);
      toast.success(`${cost} crédito(s) consumido(s)`);
      return true;
    } catch (error: any) {
      console.error("Error consuming credits:", error);
      toast.error("Erro ao consumir créditos");
      return false;
    }
  };

  return {
    credits,
    actionCosts,
    isLoading,
    hasCredits,
    consumeCredits,
    reloadCredits: loadCredits,
  };
};
