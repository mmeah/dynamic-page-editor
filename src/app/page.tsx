
"use client";

import React from 'react';
import { usePageEditorContext } from '@/context/page-editor-context';
import { JsonExportDialog } from '@/components/json-export';
import { ChromeClipboardDialog } from '@/components/ChromeClipboardDialog';
import { ContextMenuComponent } from '@/components/context-menu';
import { EditElementModal } from '@/components/edit-element-modal';
import { PasswordDialogComponent } from '@/components/password-dialog';
import { LoadingIndicator } from '@/components/loading-indicator';
import { PageHeader } from '@/components/page-header';
import { PageCanvas } from '@/components/page-canvas';

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
    selectionBox,
    history,
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
    handleCanvasMouseDown,
    alignElements,
    reorderElement,
    setShowJsonExport,
    setShowPasswordPrompt,
    handleResizeStart,
    handleMouseMove,
    handleUndo,
    chromeDialog,
    closeChromeDialog,
  } = usePageEditorContext();

  if (!isMounted) {
    return null;
  }

  return (
    <div className="h-screen bg-background relative" onClick={closeContextMenu}>
      {isPageLoading && <LoadingIndicator />}
      
      <PageHeader
        isEditMode={isEditMode}
        handleEditModeToggle={handleEditModeToggle}
        setShowJsonExport={setShowJsonExport}
        handleUndo={handleUndo}
        canUndo={history.length > 0}
      />

      <PageCanvas
        mainContainerRef={mainContainerRef}
        handleContextMenu={handleContextMenu}
        handleTouchMove={handleTouchMove}
        handleTouchEnd={handleTouchEnd}
        handleContainerClick={handleContainerClick}
        onMouseMove={handleMouseMove}
        config={config}
        isEditMode={isEditMode}
        selectedElementIds={selectedElementIds}
        alignElements={alignElements}
        draggingState={draggingState}
        selectionBox={selectionBox}
        handleMouseDown={handleMouseDown}
        handleCanvasMouseDown={handleCanvasMouseDown}
        handleTouchStart={handleTouchStart}
        handleElementClick={handleElementClick}
        handleResizeStart={handleResizeStart}
        openEditModal={openEditModal}
      />

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

      {editingElement && (
        <EditElementModal
          element={editingElement}
          onSave={handleUpdateElement}
          onCancel={() => setEditingElement(null)}
          config={config}
        />
      )}

      <JsonExportDialog
        showJsonExport={showJsonExport}
        setShowJsonExport={setShowJsonExport}
        config={config}
      />
      {chromeDialog?.open && (
        <ChromeClipboardDialog
          open={chromeDialog.open}
          url={chromeDialog.url}
          onClose={closeChromeDialog}
        />
      )}
    </div>
  );
}