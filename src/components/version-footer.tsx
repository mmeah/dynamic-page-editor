'use client';

import { version, homepage } from '../../package.json';

export function VersionFooter() {
  const url = new URL(homepage);
  const [user] = url.hostname.split('.');
  const repo = url.pathname.substring(1);
  const repoUrl = `https://github.com/${user}/${repo}`;
  const releaseUrl = `${repoUrl}/releases/tag/v${version}`;

  const handleClick = () => {
    window.open(releaseUrl, '_blank');
  };

  return (
    <div
      className="fixed bottom-2 right-2 z-50 text-xs text-gray-400 cursor-pointer opacity-30 hover:opacity-80"
      onDoubleClick={handleClick}
    >
      v{version}
    </div>
  );
}