import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NextAuthProvider } from '@/components/providers/NextAuthProvider';
import { Header } from '@/components/layout/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Flashcard AI Pro',
  description: 'The Today I L.E.A.R.N.T. Show',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      {/* The body is now a flex container that takes up the full height */}
      <body className={`flex min-h-full flex-col bg-gray-50 dark:bg-gray-900 ${inter.className}`}>
        <NextAuthProvider>
          <Header />
          {/* The main content area will now grow to fill any remaining space */}
          <main className="flex-grow">
            {children}
          </main>
        </NextAuthProvider>
      </body>
    </html>
  );
}
