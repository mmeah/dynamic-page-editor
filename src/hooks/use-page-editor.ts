
import React from 'react';
import { useToast } from "@/hooks/use-toast";
import { loadConfig } from '@/lib/config-service';
import { useEditorState } from './editor/useEditorState';
import { useAuthentication } from './editor/useAuthentication';
import { useClipboard } from './editor/useClipboard';
import { ChromeClipboardDialog } from '@/components/chrome-clipboard-dialog';
import { useElementArrangement } from './editor/useElementArrangement';
import { useElementInteractions } from './editor/useElementInteractions';
import { useKeyboardShortcuts } from './editor/useKeyboardShortcuts';

export function usePageEditor() {
  const [state, dispatch] = useEditorState();
  const { toast } = useToast();
  const mainContainerRef = React.useRef<HTMLDivElement>(null);
  const mousePosition = React.useRef({ x: 0, y: 0 });

  // Initial config loading
  React.useEffect(() => {
    dispatch({ type: 'SET_IS_MOUNTED', payload: true });

    const params = new URLSearchParams(window.location.search);
    const configParam = params.get('config');
    const configFile = configParam ? (configParam.endsWith('.json') ? configParam : `${configParam}.json`) : 'configuration.json';

    loadConfig(configFile, configParam)
      .then(config => dispatch({ type: 'SET_CONFIG', payload: config }))
      .catch(error => {
        toast({
          variant: "destructive",
          title: "Failed to load initial configuration",
          description: error.message,
        });
      });
  }, [toast, dispatch]);

  // Document title and favicon effect
  React.useEffect(() => {
    const pageTitleElement = state.config.elements.find(el => el.id === 'page-title');
    const pageTitle = pageTitleElement ? pageTitleElement.text : 'Dynamic Page';

    if (pageTitle) {
      document.title = pageTitle;
    }
    if (state.config.favicon) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = state.config.favicon;
    }
  }, [state.config]);

  const { handleEditModeToggle, handlePasswordSubmit } = useAuthentication(state, dispatch);
  
  const { 
    handleMouseDown,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleContainerClick,
    handleCanvasMouseDown,
    handleResizeStart,
    handleContextMenu,
    closeContextMenu,
    addElement,
    deleteElement,
    openEditModal,
    handleUpdateElement,
    handleElementClick,
    getElementRect,
    handleMouseMove,
   } = useElementInteractions(state, dispatch, mainContainerRef, mousePosition);
  
  const { alignElements, reorderElement } = useElementArrangement(state, dispatch, getElementRect, closeContextMenu);

  const { handleCopy, handlePaste, handleSelectAll, chromeDialog, closeChromeDialog } = useClipboard(state, dispatch);

  const handleUndo = React.useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  useKeyboardShortcuts(state, dispatch, { handleCopy, handlePaste, deleteElement, handleSelectAll, handleUndo }, mousePosition);

  return {
    ...state,
    mainContainerRef,
    handleEditModeToggle,
    handlePasswordSubmit,
    setPasswordInput: (payload: string) => dispatch({ type: 'SET_PASSWORD_INPUT', payload }),
    handleContextMenu,
    closeContextMenu,
    addElement,
    deleteElement,
    openEditModal,
    handleUpdateElement,
    setEditingElement: (payload: any) => dispatch({ type: 'SET_EDITING_ELEMENT', payload }),
    handleElementClick,
    handleMouseDown,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleContainerClick,
    handleCanvasMouseDown,
    alignElements,
    reorderElement,
    setShowJsonExport: (payload: boolean) => dispatch({ type: 'SET_SHOW_JSON_EXPORT', payload }),
    setShowPasswordPrompt: (payload: boolean) => dispatch({ type: 'SET_SHOW_PASSWORD_PROMPT', payload }),
    handleResizeStart,
    handleMouseMove,
    handleUndo,
    chromeDialog,
    closeChromeDialog,
  };
}
