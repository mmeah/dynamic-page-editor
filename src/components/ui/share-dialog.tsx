import React from "react";
import dynamic from "next/dynamic";
// Dynamically import react-qr-code to ensure client-side rendering only
const QRCode = dynamic(() => import("react-qr-code"), { ssr: false });
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from "./checkbox";
import { Label } from "./label";

interface ShareDialogProps {
  open: boolean;
  url: string;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ open, url, onOpenChange }: ShareDialogProps) {
  const { toast } = useToast();
  const [editableUrl, setEditableUrl] = React.useState(url);

  // Keep local state in sync if the dialog is reopened with a different url
  React.useEffect(() => {
    if (open) setEditableUrl(url);
  }, [open, url]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editableUrl);
    toast({ title: "Copied to clipboard!" });
  };

  const { isShareEnabled, isEditEnabled } = React.useMemo(() => {
    try {
      const urlObject = new URL(editableUrl);
      return {
        isShareEnabled: urlObject.searchParams.get('share') === 'true',
        isEditEnabled: urlObject.searchParams.get('edit') === 'true',
      };
    } catch (e) {
      return { isShareEnabled: false, isEditEnabled: false };
    }
  }, [editableUrl]);

  const handleCheckboxChange = (param: 'share' | 'edit', checked: boolean) => {
    try {
      const urlObject = new URL(editableUrl);
      if (checked) {
        urlObject.searchParams.set(param, 'true');
      } else {
        urlObject.searchParams.set(param, 'false');
      }
      setEditableUrl(urlObject.toString());
    } catch (e) {
      console.error("Failed to update URL:", e);
      // URL might be temporarily invalid while user is typing
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this page</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="relative flex items-center">
            <input
              type="text"
              className="w-full border rounded px-2 py-1 text-sm bg-muted pr-10"
              value={editableUrl}
              onChange={e => setEditableUrl(e.target.value)}
              onFocus={e => e.target.select()}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleCopy}
              tabIndex={-1}
              aria-label="Copy URL"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="share"
                checked={isShareEnabled}
                onCheckedChange={(checked) => handleCheckboxChange('share', !!checked)}
              />
              <Label htmlFor="share" className="cursor-pointer">Share</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit"
                checked={isEditEnabled}
                onCheckedChange={(checked) => handleCheckboxChange('edit', !!checked)}
              />
              <Label htmlFor="edit" className="cursor-pointer">Edit</Label>
            </div>
          </div>
          <div className="flex justify-center py-2">
            {editableUrl && (
              <div className="bg-white p-2 inline-block">
                <QRCode value={editableUrl} size={128} />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}