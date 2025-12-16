
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal } from 'lucide-react';

interface AlignmentToolbarProps {
  alignElements: (alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => void;
}

export const AlignmentToolbarComponent: React.FC<AlignmentToolbarProps> = ({ alignElements }) => {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-card p-1 rounded-lg border flex items-center gap-1">
      <TooltipProvider>
        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => alignElements('left')}><AlignStartVertical/></Button></TooltipTrigger><TooltipContent><p>Align Left</p></TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => alignElements('center-h')}><AlignCenterVertical/></Button></TooltipTrigger><TooltipContent><p>Align Center Horizontally</p></TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => alignElements('right')}><AlignEndVertical/></Button></TooltipTrigger><TooltipContent><p>Align Right</p></TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => alignElements('top')}><AlignStartHorizontal/></Button></TooltipTrigger><TooltipContent><p>Align Top</p></TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => alignElements('center-v')}><AlignCenterHorizontal/></Button></TooltipTrigger><TooltipContent><p>Align Center Vertically</p></TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => alignElements('bottom')}><AlignEndHorizontal/></Button></TooltipTrigger><TooltipContent><p>Align Bottom</p></TooltipContent></Tooltip>
      </TooltipProvider>
    </div>
  );
};
