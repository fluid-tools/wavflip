import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { DragOperation } from './types';

export function useDragHistory(maxHistory = 10) {
  const historyRef = useRef<DragOperation[]>([]);

  const addToHistory = useCallback(
    (operation: DragOperation) => {
      historyRef.current = [
        operation,
        ...historyRef.current.slice(0, maxHistory - 1),
      ];
    },
    [maxHistory]
  );

  const undo = useCallback(
    async (onUndo: (operation: DragOperation) => Promise<void>) => {
      const lastOperation = historyRef.current[0];
      if (!lastOperation) {
        toast.error('Nothing to undo');
        return;
      }

      try {
        await onUndo({
          ...lastOperation,
          from: lastOperation.to,
          to: lastOperation.from,
        });
        historyRef.current = historyRef.current.slice(1);
        toast.success('Undone');
      } catch {
        toast.error('Failed to undo');
      }
    },
    []
  );

  return { addToHistory, undo, history: historyRef.current };
}

export function useMultiSelect() {
  const selectedRef = useRef<Set<string>>(new Set());

  const toggleSelection = useCallback((id: string) => {
    if (selectedRef.current.has(id)) {
      selectedRef.current.delete(id);
    } else {
      selectedRef.current.add(id);
    }
  }, []);

  const clearSelection = useCallback(() => {
    selectedRef.current.clear();
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedRef.current.has(id);
  }, []);

  return {
    selected: selectedRef.current,
    toggleSelection,
    clearSelection,
    isSelected,
  };
}
