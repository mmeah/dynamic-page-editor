"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ChromeClipboardDialogProps {
  open: boolean;
  url: string;
  onClose: () => void;
}

export function ChromeClipboardDialog({ open, url, onClose }: ChromeClipboardDialogProps) {
  const isHttp = typeof window !== 'undefined' && window.location.protocol === 'http:';
  const site = typeof window !== 'undefined' ? window.location.origin : '';
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        style={{ width: 420, maxWidth: '90vw' }}
        onCopy={e => {
          // Prevent copy event from bubbling up and triggering global copy logic
          e.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle>Enable Clipboard Access in Chrome</DialogTitle>
          <DialogDescription>
            To enable clipboard access, <b>highlight</b> the link below, <b>right-click</b>, and select <b>Copy</b> to copy the URL. Then, paste it into a new tab and adjust your browser settings.<br /><br />
            <span style={{ color: '#b91c1c', fontWeight: 500 }}>Note:</span> Chrome may block this link from opening automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 px-1">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2563eb', wordBreak: 'break-all', fontWeight: 500 }}
          >
            {url}
          </a>
        </div>
        {isHttp && (
          <div className="mt-4 p-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-900 text-sm">
            <strong>Note for HTTP sites:</strong><br />
            Clipboard access is only allowed on secure (HTTPS) origins. If you are running this site over HTTP, you must add it as an exception.<br />
            Please go to the section <b>"Insecure origins treated as secure"</b> at <a href="chrome://flags/#unsafely-treat-insecure-origin-as-secure" target="_blank" rel="noopener noreferrer" style={{ color: '#b45309', textDecoration: 'underline' }}>chrome://flags/#unsafely-treat-insecure-origin-as-secure</a> and add <code>{site}</code> as an exception.
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
