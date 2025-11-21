import { useEffect, useRef } from 'react';

interface ElementSelectorProps {
  iframeDocument: Document | null;
  onElementHover: (element: HTMLElement | null) => void;
  onElementSelect: (element: HTMLElement | null) => void;
  isActive: boolean;
}

export function ElementSelector({
  iframeDocument,
  onElementHover,
  onElementSelect,
  isActive,
}: ElementSelectorProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!iframeDocument || !isActive) return;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      z-index: 9999;
      transition: all 0.1s ease;
    `;
    iframeDocument.body.appendChild(overlay);
    overlayRef.current = overlay;

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target === iframeDocument.body) return;

      const rect = target.getBoundingClientRect();
      overlay.style.top = `${rect.top + iframeDocument.documentElement.scrollTop}px`;
      overlay.style.left = `${rect.left}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;

      onElementHover(target);
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;
      if (!target || target === iframeDocument.body) return;

      overlay.style.borderColor = '#10b981';
      overlay.style.background = 'rgba(16, 185, 129, 0.1)';
      
      onElementSelect(target);
    };

    iframeDocument.addEventListener('mousemove', handleMouseMove);
    iframeDocument.addEventListener('click', handleClick);

    return () => {
      iframeDocument.removeEventListener('mousemove', handleMouseMove);
      iframeDocument.removeEventListener('click', handleClick);
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    };
  }, [iframeDocument, isActive, onElementHover, onElementSelect]);

  return null;
}
