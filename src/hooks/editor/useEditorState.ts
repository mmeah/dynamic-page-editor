
import React from 'react';
import type { PageElement, PageConfig, ContextMenuData, DraggingState } from '@/lib/types';

export interface EditorState {
  isMounted: boolean;
  isEditMode: boolean;
  isAuthenticated: boolean;
  showPasswordPrompt: boolean;
  passwordInput: string;
  config: PageConfig;
  contextMenu: ContextMenuData;
  editingElement: PageElement | null;
  selectedElementIds: string[];
  showJsonExport: boolean;
  isPageLoading: boolean;
  draggingState: DraggingState | null;
  resizingState: {
    isResizing: boolean;
    elementId: string;
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
  } | null;
  selectionBox: { x: number, y: number, width: number, height: number } | null;
}

export type EditorAction =
  | { type: 'SET_IS_MOUNTED'; payload: boolean }
  | { type: 'SET_IS_EDIT_MODE'; payload: boolean }
  | { type: 'SET_IS_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_SHOW_PASSWORD_PROMPT'; payload: boolean }
  | { type: 'SET_PASSWORD_INPUT'; payload: string }
  | { type: 'SET_CONFIG'; payload: PageConfig }
  | { type: 'SET_CONTEXT_MENU'; payload: ContextMenuData }
  | { type: 'SET_EDITING_ELEMENT'; payload: PageElement | null }
  | { type: 'SET_SELECTED_ELEMENT_IDS'; payload: string[] }
  | { type: 'SET_SHOW_JSON_EXPORT'; payload: boolean }
  | { type: 'SET_IS_PAGE_LOADING'; payload: boolean }
  | { type: 'SET_DRAGGING_STATE'; payload: DraggingState | null }
  | { type: 'SET_RESIZING_STATE'; payload: EditorState['resizingState'] }
  | { type: 'SET_SELECTION_BOX'; payload: EditorState['selectionBox'] }
  | { type: 'UPDATE_ELEMENTS'; payload: PageElement[] };

const initialState: EditorState = {
  isMounted: false,
  isEditMode: false,
  isAuthenticated: false,
  showPasswordPrompt: false,
  passwordInput: '',
  config: { elements: [] },
  contextMenu: { visible: false, x: 0, y: 0 },
  editingElement: null,
  selectedElementIds: [],
  showJsonExport: false,
  isPageLoading: false,
  draggingState: null,
  resizingState: null,
  selectionBox: null,
};

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_IS_MOUNTED':
      return { ...state, isMounted: action.payload };
    case 'SET_IS_EDIT_MODE':
      return { ...state, isEditMode: action.payload };
    case 'SET_IS_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'SET_SHOW_PASSWORD_PROMPT':
      return { ...state, showPasswordPrompt: action.payload };
    case 'SET_PASSWORD_INPUT':
      return { ...state, passwordInput: action.payload };
    case 'SET_CONFIG':
      return { ...state, config: action.payload };
    case 'UPDATE_ELEMENTS':
        return { ...state, config: { ...state.config, elements: action.payload } };
    case 'SET_CONTEXT_MENU':
      return { ...state, contextMenu: action.payload };
    case 'SET_EDITING_ELEMENT':
      return { ...state, editingElement: action.payload };
    case 'SET_SELECTED_ELEMENT_IDS':
      return { ...state, selectedElementIds: action.payload };
    case 'SET_SHOW_JSON_EXPORT':
      return { ...state, showJsonExport: action.payload };
    case 'SET_IS_PAGE_LOADING':
      return { ...state, isPageLoading: action.payload };
    case 'SET_DRAGGING_STATE':
      return { ...state, draggingState: action.payload };
    case 'SET_RESIZING_STATE':
        return { ...state, resizingState: action.payload };
    case 'SET_SELECTION_BOX':
        return { ...state, selectionBox: action.payload };
    default:
      return state;
  }
}

export function useEditorState() {
  return React.useReducer(editorReducer, initialState);
}
