import { icons, HelpCircle } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import React from 'react';

// A curated list of icons for the editor
export const iconList = Object.keys(icons).filter(key => 
  /^[A-Z]/.test(key) && !key.includes('Icon')
);

type IconName = keyof typeof icons;

export const LucideIcon = ({ name, ...props }: { name: string } & LucideProps) => {
  const IconComponent = icons[name as IconName];

  if (!IconComponent) {
    // Return a default icon or null if the icon name is invalid
    return <HelpCircle {...props} />;
  }

  return <IconComponent {...props} />;
};
