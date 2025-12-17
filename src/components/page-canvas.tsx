
import React from 'react';
import { PageElementComponent } from '@/components/page-element';
import { AlignmentToolbarComponent } from '@/components/alignment-toolbar';
import { PageConfig, PageElement, DraggingState } from '@/lib/types';

interface PageCanvasProps {
  mainContainerRef: React.RefObject<HTMLDivElement | null>;
  handleContextMenu: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  handleTouchMove: (event: React.TouchEvent<HTMLDivElement>) => void;
  handleTouchEnd: (event: React.TouchEvent<HTMLDivElement>) => void;
  handleContainerClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  config: PageConfig;
  isEditMode: boolean;
  selectedElementIds: string[];
  alignElements: (alignment: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v') => void;
  draggingState: DraggingState | null;
  handleMouseDown: (e: React.MouseEvent, elementId: string) => void;
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
  config,
  isEditMode,
  selectedElementIds,
  alignElements,
  draggingState,
  handleMouseDown,
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
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleContainerClick}
      style={{
        backgroundSize: '20px 20px',
        backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
      }}
    >
      {isEditMode && selectedElementIds.length > 1 && (
        <AlignmentToolbarComponent alignElements={alignElements} />
      )}

      {config.elements.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map(element => {
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
  );
};
