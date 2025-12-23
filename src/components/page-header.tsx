
import React from 'react';
import { Copy, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface PageHeaderProps {
  isEditMode: boolean;
  canUndo: boolean;
  handleEditModeToggle: (checked: boolean) => void;
  setShowJsonExport: (show: boolean) => void;
  handleUndo: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  isEditMode,
  canUndo,
  handleEditModeToggle,
  setShowJsonExport,
  handleUndo,
}) => {
  return (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
      {isEditMode && (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleUndo} variant="outline" size="icon" disabled={!canUndo}>
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Undo</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => setShowJsonExport(true)} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy Config</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      )}
      <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border">
        <Switch
          id="edit-mode-toggle"
          checked={isEditMode}
          onCheckedChange={handleEditModeToggle}
        />
        <Label htmlFor="edit-mode-toggle">Edit Mode</Label>
      </div>
    </div>
  );
};
