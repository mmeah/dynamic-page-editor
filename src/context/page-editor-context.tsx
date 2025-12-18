'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface PageEditorContextType {
  isEditMode: boolean;
  setIsEditMode: (isEditMode: boolean) => void;
}

const PageEditorContext = createContext<PageEditorContextType | undefined>(undefined);

export const PageEditorProvider = ({ children }: { children: ReactNode }) => {
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <PageEditorContext.Provider value={{ isEditMode, setIsEditMode }}>
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
