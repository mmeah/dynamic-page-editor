
import React from 'react';
import { useToast } from "@/hooks/use-toast";
import { EditorAction, EditorState } from './useEditorState';

export function useAuthentication(
  state: EditorState,
  dispatch: React.Dispatch<EditorAction>
) {
  const { toast } = useToast();
  const { isAuthenticated, passwordInput, config } = state;

  React.useEffect(() => {
    if (config.editorPassword) {
      const params = new URLSearchParams(window.location.search);
      const urlPassword = params.get('editorPassword');
      if (urlPassword) {
        if (urlPassword === config.editorPassword) {
          dispatch({ type: 'SET_IS_AUTHENTICATED', payload: true });
          const editMode = params.get('edit') === 'true';
          if (editMode) {
            dispatch({ type: 'SET_IS_EDIT_MODE', payload: true });
          }
        } else {
          toast({
            variant: "destructive",
            title: "Authentication Failed",
            description: "Incorrect password provided in URL.",
          });
        }
      }
    }
  }, [config.editorPassword, toast, dispatch]);

  const handleEditModeToggle = React.useCallback((checked: boolean) => {
    if (checked && !isAuthenticated) {
        dispatch({ type: 'SET_SHOW_PASSWORD_PROMPT', payload: true });
    } else {
        dispatch({ type: 'SET_IS_EDIT_MODE', payload: checked });
      if (!checked) {
        dispatch({ type: 'SET_SELECTED_ELEMENT_IDS', payload: { selectedElementIds: [] } });
      }
    }
  }, [isAuthenticated, dispatch]);

  const handlePasswordSubmit = React.useCallback(() => {
    const correctPassword = config.editorPassword || 'admin';
    if (passwordInput === correctPassword) {
        dispatch({ type: 'SET_IS_AUTHENTICATED', payload: true });
        dispatch({ type: 'SET_SHOW_PASSWORD_PROMPT', payload: false });
        dispatch({ type: 'SET_PASSWORD_INPUT', payload: '' });
      const params = new URLSearchParams(window.location.search);
      const editMode = params.get('edit') === 'true';
      if (editMode) {
        dispatch({ type: 'SET_IS_EDIT_MODE', payload: true });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "Incorrect password.",
      })
    }
  }, [config.editorPassword, passwordInput, toast, dispatch]);

  return {
    handleEditModeToggle,
    handlePasswordSubmit,
  };
}
