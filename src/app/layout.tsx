import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';

export const metadata: Metadata = {
  title: 'Gateway Security — Apartment Visitor Management System',
  description: 'Enterprise visitor management web application for gated apartments and large residential communities in India. Touch-friendly gate terminal, real-time resident approvals, private photo storage, and multi-tenant RLS isolation.',
  keywords: ['visitor management', 'apartment security', 'gated community', 'gate pass', 'resident approval', 'Supabase RLS'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0B132B'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white" suppressHydrationWarning>
        <Suspense fallback={<div className="h-16 bg-white border-b border-slate-100" />}>
          <Header />
        </Suspense>
        <main className="flex-1">
          {children}
        </main>
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
