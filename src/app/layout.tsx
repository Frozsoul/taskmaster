
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppDataProvider } from '@/context/AppDataContext';
import { AuthProvider } from '@/context/AuthContext'; // Added AuthProvider

export const metadata: Metadata = {
  title: 'MiinPlanner',
  description: 'Manage your tasks and social media content efficiently with MiinPlanner.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AuthProvider> {/* Added AuthProvider wrapping AppDataProvider */}
          <AppDataProvider>
            {children}
            <Toaster />
          </AppDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
