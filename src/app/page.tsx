
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
import { PageElementComponent } from '@/components/page-element';
import { EditElementModal } from '@/components/edit-element-modal';


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
            <PageElementComponent
              key={element.id}
              element={element}
              isSelected={isSelected}
              isEditMode={isEditMode}
              canDrag={canDrag}
              draggingState={draggingState}
              handleMouseDown={handleMouseDown}
              handleTouchStart={handleTouchStart}
              handleElementClick={handleElementClick}
              handleResizeStart={handleResizeStart}
            />
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


    

    




    

    