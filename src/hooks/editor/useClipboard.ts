
import React from 'react';
import { useToast } from "@/hooks/use-toast";
import { EditorAction, EditorState } from './useEditorState';
import { PageElement } from '@/lib/types';

export function useClipboard(
  state: EditorState,
  dispatch: React.Dispatch<EditorAction>,
) {
  const { toast } = useToast();
  const { selectedElementIds, config } = state;
  const clipboardRef = React.useRef<PageElement[]>([]);

  const handleCopy = React.useCallback(() => {
    if (selectedElementIds.length > 0) {
      const selectedElements = config.elements.filter(el => selectedElementIds.includes(el.id));
      clipboardRef.current = selectedElements;
      navigator.clipboard.writeText(JSON.stringify(selectedElements, null, 2));
      toast({ title: `Copied ${selectedElementIds.length} element(s) to clipboard` });
    }
  }, [selectedElementIds, config.elements, toast]);

  const handlePaste = React.useCallback(async (mousePosition: { x: number, y: number }) => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const pastedElements = JSON.parse(clipboardText);

      if (Array.isArray(pastedElements) && pastedElements.every(el => el.id && el.type && el.x != null && el.y != null)) {
        const maxZIndex = Math.max(0, ...config.elements.map(el => el.zIndex || 0));
        let currentZ = maxZIndex;

        const boundingBox = pastedElements.reduce((acc, el) => {
            return {
                minX: Math.min(acc.minX, el.x),
                minY: Math.min(acc.minY, el.y),
            };
        }, { minX: Infinity, minY: Infinity });

        const offsetX = mousePosition.x - boundingBox.minX;
        const offsetY = mousePosition.y - boundingBox.minY;

        const newElements = pastedElements.map(el => {
          currentZ++;
          return {
            ...el,
            id: Date.now().toString() + Math.random(),
            x: el.x + offsetX,
            y: el.y + offsetY,
            zIndex: currentZ,
          };
        });

        const newElementsIds = newElements.map(el => el.id);
        dispatch({ type: 'UPDATE_ELEMENTS', payload: { elements: [...config.elements, ...newElements] } });
        dispatch({ type: 'SET_SELECTED_ELEMENT_IDS', payload: { selectedElementIds: newElementsIds } });
        toast({ title: `Pasted ${newElements.length} element(s)` });
      }
    } catch (error) {
        console.error("Failed to paste from clipboard:", error);
        toast({
            variant: "destructive",
            title: "Paste failed",
            description: "Could not paste from clipboard. The content may not be valid.",
        });
    }
  }, [config.elements, dispatch, toast]);

  const handleSelectAll = React.useCallback(() => {
    const allElementIds = config.elements.map(el => el.id);
    dispatch({ type: 'SET_SELECTED_ELEMENT_IDS', payload: { selectedElementIds: allElementIds } });
  }, [config.elements, dispatch]);

  return {
    handleCopy,
    handlePaste,
    handleSelectAll,
  };
}
