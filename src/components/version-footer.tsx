import { version } from '../../package.json';

export function VersionFooter() {
  return (
    <div className="fixed bottom-2 right-2 z-50 text-xs text-gray-400 pointer-events-none">
      v{version}
    </div>
  );
}