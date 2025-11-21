import { CloneForm } from "@/components/CloneForm";
import { Code2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex items-center">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-end mb-6 sm:mb-8">
          <Button
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground backdrop-blur-sm"
          >
            <LogIn className="mr-1 sm:mr-2 h-4 w-4" />
            {isAuthenticated ? "Dashboard" : "Login"}
          </Button>
        </div>
        
        <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 sm:space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground px-4">
              Clone PERFEITAMENTE qualquer página em segundos.
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground px-4 max-w-3xl mx-auto">
              Veja o resultado e edite o que quiser. Baixe o HTML puro ou um zip com todos os arquivos separados. Aqui é você quem manda!
            </p>
          </div>

          {/* Main Form */}
          <CloneForm />
        </div>
      </div>
    </div>
  );
};

export default Index;
