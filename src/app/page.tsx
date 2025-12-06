

"use client";

import React from 'react';
import { CheckCircle, XCircle, Loader2, Copy, Plus, Trash2, Edit, Save, AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal } from 'lucide-react';

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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

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
  const [draggingState, setDraggingState] = React.useState<{
    isDragging: boolean;
    initialPositions: Map<string, { x: number; y: number }>;
    startX: number;
    startY: number;
  } | null>(null);
  const mainContainerRef = React.useRef<HTMLDivElement>(null);
  const longPressTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const NUDGE_AMOUNT = 1;
  const LONG_PRESS_DURATION = 300;

  React.useEffect(() => {
    setIsMounted(true);
    const fetchConfig = async () => {
      try {
        const res = await fetch('/configuration.json');
        if (!res.ok) {
          throw new Error(`Failed to fetch configuration: ${res.statusText}`);
        }
        const data = await res.json();
        setConfig(data);
      } catch (error) {
        console.error("Failed to load configuration.json", error);
        toast({
          variant: "destructive",
          title: "Failed to load initial configuration",
          description: "Please make sure configuration.json exists in the public folder.",
        });
      }
    };
    fetchConfig();
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
    const newElement: PageElement = {
      id: Date.now().toString(),
      type,
      x: contextMenu.x,
      y: contextMenu.y,
      text: type === 'text' ? 'New Text' : undefined,
      icon: type === 'icon' ? 'Smile' : undefined,
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
    if (isEditMode || !element.url) return;

    const updateStatus = (id: string, status: ElementStatus) => {
      updateElements(config.elements.map(el => (el.id === id ? { ...el, status } : el)), true);
    };

    updateStatus(element.id, 'loading');

    try {
      const response = await fetch(element.url);
      if (response.ok) {
        updateStatus(element.id, 'success');
      } else {
        updateStatus(element.id, 'error');
      }
    } catch (error) {
      updateStatus(element.id, 'error');
    }

    setTimeout(() => updateStatus(element.id, 'idle'), 2000);
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
    if (!draggingState || !draggingState.isDragging || !mainContainerRef.current) return;

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
    if (draggingState?.isDragging) {
      updateElements([...config.elements]);
      setDraggingState(null);
    }
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    handleDragStart(id, e.clientX, e.clientY, e.shiftKey);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    if (!isEditMode) return;
    const touch = e.touches[0];
    
    // Prevent default to avoid scrolling and other interferences
    if (e.touches.length === 1) {
      longPressTimeoutRef.current = setTimeout(() => {
          handleDragStart(id, touch.clientX, touch.clientY, e.shiftKey);
          longPressTimeoutRef.current = null; // Clear timeout after it has run
      }, LONG_PRESS_DURATION);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
    }
    if (draggingState?.isDragging) {
        e.preventDefault(); // Prevent scrolling while dragging
        const touch = e.touches[0];
        handleDragMove(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    handleDragEnd();
  };


  const handleContainerClick = (e: React.MouseEvent) => {
      if (e.target === mainContainerRef.current) {
          setSelectedElementIds([]);
      }
      closeContextMenu();
  }

  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    if (!isEditMode || selectedElementIds.length === 0 || editingElement) return;

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
  }, [isEditMode, selectedElementIds, config.elements, editingElement]);


  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  

  const renderElementContent = (element: PageElement) => {
    const statusIcon = {
      loading: <Loader2 className="animate-spin" />,
      success: <CheckCircle style={{ color: 'hsl(var(--success))' }} />,
      error: <XCircle className="text-destructive" />,
      idle: null
    };

    const content = (
      <>
        {element.icon && <LucideIcon name={element.icon} className="inline-block mr-2" size={element.fontSize} />}
        {element.type !== 'icon' && <span>{element.text}</span>}
      </>
    );
    
    return statusIcon[element.status || 'idle'] || content;
  };

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
  
  if (!isMounted) {
    return null; 
  }

  return (
    <div className="h-screen bg-background" onClick={closeContextMenu}>
      <div 
        ref={mainContainerRef}
        className="w-full h-full relative overflow-auto grid-bg" 
        onContextMenu={handleContextMenu}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleContainerClick}
        style={{
          backgroundSize: '20px 20px',
          backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
        }}
      >
        <div className="absolute top-4 right-4 z-20 flex items-center gap-4">
          {isEditMode && (
              <Button onClick={() => setShowJsonExport(true)}><Copy className="mr-2 h-4 w-4" /> Copy Config</Button>
          )}
          <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border">
            <Switch id="edit-mode-toggle" checked={isEditMode} onCheckedChange={handleEditModeToggle} />
            <Label htmlFor="edit-mode-toggle">Edit Mode</Label>
          </div>
        </div>

        {isEditMode && selectedElementIds.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-card p-1 rounded-lg border flex items-center gap-1">
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

        {config.elements.map(element => (
          <div
            key={element.id}
            data-element-id={element.id}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            onTouchStart={(e) => handleTouchStart(e, element.id)}
            style={{ 
                position: 'absolute', 
                left: element.x, 
                top: element.y,
                fontFamily: element.fontFamily,
                fontSize: `${element.fontSize}px`,
                fontWeight: element.id === 'page-title' ? 'bold' : 'normal',
                cursor: isEditMode ? 'move' : (element.url ? 'pointer' : 'default'),
            }}
            className={cn(
                "p-2 rounded-md transition-shadow select-none",
                isEditMode && selectedElementIds.includes(element.id) && "shadow-lg border-2 border-dashed border-primary ring-2 ring-primary ring-offset-2",
                element.type === 'button' && "min-w-[100px]",
            )}
          >
            {element.type === 'button' ? (
              <Button 
                style={{ backgroundColor: element.color, fontSize: 'inherit', fontFamily: 'inherit' }}
                onClick={() => handleElementClick(element)}
                className="w-full h-full text-primary-foreground"
              >
                {renderElementContent(element)}
              </Button>
            ) : element.type === 'text' ? (
                <div onClick={() => handleElementClick(element)} className="flex items-center justify-center">
                  {element.status && element.status !== 'idle' ? (
                    {
                      loading: <Loader2 className="animate-spin" size={element.fontSize} />,
                      success: <CheckCircle style={{ color: 'hsl(var(--success))' }} size={element.fontSize} />,
                      error: <XCircle className="text-destructive" size={element.fontSize} />
                    }[element.status]
                  ) : (
                    <p style={{ color: element.color }}>{element.text}</p>
                  )}
                </div>
            ) : ( // icon
                <div onClick={() => handleElementClick(element)} className="flex items-center justify-center">
                  {element.status && element.status !== 'idle' ? (
                     {
                      loading: <Loader2 className="animate-spin" style={{ color: element.color }} size={(element.fontSize || 16) * 1.5} />,
                      success: <CheckCircle style={{ color: 'hsl(var(--success))' }} size={(element.fontSize || 16) * 1.5} />,
                      error: <XCircle className="text-destructive" size={(element.fontSize || 16) * 1.5} />
                    }[element.status]
                  ) : (
                    <LucideIcon name={element.icon || 'Smile'} style={{ color: element.color }} size={(element.fontSize || 16) * 1.5} />
                  )}
                </div>
            )}
          </div>
        ))}
      </div>

      {contextMenu.visible && (
        <Card style={{ top: contextMenu.y, left: contextMenu.x }} className="absolute z-50">
          <CardContent className="p-2">
            <div className="flex flex-col">
              {contextMenu.elementId ? (
                <>
                  <Button variant="ghost" className="justify-start" onClick={openEditModal} disabled={selectedElementIds.length > 1}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                  <Button variant="ghost" className="justify-start text-destructive" onClick={deleteElement}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="justify-start" onClick={() => addElement('button')}><Plus className="mr-2 h-4 w-4" /> Add Button</Button>
                  <Button variant="ghost" className="justify-start" onClick={() => addElement('text')}><Plus className="mr-2 h-4 w-4" /> Add Text</Button>
                  <Button variant="ghost" className="justify-start" onClick={() => addElement('icon')}><Plus className="mr-2 h-4 w-4" /> Add Icon</Button>
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

      <Dialog open={showJsonExport} onOpenChange={setShowJsonExport}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Page Configuration</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Copy this JSON and save it to `public/configuration.json` to persist your changes.</p>
          <div className="relative">
            <pre className="bg-muted p-4 rounded-md text-sm max-h-[50vh] overflow-auto">
                <code>{JSON.stringify(config, null, 2)}</code>
            </pre>
            <Button size="sm" className="absolute top-2 right-2" onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(config, null, 2));
                toast({ title: "Copied to clipboard!" });
            }}>
                <Copy className="h-4 w-4"/>
            </Button>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditElementModal({ element, onSave, onCancel, config }: { element: PageElement, onSave: (el: PageElement) => void, onCancel: () => void, config: PageConfig }) {
  const [formData, setFormData] = React.useState(element);
  const selectedIconRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (selectedIconRef.current) {
      selectedIconRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, []);

  const handleSave = () => {
    onSave(formData);
  };

  const handleChange = (field: keyof PageElement, value: any) => {
    setFormData(prev => ({...prev, [field]: value}));
  }
  
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
          {formData.type !== 'icon' && <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="text" className="text-right">Text</Label>
            <Input id="text" value={formData.text || ''} onChange={e => handleChange('text', e.target.value)} className="col-span-3" />
          </div>}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right">URL</Label>
            <Input id="url" value={formData.url || ''} onChange={e => handleChange('url', e.target.value)} className="col-span-3" placeholder="Optional: REST API endpoint"/>
          </div>
          
          {(formData.type === 'button' || formData.type === 'icon' || formData.type === 'text') && (
             <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="icon" className="text-right pt-2">Icon</Label>
                <div className="col-span-3">
                    {formData.icon && (
                      <div className="mb-4 p-2 bg-muted rounded-md flex items-center gap-2">
                        <LucideIcon name={formData.icon} className="h-6 w-6" />
                        <span className="text-sm font-medium">{formData.icon}</span>
                      </div>
                    )}
                    <ScrollArea className="h-48 rounded-lg border shadow-md">
                      <div className="p-2 grid grid-cols-6 gap-2">
                          {iconList.map((iconName) => {
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
                          })}
                      </div>
                    </ScrollArea>
                </div>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">Color</Label>
            <Input id="color" type="color" value={formData.color || '#000000'} onChange={e => handleChange('color', e.target.value)} className="col-span-3 p-1" />
          </div>

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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


    
