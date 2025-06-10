
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  ListChecks, 
  Share2, 
  CalendarDays, 
  ListTodo,
  Settings,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext"; // Added useAuth

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/content-studio", label: "Content Studio", icon: Share2 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/prioritize", label: "Prioritize Tasks", icon: ListTodo },
];

export const MiinTaskMasterLogo = () => ( // Exported for use in LoginPage if needed
  <svg
    aria-label="MiinTaskMaster Logo"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 500 500"
    className="h-10 w-10 text-primary group-data-[state=expanded]:text-accent" // Adjusted class for direct primary and accent
    fill="none"
  >
    <g>
        <polygon
          fill="currentColor" // Will take text-primary
          points="4,262 66.8,304.9 169.1,244.2 169.1,328.1 233.3,366.3 233.3,133"
        />
        <polygon
          className="fill-[hsl(var(--accent))]" // Uses accent color directly, no need for complex group selector here if it always uses accent
          points="496,262 433.2,304.9 330.9,244.2 330.9,328.1 266.7,366.3 266.7,133"
        />
    </g>
  </svg>
);

export function AppSidebar() {
  const pathname = usePathname();
  const { logout, currentUser } = useAuth(); // Added currentUser for conditional rendering if needed

  return (
    <Sidebar side="left" collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <MiinTaskMasterLogo />
          <span className="font-bold text-xl group-data-[collapsible=icon]:hidden text-sidebar-foreground">MiinTaskMaster</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  className={cn(
                    "w-full justify-start",
                    pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label, className: "text-xs" }}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      { currentUser && ( // Only show footer if user is logged in
        <SidebarFooter className="p-2 mt-auto border-t border-sidebar-border">
           <SidebarMenu>
              <SidebarMenuItem>
                  <SidebarMenuButton
                    className="w-full justify-start"
                    tooltip={{ children: "Settings", className: "text-xs" }}
                  >
                    <Settings className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                  </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={logout}
                    className="w-full justify-start"
                    tooltip={{ children: "Log Out", className: "text-xs" }}
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">Log Out</span>
                  </SidebarMenuButton>
              </SidebarMenuItem>
           </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
