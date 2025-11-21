import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";

interface LinkEditorProps {
  element: HTMLAnchorElement | null;
  onSave: (href: string, target: string) => void;
  onCancel: () => void;
}

export function LinkEditor({ element, onSave, onCancel }: LinkEditorProps) {
  const [href, setHref] = useState('');
  const [target, setTarget] = useState('_self');

  useEffect(() => {
    if (element) {
      setHref(element.href || '');
      setTarget(element.target || '_self');
    }
  }, [element]);

  if (!element) return null;

  const handleSave = () => {
    onSave(href, target);
  };

  return (
    <div className="absolute bg-background border rounded-lg shadow-lg p-4 z-50 min-w-[350px]" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
      <h3 className="font-semibold mb-4">Editar Link</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="href">URL</Label>
          <Input
            id="href"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="https://exemplo.com"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="target">Abrir em</Label>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_self">Mesma janela</SelectItem>
              <SelectItem value="_blank">Nova janela</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 mt-4 justify-end">
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
