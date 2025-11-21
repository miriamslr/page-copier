import { ColorPicker } from "./ColorPicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface StylePanelProps {
  selectedElement: HTMLElement | null;
  styles: any;
  onStyleChange: (property: string, value: string) => void;
}

export function StylePanel({ selectedElement, styles, onStyleChange }: StylePanelProps) {
  if (!selectedElement || !styles) {
    return (
      <div className="w-80 border-l bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">Selecione um elemento para editar</p>
      </div>
    );
  }

  const SpacingControl = ({ label, properties }: { label: string; properties: { top: string; right: string; bottom: string; left: string } }) => (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">Top</Label>
          <Input
            type="text"
            value={styles[properties.top]}
            onChange={(e) => onStyleChange(properties.top, e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Right</Label>
          <Input
            type="text"
            value={styles[properties.right]}
            onChange={(e) => onStyleChange(properties.right, e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Bottom</Label>
          <Input
            type="text"
            value={styles[properties.bottom]}
            onChange={(e) => onStyleChange(properties.bottom, e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Left</Label>
          <Input
            type="text"
            value={styles[properties.left]}
            onChange={(e) => onStyleChange(properties.left, e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-80 border-l bg-background">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Painel de Estilos</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {selectedElement.tagName.toLowerCase()}
          {selectedElement.className && `.${selectedElement.className.split(' ')[0]}`}
        </p>
      </div>
      
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-4 space-y-6">
          {/* Cores */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">🎨 Cores</h4>
            <ColorPicker
              label="Cor de fundo"
              value={styles.backgroundColor}
              onChange={(value) => onStyleChange('background-color', value)}
            />
            <ColorPicker
              label="Cor do texto"
              value={styles.color}
              onChange={(value) => onStyleChange('color', value)}
            />
          </div>

          <Separator />

          {/* Tipografia */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">✍️ Tipografia</h4>
            
            <div>
              <Label className="text-sm">Família da fonte</Label>
              <Select
                value={styles.fontFamily}
                onValueChange={(value) => onStyleChange('font-family', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                  <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                  <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                  <SelectItem value="Georgia, serif">Georgia</SelectItem>
                  <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Tamanho</Label>
              <Input
                type="text"
                value={styles.fontSize}
                onChange={(e) => onStyleChange('font-size', e.target.value)}
                className="mt-1"
                placeholder="16px"
              />
            </div>

            <div>
              <Label className="text-sm">Peso</Label>
              <Select
                value={styles.fontWeight}
                onValueChange={(value) => onStyleChange('font-weight', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Light (300)</SelectItem>
                  <SelectItem value="400">Normal (400)</SelectItem>
                  <SelectItem value="500">Medium (500)</SelectItem>
                  <SelectItem value="600">Semibold (600)</SelectItem>
                  <SelectItem value="700">Bold (700)</SelectItem>
                  <SelectItem value="800">Extra Bold (800)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Espaçamento */}
          <SpacingControl
            label="📏 Padding"
            properties={{
              top: 'paddingTop',
              right: 'paddingRight',
              bottom: 'paddingBottom',
              left: 'paddingLeft',
            }}
          />

          <Separator />

          <SpacingControl
            label="📐 Margin"
            properties={{
              top: 'marginTop',
              right: 'marginRight',
              bottom: 'marginBottom',
              left: 'marginLeft',
            }}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
