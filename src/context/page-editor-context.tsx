
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { usePageEditor } from '@/hooks/use-page-editor';

type PageEditorContextType = ReturnType<typeof usePageEditor>;

const PageEditorContext = createContext<PageEditorContextType | undefined>(undefined);

export const PageEditorProvider = ({ children }: { children: ReactNode }) => {
  const pageEditor = usePageEditor();

  return (
    <PageEditorContext.Provider value={pageEditor}>
      {children}
    </PageEditorContext.Provider>
  );
};

export const usePageEditorContext = () => {
  const context = useContext(PageEditorContext);
  if (context === undefined) {
    throw new Error('usePageEditorContext must be used within a PageEditorProvider');
  }
  return context;
};

