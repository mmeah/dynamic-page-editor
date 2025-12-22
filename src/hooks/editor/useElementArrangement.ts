
import React from 'react';
import { ElementRect } from '@/lib/types';
import { EditorAction, EditorState } from './useEditorState';

export function useElementArrangement(
  state: EditorState,
  dispatch: React.Dispatch<EditorAction>,
  getElementRect: (elementId: string) => ElementRect | null,
  closeContextMenu: () => void
) {
  const { config, selectedElementIds } = state;

  const alignElements = React.useCallback((alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    if (selectedElementIds.length < 2) return;

    const selectedRects = selectedElementIds.map(id => getElementRect(id)).filter((r): r is NonNullable<typeof r> => !!r);
    if (selectedRects.length < 2) return;

    const anchorRect = selectedRects.find(r => r.id === selectedElementIds[0]);
    if (!anchorRect) return;

    const newElements = config.elements.map(el => {
        if (!selectedElementIds.includes(el.id) || el.id === anchorRect.id) return el;
        
        const currentRect = selectedRects.find(item => item.id === el.id);
        if (!currentRect) return el;

        let newX = el.x;
        let newY = el.y;

        switch (alignment) {
          case 'left':
              newX = anchorRect.left;
              break;
          case 'center-h':
              newX = anchorRect.left + (anchorRect.width / 2) - (currentRect.width / 2);
              break;
          case 'right':
              newX = anchorRect.right - currentRect.width;
              break;
          case 'top':
              newY = anchorRect.top;
              break;
          case 'center-v':
              newY = anchorRect.top + (anchorRect.height / 2) - (currentRect.height / 2);
              break;
          case 'bottom':
              newY = anchorRect.bottom - currentRect.height;
              break;
      }
        return { ...el, x: newX, y: newY };
    });

    dispatch({ type: 'UPDATE_ELEMENTS', payload: newElements });
}, [config.elements, selectedElementIds, dispatch, getElementRect]);

const reorderElement = React.useCallback((direction: 'front' | 'back' | 'forward' | 'backward') => {
    if (selectedElementIds.length !== 1) return;
    const elementId = selectedElementIds[0];
    const sortedElements = [...config.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const currentIndex = sortedElements.findIndex(el => el.id === elementId);
    if (currentIndex === -1) return;

    const newElements = [...config.elements];
    const currentZ = sortedElements[currentIndex].zIndex || 0;

    switch (direction) {
        case 'front':
            newElements.forEach(el => {
                if (el.id === elementId) {
                    el.zIndex = sortedElements.length + 1;
                }
            });
            break;
        case 'back':
            newElements.forEach(el => {
                if (el.id === elementId) {
                    el.zIndex = 0;
                }
            });
            break;
        case 'forward':
            if (currentIndex < sortedElements.length - 1) {
                const nextZ = sortedElements[currentIndex + 1].zIndex || 0;
                newElements.find(el => el.id === sortedElements[currentIndex + 1].id)!.zIndex = currentZ;
                newElements.find(el => el.id === elementId)!.zIndex = nextZ;
            }
            break;
        case 'backward':
            if (currentIndex > 0) {
                const prevZ = sortedElements[currentIndex - 1].zIndex || 0;
                newElements.find(el => el.id === sortedElements[currentIndex - 1].id)!.zIndex = currentZ;
                newElements.find(el => el.id === elementId)!.zIndex = prevZ;
            }
            break;
    }
    
    const finalSorted = newElements.sort((a,b) => (a.zIndex || 0) - (b.zIndex || 0));
    finalSorted.forEach((el, index) => el.zIndex = index + 1);

    dispatch({ type: 'UPDATE_ELEMENTS', payload: finalSorted });
    closeContextMenu();
}, [config.elements, selectedElementIds, dispatch, closeContextMenu]);


  return {
    alignElements,
    reorderElement,
  };
}
