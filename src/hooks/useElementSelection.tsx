import { useState, useCallback } from 'react';
import { EditorElement, getElementInfo } from '@/lib/editorUtils';

export function useElementSelection() {
  const [selectedElement, setSelectedElement] = useState<EditorElement | null>(null);
  const [hoveredElement, setHoveredElement] = useState<EditorElement | null>(null);

  const selectElement = useCallback((element: HTMLElement | null) => {
    if (!element) {
      setSelectedElement(null);
      return;
    }
    setSelectedElement(getElementInfo(element));
  }, []);

  const hoverElement = useCallback((element: HTMLElement | null) => {
    if (!element) {
      setHoveredElement(null);
      return;
    }
    setHoveredElement(getElementInfo(element));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedElement(null);
  }, []);

  return {
    selectedElement,
    hoveredElement,
    selectElement,
    hoverElement,
    clearSelection,
  };
}
