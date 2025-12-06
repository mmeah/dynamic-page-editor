
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, XCircle, Loader2, Copy, Plus, Trash2, Edit, Save, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PageElement, ContextMenuData, ElementStatus, PageConfig } from '@/lib/types';
import { LucideIcon, iconList } from '@/lib/icons.tsx';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [config, setConfig] = useState<PageConfig>({ pageTitle: 'Loading...', editorPassword: '', defaultRestUrl: '', elements: [] });
  const [contextMenu, setContextMenu] = useState<ContextMenuData>({ visible: false, x: 0, y: 0 });
  const [editingElement, setEditingElement] = useState<PageElement | null>(null);
  const [showJsonExport, setShowJsonExport] = useState(false);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [draggingElement, setDraggingElement] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    const fetchConfig = async () => {
      try {
        const res = await fetch('/configuration.json');
        if (!res.ok) {
          throw new Error(`Failed to fetch configuration: ${res.statusText}`);
        }
        const data = await res.json();
        setConfig(data);
        document.title = data.pageTitle;
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


  const handleEditModeToggle = (checked: boolean) => {
    if (checked && !isAuthenticated) {
      setShowPasswordPrompt(true);
    } else {
      setIsEditMode(checked);
      if (!checked) {
        setIsAuthenticated(false);
      }
    }
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === config.editorPassword) {
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
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, elementId: elementId ?? undefined });
  };

  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, []);
  
  const updateElements = (newElements: PageElement[]) => {
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
    if (contextMenu.elementId) {
      updateElements(config.elements.filter(el => el.id !== contextMenu.elementId));
    }
    closeContextMenu();
  };

  const openEditModal = () => {
    if (contextMenu.elementId) {
      const elementToEdit = config.elements.find(el => el.id === contextMenu.elementId);
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
  
  const handleJsonImport = () => {
    try {
      const parsedConfig = JSON.parse(jsonInput);
      if (parsedConfig && typeof parsedConfig === 'object' && Array.isArray(parsedConfig.elements)) {
        setConfig(parsedConfig);
        document.title = parsedConfig.pageTitle || 'Dynamic Page';
        setShowJsonImport(false);
        setJsonInput('');
        toast({
          title: "Configuration Loaded",
          description: "Page has been updated.",
        });
      } else {
        throw new Error("Invalid format: Configuration must be a valid JSON object with an 'elements' array.");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load configuration",
        description: error instanceof Error ? error.message : "Invalid JSON format.",
      });
    }
  };

  const handleElementClick = async (element: PageElement) => {
    if (isEditMode || !element.url) return;

    const updateStatus = (id: string, status: ElementStatus) => {
      updateElements(config.elements.map(el => (el.id === id ? { ...el, status } : el)));
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
  
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (!isEditMode) return;
    const element = e.currentTarget as HTMLDivElement;
    const rect = element.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setDraggingElement({ id, offsetX, offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingElement || !mainContainerRef.current) return;
    const mainRect = mainContainerRef.current.getBoundingClientRect();
    let newX = e.clientX - mainRect.left - draggingElement.offsetX;
    let newY = e.clientY - mainRect.top - draggingElement.offsetY;

    // Constrain within parent
    const elementOnPage = document.querySelector(`[data-element-id="${draggingElement.id}"]`);
    if (!elementOnPage) return;

    const elementWidth = elementOnPage.clientWidth || 100;
    const elementHeight = elementOnPage.clientHeight || 40;

    newX = Math.max(0, Math.min(newX, mainRect.width - elementWidth));
    newY = Math.max(0, Math.min(newY, mainRect.height - elementHeight));
    
    updateElements(
        config.elements.map(el => (el.id === draggingElement.id ? { ...el, x: newX, y: newY } : el))
    );
  };
  
  const handleMouseUp = () => {
    setDraggingElement(null);
  };

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
  
  if (!isMounted) {
    return null; 
  }

  return (
    <div className="flex flex-col h-screen bg-background" onClick={closeContextMenu}>
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <h1 className="text-2xl font-headline font-bold">{config.pageTitle}</h1>
        <div className="flex items-center gap-4">
          {isEditMode && (
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowJsonExport(true)}><Copy className="mr-2 h-4 w-4" /> Copy Config</Button>
              <Button onClick={() => setShowJsonImport(true)} variant="outline"><Upload className="mr-2 h-4 w-4" /> Load Config</Button>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Switch id="edit-mode-toggle" checked={isEditMode} onCheckedChange={handleEditModeToggle} />
            <Label htmlFor="edit-mode-toggle">Edit Mode</Label>
          </div>
        </div>
      </header>

      <main 
        ref={mainContainerRef}
        className="flex-grow relative overflow-auto grid-bg" 
        onContextMenu={handleContextMenu}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          backgroundSize: '20px 20px',
          backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
        }}
      >
        {config.elements.map(element => (
          <div
            key={element.id}
            data-element-id={element.id}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            style={{ 
                position: 'absolute', 
                left: element.x, 
                top: element.y,
                fontFamily: element.fontFamily,
                fontSize: `${element.fontSize}px`,
                cursor: isEditMode ? 'move' : (element.url ? 'pointer' : 'default'),
            }}
            className={cn(
                "p-2 rounded-md transition-shadow select-none",
                isEditMode && "shadow-lg border-2 border-dashed border-primary",
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
      </main>

      {contextMenu.visible && (
        <Card style={{ top: contextMenu.y, left: contextMenu.x }} className="absolute z-50">
          <CardContent className="p-2">
            <div className="flex flex-col">
              {contextMenu.elementId ? (
                <>
                  <Button variant="ghost" className="justify-start" onClick={openEditModal}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
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
      
      {editingElement && <EditElementModal element={editingElement} onSave={handleUpdateElement} onCancel={() => setEditingElement(null)} />}

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
      
      <Dialog open={showJsonImport} onOpenChange={setShowJsonImport}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Load Page Configuration</DialogTitle></DialogHeader>
           <p className="text-sm text-muted-foreground">Paste your JSON configuration below to load it onto the page.</p>
           <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste JSON here..."
            className="min-h-[200px] max-h-[50vh] font-mono text-sm bg-muted"
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleJsonImport}>Load Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditElementModal({ element, onSave, onCancel }: { element: PageElement, onSave: (el: PageElement) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState(element);
  const [iconSearch, setIconSearch] = useState('');

  const handleSave = () => {
    onSave(formData);
  };

  const handleChange = (field: keyof PageElement, value: any) => {
    setFormData(prev => ({...prev, [field]: value}));
  }

  const filteredIcons = iconList.filter(iconName => 
    iconName.toLowerCase().includes(iconSearch.toLowerCase())
  );

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
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
          
          {(formData.type === 'button' || formData.type === 'icon') && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="icon" className="text-right pt-2">Icon</Label>
              <div className="col-span-3">
                <Input 
                  id="icon-search"
                  placeholder="Search icons..."
                  value={iconSearch}
                  onChange={e => setIconSearch(e.target.value)}
                  className="mb-2"
                />
                <TooltipProvider>
                  <ScrollArea className="h-40 w-full rounded-md border">
                    <div className="p-4 grid grid-cols-6 gap-2">
                      {filteredIcons.map(iconName => (
                        <Tooltip key={iconName}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={formData.icon === iconName ? 'secondary' : 'ghost'}
                              size="icon"
                              onClick={() => handleChange('icon', iconName)}
                              className={cn("border", formData.icon === iconName && "border-primary")}
                            >
                              <LucideIcon name={iconName} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{iconName}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </ScrollArea>
                </TooltipProvider>
                 {formData.icon && <p className="text-sm text-muted-foreground mt-2">Selected: {formData.icon}</p>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">Color</Label>
            <Input id="color" type="color" value={formData.color || '#000000'} onChange={e => handleChange('color', e.target.value)} className="col-span-3 p-1" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fontSize" className="text-right">Font Size</Label>
            <Input id="fontSize" type="number" value={formData.fontSize || 16} onChange={e => handleChange('fontSize', parseInt(e.target.value, 10))} className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fontFamily" className="text-right">Font Family</Label>
            <Select value={formData.fontFamily} onValueChange={(val) => handleChange('fontFamily', val)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="'Poppins', sans-serif">Poppins (Headline)</SelectItem>
                  <SelectItem value="'PT Sans', sans-serif">PT Sans (Body)</SelectItem>
                </SelectContent>
              </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>          <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
