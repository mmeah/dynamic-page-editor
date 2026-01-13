
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Copy, CornerDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { VALID_ELEMENT_TYPES } from '@/lib/config';
import type { PageConfig } from '@/lib/types';
import { cn } from '@/lib/utils';

interface JsonExportDialogProps {
  showJsonExport: boolean;
  setShowJsonExport: (show: boolean) => void;
  config: PageConfig;
}

export function JsonExportDialog({ showJsonExport, setShowJsonExport, config }: JsonExportDialogProps) {
  const { toast } = useToast();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState({ width: 500, height: 600 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Create a cleaned version of the config without the 'status' property
  const cleanedConfig = {
    ...config,
    elements: config.elements
      .filter(element => VALID_ELEMENT_TYPES.includes(element.type))
      .map(element => {
        const { status, ...remaningAttrs } = element;
        return remaningAttrs;
      }),
  };

  useEffect(() => {
    if (showJsonExport) {
        // Center the dialog initially
        setPosition({
            x: window.innerWidth / 2 - size.width / 2,
            y: window.innerHeight / 2 - size.height / 2,
        });
    }
  }, [showJsonExport, size.width, size.height]);

  const handleDragMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
    if (isResizing) {
      const dx = e.clientX - resizeStartRef.current.x;
      const dy = e.clientY - resizeStartRef.current.y;
      setSize(prevSize => ({
        width: Math.max(300, resizeStartRef.current.width + dx),
        height: Math.max(200, resizeStartRef.current.height + dy),
      }));
    }
  }, [isDragging, isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);
  
  return (
    <Dialog open={showJsonExport} onOpenChange={setShowJsonExport}>
    <DialogContent 
      ref={dialogRef}
      className="p-0 shadow-lg"
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        top: `${position.y}px`,
        left: `${position.x}px`,
        transform: 'none', // Override default centering
        position: 'fixed'
      }}
      onMouseDown={(e:any) => e.stopPropagation()} // Prevent dialog closing on content click
      onKeyDown={(e) => {
        // Stop propagation for copy and select all events to prevent global shortcuts from firing
        if ((e.metaKey || e.ctrlKey) && (e.key === 'c' || e.key === 'a')) {
          e.stopPropagation();
        }
      }}
      onCopy={e => {
        // Prevent copy event from bubbling up and triggering global copy logic
        e.stopPropagation();
      }}
        >
            <div className="flex flex-col h-full">
                <DialogHeader 
                    className="p-4 cursor-move"
                    onMouseDown={handleDragMouseDown}
                >
                    <DialogTitle>Page Configuration</DialogTitle>
                    <DialogDescription>
                        View and copy the JSON configuration for the current page.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow px-4 pb-4 relative">
                    <p className="text-sm text-muted-foreground mb-2">Copy this JSON to persist your changes.</p>
                    <Textarea
                        readOnly
                        value={JSON.stringify(cleanedConfig, null, 2)}
                        className="h-full w-full bg-muted rounded-md text-sm resize-none"
                        wrap="off"
                    />
                    <Button 
                        size="sm" 
                        className="absolute top-12 right-6"
                        onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(cleanedConfig, null, 2));
                            toast({ title: "Copied to clipboard!" });
                        }}
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
                <DialogFooter className="p-4 border-t">
                    <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
                <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                    onMouseDown={handleResizeMouseDown}
                >
                    <CornerDownRight className="w-full h-full text-muted-foreground/50"/>
                </div>
            </div>
      </DialogContent>
    </Dialog>
  );
}
