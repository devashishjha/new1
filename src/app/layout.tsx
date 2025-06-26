
import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/hooks/use-auth';
import { EnvDebugger } from '@/components/env-debugger';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LOKALITY',
  description: 'Find your next home with LOKALITY',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-body antialiased bg-gradient-to-br from-black to-blue-950 text-white`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
        <EnvDebugger />
      </body>
    </html>
  );
}
