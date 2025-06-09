
"use client";
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { SidebarProvider, SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from '@/app/loading';

export default function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace('/login');
    }
  }, [currentUser, loading, router]);

  if (loading || (!loading && !currentUser && typeof window !== 'undefined' && window.location.pathname !== '/login')) {
    return <Loading />;
  }
  
  // If there's a user, or if we are on the client and still no user (which means the redirect should have happened or is happening)
  // we proceed to render. This check helps prevent rendering children briefly before redirecting.
  if (!currentUser && !loading) {
    // This case should ideally be covered by the redirect,
    // but as a fallback, we can return null or loading.
    // However, the effect should handle redirection.
    return <Loading />; // Or null, if redirect is consistently fast
  }


  return (
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarRail />
        <SidebarInset className="bg-background min-h-screen">
          <AppHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
  );
}
