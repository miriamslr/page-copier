import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

interface CreditPurchaseModalProps {
  open: boolean;
  onClose: () => void;
  requiredCredits: number;
  currentCredits: number;
}

export const CreditPurchaseModal = ({
  open,
  onClose,
  requiredCredits,
  currentCredits,
}: CreditPurchaseModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Créditos Insuficientes
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm mb-2">
                <span className="font-semibold">Créditos necessários:</span> {requiredCredits}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Seus créditos atuais:</span> {currentCredits}
              </p>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Você precisa de mais créditos para realizar esta ação. 
              Entre em contato com o administrador para adicionar créditos à sua conta.
            </p>

            <div className="pt-2">
              <Button onClick={onClose} className="w-full">
                Entendido
              </Button>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
