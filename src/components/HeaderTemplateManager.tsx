import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Edit, Plus, Check, Copy } from "lucide-react";
import { HeadersInput } from "./HeadersInput";
import { TemplateVariableForm } from "./TemplateVariableForm";

interface HeaderTemplate {
  id: string;
  name: string;
  description: string | null;
  headers: Record<string, string>;
  created_at: string;
  is_public?: boolean;
  variables?: string[];
  instructions?: string;
  category?: string;
  user_id?: string;
}

interface HeaderTemplateManagerProps {
  onSelectTemplate?: (headers: Record<string, string>) => void;
  compact?: boolean;
}

export function HeaderTemplateManager({ onSelectTemplate, compact = false }: HeaderTemplateManagerProps) {
  const [publicTemplates, setPublicTemplates] = useState<HeaderTemplate[]>([]);
  const [userTemplates, setUserTemplates] = useState<HeaderTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    headers: {} as Record<string, string>,
  });

  const [variableFormState, setVariableFormState] = useState<{
    open: boolean;
    template: HeaderTemplate | null;
    variables: string[];
  }>({
    open: false,
    template: null,
    variables: [],
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Load public (system) templates
      const { data: publicData, error: publicError } = await supabase
        .from("header_templates")
        .select("*")
        .eq("is_public", true)
        .order("category", { ascending: true });

      if (publicError) throw publicError;
      setPublicTemplates((publicData || []).map(item => ({
        ...item,
        headers: item.headers as Record<string, string>,
        variables: item.variables || [],
      })));

      // Load user templates if logged in
      if (session) {
        const { data: userData, error: userError } = await supabase
          .from("header_templates")
          .select("*")
          .eq("is_public", false)
          .order("created_at", { ascending: false });

        if (userError) throw userError;
        setUserTemplates((userData || []).map(item => ({
          ...item,
          headers: item.headers as Record<string, string>,
          variables: item.variables || [],
        })));
      }
    } catch (error: any) {
      toast.error("Erro ao carregar templates");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const detectVariables = (headers: Record<string, string>): string[] => {
    const variables = new Set<string>();
    const regex = /\{\{([A-Z_]+)\}\}/g;
    
    Object.values(headers).forEach(value => {
      let match;
      while ((match = regex.exec(value)) !== null) {
        variables.add(match[1]);
      }
    });
    
    return Array.from(variables);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (Object.keys(formData.headers).length === 0) {
      toast.error("Adicione pelo menos um header");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado");
        return;
      }

      if (editingId) {
        const { error } = await supabase
          .from("header_templates")
          .update({
            name: formData.name,
            description: formData.description || null,
            headers: formData.headers,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Template atualizado!");
      } else {
        const { error } = await supabase
          .from("header_templates")
          .insert({
            user_id: session.user.id,
            name: formData.name,
            description: formData.description || null,
            headers: formData.headers,
          });

        if (error) throw error;
        toast.success("Template criado!");
      }

      setFormData({ name: "", description: "", headers: {} });
      setEditingId(null);
      setIsCreating(false);
      loadTemplates();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar template");
      console.error(error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o template "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from("header_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Template excluído!");
      loadTemplates();
    } catch (error: any) {
      toast.error("Erro ao excluir template");
      console.error(error);
    }
  };

  const handleEdit = (template: HeaderTemplate) => {
    setFormData({
      name: template.name,
      description: template.description || "",
      headers: template.headers,
    });
    setEditingId(template.id);
    setIsCreating(true);
  };

  const handleSelect = (template: HeaderTemplate) => {
    const variables = template.variables && template.variables.length > 0 
      ? template.variables 
      : detectVariables(template.headers);
    
    if (variables.length > 0) {
      // Open variable form
      setVariableFormState({
        open: true,
        template,
        variables,
      });
    } else {
      // Apply directly
      setSelectedId(template.id);
      if (onSelectTemplate) {
        onSelectTemplate(template.headers);
        toast.success(`Template "${template.name}" aplicado!`);
      }
    }
  };

  const handleApplyVariables = (filledHeaders: Record<string, string>) => {
    if (variableFormState.template) {
      setSelectedId(variableFormState.template.id);
      if (onSelectTemplate) {
        onSelectTemplate(filledHeaders);
        toast.success(`Template "${variableFormState.template.name}" aplicado!`);
      }
    }
  };

  const handleDuplicate = (template: HeaderTemplate) => {
    setFormData({
      name: `${template.name} (cópia)`,
      description: template.description || "",
      headers: template.headers,
    });
    setIsCreating(true);
  };

  if (compact) {
    const allTemplates = [...publicTemplates, ...userTemplates];
    return (
      <>
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Templates salvos</Label>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Carregando...</p>
          ) : allTemplates.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum template disponível</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allTemplates.map((template) => (
                <Button
                  key={template.id}
                  size="sm"
                  variant={selectedId === template.id ? "default" : "outline"}
                  onClick={() => handleSelect(template)}
                  className="text-xs"
                >
                  {selectedId === template.id && <Check className="mr-1 h-3 w-3" />}
                  {template.name}
                </Button>
              ))}
            </div>
          )}
        </div>
        <TemplateVariableForm
          open={variableFormState.open}
          onOpenChange={(open) =>
            setVariableFormState({ ...variableFormState, open })
          }
          templateName={variableFormState.template?.name || ""}
          variables={variableFormState.variables}
          headers={variableFormState.template?.headers || {}}
          instructions={variableFormState.template?.instructions}
          onApply={handleApplyVariables}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Templates de Headers</h3>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Template" : "Novo Template"}</DialogTitle>
              <DialogDescription>
                Salve configurações de headers para reutilizar facilmente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Template *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Login Site X"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva para que serve este template..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label>Headers</Label>
                <HeadersInput
                  headers={formData.headers}
                  onChange={(headers) => setFormData({ ...formData, headers })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    setFormData({ name: "", description: "", headers: {} });
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave}>Salvar Template</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Carregando templates...</p>
      ) : userTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Você ainda não criou nenhum template de headers.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Templates permitem salvar configurações de autenticação e reutilizá-las facilmente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {userTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{template.name}</CardTitle>
                {template.description && (
                  <CardDescription className="text-xs line-clamp-2">
                    {template.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-xs text-muted-foreground">
                  {Object.keys(template.headers).length} header(s) configurado(s)
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.keys(template.headers).slice(0, 3).map((key) => (
                    <span key={key} className="text-xs bg-muted px-2 py-1 rounded">
                      {key}
                    </span>
                  ))}
                  {Object.keys(template.headers).length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{Object.keys(template.headers).length - 3}
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                {onSelectTemplate && (
                  <Button
                    size="sm"
                    variant={selectedId === template.id ? "default" : "outline"}
                    onClick={() => handleSelect(template)}
                    className="flex-1"
                  >
                    {selectedId === template.id ? "Selecionado" : "Usar"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(template)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(template.id, template.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <TemplateVariableForm
        open={variableFormState.open}
        onOpenChange={(open) =>
          setVariableFormState({ ...variableFormState, open })
        }
        templateName={variableFormState.template?.name || ""}
        variables={variableFormState.variables}
        headers={variableFormState.template?.headers || {}}
        instructions={variableFormState.template?.instructions}
        onApply={handleApplyVariables}
      />
    </div>
  );
}

// Export function for use in Templates page
export function TemplateLibrary({ onSelectTemplate }: { onSelectTemplate?: (headers: Record<string, string>) => void }) {
  const [publicTemplates, setPublicTemplates] = useState<HeaderTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [variableFormState, setVariableFormState] = useState<{
    open: boolean;
    template: HeaderTemplate | null;
    variables: string[];
  }>({
    open: false,
    template: null,
    variables: [],
  });

  useEffect(() => {
    loadPublicTemplates();
  }, []);

  const loadPublicTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("header_templates")
        .select("*")
        .eq("is_public", true)
        .order("category", { ascending: true });

      if (error) throw error;
      setPublicTemplates((data || []).map(item => ({
        ...item,
        headers: item.headers as Record<string, string>,
        variables: item.variables || [],
      })));
    } catch (error: any) {
      toast.error("Erro ao carregar templates");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const detectVariables = (headers: Record<string, string>): string[] => {
    const variables = new Set<string>();
    const regex = /\{\{([A-Z_]+)\}\}/g;
    
    Object.values(headers).forEach(value => {
      let match;
      while ((match = regex.exec(value)) !== null) {
        variables.add(match[1]);
      }
    });
    
    return Array.from(variables);
  };

  const handleSelect = (template: HeaderTemplate) => {
    const variables = template.variables && template.variables.length > 0 
      ? template.variables 
      : detectVariables(template.headers);
    
    if (variables.length > 0) {
      setVariableFormState({
        open: true,
        template,
        variables,
      });
    } else {
      setSelectedId(template.id);
      if (onSelectTemplate) {
        onSelectTemplate(template.headers);
        toast.success(`Template "${template.name}" aplicado!`);
      }
    }
  };

  const handleApplyVariables = (filledHeaders: Record<string, string>) => {
    if (variableFormState.template) {
      setSelectedId(variableFormState.template.id);
      if (onSelectTemplate) {
        onSelectTemplate(filledHeaders);
        toast.success(`Template "${variableFormState.template.name}" aplicado!`);
      }
    }
  };

  const handleDuplicate = async (template: HeaderTemplate) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado para duplicar templates");
        return;
      }

      const { error } = await supabase
        .from("header_templates")
        .insert({
          user_id: session.user.id,
          name: `${template.name} (cópia)`,
          description: template.description,
          headers: template.headers,
        });

      if (error) throw error;
      toast.success("Template duplicado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao duplicar template");
      console.error(error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "auth":
        return "🔐";
      case "api":
        return "🔌";
      case "bypass":
        return "🤖";
      default:
        return "📦";
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case "auth":
        return "Autenticação";
      case "api":
        return "APIs";
      case "bypass":
        return "Anti-Bot";
      default:
        return "Outros";
    }
  };

  if (isLoading) {
    return <p className="text-center py-8 text-muted-foreground">Carregando templates...</p>;
  }

  const categories = Array.from(new Set(publicTemplates.map(t => t.category || "other")));

  return (
    <>
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryTemplates = publicTemplates.filter(t => (t.category || "other") === category);
          return (
            <div key={category}>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <span>{getCategoryIcon(category)}</span>
                <span>{getCategoryName(category)}</span>
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categoryTemplates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.description && (
                        <CardDescription className="text-xs line-clamp-2">
                          {template.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="text-xs text-muted-foreground">
                        {Object.keys(template.headers).length} header(s) configurado(s)
                      </div>
                      {template.variables && template.variables.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {template.variables.map((variable) => (
                            <span key={variable} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {`{{${variable}}}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        size="sm"
                        variant={selectedId === template.id ? "default" : "outline"}
                        onClick={() => handleSelect(template)}
                        className="flex-1"
                      >
                        {selectedId === template.id ? "Selecionado" : "Usar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicate(template)}
                        title="Duplicar e personalizar"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <TemplateVariableForm
        open={variableFormState.open}
        onOpenChange={(open) =>
          setVariableFormState({ ...variableFormState, open })
        }
        templateName={variableFormState.template?.name || ""}
        variables={variableFormState.variables}
        headers={variableFormState.template?.headers || {}}
        instructions={variableFormState.template?.instructions}
        onApply={handleApplyVariables}
      />
    </>
  );
}
