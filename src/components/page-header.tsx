
import React from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PageHeaderProps {
  isEditMode: boolean;
  handleEditModeToggle: (checked: boolean) => void;
  setShowJsonExport: (show: boolean) => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  isEditMode,
  handleEditModeToggle,
  setShowJsonExport,
}) => {
  return (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
      {isEditMode && (
        <Button onClick={() => setShowJsonExport(true)}>
          <Copy className="mr-2 h-4 w-4" /> Copy Config
        </Button>
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
