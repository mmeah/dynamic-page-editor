
import React from 'react';

export const LoadingIndicator = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-1 z-50 overflow-hidden">
      <div className="animate-indeterminate-progress absolute top-0 left-0 h-full w-full bg-primary transform-gpu"></div>
      <style jsx>{`
        @keyframes indeterminate-progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-indeterminate-progress {
          animation: indeterminate-progress 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
