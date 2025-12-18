import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { VersionFooter } from "@/components/version-footer";
import { ActivityWatcher } from '@/components/activity-watcher';
import { PageEditorProvider } from '@/context/page-editor-context';

export const metadata: Metadata = {
  title: 'Dynamic Page',
  description: 'Create and customize your own dynamic page.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <PageEditorProvider>
          <ActivityWatcher />
          {children}
        </PageEditorProvider>
        <Toaster />
        <VersionFooter />
      </body>
    </html>
  );
}
