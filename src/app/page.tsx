
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
import { usePageEditor } from '@/hooks/use-page-editor';


export default function HomePage() {
  const {
    isMounted,
    isEditMode,
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
  } = usePageEditor();
  
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
    

    




    

    