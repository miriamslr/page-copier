import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Save, Undo, Redo, Eye, Trash2, Edit3, Link2, X, List } from "lucide-react";
import { ResponsivePreview } from './ResponsivePreview';

interface EditorToolbarProps {
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onPreview: () => void;
  onDelete: () => void;
  onEditText: () => void;
  onEditLink: () => void;
  onClose: () => void;
  onToggleDOMTree: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  isLink: boolean;
  showDOMTree: boolean;
  viewport: 'desktop' | 'tablet' | 'mobile';
  onViewportChange: (viewport: 'desktop' | 'tablet' | 'mobile') => void;
}

export function EditorToolbar({
  onSave,
  onUndo,
  onRedo,
  onPreview,
  onDelete,
  onEditText,
  onEditLink,
  onClose,
  onToggleDOMTree,
  canUndo,
  canRedo,
  hasSelection,
  isLink,
  showDOMTree,
  viewport,
  onViewportChange,
}: EditorToolbarProps) {
  return (
    <div className="h-14 border-b bg-background flex items-center px-4 gap-2">
      <div className="flex items-center gap-2">
        <Button onClick={onSave} size="sm">
          <Save className="h-4 w-4 mr-2" />
          Salvar
        </Button>
        <Button onClick={onClose} size="sm" variant="outline">
          <X className="h-4 w-4 mr-2" />
          Fechar Editor
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      <div className="flex items-center gap-1">
        <Button onClick={onUndo} size="sm" variant="ghost" disabled={!canUndo} title="Desfazer (Ctrl+Z)">
          <Undo className="h-4 w-4" />
        </Button>
        <Button onClick={onRedo} size="sm" variant="ghost" disabled={!canRedo} title="Refazer (Ctrl+Y)">
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {hasSelection && (
        <>
          <div className="flex items-center gap-1">
            <Button onClick={onEditText} size="sm" variant="ghost" title="Editar texto">
              <Edit3 className="h-4 w-4" />
            </Button>
            {isLink && (
              <Button onClick={onEditLink} size="sm" variant="ghost" title="Editar link">
                <Link2 className="h-4 w-4" />
              </Button>
            )}
            <Button onClick={onDelete} size="sm" variant="ghost" title="Deletar elemento (Del)">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Separator orientation="vertical" className="h-8" />
        </>
      )}

      <Button onClick={onPreview} size="sm" variant="outline">
        <Eye className="h-4 w-4 mr-2" />
        Preview
      </Button>

      <Separator orientation="vertical" className="h-8" />

      <ResponsivePreview viewport={viewport} onViewportChange={onViewportChange} />

      <Separator orientation="vertical" className="h-8" />

      <Button 
        onClick={onToggleDOMTree} 
        size="sm" 
        variant={showDOMTree ? "default" : "outline"}
        title="Árvore DOM"
      >
        <List className="h-4 w-4 mr-2" />
        DOM
      </Button>

      <div className="ml-auto text-sm text-muted-foreground">
        Editor Visual MVP
      </div>
    </div>
  );
}
