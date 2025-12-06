export type ElementType = 'button' | 'text' | 'icon';

export type ElementStatus = 'idle' | 'loading' | 'success' | 'error';

export interface PageElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  w?: number;
  h?: number;
  text?: string;
  url?: string;
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
  favicon?: string;
  elements: PageElement[];
}
