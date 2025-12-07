
export type ElementType = 'button' | 'text' | 'icon' | 'image';

export type ElementStatus = 'idle' | 'loading' | 'success' | 'error';

export interface PageElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  zIndex?: number;
  width?: number;
  height?: number;
  text?: string;
  url?: string;
  src?: string; // For images
  aspectRatio?: number; // For images
  icon?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  status?: ElementStatus;
}

export interface ContextMenuData {
  visible: boolean;
  x: number;
  y: number;
  elementId?: string;
}

export interface PageConfig {
  editorPassword?: string;
  defaultRestUrl?: string;
  defaultImageUrl?: string;
  favicon?: string;
  elements: PageElement[];
}
