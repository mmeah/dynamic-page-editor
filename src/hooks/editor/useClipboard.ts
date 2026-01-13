
import React from 'react';
import { useToast } from "@/hooks/use-toast";
import { EditorAction, EditorState } from './useEditorState';
import { PageElement } from '@/lib/types';

export function useClipboard(
  state: EditorState,
  dispatch: React.Dispatch<EditorAction>
) {
  // Local dialog state for showing the Chrome link
  const [chromeDialog, setChromeDialog] = React.useState<{ open: boolean, url: string } | null>(null);
  const { toast } = useToast();
  const { selectedElementIds, config } = state;
  const clipboardRef = React.useRef<PageElement[]>([]);

  const showPermissionErrorToast = React.useCallback(() => {
    const isChrome = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
    let description = "Please allow clipboard access in your browser settings.";
    let onClick;

    if (isChrome && typeof window !== 'undefined') {
      const site = window.location.origin;
      const chromeUrl = `chrome://settings/content/siteDetails?site=${site}`;
      description = `For Chrome, please click this message to open settings. ${chromeUrl}`;
      onClick = () => {
        setChromeDialog({ open: true, url: chromeUrl });
      };
    }

    toast({
      variant: "destructive",
      title: "Clipboard permission denied",
      description: description,
      duration: 30000,
      onClick,
    });
  }, [toast]);

  const handleCopy = React.useCallback(async () => {
    if (selectedElementIds.length > 0) {
      try {
        const selectedElements = config.elements.filter(el => selectedElementIds.includes(el.id));
        clipboardRef.current = selectedElements;
        await navigator.clipboard.writeText(JSON.stringify(selectedElements, null, 2));
        toast({ title: `Copied ${selectedElementIds.length} element(s) to clipboard` });
      } catch (error: any) {
        if (error.name === 'NotAllowedError') {
          showPermissionErrorToast();
        } else {
          toast({
            variant: "destructive",
            title: "Copy failed",
            description: "Could not copy elements to clipboard.",
          });
        }
      }
    }
  }, [selectedElementIds, config.elements, toast, showPermissionErrorToast]);

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
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        showPermissionErrorToast();
      } else {
        console.error("Failed to paste from clipboard:", error);
        toast({
            variant: "destructive",
            title: "Paste failed",
            description: "Could not paste from clipboard. The content may not be valid.",
        });
      }
    }
  }, [config.elements, dispatch, toast, showPermissionErrorToast]);

  const handleSelectAll = React.useCallback(() => {
    const allElementIds = config.elements.map(el => el.id);
    dispatch({ type: 'SET_SELECTED_ELEMENT_IDS', payload: { selectedElementIds: allElementIds } });
  }, [config.elements, dispatch]);

  // Instead of returning JSX, return dialog state and close handler
  return {
    handleCopy,
    handlePaste,
    handleSelectAll,
    chromeDialog,
    closeChromeDialog: () => setChromeDialog(null),
  };
}
