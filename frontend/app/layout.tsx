import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from './context/ThemeContext';
import { FloatingNavigation } from './components/FloatingNavigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fra-Gent - AI Agent Framework',
  description: 'A comprehensive web-based framework for creating, managing, and orchestrating AI agents',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <FloatingNavigation />
        </ThemeProvider>
      </body>
    </html>
  );
}
