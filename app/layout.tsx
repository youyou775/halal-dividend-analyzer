import type { Metadata } from 'next';
import Sidebar from '@/components/shared/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Halal Dividend Analyzer',
  description: 'Shariah-compliant dividend stock screening dashboard',
};

const THEME_INIT_SCRIPT = `
try {
  var theme = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (theme === 'dark' || (!theme && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <div className="flex h-screen">
          <Sidebar />
          <div className="h-full min-w-0 flex-1 overflow-hidden">{children}</div>
        </div>
      </body>
    </html>
  );
}
