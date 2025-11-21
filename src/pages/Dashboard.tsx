import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Search, Eye, ExternalLink, Trash2, Copy, Plus, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreditBalance } from "@/components/CreditBalance";
import { useAuth } from "@/hooks/useAuth";

interface ClonedPage {
  id: string;
  title: string;
  slug: string;
  original_url: string;
  views_count: number;
  is_public: boolean;
  created_at: string;
  thumbnail_url: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pages, setPages] = useState<ClonedPage[]>([]);
  const [filteredPages, setFilteredPages] = useState<ClonedPage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    checkAuth();
    loadPages();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPages(pages);
    } else {
      const filtered = pages.filter(
        (page) =>
          page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          page.original_url.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPages(filtered);
    }
  }, [searchQuery, pages]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", session.user.id)
      .single();

    if (profile) {
      setUserName(profile.name);
    }
  };

  const loadPages = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("cloned_pages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar páginas");
    } else {
      setPages(data || []);
      setFilteredPages(data || []);
    }
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${title}"?`)) return;

    const { error } = await supabase.from("cloned_pages").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir página");
    } else {
      toast.success("Página excluída com sucesso");
      loadPages();
    }
  };

  const copySlugLink = (slug: string) => {
    const link = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const totalViews = pages.reduce((sum, page) => sum + page.views_count, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
              {userName && <p className="text-sm text-muted-foreground">Olá, {userName}</p>}
            </div>
            <div className="flex gap-2 items-center">
              <CreditBalance userId={user?.id} />
              <Button onClick={() => navigate("/")} variant="outline" size="sm" className="flex-1 sm:flex-initial">
                <Plus className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nova página</span>
                <span className="sm:hidden">Nova</span>
              </Button>
              <Button onClick={() => navigate("/templates")} variant="outline" size="sm" className="flex-1 sm:flex-initial">
                <FileText className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden md:inline">Templates</span>
                <span className="md:hidden">Temps</span>
              </Button>
              <Button onClick={handleSignOut} variant="outline" size="sm" className="flex-1 sm:flex-initial">
                <LogOut className="mr-1 sm:mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-3 md:grid-cols-3 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-xs sm:text-sm md:text-base">Total de Páginas</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">{pages.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-xs sm:text-sm md:text-base">Visualizações</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">{totalViews}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-xs sm:text-sm md:text-base">Públicas</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                {pages.filter((p) => p.is_public).length}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : filteredPages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? "Nenhuma página encontrada" : "Você ainda não clonou nenhuma página"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPages.map((page) => (
              <Card key={page.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="line-clamp-1 text-base sm:text-lg">{page.title}</CardTitle>
                  <CardDescription className="line-clamp-1 text-xs sm:text-sm">
                    {page.original_url}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{page.views_count} visualizações</span>
                  </div>
                  <div className="mt-2">
                    <Badge variant={page.is_public ? "default" : "secondary"} className="text-xs">
                      {page.is_public ? "Público" : "Privado"}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/p/${page.slug}`, "_blank")}
                    className="px-2 sm:px-3"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => copySlugLink(page.slug)}
                    className="px-2 sm:px-3"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(page.id, page.title)}
                    className="ml-auto px-2 sm:px-3"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
