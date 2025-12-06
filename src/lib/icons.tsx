import { icons, HelpCircle } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import React from 'react';

// A curated list of icons for the editor
export const iconList = [
  'Home', 'Settings', 'User', 'Zap', 'Phone', 'Mail', 'MapPin', 'Bell', 'Smile',
  'Camera', 'Lock', 'Unlock', 'Sun', 'Moon', 'Cloud', 'Coffee', 'Heart',
  'Star', 'Trash2', 'Edit', 'Plus', 'Minus', 'Check', 'X', 'AlertTriangle',
  'Info', 'HelpCircle', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown',
  'Lightbulb', 'Power', 'Wifi', 'Bluetooth', 'Volume2', 'Music', 'Video',
  'Image', 'File', 'Folder',
];

type IconName = keyof typeof icons;

export const LucideIcon = ({ name, ...props }: { name: string } & LucideProps) => {
  const IconComponent = icons[name as IconName];

  if (!IconComponent) {
    // Return a default icon or null if the icon name is invalid
    return <HelpCircle {...props} />;
  }

  return <IconComponent {...props} />;
};

    