import { useState, useRef, useEffect } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { StylePanel } from './StylePanel';
import { ElementSelector } from './ElementSelector';
import { TextEditor } from './TextEditor';
import { LinkEditor } from './LinkEditor';
import { DOMTree } from './DOMTree';
import { useElementSelection } from '@/hooks/useElementSelection';
import { useStyleEditor } from '@/hooks/useStyleEditor';
import { useEditorHistory } from '@/hooks/useEditorHistory';
import { isEditableText, isLink, sanitizeHtml } from '@/lib/editorUtils';
import { useToast } from '@/hooks/use-toast';

interface VisualEditorProps {
  html: string;
  onSave: (editedHtml: string) => void;
  onCancel: () => void;
}

export function VisualEditor({ html, onSave, onCancel }: VisualEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeDocument, setIframeDocument] = useState<Document | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [showDOMTree, setShowDOMTree] = useState(false);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const { toast } = useToast();

  const { selectedElement, hoveredElement, selectElement, hoverElement, clearSelection } = useElementSelection();
  const { currentStyles, loadStyles, updateStyle } = useStyleEditor();
  const { pushState, undo, redo, canUndo, canRedo } = useEditorHistory(html);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        setIframeDocument(doc);
      }
    }
  }, [html]);

  useEffect(() => {
    if (selectedElement?.node) {
      loadStyles(selectedElement.node);
    }
  }, [selectedElement, loadStyles]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      } else if (e.key === 'Delete' && selectedElement?.node) {
        e.preventDefault();
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement]);

  const getCurrentHtml = (): string => {
    if (!iframeDocument) return html;
    return iframeDocument.documentElement.outerHTML;
  };

  const handleSave = () => {
    const editedHtml = getCurrentHtml();
    pushState(editedHtml);
    onSave(sanitizeHtml(editedHtml));
    toast({ title: "Alterações salvas com sucesso!" });
  };

  const handleUndo = () => {
    const previousHtml = undo();
    if (previousHtml && iframeDocument) {
      iframeDocument.open();
      iframeDocument.write(previousHtml);
      iframeDocument.close();
      toast({ title: "Desfeito" });
    }
  };

  const handleRedo = () => {
    const nextHtml = redo();
    if (nextHtml && iframeDocument) {
      iframeDocument.open();
      iframeDocument.write(nextHtml);
      iframeDocument.close();
      toast({ title: "Refeito" });
    }
  };

  const handleDelete = () => {
    if (selectedElement?.node) {
      selectedElement.node.remove();
      pushState(getCurrentHtml());
      clearSelection();
      toast({ title: "Elemento deletado" });
    }
  };

  const handleStyleChange = (property: string, value: string) => {
    if (selectedElement?.node) {
      updateStyle(selectedElement.node, property, value);
      pushState(getCurrentHtml());
    }
  };

  const handleEditText = () => {
    if (selectedElement?.node && isEditableText(selectedElement.node)) {
      setIsEditingText(true);
    }
  };

  const handleEditLink = () => {
    if (selectedElement?.node && isLink(selectedElement.node)) {
      setIsEditingLink(true);
    }
  };

  const handleSaveText = (newText: string) => {
    if (selectedElement?.node) {
      selectedElement.node.innerHTML = newText;
      pushState(getCurrentHtml());
      setIsEditingText(false);
      toast({ title: "Texto atualizado" });
    }
  };

  const handleSaveLink = (href: string, target: string) => {
    if (selectedElement?.node && isLink(selectedElement.node)) {
      const linkElement = selectedElement.node as HTMLAnchorElement;
      linkElement.href = href;
      linkElement.target = target;
      if (target === '_blank') {
        linkElement.rel = 'noopener noreferrer';
      }
      pushState(getCurrentHtml());
      setIsEditingLink(false);
      toast({ title: "Link atualizado" });
    }
  };

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '768px';
      default:
        return '100%';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <EditorToolbar
        onSave={handleSave}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onPreview={() => window.open(URL.createObjectURL(new Blob([getCurrentHtml()], { type: 'text/html' })), '_blank')}
        onDelete={handleDelete}
        onEditText={handleEditText}
        onEditLink={handleEditLink}
        onClose={onCancel}
        onToggleDOMTree={() => setShowDOMTree(!showDOMTree)}
        canUndo={canUndo}
        canRedo={canRedo}
        hasSelection={!!selectedElement}
        isLink={!!(selectedElement?.node && isLink(selectedElement.node))}
        showDOMTree={showDOMTree}
        viewport={viewport}
        onViewportChange={setViewport}
      />

      <div className="flex h-[calc(100vh-3.5rem)]">
        <div className="flex-1 overflow-auto bg-muted/20 p-4">
          <div 
            className="mx-auto bg-white shadow-lg transition-all duration-300" 
            style={{ width: getViewportWidth(), maxWidth: '100%' }}
          >
            <iframe
              ref={iframeRef}
              className="w-full h-full min-h-[800px] border-0"
              title="Editor Preview"
            />
          </div>
        </div>

        <StylePanel
          selectedElement={selectedElement?.node || null}
          styles={currentStyles}
          onStyleChange={handleStyleChange}
        />

        {showDOMTree && (
          <DOMTree
            iframeDocument={iframeDocument}
            selectedElement={selectedElement?.node || null}
            onSelectElement={selectElement}
          />
        )}
      </div>

      <ElementSelector
        iframeDocument={iframeDocument}
        onElementHover={(el) => hoverElement(el)}
        onElementSelect={(el) => selectElement(el)}
        isActive={!isEditingText && !isEditingLink}
      />

      {isEditingText && (
        <TextEditor
          element={selectedElement?.node || null}
          onSave={handleSaveText}
          onCancel={() => setIsEditingText(false)}
        />
      )}

      {isEditingLink && (
        <LinkEditor
          element={selectedElement?.node as HTMLAnchorElement}
          onSave={handleSaveLink}
          onCancel={() => setIsEditingLink(false)}
        />
      )}
    </div>
  );
}
