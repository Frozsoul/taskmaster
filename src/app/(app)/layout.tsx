
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { SidebarProvider, SidebarInset, SidebarRail } from '@/components/ui/sidebar';

export default function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
