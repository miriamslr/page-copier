import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface TemplateVariableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  variables: string[];
  headers: Record<string, string>;
  instructions?: string;
  onApply: (filledHeaders: Record<string, string>) => void;
}

export function TemplateVariableForm({
  open,
  onOpenChange,
  templateName,
  variables,
  headers,
  instructions,
  onApply,
}: TemplateVariableFormProps) {
  const [values, setValues] = useState<Record<string, string>>(
    variables.reduce((acc, variable) => ({ ...acc, [variable]: "" }), {})
  );

  const handleApply = () => {
    // Check if all variables are filled
    const missingVars = variables.filter((v) => !values[v]?.trim());
    if (missingVars.length > 0) {
      return;
    }

    // Replace variables in headers
    const filledHeaders: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
      let filledValue = value;
      variables.forEach((variable) => {
        filledValue = filledValue.replace(
          new RegExp(`\\{\\{${variable}\\}\\}`, "g"),
          values[variable]
        );
      });
      filledHeaders[key] = filledValue;
    });

    onApply(filledHeaders);
    onOpenChange(false);
    
    // Reset form
    setValues(variables.reduce((acc, variable) => ({ ...acc, [variable]: "" }), {}));
  };

  const getPreview = () => {
    const preview: string[] = [];
    Object.entries(headers).forEach(([key, value]) => {
      let previewValue = value;
      variables.forEach((variable) => {
        const fillValue = values[variable] || `{{${variable}}}`;
        previewValue = previewValue.replace(
          new RegExp(`\\{\\{${variable}\\}\\}`, "g"),
          fillValue
        );
      });
      preview.push(`${key}: ${previewValue}`);
    });
    return preview;
  };

  const allFilled = variables.every((v) => values[v]?.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>📝 Complete os Dados do Template</DialogTitle>
          <DialogDescription>Template: {templateName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {instructions && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">{instructions}</AlertDescription>
            </Alert>
          )}

          {variables.map((variable) => (
            <div key={variable}>
              <Label htmlFor={variable}>
                {variable.replace(/_/g, " ")} *
              </Label>
              <Input
                id={variable}
                placeholder={`Cole aqui o valor de ${variable}`}
                value={values[variable]}
                onChange={(e) =>
                  setValues({ ...values, [variable]: e.target.value })
                }
                className="font-mono text-sm"
              />
            </div>
          ))}

          <div>
            <Label className="text-muted-foreground">Preview dos Headers:</Label>
            <div className="mt-2 rounded-md bg-muted p-3 font-mono text-xs space-y-1">
              {getPreview().map((line, i) => (
                <div key={i} className="break-all">{line}</div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setValues(variables.reduce((acc, variable) => ({ ...acc, [variable]: "" }), {}));
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleApply} disabled={!allFilled}>
              Aplicar Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
