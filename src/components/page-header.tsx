
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Copy, Undo2, Pencil, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { ShareDialog } from './ui/share-dialog';

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
  const searchParams = useSearchParams();
  const editParam = searchParams.get('edit');
  const shareParam = searchParams.get('share');
  const hideEditButton = editParam === 'false';
  const hideShareButton = shareParam === 'false';
  const [shareOpen, setShareOpen] = React.useState(false);

  // Build the current URL with all params
  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  };

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
      {!hideEditButton && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => handleEditModeToggle(!isEditMode)}
                variant={isEditMode ? "default" : "outline"}
                size="icon"
                aria-label="Toggle Edit Mode"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Share Button and Dialog - only hide if share=false */}
      {!hideShareButton && (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Share Page"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ShareDialog open={shareOpen} url={getShareUrl()} onOpenChange={setShareOpen} />
        </>
      )}
    </div>
  );
};
