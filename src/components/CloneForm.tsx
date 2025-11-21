import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Download, Copy, Globe, Package, ChevronDown, ChevronUp, Trash2, Edit, Save } from "lucide-react";
import { toast } from "sonner";
import { HeadersInput } from "./HeadersInput";
import { HeaderTemplateManager } from "./HeaderTemplateManager";
import { ResourceExtractor } from "@/utils/resourceExtractor";
import { ZipCreator } from "@/utils/zipCreator";
import { Base64Embedder } from "@/utils/base64Embedder";
import { resourceCache } from "@/utils/resourceCache";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { VisualEditor } from "./editor/VisualEditor";
import { ResponsivePreview } from "./editor/ResponsivePreview";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCredits } from "@/hooks/useCredits";
import { CreditPurchaseModal } from "./CreditPurchaseModal";
import { useAuth } from "@/hooks/useAuth";

export const CloneForm = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [clonedHtml, setClonedHtml] = useState("");
  const [customHeaders, setCustomHeaders] = useState<Record<string, string>>({});
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [embedAsBase64, setEmbedAsBase64] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [savedPageSlug, setSavedPageSlug] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [requiredCreditsForAction, setRequiredCreditsForAction] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { credits, actionCosts, hasCredits, consumeCredits } = useCredits(user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleClone = async () => {
    if (!url || !isValidUrl(url)) {
      toast.error("Por favor, digite uma URL válida");
      return;
    }

    setIsLoading(true);
    
    // Lista de proxies CORS para tentar
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
    ];

    let success = false;
    let lastError = null;
    let originalHtml = "";

    // Tentar com cada proxy até um funcionar
    for (const proxyUrl of proxies) {
      try {
        console.log(`Tentando clonar com proxy: ${proxyUrl}`);
        
        const headers: HeadersInit = { ...customHeaders };
        const response = await fetch(proxyUrl, { headers });
        
        if (!response.ok) {
          throw new Error(`Erro HTTP! status: ${response.status}`);
        }
        
        const html = await response.text();
        
        if (!html || html.trim().length === 0) {
          throw new Error("Resposta vazia do servidor");
        }
        
        originalHtml = html;
        success = true;
        break;
      } catch (error) {
        console.error(`Erro com proxy ${proxyUrl}:`, error);
        lastError = error;
        continue;
      }
    }

    if (!success) {
      toast.error("Não foi possível clonar a página. A URL pode estar bloqueada ou inacessível.");
      console.error("Todos os proxies falharam. Último erro:", lastError);
      setIsLoading(false);
      return;
    }

    // Processar HTML para incorporar recursos
    toast.info("Processando recursos da página...");
    
    try {
      let processedHtml: string;
      
      if (embedAsBase64) {
        toast.info("Incorporando recursos como base64...");
        const embedder = new Base64Embedder(customHeaders);
        processedHtml = await embedder.embedResourcesInHtml(originalHtml, url);
      } else {
        processedHtml = await processHtmlResources(originalHtml, url);
      }
      
      setClonedHtml(processedHtml);
      setShowPreview(true);
      toast.success("Página clonada e processada com sucesso!");
      
      // Atualizar tamanho do cache
      updateCacheSize();
    } catch (error) {
      console.error("Erro ao processar recursos:", error);
      // Usar HTML original se falhar
      setClonedHtml(originalHtml);
      toast.warning("Página clonada, mas alguns recursos podem não carregar.");
    }
    
    setIsLoading(false);
  };

  const processHtmlResources = async (html: string, baseUrl: string): Promise<string> => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    // Adicionar base tag para resolver URLs relativas
    const base = doc.createElement("base");
    base.href = baseUrl;
    doc.head.insertBefore(base, doc.head.firstChild);
    
    // Converter todas as URLs relativas para absolutas
    const urlBase = new URL(baseUrl);
    
    // Converter links CSS
    doc.querySelectorAll('link[href]').forEach((link) => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('data:')) {
        try {
          link.setAttribute('href', new URL(href, baseUrl).href);
        } catch (e) {
          console.warn('Erro ao converter URL:', href);
        }
      }
    });
    
    // Converter scripts
    doc.querySelectorAll('script[src]').forEach((script) => {
      const src = script.getAttribute('src');
      if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:')) {
        try {
          script.setAttribute('src', new URL(src, baseUrl).href);
        } catch (e) {
          console.warn('Erro ao converter URL:', src);
        }
      }
    });
    
    // Converter imagens
    doc.querySelectorAll('img[src]').forEach((img) => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:')) {
        try {
          img.setAttribute('src', new URL(src, baseUrl).href);
        } catch (e) {
          console.warn('Erro ao converter URL:', src);
        }
      }
    });
    
    // Adicionar meta tag para permitir carregamento de recursos
    const metaCsp = doc.createElement("meta");
    metaCsp.httpEquiv = "Content-Security-Policy";
    metaCsp.content = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:";
    doc.head.appendChild(metaCsp);
    
    return doc.documentElement.outerHTML;
  };

  const handleDownload = async () => {
    if (!clonedHtml) return;
    
    if (!isAuthenticated) {
      toast.error("Você precisa estar logado para baixar");
      navigate("/auth");
      return;
    }

    if (!hasCredits("download_html")) {
      setRequiredCreditsForAction(actionCosts.download_html);
      setShowCreditModal(true);
      return;
    }

    const success = await consumeCredits("download_html", "Download HTML");
    if (!success) return;
    
    const blob = new Blob([clonedHtml], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cloned-page.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Arquivo baixado");
  };

  const handleDownloadWithResources = async () => {
    if (!clonedHtml || !url) return;

    if (!isAuthenticated) {
      toast.error("Você precisa estar logado para baixar");
      navigate("/auth");
      return;
    }

    if (!hasCredits("download_zip")) {
      setRequiredCreditsForAction(actionCosts.download_zip);
      setShowCreditModal(true);
      return;
    }

    const success = await consumeCredits("download_zip", "Download ZIP com recursos");
    if (!success) return;

    setIsDownloadingZip(true);
    setDownloadProgress(0);

    try {
      // Extrair recursos do HTML
      const extractor = new ResourceExtractor(url);
      const resources = extractor.extractResources(clonedHtml);

      toast.info(`Encontrados ${resources.length} recursos para baixar...`);

      // Criar ZIP e baixar recursos
      const zipCreator = new ZipCreator();
      
      const { success, failed } = await zipCreator.downloadResources(
        resources,
        customHeaders,
        (current, total) => {
          setDownloadProgress(Math.round((current / total) * 100));
        }
      );

      // Atualizar HTML com caminhos locais
      const updatedHtml = extractor.updateHtmlPaths(clonedHtml, success);
      zipCreator.addFile("index.html", updatedHtml);

      // Gerar e baixar ZIP
      await zipCreator.downloadZip("pagina-clonada.zip");

      if (failed.length > 0) {
        toast.warning(`Download completo! ${failed.length} recursos falharam.`);
      } else {
        toast.success(`Página completa baixada! ${success.length} recursos incluídos.`);
      }
    } catch (error) {
      console.error("Erro ao criar ZIP:", error);
      toast.error("Erro ao criar arquivo ZIP com recursos");
    } finally {
      setIsDownloadingZip(false);
      setDownloadProgress(0);
    }
  };

  const handleCopy = async () => {
    if (!clonedHtml) return;
    
    if (!isAuthenticated) {
      toast.error("Você precisa estar logado para copiar");
      navigate("/auth");
      return;
    }

    if (!hasCredits("copy_code")) {
      setRequiredCreditsForAction(actionCosts.copy_code);
      setShowCreditModal(true);
      return;
    }

    const success = await consumeCredits("copy_code", "Copiar código");
    if (!success) return;
    
    try {
      await navigator.clipboard.writeText(clonedHtml);
      toast.success("HTML copiado para a área de transferência");
    } catch (error) {
      toast.error("Erro ao copiar");
    }
  };

  const updateCacheSize = async () => {
    try {
      const size = await resourceCache.getCacheSize();
      setCacheSize(size);
    } catch (error) {
      console.error("Erro ao obter tamanho do cache:", error);
    }
  };

  const handleClearCache = async () => {
    try {
      await resourceCache.clear();
      setCacheSize(0);
      toast.success("Cache limpo com sucesso");
    } catch (error) {
      toast.error("Erro ao limpar cache");
    }
  };

  const handleSavePage = async () => {
    if (!isAuthenticated) {
      toast.error("Você precisa estar logado para salvar páginas");
      navigate("/auth");
      return;
    }

    if (!clonedHtml || !url) {
      toast.error("Nenhuma página para salvar");
      return;
    }

    if (!hasCredits("save_page")) {
      setRequiredCreditsForAction(actionCosts.save_page);
      setShowCreditModal(true);
      return;
    }

    const success = await consumeCredits("save_page", "Salvar página");
    if (!success) return;

    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        navigate("/auth");
        return;
      }

      const { generateSlug, extractTitle } = await import("@/lib/slugGenerator");
      const title = extractTitle(clonedHtml);
      const slug = generateSlug(title);

      const { error } = await supabase.from("cloned_pages").insert({
        user_id: session.user.id,
        title,
        slug,
        original_url: url,
        html_content: clonedHtml,
        is_public: true,
      });

      if (error) throw error;

      setSavedPageSlug(slug);
      toast.success("Página salva com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar página:", error);
      toast.error(error.message || "Erro ao salvar página");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = async () => {
    if (!isAuthenticated) {
      toast.error("Você precisa estar logado para editar");
      navigate("/auth");
      return;
    }

    if (actionCosts.edit_page > 0 && !hasCredits("edit_page")) {
      setRequiredCreditsForAction(actionCosts.edit_page);
      setShowCreditModal(true);
      return;
    }

    if (actionCosts.edit_page > 0) {
      const success = await consumeCredits("edit_page", "Editar página");
      if (!success) return;
    }

    setShowPreview(false);
    setIsEditing(true);
  };

  const getPreviewWidth = () => {
    switch (previewViewport) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  if (isEditing) {
    return (
      <VisualEditor
        html={clonedHtml}
        onSave={(editedHtml) => {
          setClonedHtml(editedHtml);
          setIsEditing(false);
          setShowPreview(true);
          toast.success("Alterações salvas!");
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      <Card className="p-4 sm:p-6 bg-white/75 border border-border/30 shadow-[var(--shadow-soft)] backdrop-blur-md">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Input
              type="url"
              placeholder="Pesquisar ferramenta..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleClone()}
              className="h-11 sm:h-12 bg-white/70 border-border backdrop-blur-sm focus:border-primary text-base"
            />
            <Button
              onClick={handleClone}
              disabled={isLoading || !url}
              className="h-11 sm:h-12 px-6 bg-primary hover:bg-primary/90 shadow-sm whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clonando...
                </>
              ) : (
                "Clonar"
              )}
            </Button>
          </div>

          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground hover:bg-white/50">
                {showAdvanced ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Ocultar opções avançadas
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Opções avançadas
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {isAuthenticated && (
                <HeaderTemplateManager
                  onSelectTemplate={setCustomHeaders}
                  compact
                />
              )}
              
              <HeadersInput
                headers={customHeaders}
                onChange={setCustomHeaders}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="embed-base64"
                    checked={embedAsBase64}
                    onCheckedChange={setEmbedAsBase64}
                  />
                  <Label htmlFor="embed-base64" className="text-sm text-muted-foreground">
                    Incorporar recursos como Base64
                  </Label>
                </div>
                
                {cacheSize > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCache}
                    className="text-xs text-muted-foreground hover:bg-white/50"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Limpar Cache ({cacheSize} itens)
                  </Button>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {clonedHtml && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  size="sm"
                  className="border-border hover:bg-white/60 backdrop-blur-sm text-xs sm:text-sm"
                >
                  <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">HTML</span>
                  <span className="xs:hidden">HTML</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  size="sm"
                  className="border-border hover:bg-white/60 backdrop-blur-sm text-xs sm:text-sm"
                >
                  <Copy className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Copiar</span>
                  <span className="xs:hidden">Copy</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleEditClick}
                  size="sm"
                  className="border-border hover:bg-white/60 backdrop-blur-sm text-xs sm:text-sm"
                >
                  <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Editar</span>
                  <span className="xs:hidden">Edit</span>
                </Button>
              </div>

              {isAuthenticated && !savedPageSlug && (
                <Button
                  onClick={handleSavePage}
                  disabled={isSaving}
                  variant="outline"
                  className="w-full border-border hover:bg-white/60 backdrop-blur-sm"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Página
                    </>
                  )}
                </Button>
              )}

              {savedPageSlug && (
                <div className="p-3 bg-white/60 border border-border rounded-md backdrop-blur-sm">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">Página salva com sucesso!</p>
                  <div className="flex flex-col xs:flex-row gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/p/${savedPageSlug}`, "_blank")}
                      className="text-xs hover:bg-white/60"
                    >
                      Ver página pública
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate("/dashboard")}
                      className="text-xs hover:bg-white/60"
                    >
                      Dashboard
                    </Button>
                  </div>
                </div>
              )}

              {showPreview && (
                <Card className="overflow-hidden bg-white/60 border border-border backdrop-blur-sm">
                  <div className="flex items-center justify-between p-3 border-b border-border bg-white/40">
                    <h3 className="text-sm font-medium">Preview da Página Clonada</h3>
                    <div className="flex items-center gap-2">
                      <ResponsivePreview 
                        viewport={previewViewport} 
                        onViewportChange={setPreviewViewport} 
                      />
                      <Button 
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const newWindow = window.open();
                          if (newWindow) {
                            newWindow.document.write(clonedHtml);
                            newWindow.document.close();
                          }
                        }}
                        className="h-8 px-3 hover:bg-white/60"
                      >
                        <Globe className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowPreview(false)}
                        className="h-8 px-3 hover:bg-white/60"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-center p-4 bg-muted/20">
                    <div style={{ width: getPreviewWidth(), transition: 'width 0.3s ease' }}>
                      <iframe
                        srcDoc={clonedHtml}
                        className="w-full h-[600px] border border-border rounded-md bg-white shadow-sm"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                        title="Preview da Página Clonada"
                      />
                    </div>
                  </div>
                </Card>
              )}

              {!showPreview && (
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                  className="w-full border-border hover:bg-white/60 backdrop-blur-sm"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Ver Preview
                </Button>
              )}
              
              <Button
                onClick={handleDownloadWithResources}
                disabled={isDownloadingZip}
                className="w-full bg-primary hover:bg-primary/90 shadow-sm"
              >
                {isDownloadingZip ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Baixando... {downloadProgress}%
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Baixar ZIP Completo
                  </>
                )}
              </Button>
              
              {isDownloadingZip && (
                <Progress value={downloadProgress} className="h-2" />
              )}
            </div>
          )}
        </div>
      </Card>

      <CreditPurchaseModal
        open={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        requiredCredits={requiredCreditsForAction}
        currentCredits={credits}
      />
    </div>
  );
};

export default CloneForm;
