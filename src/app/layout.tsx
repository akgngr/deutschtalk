
import type { Metadata } from 'next';
import { Poppins, PT_Sans } from 'next/font/google';
import './globals.css';
import { FirebaseAuthProvider } from '@/components/providers/firebase-auth-provider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  weight: ['300', '400', '500', '600', '700']
});

const ptSans = PT_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pt-sans',
  weight: ['400', '700']
});

export const metadata: Metadata = {
  title: 'DeutschTalk - Practice German with Native Speakers',
  description: 'Connect with German learners and native speakers for real-time chat practice. Improve your German fluency with AI-powered feedback and corrections.',
  icons: {
    icon: '/favicon.ico', // Assuming you will add a favicon later
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* next/font handles optimized font loading. Explicit links previously here were redundant. */}
      </head>
      <body className={cn(
        "min-h-screen bg-background font-body antialiased",
        poppins.variable,
        ptSans.variable
      )}>
        <FirebaseAuthProvider>
          {children}
          <Toaster />
        </FirebaseAuthProvider>
      </body>
    </html>
  );
}
