import { useState, useCallback, useRef } from 'react';

interface HistoryState {
  html: string;
  timestamp: number;
}

const MAX_HISTORY = 50;
const DEBOUNCE_TIME = 500;

export function useEditorHistory(initialHtml: string) {
  const [history, setHistory] = useState<HistoryState[]>([
    { html: initialHtml, timestamp: Date.now() }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const pushState = useCallback((html: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setHistory(prev => {
        const newHistory = prev.slice(0, currentIndex + 1);
        newHistory.push({ html, timestamp: Date.now() });
        
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
          return newHistory;
        }
        
        return newHistory;
      });
      setCurrentIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
    }, DEBOUNCE_TIME);
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1].html;
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1].html;
    }
    return null;
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return { pushState, undo, redo, canUndo, canRedo };
}
