import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResponsivePreviewProps {
  viewport: 'desktop' | 'tablet' | 'mobile';
  onViewportChange: (viewport: 'desktop' | 'tablet' | 'mobile') => void;
}

export function ResponsivePreview({ viewport, onViewportChange }: ResponsivePreviewProps) {
  return (
    <div className="flex items-center gap-1 bg-muted/30 rounded-md p-1">
      <Button
        size="sm"
        variant="ghost"
        className={cn(
          "h-8 px-3",
          viewport === 'desktop' && "bg-background shadow-sm"
        )}
        onClick={() => onViewportChange('desktop')}
        title="Desktop (100%)"
      >
        <Monitor className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className={cn(
          "h-8 px-3",
          viewport === 'tablet' && "bg-background shadow-sm"
        )}
        onClick={() => onViewportChange('tablet')}
        title="Tablet (768px)"
      >
        <Tablet className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className={cn(
          "h-8 px-3",
          viewport === 'mobile' && "bg-background shadow-sm"
        )}
        onClick={() => onViewportChange('mobile')}
        title="Mobile (375px)"
      >
        <Smartphone className="h-4 w-4" />
      </Button>
    </div>
  );
}
