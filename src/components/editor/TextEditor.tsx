import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline, Save, X } from "lucide-react";

interface TextEditorProps {
  element: HTMLElement | null;
  onSave: (newText: string) => void;
  onCancel: () => void;
}

export function TextEditor({ element, onSave, onCancel }: TextEditorProps) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (element) {
      setText(element.textContent || '');
    }
  }, [element]);

  if (!element) return null;

  const handleSave = () => {
    onSave(text);
  };

  const applyFormat = (format: string) => {
    document.execCommand(format, false);
  };

  return (
    <div className="absolute bg-background border rounded-lg shadow-lg p-3 z-50" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
      <div className="flex gap-2 mb-2 border-b pb-2">
        <Button size="sm" variant="outline" onClick={() => applyFormat('bold')}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => applyFormat('italic')}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => applyFormat('underline')}>
          <Underline className="h-4 w-4" />
        </Button>
      </div>
      <div
        contentEditable
        className="min-w-[300px] min-h-[100px] p-2 border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        dangerouslySetInnerHTML={{ __html: text }}
        onInput={(e) => setText(e.currentTarget.innerHTML)}
      />
      <div className="flex gap-2 mt-2 justify-end">
        <Button size="sm" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSave}>
          <Save className="h-4 w-4 mr-1" />
          Salvar
        </Button>
      </div>
    </div>
  );
}
