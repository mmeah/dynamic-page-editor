
import React from 'react';
import { useToast } from "@/hooks/use-toast";
import type { PageElement, ContextMenuData, PageConfig } from '@/lib/types';

import { loadConfig } from '@/lib/config-service';
const NUDGE_AMOUNT = 1;
const LONG_PRESS_DURATION = 300;
const PASTE_OFFSET = 10;

export function usePageEditor() {
  const [isMounted, setIsMounted] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = React.useState(false);
  const [passwordInput, setPasswordInput] = React.useState('');
  const [config, setConfig] = React.useState<PageConfig>({ elements: [] });
  const [contextMenu, setContextMenu] = React.useState<ContextMenuData>({ visible: false, x: 0, y: 0 });
  const [editingElement, setEditingElement] = React.useState<PageElement | null>(null);
  const [selectedElementIds, setSelectedElementIds] = React.useState<string[]>([]);
  const [showJsonExport, setShowJsonExport] = React.useState(false);
  const [isPageLoading, setIsPageLoading] = React.useState(false);
  const [draggingState, setDraggingState] = React.useState<{
    isDragging: boolean;
    initialPositions: Map<string, { x: number; y: number }>;
    startX: number;
    startY: number;
  } | null>(null);
  const mainContainerRef = React.useRef<HTMLDivElement>(null);
  const longPressTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const [resizingState, setResizingState] = React.useState<{
    isResizing: boolean;
    elementId: string;
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
  } | null>(null);
  const clipboardRef = React.useRef<PageElement[]>([]);

  React.useEffect(() => {
    setIsMounted(true);

    const params = new URLSearchParams(window.location.search);
    const configParam = params.get('config');
    const configFile = configParam ? (configParam.endsWith('.json') ? configParam : `${configParam}.json`) : 'configuration.json';

    loadConfig(configFile, configParam)
      .then(setConfig)
      .catch(error => {
        toast({
          variant: "destructive",
          title: "Failed to load initial configuration",
          description: error.message,
        });
      });
  }, [toast]);

  React.useEffect(() => {
    const pageTitleElement = config.elements.find(el => el.id === 'page-title');
    const pageTitle = pageTitleElement ? pageTitleElement.text : 'Dynamic Page';

    if (pageTitle) {
      document.title = pageTitle;
    }
    if (config.favicon) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = config.favicon;
    }
  }, [config]);


  const handleEditModeToggle = React.useCallback((checked: boolean) => {
    if (checked && !isAuthenticated) {
      setShowPasswordPrompt(true);
    } else {
      setIsEditMode(checked);
      if (!checked) {
        setSelectedElementIds([]);
      }
    }
  }, [isAuthenticated]);

  const handlePasswordSubmit = React.useCallback(() => {
    const correctPassword = config.editorPassword || 'admin';
    if (passwordInput === correctPassword) {
      setIsAuthenticated(true);
      setIsEditMode(true);
      setShowPasswordPrompt(false);
      setPasswordInput('');
    } else {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "Incorrect password.",
      })
    }
  }, [config.editorPassword, passwordInput, toast]);

  const handleContextMenu = React.useCallback((e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    const target = e.target as HTMLElement;
    const elementId = target.closest('[data-element-id]')?.getAttribute('data-element-id');
    if (elementId && !selectedElementIds.includes(elementId)) {
        setSelectedElementIds([elementId]);
    }

    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, elementId: selectedElementIds.length > 0 ? selectedElementIds[0] : undefined });
  }, [isEditMode, selectedElementIds]);

  const closeContextMenu = React.useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, []);
  
  const updateElements = React.useCallback((newElements: PageElement[], skipHistory = false) => {
    setConfig(prev => ({...prev, elements: newElements}));
  }, []);

  const addElement = React.useCallback((type: PageElement['type']) => {
    const maxZIndex = Math.max(0, ...config.elements.map(el => el.zIndex || 0));
    const newElement: PageElement = {
      id: Date.now().toString(),
      type,
      x: contextMenu.x,
      y: contextMenu.y,
      zIndex: maxZIndex + 1,
      text: type === 'text' ? 'New Text' : undefined,
      icon: type === 'icon' ? 'Smile' : undefined,
      src: type === 'image' ? (config.defaultImageUrl || `https://picsum.photos/seed/${Date.now()}/200/300`) : undefined,
      width: type === 'image' ? 200 : undefined,
      height: type === 'image' ? 300 : undefined,
      aspectRatio: type === 'image' ? 200/300 : undefined,
      url: type === 'button' ? config.defaultRestUrl : undefined,
      color: '#87CEEB',
      fontSize: 16,
      fontFamily: "'PT Sans', sans-serif",
      status: 'idle',
    };
    if (newElement.type === 'button') {
        newElement.text = 'New Button';
    }
    if (mainContainerRef.current) {
      const rect = mainContainerRef.current.getBoundingClientRect();
      newElement.x -= rect.left;
      newElement.y -= rect.top;
    }
    updateElements([...config.elements, newElement]);
    closeContextMenu();
  }, [config.elements, config.defaultImageUrl, config.defaultRestUrl, contextMenu.x, contextMenu.y, updateElements, closeContextMenu]);

  const deleteElement = React.useCallback(() => {
    if (selectedElementIds.length > 0) {
      updateElements(config.elements.filter(el => !selectedElementIds.includes(el.id)));
      setSelectedElementIds([]);
    }
    closeContextMenu();
  }, [config.elements, selectedElementIds, updateElements, closeContextMenu]);

  const openEditModal = React.useCallback(() => {
    if (selectedElementIds.length === 1) {
      const elementToEdit = config.elements.find(el => el.id === selectedElementIds[0]);
      if (elementToEdit) {
        setEditingElement(elementToEdit);
      }
    }
    closeContextMenu();
  }, [config.elements, selectedElementIds, closeContextMenu]);

  const handleUpdateElement = React.useCallback((updatedElement: PageElement) => {
    updateElements(config.elements.map(el => (el.id === updatedElement.id ? updatedElement : el)));
    setEditingElement(null);
  }, [config.elements, updateElements]);

  const handleElementClick = React.useCallback(async (element: PageElement) => {
    if (isEditMode || !element.url) return;

    if (element.type === 'button') {
        try {
            const response = await fetch(element.url as string);
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Request Failed",
                description: "The request to the specified URL failed.",
            });
        }
    } else {
        if (isPageLoading) return;

        setIsPageLoading(true);

        try {
            const response = await fetch(element.url as string);
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Request Failed",
                description: "The request to the specified URL failed.",
            });
        } finally {
            setIsPageLoading(false);
        }
    }
  }, [isEditMode, isPageLoading, toast]);

    const handleDragStart = React.useCallback((id: string, clientX: number, clientY: number, shiftKey = false) => {
    if (!isEditMode) return;

    let newSelectedIds: string[];
    if (shiftKey) {
      if (selectedElementIds.includes(id)) {
        newSelectedIds = selectedElementIds.filter(sid => sid !== id);
      } else {
        newSelectedIds = [...selectedElementIds, id];
      }
    } else {
      if (!selectedElementIds.includes(id)) {
        newSelectedIds = [id];
      } else {
        newSelectedIds = selectedElementIds;
      }
    }
    setSelectedElementIds(newSelectedIds);

    const initialPositions = new Map();
    config.elements.forEach(el => {
      if (newSelectedIds.includes(el.id)) {
        initialPositions.set(el.id, { x: el.x, y: el.y });
      }
    });

    setDraggingState({
      isDragging: true,
      initialPositions,
      startX: clientX,
      startY: clientY,
    });
  }, [isEditMode, selectedElementIds, config.elements]);

  const handleDragMove = React.useCallback((clientX: number, clientY: number) => {
    if (!draggingState || !mainContainerRef.current) return;
    
    const dx = clientX - draggingState.startX;
    const dy = clientY - draggingState.startY;

    updateElements(
      config.elements.map(el => {
        const initialPos = draggingState.initialPositions.get(el.id);
        if (initialPos) {
          const newX = initialPos.x + dx;
          const newY = initialPos.y + dy;
          return { ...el, x: newX, y: newY };
        }
        return el;
      }),
      true
    );
  }, [draggingState, config.elements, updateElements]);

  const handleDragEnd = React.useCallback(() => {
    if (draggingState) {
        setDraggingState(null);
    }
    if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
    }
  }, [draggingState]);
  
  const handleResizeStart = React.useCallback((e: React.MouseEvent | React.TouchEvent, elementId: string) => {
    e.stopPropagation();
    if (!isEditMode) return;
  
    const element = config.elements.find(el => el.id === elementId);
    if (!element || !element.width || !element.height) return;
  
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  
    setResizingState({
      isResizing: true,
      elementId,
      startX: clientX,
      startY: clientY,
      initialWidth: element.width,
      initialHeight: element.height,
    });
  }, [isEditMode, config.elements]);

  const handleResizeMove = React.useCallback((clientX: number, clientY: number) => {
    if (!resizingState || !resizingState.isResizing) return;
  
    const dx = clientX - resizingState.startX;
    const element = config.elements.find(el => el.id === resizingState.elementId);
    if (!element || !element.aspectRatio) return;
  
    const newWidth = resizingState.initialWidth + dx;
    const newHeight = newWidth / element.aspectRatio;
  
    updateElements(
      config.elements.map(el => 
        el.id === resizingState.elementId 
          ? { ...el, width: Math.max(20, newWidth), height: Math.max(20, newHeight) }
          : el
      ),
      true
    );
  }, [resizingState, config.elements, updateElements]);
  
  const handleResizeEnd = React.useCallback(() => {
    if (resizingState?.isResizing) {
      updateElements([...config.elements]);
      setResizingState(null);
    }
  }, [resizingState, config.elements, updateElements]);

  const handleGlobalMouseMove = React.useCallback((e: MouseEvent) => {
    if (draggingState) handleDragMove(e.clientX, e.clientY);
    if (resizingState?.isResizing) handleResizeMove(e.clientX, e.clientY);
  }, [draggingState, resizingState, handleDragMove, handleResizeMove]);

  const handleGlobalMouseUp = React.useCallback(() => {
    handleDragEnd();
    handleResizeEnd();
  }, [handleDragEnd, handleResizeEnd]);

  React.useEffect(() => {
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);


  const handleMouseDown = React.useCallback((e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return; // Only drag with left mouse button
    const target = e.target as HTMLElement;
    
    // Prevent drag from starting on a resize handle
    if (target.closest('[data-resize-handle]')) return;

    handleDragStart(id, e.clientX, e.clientY, e.shiftKey);
  }, [handleDragStart]);
  
  const handleTouchStart = React.useCallback((e: React.TouchEvent, id: string) => {
    if (!isEditMode) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-resize-handle]')) return;

    const touch = e.touches[0];
    
    if (e.touches.length === 1) {
      longPressTimeoutRef.current = setTimeout(() => {
          handleDragStart(id, touch.clientX, touch.clientY, e.shiftKey);
          longPressTimeoutRef.current = null; 
      }, LONG_PRESS_DURATION);
    }
  }, [isEditMode, handleDragStart]);

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (longPressTimeoutRef.current) {
        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - (draggingState?.startX ?? touch.clientX));
        const dy = Math.abs(touch.clientY - (draggingState?.startY ?? touch.clientY));
        if (dx > 5 || dy > 5) {
          clearTimeout(longPressTimeoutRef.current);
          longPressTimeoutRef.current = null;
        }
    }
    if (draggingState) {
        e.preventDefault(); 
        const touch = e.touches[0];
        handleDragMove(touch.clientX, touch.clientY);
    }
    if (resizingState?.isResizing) {
        e.preventDefault();
        const touch = e.touches[0];
        handleResizeMove(touch.clientX, touch.clientY);
    }
  }, [draggingState, resizingState, handleDragMove, handleResizeMove]);

  const handleTouchEnd = React.useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    handleDragEnd();
    handleResizeEnd();
  }, [handleDragEnd, handleResizeEnd]);

  const handleContainerClick = React.useCallback((e: React.MouseEvent) => {
      if (e.target === mainContainerRef.current) {
          setSelectedElementIds([]);
      }
      closeContextMenu();
  }, [closeContextMenu]);

  const handleCopy = React.useCallback(() => {
    if (selectedElementIds.length > 0) {
      clipboardRef.current = config.elements.filter(el => selectedElementIds.includes(el.id));
      toast({ title: `Copied ${selectedElementIds.length} element(s)` });
    }
  }, [selectedElementIds, config.elements, toast]);

  const handlePaste = React.useCallback(() => {
    if (clipboardRef.current.length > 0) {
      const maxZIndex = Math.max(0, ...config.elements.map(el => el.zIndex || 0));
      let currentZ = maxZIndex;

      const newElements = clipboardRef.current.map(el => {
        currentZ++;
        return {
          ...el,
          id: Date.now().toString() + Math.random(),
          x: el.x + PASTE_OFFSET,
          y: el.y + PASTE_OFFSET,
          zIndex: currentZ,
        };
      });

      const newElementsIds = newElements.map(el => el.id);
      updateElements([...config.elements, ...newElements]);
      setSelectedElementIds(newElementsIds);
      toast({ title: `Pasted ${newElements.length} element(s)` });
    }
  }, [config.elements, updateElements, toast]);


  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    if (!isEditMode || editingElement) return;

    if ((e.metaKey || e.ctrlKey)) {
        if (e.key === 'c') {
            e.preventDefault();
            handleCopy();
            return;
        }
        if (e.key === 'v') {
            e.preventDefault();
            handlePaste();
            return;
        }
    }

    if(selectedElementIds.length === 0) return;

    let dx = 0;
    let dy = 0;

    switch(e.key) {
        case 'ArrowUp':
            dy = -NUDGE_AMOUNT;
            break;
        case 'ArrowDown':
            dy = NUDGE_AMOUNT;
            break;
        case 'ArrowLeft':
            dx = -NUDGE_AMOUNT;
            break;
        case 'ArrowRight':
            dx = NUDGE_AMOUNT;
            break;
        case 'Delete':
        case 'Backspace':
            e.preventDefault();
            deleteElement();
            return;
        default:
            return;
    }
    
    e.preventDefault();

    updateElements(
        config.elements.map(el => 
            selectedElementIds.includes(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el
        )
    );
  }, [isEditMode, selectedElementIds, config.elements, editingElement, handleCopy, handlePaste, updateElements, deleteElement]);


  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  const getElementRect = React.useCallback((elementId: string) => {
    if (!mainContainerRef.current) return null;
    const el = config.elements.find(e => e.id === elementId);
    const domEl = mainContainerRef.current.querySelector(`[data-element-id="${elementId}"]`) as HTMLElement;
    if (!el || !domEl) return null;
    
    return {
      id: elementId,
      x: el.x,
      y: el.y,
      width: domEl.offsetWidth,
      height: domEl.offsetHeight,
      left: el.x,
      top: el.y,
      right: el.x + domEl.offsetWidth,
      bottom: el.y + domEl.offsetHeight,
    };
  }, [config.elements]);

  const alignElements = React.useCallback((alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    if (selectedElementIds.length < 2) return;

    const selectedRects = selectedElementIds.map(id => getElementRect(id)).filter((r): r is NonNullable<typeof r> => !!r);
    if (selectedRects.length < 2) return;

    const anchorRect = selectedRects.find(r => r.id === selectedElementIds[0]);
    if (!anchorRect) return;

    const newElements = config.elements.map(el => {
        if (!selectedElementIds.includes(el.id) || el.id === anchorRect.id) return el;
        
        const currentRect = selectedRects.find(item => item.id === el.id);
        if (!currentRect) return el;

        let newX = el.x;
        let newY = el.y;

        switch (alignment) {
          case 'left':
              newX = anchorRect.left;
              break;
          case 'center-h':
              newX = anchorRect.left + (anchorRect.width / 2) - (currentRect.width / 2);
              break;
          case 'right':
              newX = anchorRect.right - currentRect.width;
              break;
          case 'top':
              newY = anchorRect.top;
              break;
          case 'center-v':
              newY = anchorRect.top + (anchorRect.height / 2) - (currentRect.height / 2);
              break;
          case 'bottom':
              newY = anchorRect.bottom - currentRect.height;
              break;
      }
        return { ...el, x: newX, y: newY };
    });

    updateElements(newElements);
}, [config.elements, selectedElementIds, updateElements, getElementRect]);

const reorderElement = React.useCallback((direction: 'front' | 'back' | 'forward' | 'backward') => {
    if (selectedElementIds.length !== 1) return;
    const elementId = selectedElementIds[0];
    const sortedElements = [...config.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const currentIndex = sortedElements.findIndex(el => el.id === elementId);
    if (currentIndex === -1) return;

    const newElements = [...config.elements];
    const currentZ = sortedElements[currentIndex].zIndex || 0;

    switch (direction) {
        case 'front':
            newElements.forEach(el => {
                if (el.id === elementId) {
                    el.zIndex = sortedElements.length + 1;
                }
            });
            break;
        case 'back':
            newElements.forEach(el => {
                if (el.id === elementId) {
                    el.zIndex = 0;
                }
            });
            break;
        case 'forward':
            if (currentIndex < sortedElements.length - 1) {
                const nextZ = sortedElements[currentIndex + 1].zIndex || 0;
                newElements.find(el => el.id === sortedElements[currentIndex + 1].id)!.zIndex = currentZ;
                newElements.find(el => el.id === elementId)!.zIndex = nextZ;
            }
            break;
        case 'backward':
            if (currentIndex > 0) {
                const prevZ = sortedElements[currentIndex - 1].zIndex || 0;
                newElements.find(el => el.id === sortedElements[currentIndex - 1].id)!.zIndex = currentZ;
                newElements.find(el => el.id === elementId)!.zIndex = prevZ;
            }
            break;
    }
    
    const finalSorted = newElements.sort((a,b) => (a.zIndex || 0) - (b.zIndex || 0));
    finalSorted.forEach((el, index) => el.zIndex = index + 1);

    updateElements(finalSorted);
    closeContextMenu();
}, [config.elements, selectedElementIds, updateElements, closeContextMenu]);

  return {
    isMounted,
    isEditMode,
    isAuthenticated,
    showPasswordPrompt,
    passwordInput,
    config,
    contextMenu,
    editingElement,
    selectedElementIds,
    showJsonExport,
    isPageLoading,
    draggingState,
    mainContainerRef,
    resizingState,
    handleEditModeToggle,
    handlePasswordSubmit,
    setPasswordInput,
    handleContextMenu,
    closeContextMenu,
    addElement,
    deleteElement,
    openEditModal,
    handleUpdateElement,
    setEditingElement,
    handleElementClick,
    handleMouseDown,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleContainerClick,
    alignElements,
    reorderElement,
    setShowJsonExport,
    setShowPasswordPrompt,
    handleResizeStart
  };
}
