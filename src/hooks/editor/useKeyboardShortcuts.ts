
import React from 'react';
import { EditorAction, EditorState } from './useEditorState';

const NUDGE_AMOUNT = 1;

interface KeyboardActions {
    handleCopy: () => void;
    handlePaste: (mousePosition: { x: number, y: number }) => void;
    deleteElement: () => void;
    handleSelectAll: () => void;
    handleUndo: () => void;
}

export function useKeyboardShortcuts(
    state: EditorState,
    dispatch: React.Dispatch<EditorAction>,
    actions: KeyboardActions,
    mousePosition: React.MutableRefObject<{ x: number; y: number; }>,
) {
  const { isEditMode, editingElement, selectedElementIds, config } = state;
  const { handleCopy, handlePaste, deleteElement, handleSelectAll, handleUndo } = actions;

  const handleKeyDown = React.useCallback(async (e: KeyboardEvent) => {
    if (!isEditMode || editingElement) return;

    if ((e.metaKey || e.ctrlKey)) {
        if (e.key === 'c') {
            e.preventDefault();
            handleCopy();
            return;
        }
        if (e.key === 'v') {
            e.preventDefault();
            await handlePaste(mousePosition.current);
            return;
        }
        if (e.key === 'a') {
            e.preventDefault();
            handleSelectAll();
            // We need to wait for the state to update before copying
            setTimeout(() => {
                handleCopy();
            }, 0);
            return;
        }
        if (e.key === 'z') {
            e.preventDefault();
            handleUndo();
            return;
        }
    }

    if(selectedElementIds.length === 0) return;

    let dx = 0;
    let dy = 0;

    switch(e.key) {
        case 'ArrowUp':
            dy = -NUDGE_AMOUNT;
            break;
        case 'ArrowDown':
            dy = NUDGE_AMOUNT;
            break;
        case 'ArrowLeft':
            dx = -NUDGE_AMOUNT;
            break;
        case 'ArrowRight':
            dx = NUDGE_AMOUNT;
            break;
        case 'Delete':
        case 'Backspace':
            e.preventDefault();
            deleteElement();
            return;
        default:
            return;
    }
    
    e.preventDefault();

    dispatch({type: 'UPDATE_ELEMENTS', payload: { elements:
        config.elements.map(el => 
            selectedElementIds.includes(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el
        )
    }});
  }, [isEditMode, editingElement, selectedElementIds, config.elements, dispatch, handleCopy, handlePaste, deleteElement, handleSelectAll, handleUndo, mousePosition]);


  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
