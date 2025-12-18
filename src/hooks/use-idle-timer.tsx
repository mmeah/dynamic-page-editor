import { useState, useEffect, useCallback } from 'react';

export function useIdleTimer(timeout: number, onIdle: () => void) {
  const [isIdle, setIsIdle] = useState(false);

  const handleIdle = useCallback(() => {
    setIsIdle(true);
    onIdle();
  }, [onIdle]);

  const resetTimer = useCallback(() => {
    setIsIdle(false);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleActivity = () => {
      resetTimer();
      clearTimeout(timer);
      timer = setTimeout(handleIdle, timeout);
    };

    const events = ['mousemove', 'touchstart', 'keydown'];

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    timer = setTimeout(handleIdle, timeout);

    return () => {
      clearTimeout(timer);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [timeout, handleIdle, resetTimer]);

  return isIdle;
}
