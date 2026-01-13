
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LucideIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { PageElement, ElementType } from '@/lib/types';
import { GripVertical } from 'lucide-react';

interface PageElementProps {
  element: PageElement;
  isSelected: boolean;
  isEditMode: boolean;
  canDrag: boolean;
  draggingState: any;
  handleMouseDown: (e: React.MouseEvent, id: string) => void;
  handleTouchStart: (e: React.TouchEvent, id: string) => void;
  handleElementClick: (element: PageElement) => void;
  handleResizeStart: (e: React.MouseEvent | React.TouchEvent, elementId: string) => void;
  openEditModal: (element: PageElement) => void;
}

export const PageElementComponent: React.FC<PageElementProps> = ({
  element,
  isSelected,
  isEditMode,
  canDrag,
  draggingState,
  handleMouseDown,
  handleTouchStart,
  handleElementClick,
  handleResizeStart,
  openEditModal,
}) => {
  const [imageSrc, setImageSrc] = useState(element.src);

  useEffect(() => {
    if (element.type === ElementType.Image && element.refreshInterval && element.refreshInterval > 0) {
      const intervalId = setInterval(() => {
        // Append a timestamp to the src to bypass browser cache
        const newSrc = `${element.src}?t=${new Date().getTime()}`;
        setImageSrc(newSrc);
      }, element.refreshInterval * 1000);

      return () => clearInterval(intervalId);
    }
  }, [element.src, element.refreshInterval, element.type]);

  useEffect(() => {
    setImageSrc(element.src);
  }, [element.src]);

  return (
    <div
      key={element.id}
      data-element-id={element.id}
      onMouseDown={(e) => handleMouseDown(e, element.id)}
      onTouchStart={(e) => handleTouchStart(e, element.id)}
      onClick={(e) => {
          if (draggingState) return;
          if (!isEditMode) handleElementClick(element);
      }}
      onDoubleClick={() => {
        if (isEditMode) {
          openEditModal(element);
        } else if (element.type === ElementType.Image && !element.url) {
          // If in non-edit mode and it's an image with no URL, refresh it.
          const newSrc = `${element.src}?t=${new Date().getTime()}`;
          setImageSrc(newSrc);
        }
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
          {'pointer-events-none': draggingState && !isEditMode}
      )}
  >
    {element.type === ElementType.Button ? (
      <Button
        style={{ backgroundColor: element.color, fontSize: 'inherit', fontFamily: 'inherit' }}
        className="w-full h-full text-primary-foreground pointer-events-none"
      >
          {element.icon && <LucideIcon name={element.icon} />}
          {element.text && <span>{element.text}</span>}
      </Button>
    ) : element.type === ElementType.Text ? (
        <div className="relative flex items-center justify-center h-full">
          <p style={{ color: element.color }}>{element.text}</p>
        </div>
    ) : element.type === ElementType.Image && imageSrc ? (
        <div className="relative w-full h-full group" style={{cursor: canDrag ? 'move' : 'default'}}>
            {isSelected && (
                <div
                    data-drag-handle
                    className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full p-1 bg-primary rounded-t-md cursor-move opacity-50 hover:opacity-100 transition-opacity"
                >
                    <GripVertical className="h-4 w-4 text-primary-foreground" />
                </div>
            )}
            <Image src={imageSrc} alt={element.text || 'user image'} layout="fill" objectFit="cover" className={cn("rounded-md pointer-events-none", element.url && !isEditMode && "cursor-pointer")} />
            {isSelected && (
                <div
                    data-resize-handle
                    onMouseDown={(e) => handleResizeStart(e, element.id)}
                    onTouchStart={(e) => handleResizeStart(e, element.id)}
                    className="absolute -right-1 -bottom-1 w-4 h-4 bg-primary rounded-full border-2 border-background cursor-se-resize"
                />
            )}
        </div>
    ) : element.type === ElementType.Icon ? (
        <div className="relative flex items-center justify-center h-full">
            <LucideIcon name={element.icon || 'Smile'} style={{ color: element.color }} size={(element.fontSize || 16) * 1.5} />
        </div>
    ) : null }
  </div>
  )
};
