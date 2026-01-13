import React from "react";
import dynamic from "next/dynamic";
// Dynamically import react-qr-code to ensure client-side rendering only
const QRCode = dynamic(() => import("react-qr-code"), { ssr: false });
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this page</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
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
          <div className="flex justify-center py-4">
            {/* Only render QR code if editableUrl is present */}
            {editableUrl && (
              <QRCode value={editableUrl} size={128} />
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