
import React from 'react';
import { PageElementComponent } from '@/components/page-element';
import { AlignmentToolbarComponent } from '@/components/alignment-toolbar';
import { PageConfig, PageElement, DraggingState, ElementType } from '@/lib/types';

interface PageCanvasProps {
  mainContainerRef: React.RefObject<HTMLDivElement | null>;
  handleContextMenu: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  handleTouchMove: (event: React.TouchEvent<HTMLDivElement>) => void;
  handleTouchEnd: (event: React.TouchEvent<HTMLDivElement>) => void;
  handleContainerClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onMouseMove: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  config: PageConfig;
  isEditMode: boolean;
  selectedElementIds: string[];
  alignElements: (alignment: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v') => void;
  draggingState: DraggingState | null;
  selectionBox: { x: number; y: number; width: number; height: number; } | null;
  handleMouseDown: (e: React.MouseEvent, elementId: string) => void;
  handleCanvasMouseDown: (e: React.MouseEvent) => void;
  handleTouchStart: (e: React.TouchEvent, elementId: string) => void;
  handleElementClick: (element: PageElement) => void;
  handleResizeStart: (e: React.MouseEvent | React.TouchEvent, elementId: string) => void;
  openEditModal: (element: PageElement) => void;
}

export const PageCanvas: React.FC<PageCanvasProps> = ({
  mainContainerRef,
  handleContextMenu,
  handleTouchMove,
  handleTouchEnd,
  handleContainerClick,
  onMouseMove,
  config,
  isEditMode,
  selectedElementIds,
  alignElements,
  draggingState,
  selectionBox,
  handleMouseDown,
  handleCanvasMouseDown,
  handleTouchStart,
  handleElementClick,
  handleResizeStart,
  openEditModal,
}) => {
  return (
    <div
      ref={mainContainerRef}
      className="w-full h-full relative overflow-auto grid-bg"
      onContextMenu={handleContextMenu}
      onMouseDown={handleCanvasMouseDown}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleContainerClick}
      onMouseMove={onMouseMove}
      style={{
        backgroundSize: '20px 20px',
        backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
      }}
    >
      {isEditMode && selectedElementIds && selectedElementIds.length > 1 && (
        <AlignmentToolbarComponent alignElements={alignElements} />
      )}

      {selectionBox && (
        <div
          className="absolute border-2 border-dashed border-primary bg-primary/20 pointer-events-none"
          style={{
            left: selectionBox.x,
            top: selectionBox.y,
            width: selectionBox.width,
            height: selectionBox.height,
            zIndex: 9999,
          }}
        />
      )}

      {config.elements.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map(element => {
        const isSelected = isEditMode && (selectedElementIds || []).includes(element.id);
        const canDrag = isEditMode && (element.type !== ElementType.Image || isSelected);

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
  );
};
