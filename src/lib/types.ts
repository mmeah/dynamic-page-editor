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
  fontFamily?: "'Poppins', sans-serif" | "'PT Sans', sans-serif";
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
  pageTitle?: string;
  elements: PageElement[];
}
