
"use client";

import React from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { JsonExportDialog } from '@/components/json-export';
import { usePageEditor } from '@/hooks/use-page-editor';
import { PageElementComponent } from '@/components/page-element';
import { ContextMenuComponent } from '@/components/context-menu';
import { EditElementModal } from '@/components/edit-element-modal';
import { PasswordDialogComponent } from '@/components/password-dialog';
import { AlignmentToolbarComponent } from '@/components/alignment-toolbar';






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
            <AlignmentToolbarComponent alignElements={alignElements} />
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
              openEditModal={openEditModal}
            />
          )
        })}
      </div>

      <ContextMenuComponent
        contextMenu={contextMenu}
        openEditModal={openEditModal}
        reorderElement={reorderElement}
        deleteElement={deleteElement}
        addElement={addElement}
        selectedElementIds={selectedElementIds}
      />

      <PasswordDialogComponent
        showPasswordPrompt={showPasswordPrompt}
        setShowPasswordPrompt={setShowPasswordPrompt}
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        handlePasswordSubmit={handlePasswordSubmit}
      />
      
      {editingElement && <EditElementModal element={editingElement} onSave={handleUpdateElement} onCancel={() => setEditingElement(null)} config={config}/>}

      <JsonExportDialog showJsonExport={showJsonExport} setShowJsonExport={setShowJsonExport} config={config} />
    </div>
  );
}


    

    




    

    