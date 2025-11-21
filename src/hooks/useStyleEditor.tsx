import { useState, useCallback } from 'react';
import { applyStyle, getComputedStyles } from '@/lib/editorUtils';

interface StyleState {
  backgroundColor: string;
  color: string;
  fontSize: string;
  fontWeight: string;
  fontFamily: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
}

export function useStyleEditor() {
  const [currentStyles, setCurrentStyles] = useState<StyleState | null>(null);

  const loadStyles = useCallback((element: HTMLElement) => {
    const computed = getComputedStyles(element);
    setCurrentStyles({
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      fontFamily: computed.fontFamily,
      paddingTop: computed.paddingTop,
      paddingRight: computed.paddingRight,
      paddingBottom: computed.paddingBottom,
      paddingLeft: computed.paddingLeft,
      marginTop: computed.marginTop,
      marginRight: computed.marginRight,
      marginBottom: computed.marginBottom,
      marginLeft: computed.marginLeft,
    });
  }, []);

  const updateStyle = useCallback((element: HTMLElement, property: string, value: string) => {
    applyStyle(element, property, value);
    loadStyles(element);
  }, [loadStyles]);

  return { currentStyles, loadStyles, updateStyle };
}
