
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, BringToFront, ChevronsUp, ChevronsDown, SendToBack, Trash2, Square, Type, Smile, ImageIcon } from 'lucide-react';
import { type ContextMenuData, ElementType } from '@/lib/types';

interface ContextMenuProps {
  contextMenu: ContextMenuData;
  openEditModal: () => void;
  reorderElement: (direction: 'front' | 'back' | 'forward' | 'backward') => void;
  deleteElement: () => void;
  addElement: (type: ElementType) => void;
  selectedElementIds: string[];
}

export const ContextMenuComponent: React.FC<ContextMenuProps> = ({
  contextMenu,
  openEditModal,
  reorderElement,
  deleteElement,
  addElement,
  selectedElementIds,
}) => {
  if (!contextMenu.visible) {
    return null;
  }

  return (
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
              <Button variant="ghost" className="justify-start" onClick={() => addElement(ElementType.Button)}><Square className="mr-2 h-4 w-4" /> Add Button</Button>
              <Button variant="ghost" className="justify-start" onClick={() => addElement(ElementType.Text)}><Type className="mr-2 h-4 w-4" /> Add Text</Button>
              <Button variant="ghost" className="justify-start" onClick={() => addElement(ElementType.Icon)}><Smile className="mr-2 h-4 w-4" /> Add Icon</Button>
              <Button variant="ghost" className="justify-start" onClick={() => addElement(ElementType.Image)}><ImageIcon className="mr-2 h-4 w-4" /> Add Image</Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
