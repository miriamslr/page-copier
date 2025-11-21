import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

interface CreditBalanceProps {
  userId?: string;
}

export const CreditBalance = ({ userId }: CreditBalanceProps) => {
  const navigate = useNavigate();
  const { credits, isLoading, reloadCredits } = useCredits(userId);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }
  }, [credits, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
        <CreditCard className="h-4 w-4" />
        <span className="text-sm font-medium">...</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 transition-transform ${animate ? "scale-110" : ""}`}
        >
          <CreditCard className="h-4 w-4" />
          <span className="font-semibold">{credits}</span>
          <Badge variant="secondary" className="ml-1">
            créditos
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Seus Créditos</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/transactions")}>
          <CreditCard className="mr-2 h-4 w-4" />
          Ver Histórico
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/buy-credits")}>
          <Plus className="mr-2 h-4 w-4" />
          Comprar Créditos
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
