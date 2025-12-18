'use client';

import { useIdleTimer } from '@/hooks/use-idle-timer';
import { usePageEditorContext } from '@/context/page-editor-context';

const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;

export function ActivityWatcher() {
  const { isEditMode } = usePageEditorContext();

  useIdleTimer(TWENTY_FOUR_HOURS_IN_MS, () => {
    if (!isEditMode) {
      window.location.reload();
    }
  });

  return null;
}
