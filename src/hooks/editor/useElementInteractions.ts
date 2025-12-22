
import React from 'react';
import { useToast } from "@/hooks/use-toast";
import { EditorAction, EditorState } from './useEditorState';
import { PageElement, ElementRect } from '@/lib/types';

const LONG_PRESS_DURATION = 300;

export function useElementInteractions(
  state: EditorState,
  dispatch: React.Dispatch<EditorAction>,
  mainContainerRef: React.RefObject<HTMLDivElement | null>,
  mousePosition: React.MutableRefObject<{ x: number; y: number; }>,
) {
  const { toast } = useToast();
  const { isEditMode, selectedElementIds, config, draggingState, resizingState, isPageLoading, contextMenu } = state;
  const longPressTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const isSelectingRef = React.useRef(false);
  const selectionStartRef = React.useRef({ x: 0, y: 0 });
  const selectionBoxRef = React.useRef<{ x: number, y: number, width: number, height: number } | null>(null);
  const justSelectedRef = React.useRef(false);
  const shiftKeyRef = React.useRef(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mainContainerRef.current) {
        const rect = mainContainerRef.current.getBoundingClientRect();
        mousePosition.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }
  };

  const updateElements = React.useCallback((newElements: PageElement[], skipHistory = false) => {
    dispatch({ type: 'UPDATE_ELEMENTS', payload: newElements });
  }, [dispatch]);
  
  const closeContextMenu = React.useCallback(() => {
    dispatch({ type: 'SET_CONTEXT_MENU', payload: { visible: false, x: 0, y: 0 } });
  }, [dispatch]);

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
  }, [config.elements, config.defaultImageUrl, config.defaultRestUrl, contextMenu.x, contextMenu.y, updateElements, closeContextMenu, mainContainerRef]);

  const deleteElement = React.useCallback(() => {
    if (selectedElementIds.length > 0) {
      updateElements(config.elements.filter(el => !selectedElementIds.includes(el.id)));
      dispatch({ type: 'SET_SELECTED_ELEMENT_IDS', payload: [] });
    }
    closeContextMenu();
  }, [config.elements, selectedElementIds, updateElements, closeContextMenu, dispatch]);

  const openEditModal = React.useCallback(() => {
    if (selectedElementIds.length === 1) {
      const elementToEdit = config.elements.find(el => el.id === selectedElementIds[0]);
      if (elementToEdit) {
        dispatch({ type: 'SET_EDITING_ELEMENT', payload: elementToEdit });
      }
    }
    closeContextMenu();
  }, [config.elements, selectedElementIds, closeContextMenu, dispatch]);

  const handleUpdateElement = React.useCallback((updatedElement: PageElement) => {
    updateElements(config.elements.map(el => (el.id === updatedElement.id ? updatedElement : el)));
    dispatch({ type: 'SET_EDITING_ELEMENT', payload: null });
  }, [config.elements, updateElements, dispatch]);

  const handleElementClick = React.useCallback(async (element: PageElement) => {
    if (isEditMode || !element.url) return;

    if (element.type === 'text') {
      if (element.url.toLowerCase() === 'back') {
        window.history.back();
      } else {
        window.open(element.url, '_self');
      }
      return;
    }
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

        dispatch({ type: 'SET_IS_PAGE_LOADING', payload: true });

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
            dispatch({ type: 'SET_IS_PAGE_LOADING', payload: false });
        }
    }
  }, [isEditMode, isPageLoading, toast, dispatch]);

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
    dispatch({ type: 'SET_SELECTED_ELEMENT_IDS', payload: newSelectedIds });

    const initialPositions = new Map();
    config.elements.forEach(el => {
      if (newSelectedIds.includes(el.id)) {
        initialPositions.set(el.id, { x: el.x, y: el.y });
      }
    });

    dispatch({type: 'SET_DRAGGING_STATE', payload: {
      isDragging: true,
      initialPositions,
      startX: clientX,
      startY: clientY,
    }});
  }, [isEditMode, selectedElementIds, config.elements, dispatch]);

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
  }, [draggingState, config.elements, updateElements, mainContainerRef]);

  const handleDragEnd = React.useCallback(() => {
    if (draggingState) {
        dispatch({ type: 'SET_DRAGGING_STATE', payload: null });
    }
    if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
    }
  }, [draggingState, dispatch]);
  
  const handleResizeStart = React.useCallback((e: React.MouseEvent | React.TouchEvent, elementId: string) => {
    e.stopPropagation();
    if (!isEditMode) return;
  
    const element = config.elements.find(el => el.id === elementId);
    if (!element || !element.width || !element.height) return;
  
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  
    dispatch({type: 'SET_RESIZING_STATE', payload: {
      isResizing: true,
      elementId,
      startX: clientX,
      startY: clientY,
      initialWidth: element.width,
      initialHeight: element.height,
    }});
  }, [isEditMode, config.elements, dispatch]);

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
      dispatch({ type: 'SET_RESIZING_STATE', payload: null });
    }
  }, [resizingState, config.elements, updateElements, dispatch]);

  const getElementRect = React.useCallback((elementId: string): ElementRect | null => {
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
  }, [config.elements, mainContainerRef]);

  const handleGlobalMouseMove = React.useCallback((e: MouseEvent) => {
    if (draggingState) handleDragMove(e.clientX, e.clientY);
    if (resizingState?.isResizing) handleResizeMove(e.clientX, e.clientY);
    if (isSelectingRef.current && mainContainerRef.current) {
      const rect = mainContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + mainContainerRef.current.scrollLeft;
      const y = e.clientY - rect.top + mainContainerRef.current.scrollTop;
      const startX = selectionStartRef.current.x;
      const startY = selectionStartRef.current.y;

      const newSelectionBox = {
          x: Math.min(x, startX),
          y: Math.min(y, startY),
          width: Math.abs(x - startX),
          height: Math.abs(y - startY),
      };
      selectionBoxRef.current = newSelectionBox;
      dispatch({ type: 'SET_SELECTION_BOX', payload: newSelectionBox });
    }
  }, [draggingState, resizingState, handleDragMove, handleResizeMove, mainContainerRef, dispatch]);

  React.useEffect(() => {
    const handleMouseUp = () => {
      handleDragEnd();
      handleResizeEnd();

      if (isSelectingRef.current) {
        const currentSelectionBox = selectionBoxRef.current;
        if (currentSelectionBox) {
            const selectedIds = new Set<string>();
            config.elements.forEach(element => {
                const elementRect = getElementRect(element.id);
                if (elementRect) {
                    if (
                        currentSelectionBox.x < elementRect.right &&
                        currentSelectionBox.x + currentSelectionBox.width > elementRect.left &&
                        currentSelectionBox.y < elementRect.bottom &&
                        currentSelectionBox.y + currentSelectionBox.height > elementRect.top
                    ) {
                        selectedIds.add(element.id);
                    }
                }
            });

            if (shiftKeyRef.current) {
                dispatch({type: 'SET_SELECTED_ELEMENT_IDS', payload: Array.from(new Set([...selectedElementIds, ...selectedIds]))});
            } else {
                dispatch({type: 'SET_SELECTED_ELEMENT_IDS', payload: Array.from(selectedIds)});
            }
            
            if (selectedIds.size > 0) {
              justSelectedRef.current = true;
            }
        }
        dispatch({ type: 'SET_SELECTION_BOX', payload: null });
        selectionBoxRef.current = null;
      }
      isSelectingRef.current = false;
    }

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [handleGlobalMouseMove, handleDragEnd, handleResizeEnd, config.elements, getElementRect, dispatch, selectedElementIds]);


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
      if (justSelectedRef.current) {
        justSelectedRef.current = false;
        return;
      }
      if (e.target === mainContainerRef.current) {
        dispatch({ type: 'SET_SELECTED_ELEMENT_IDS', payload: [] });
      }
      closeContextMenu();
  }, [closeContextMenu, mainContainerRef, dispatch]);

  const handleCanvasMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || !isEditMode) return;
    
    // Only start selection if clicking on the canvas background
    if (e.target === mainContainerRef.current) {
        e.preventDefault();
        isSelectingRef.current = true;
        shiftKeyRef.current = e.shiftKey;
        if (!mainContainerRef.current) return;
        const rect = mainContainerRef.current.getBoundingClientRect();
        selectionStartRef.current = {
            x: e.clientX - rect.left + mainContainerRef.current.scrollLeft,
            y: e.clientY - rect.top + mainContainerRef.current.scrollTop,
        };
        dispatch({ type: 'SET_SELECTION_BOX', payload: { ...selectionStartRef.current, width: 0, height: 0 } });
        if (!e.shiftKey) {
            dispatch({ type: 'SET_SELECTED_ELEMENT_IDS', payload: [] });
        }
    }
  }, [isEditMode, dispatch, mainContainerRef]);

    const handleContextMenu = React.useCallback((e: React.MouseEvent) => {
        if (!isEditMode) return;
        e.preventDefault();
        const target = e.target as HTMLElement;
        const elementId = target.closest('[data-element-id]')?.getAttribute('data-element-id');
        if (elementId && !selectedElementIds.includes(elementId)) {
            dispatch({ type: 'SET_SELECTED_ELEMENT_IDS', payload: [elementId] });
        }

        dispatch({ type: 'SET_CONTEXT_MENU', payload: { visible: true, x: e.clientX, y: e.clientY, elementId: selectedElementIds.length > 0 ? selectedElementIds[0] : undefined } });
    }, [isEditMode, selectedElementIds, dispatch]);

    return {
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
    }

}
