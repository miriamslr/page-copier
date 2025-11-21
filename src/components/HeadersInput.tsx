import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

interface HeaderEntry {
  key: string;
  value: string;
}

interface HeadersInputProps {
  headers: Record<string, string>;
  onChange: (headers: Record<string, string>) => void;
}

export const HeadersInput = ({ headers, onChange }: HeadersInputProps) => {
  const [entries, setEntries] = useState<HeaderEntry[]>(
    Object.entries(headers).map(([key, value]) => ({ key, value }))
  );

  const addHeader = () => {
    setEntries([...entries, { key: "", value: "" }]);
  };

  const removeHeader = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
    updateHeaders(newEntries);
  };

  const updateHeader = (index: number, field: "key" | "value", value: string) => {
    const newEntries = [...entries];
    newEntries[index][field] = value;
    setEntries(newEntries);
    updateHeaders(newEntries);
  };

  const updateHeaders = (newEntries: HeaderEntry[]) => {
    const headerObj: Record<string, string> = {};
    newEntries.forEach((entry) => {
      if (entry.key && entry.value) {
        headerObj[entry.key] = entry.value;
      }
    });
    onChange(headerObj);
  };

  return (
    <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Headers Personalizados</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={addHeader}
            className="h-8 border-border/50 hover:bg-accent/10"
          >
            <Plus className="h-3 w-3 mr-1" />
            Adicionar
          </Button>
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum header personalizado. Clique em "Adicionar" para incluir.
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Nome (ex: Cookie)"
                  value={entry.key}
                  onChange={(e) => updateHeader(index, "key", e.target.value)}
                  className="flex-1 h-9 bg-background border-border/50 text-sm"
                />
                <Input
                  placeholder="Valor"
                  value={entry.value}
                  onChange={(e) => updateHeader(index, "value", e.target.value)}
                  className="flex-1 h-9 bg-background border-border/50 text-sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeHeader(index)}
                  className="h-9 px-2 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            Exemplos comuns: Cookie, Authorization, User-Agent, Referer
          </p>
        </div>
      </div>
    </Card>
  );
};
