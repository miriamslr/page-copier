import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function PublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [htmlContent, setHtmlContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      loadPage();
      incrementViews();
    }
  }, [slug]);

  const loadPage = async () => {
    if (!slug) return;

    const { data, error } = await supabase
      .from("cloned_pages")
      .select("html_content, is_public")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    if (!data.is_public) {
      setNotFound(true);
      setIsLoading(false);
      toast.error("Esta página não está disponível publicamente");
      return;
    }

    setHtmlContent(data.html_content);
    setIsLoading(false);
  };

  const incrementViews = async () => {
    if (!slug) return;
    await supabase.rpc("increment_page_views", { page_slug: slug });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <p className="text-lg text-muted-foreground">Página não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <iframe
        srcDoc={htmlContent}
        className="w-full h-full border-0"
        title="Cloned Page"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
