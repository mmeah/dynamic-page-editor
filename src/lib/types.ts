
export enum ElementType {
  Button = 'button',
  Text = 'text',
  Icon = 'icon',
  Image = 'image',
}

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
  refreshInterval?: number; // For images, in seconds
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

export interface DraggingState {
  isDragging: boolean;
  initialPositions: Map<string, { x: number; y: number }>;
  startX: number;
  startY: number;
}

export interface ElementRect {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    left: number;
    top: number;
    right: number;
    bottom: number;
  }
