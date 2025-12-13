
"use client";

import React from 'react';
import { CheckCircle, XCircle, Loader2, Copy, Plus, Trash2, Edit, Save, AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, SendToBack, BringToFront, ChevronsDown, ChevronsUp, Image as ImageIcon, Type, Square, Smile, GripVertical } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PageElement, ContextMenuData, ElementStatus, PageConfig } from '@/lib/types';
import { LucideIcon, iconList } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { JsonExportDialog } from '@/components/json-export';
import { Progress } from "@/components/ui/progress";


export default function HomePage() {
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

  const NUDGE_AMOUNT = 1;
  const LONG_PRESS_DURATION = 300;
  const PASTE_OFFSET = 10;

  React.useEffect(() => {
    setIsMounted(true);

    const params = new URLSearchParams(window.location.search);
    const configParam = params.get('config');
    const configFile = configParam ? (configParam.endsWith('.json') ? configParam : `${configParam}.json`) : 'configuration.json';

    const loadConfig = async (file: string) => {
      const res = await fetch(file);
      if (res.ok) return res.json();
      throw new Error(`Failed to load ${file}`);
    };

    const processConfig = (data: any) => {
        const migratedConfig = {
          ...data,
          elements: data.elements.map((el: PageElement, index: number) => ({
            ...el,
            zIndex: el.zIndex ?? index + 1,
            status: 'idle',
          })),
        };
        setConfig(migratedConfig);
    };

    loadConfig(configFile)
      .then(processConfig)
      .catch(async error => {
        console.error(`Failed to load ${configFile}`, error);
        if (configParam) {
          try {
            const errorData = await loadConfig('error.json');
            processConfig(errorData);
            return;
          } catch (e) {
            console.error("Failed to load error.json", e);
          }
        }
        toast({
          variant: "destructive",
          title: "Failed to load initial configuration",
          description: `Please make sure ${configFile} exists in the public folder.`,
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


  const handleEditModeToggle = (checked: boolean) => {
    if (checked && !isAuthenticated) {
      setShowPasswordPrompt(true);
    } else {
      setIsEditMode(checked);
      if (!checked) {
        setSelectedElementIds([]);
      }
    }
  };

  const handlePasswordSubmit = () => {
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
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    const target = e.target as HTMLElement;
    const elementId = target.closest('[data-element-id]')?.getAttribute('data-element-id');
    if (elementId && !selectedElementIds.includes(elementId)) {
        setSelectedElementIds([elementId]);
    }

    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, elementId: selectedElementIds.length > 0 ? selectedElementIds[0] : undefined });
  };

  const closeContextMenu = React.useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, []);
  
  const updateElements = (newElements: PageElement[], skipHistory = false) => {
    setConfig(prev => ({...prev, elements: newElements}));
  }

  const addElement = (type: PageElement['type']) => {
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
  };

  const deleteElement = () => {
    if (selectedElementIds.length > 0) {
      updateElements(config.elements.filter(el => !selectedElementIds.includes(el.id)));
      setSelectedElementIds([]);
    }
    closeContextMenu();
  };

  const openEditModal = () => {
    if (selectedElementIds.length === 1) {
      const elementToEdit = config.elements.find(el => el.id === selectedElementIds[0]);
      if (elementToEdit) {
        setEditingElement(elementToEdit);
      }
    }
    closeContextMenu();
  };

  const handleUpdateElement = (updatedElement: PageElement) => {
    updateElements(config.elements.map(el => (el.id === updatedElement.id ? updatedElement : el)));
    setEditingElement(null);
  };

  const handleElementClick = async (element: PageElement) => {
    if (isEditMode || !element.url || isPageLoading) return;
  
    setIsPageLoading(true);
  
    try {
      const response = await fetch(element.url);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (error: any) {
       toast({
          variant: "destructive",
          title: "Request Failed",
          description: <div className="flex items-center gap-2"><XCircle /><span>{element.url}</span></div>,
        });
    } finally {
      setIsPageLoading(false);
    }
  };

    const handleDragStart = (id: string, clientX: number, clientY: number, shiftKey = false) => {
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
  };

  const handleDragMove = (clientX: number, clientY: number) => {
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
  };

  const handleDragEnd = () => {
    if (draggingState) {
        setDraggingState(null);
    }
    if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
    }
  };
  
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, elementId: string) => {
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
  };

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


  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return; // Only drag with left mouse button
    const target = e.target as HTMLElement;
    
    // Prevent drag from starting on a resize handle
    if (target.closest('[data-resize-handle]')) return;

    handleDragStart(id, e.clientX, e.clientY, e.shiftKey);
  };
  
  const handleTouchStart = (e: React.TouchEvent, id: string) => {
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
  };

  const handleTouchMove = (e: React.TouchEvent) => {
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
  };

  const handleTouchEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    handleDragEnd();
    handleResizeEnd();
  };

  const handleContainerClick = (e: React.MouseEvent) => {
      if (e.target === mainContainerRef.current) {
          setSelectedElementIds([]);
      }
      closeContextMenu();
  }

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

    // Handle copy-paste
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
  
  const getElementRect = (elementId: string) => {
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
  };

  const alignElements = (alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
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
};

const reorderElement = (direction: 'front' | 'back' | 'forward' | 'backward') => {
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
    
    // Renumber z-indexes to be dense
    const finalSorted = newElements.sort((a,b) => (a.zIndex || 0) - (b.zIndex || 0));
    finalSorted.forEach((el, index) => el.zIndex = index + 1);

    updateElements(finalSorted);
    closeContextMenu();
};
  
  if (!isMounted) {
    return null; 
  }

  return (
    <div className="h-screen bg-background relative" onClick={closeContextMenu}>
      {isPageLoading && (
        <div className="absolute top-0 left-0 w-full h-1 z-50 overflow-hidden">
          <div className="animate-indeterminate-progress absolute top-0 left-0 h-full w-full bg-primary transform-gpu"></div>
            <style jsx>{`
              @keyframes indeterminate-progress {
                0% {
                  transform: translateX(-100%);
                }
                100% {
                  transform: translateX(100%);
                }
              }
              .animate-indeterminate-progress {
                animation: indeterminate-progress 1.5s infinite ease-in-out;
              }
          `}</style>
        </div>
      )}
      <div 
        ref={mainContainerRef}
        className="w-full h-full relative overflow-auto grid-bg" 
        onContextMenu={handleContextMenu}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleContainerClick}
        style={{
          backgroundSize: '20px 20px',
          backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
        }}
      >
        <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
          {isEditMode && (
              <Button onClick={() => setShowJsonExport(true)}><Copy className="mr-2 h-4 w-4" /> Copy Config</Button>
          )}
          <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border">
            <Switch id="edit-mode-toggle" checked={isEditMode} onCheckedChange={handleEditModeToggle} />
            <Label htmlFor="edit-mode-toggle">Edit Mode</Label>
          </div>
        </div>

        {isEditMode && selectedElementIds.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-card p-1 rounded-lg border flex items-center gap-1">
                <TooltipProvider>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => alignElements('left')}><AlignStartVertical/></Button></TooltipTrigger><TooltipContent><p>Align Left</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => alignElements('center-h')}><AlignCenterVertical/></Button></TooltipTrigger><TooltipContent><p>Align Center Horizontally</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => alignElements('right')}><AlignEndVertical/></Button></TooltipTrigger><TooltipContent><p>Align Right</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => alignElements('top')}><AlignStartHorizontal/></Button></TooltipTrigger><TooltipContent><p>Align Top</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => alignElements('center-v')}><AlignCenterHorizontal/></Button></TooltipTrigger><TooltipContent><p>Align Center Vertically</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => alignElements('bottom')}><AlignEndHorizontal/></Button></TooltipTrigger><TooltipContent><p>Align Bottom</p></TooltipContent></Tooltip>
                </TooltipProvider>
            </div>
        )}

        {config.elements.sort((a,b) => (a.zIndex || 0) - (b.zIndex || 0)).map(element => {
          const isSelected = isEditMode && selectedElementIds.includes(element.id);
          const canDrag = isEditMode && (element.type !== 'image' || isSelected);

          return (
            <div
                key={element.id}
                data-element-id={element.id}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
                onTouchStart={(e) => handleTouchStart(e, element.id)}
                onClick={(e) => {
                    // Prevent click action during a drag
                    if (draggingState) return; 
                    if (!isEditMode) handleElementClick(element);
                }}
                style={{ 
                    position: 'absolute', 
                    left: element.x, 
                    top: element.y,
                    zIndex: element.zIndex,
                    width: element.width,
                    height: element.height,
                    fontFamily: element.fontFamily,
                    fontSize: `${element.fontSize}px`,
                    fontWeight: element.id === 'page-title' ? 'bold' : 'normal',
                }}
                className={cn(
                    "p-2 rounded-md transition-shadow select-none",
                    isSelected && "shadow-lg border-2 border-dashed border-primary ring-2 ring-primary ring-offset-2",
                    isEditMode && canDrag ? 'cursor-move' : (element.url && !isEditMode ? 'cursor-pointer' : 'default'),
                    {'pointer-events-none': isPageLoading && !isEditMode}
                )}
            >
              {element.type === 'button' ? (
                <Button 
                  style={{ backgroundColor: element.color, fontSize: 'inherit', fontFamily: 'inherit' }}
                  className="w-full h-full text-primary-foreground pointer-events-none" // Disable pointer events on button itself
                >
                    {element.icon && <LucideIcon name={element.icon} />}
                    {element.text && <span>{element.text}</span>}
                </Button>
              ) : element.type === 'text' ? (
                  <div className="relative flex items-center justify-center h-full">
                    <p style={{ color: element.color }}>{element.text}</p>
                  </div>
              ) : element.type === 'image' && element.src ? (
                  <div className="relative w-full h-full group" style={{cursor: canDrag ? 'move' : 'default'}}>
                      {isSelected && (
                          <div 
                              data-drag-handle
                              className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full p-1 bg-primary rounded-t-md cursor-move opacity-50 hover:opacity-100 transition-opacity"
                          >
                              <GripVertical className="h-4 w-4 text-primary-foreground" />
                          </div>
                      )}
                      <Image src={element.src} alt={element.text || 'user image'} layout="fill" objectFit="cover" className={cn("rounded-md pointer-events-none", element.url && !isEditMode && "cursor-pointer")} />
                      {isSelected && (
                          <div 
                              data-resize-handle
                              onMouseDown={(e) => handleResizeStart(e, element.id)}
                              onTouchStart={(e) => handleResizeStart(e, element.id)}
                              className="absolute -right-1 -bottom-1 w-4 h-4 bg-primary rounded-full border-2 border-background cursor-se-resize"
                          />
                      )}
                  </div>
              ) : element.type === 'icon' ? ( // icon
                  <div className="relative flex items-center justify-center h-full">
                      <LucideIcon name={element.icon || 'Smile'} style={{ color: element.color }} size={(element.fontSize || 16) * 1.5} />
                  </div>
              ) : null }
            </div>
          )
        })}
      </div>

      {contextMenu.visible && (
        <Card style={{ top: contextMenu.y, left: contextMenu.x }} className="absolute z-[100]">
          <CardContent className="p-2">
            <div className="flex flex-col">
              {contextMenu.elementId ? (
                <>
                  <Button variant="ghost" className="justify-start" onClick={openEditModal} disabled={selectedElementIds.length > 1}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                  <Button variant="ghost" className="justify-start" onClick={() => reorderElement('front')}><BringToFront className="mr-2 h-4 w-4" /> Bring to Front</Button>
                  <Button variant="ghost" className="justify-start" onClick={() => reorderElement('forward')}><ChevronsUp className="mr-2 h-4 w-4" /> Bring Forward</Button>
                  <Button variant="ghost" className="justify-start" onClick={() => reorderElement('backward')}><ChevronsDown className="mr-2 h-4 w-4" /> Send Backward</Button>
                  <Button variant="ghost" className="justify-start" onClick={() => reorderElement('back')}><SendToBack className="mr-2 h-4 w-4" /> Send to Back</Button>
                  <Button variant="ghost" className="justify-start text-destructive" onClick={deleteElement}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="justify-start" onClick={() => addElement('button')}><Square className="mr-2 h-4 w-4" /> Add Button</Button>
                  <Button variant="ghost" className="justify-start" onClick={() => addElement('text')}><Type className="mr-2 h-4 w-4" /> Add Text</Button>
                  <Button variant="ghost" className="justify-start" onClick={() => addElement('icon')}><Smile className="mr-2 h-4 w-4" /> Add Icon</Button>
                  <Button variant="ghost" className="justify-start" onClick={() => addElement('image')}><ImageIcon className="mr-2 h-4 w-4" /> Add Image</Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showPasswordPrompt} onOpenChange={setShowPasswordPrompt}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enter Password</DialogTitle></DialogHeader>
          <Input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="Password" onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()} />
          <DialogFooter>
            <Button onClick={handlePasswordSubmit}>Unlock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {editingElement && <EditElementModal element={editingElement} onSave={handleUpdateElement} onCancel={() => setEditingElement(null)} config={config}/>}

      <JsonExportDialog showJsonExport={showJsonExport} setShowJsonExport={setShowJsonExport} config={config} />
    </div>
  );
}

function EditElementModal({ element, onSave, onCancel, config }: { element: PageElement, onSave: (el: PageElement) => void, onCancel: () => void, config: PageConfig }) {
  const [formData, setFormData] = React.useState(element);
  const selectedIconRef = React.useRef<HTMLButtonElement>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState("");

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const filteredIcons = React.useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.replace(/\s/g, '').toLowerCase();
    if (!normalizedSearch) {
      return iconList;
    }
    return iconList.filter(iconName =>
      iconName.toLowerCase().includes(normalizedSearch)
    );
  }, [debouncedSearchTerm]);


  React.useEffect(() => {
    if (selectedIconRef.current) {
      selectedIconRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [filteredIcons, formData.icon]);

  const handleSave = () => {
    onSave(formData);
  };

  const handleChange = (field: keyof PageElement, value: any) => {
    setFormData(prev => ({...prev, [field]: value}));
  }

  const handleDimensionChange = (field: 'width' | 'height', value: string) => {
    if (value === '') {
      setFormData(prev => ({ ...prev, [field]: undefined, aspectRatio: prev.aspectRatio }));
      return;
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue <= 0) return;

    let newWidth = formData.width;
    let newHeight = formData.height;
    const aspectRatio = formData.aspectRatio;

    if (field === 'width') {
      newWidth = numValue;
      if (aspectRatio) {
        newHeight = Math.round(numValue / aspectRatio);
      }
    } else { // height
      newHeight = numValue;
      if (aspectRatio) {
        newWidth = Math.round(numValue * aspectRatio);
      }
    }
    setFormData(prev => ({...prev, width: newWidth, height: newHeight}));
  };

  const updateAspectRatio = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const aspectRatio = naturalWidth / naturalHeight;
    setFormData(prev => ({
      ...prev,
      aspectRatio,
      width: prev.width === undefined ? naturalWidth : prev.width,
      height: prev.height === undefined ? naturalHeight : prev.height,
     }));
  };
  
  const fontOptions = [
    { value: "'Poppins', sans-serif", label: "Poppins (Headline)" },
    { value: "'PT Sans', sans-serif", label: "PT Sans (Body)" },
    { value: "Arial, Helvetica, sans-serif", label: "Arial" },
    { value: "'Times New Roman', Times, serif", label: "Times New Roman" },
    { value: "Verdana, Geneva, sans-serif", label: "Verdana" },
    { value: "'Trebuchet MS', Helvetica, sans-serif", label: "Trebuchet MS" },
    { value: "Georgia, serif", label: "Georgia" },
    { value: "'Courier New', Courier, monospace", label: "Courier New" },
  ];

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {element.type}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {formData.type === 'image' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="src" className="text-right">Image URL</Label>
                  <Input id="src" value={formData.src || ''} onChange={e => handleChange('src', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="width" className="text-right">Width</Label>
                  <Input id="width" type="number" value={formData.width || ''} onChange={e => handleDimensionChange('width', e.target.value)} className="col-span-1" />
                  <Label htmlFor="height" className="text-center col-span-1">Height</Label>
                  <Input id="height" type="number" value={formData.height || ''} onChange={e => handleDimensionChange('height', e.target.value)} className="col-span-1" />
                  {/* Hidden image to get natural dimensions for aspect ratio */}
                  <img src={formData.src} onLoad={updateAspectRatio} style={{display: 'none'}} alt="hidden for aspect ratio" />
              </div>
            </>
          )}

          {(formData.type === 'text' || formData.type === 'button') && <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="text" className="text-right">Text</Label>
            <Input id="text" value={formData.text || ''} onChange={e => handleChange('text', e.target.value)} className="col-span-3" />
          </div>}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right">Click URL</Label>
            <Input id="url" value={formData.url || ''} onChange={e => handleChange('url', e.target.value)} className="col-span-3" placeholder="Optional: REST API endpoint"/>
          </div>
          
          {(formData.type === 'button' || formData.type === 'icon' || formData.type === 'text') && (
             <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="icon" className="text-right pt-2">Icon</Label>
                <div className="col-span-3">
                    {formData.icon && (
                      <div className="mb-2 p-2 bg-muted rounded-md flex items-center gap-2">
                        <LucideIcon name={formData.icon} className="h-6 w-6" />
                        <span className="text-sm font-medium">{formData.icon}</span>
                      </div>
                    )}
                     <div className="mb-2">
                        <Input 
                            placeholder="Search icons..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="h-48 rounded-lg border shadow-inner">
                      <div className="p-2 grid grid-cols-6 gap-2">
                          {filteredIcons.length > 0 ? filteredIcons.map((iconName) => {
                              const isSelected = formData.icon === iconName;
                              return (
                              <Button
                                  key={iconName}
                                  ref={isSelected ? selectedIconRef : null}
                                  variant={isSelected ? 'secondary' : 'ghost'}
                                  onClick={() => handleChange('icon', iconName)}
                                  className="h-auto p-2 flex flex-col items-center justify-center gap-1"
                              >
                                  <LucideIcon name={iconName} className="h-6 w-6" />
                                  <span className="text-xs w-full text-center truncate">{iconName}</span>
                              </Button>
                              );
                          }) : (
                            <p className="col-span-6 text-center text-sm text-muted-foreground p-4">No icons found.</p>
                          )}
                      </div>
                    </ScrollArea>
                </div>
            </div>
          )}
          
          {(formData.type === 'text' || formData.type === 'icon' || formData.type === 'button') && 
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">Color</Label>
              <Input id="color" type="color" value={formData.color || '#000000'} onChange={e => handleChange('color', e.target.value)} className="col-span-3 p-1" />
            </div>
          }


          {(formData.type === 'text' || formData.type === 'icon' || formData.type === 'button') && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fontSize" className="text-right">Font Size</Label>
                <Input id="fontSize" type="number" value={formData.fontSize || ''} onChange={e => handleChange('fontSize', parseInt(e.target.value, 10))} className="col-span-3" />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fontFamily" className="text-right">Font Family</Label>
                <Select value={formData.fontFamily} onValueChange={(val) => handleChange('fontFamily', val)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map(font => (
                        <SelectItem key={font.value} value={font.value} style={{fontFamily: font.value}}>
                            {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
            </>
          )}

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
    

    




    

    