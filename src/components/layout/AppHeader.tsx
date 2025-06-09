
"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Sun, Moon } from "lucide-react";
// import { useTheme } from "next-themes"; // Assuming next-themes is or will be installed for theme toggling
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext"; // Added useAuth

export function AppHeader() {
  // const { setTheme, theme } = useTheme(); // Enable if next-themes is used
  const [currentTheme, setCurrentTheme] = useState("light"); // Placeholder
  const { currentUser } = useAuth(); // Get current user

  useEffect(() => {
    // Placeholder for theme detection if next-themes is not used
    const isDark = document.documentElement.classList.contains('dark');
    setCurrentTheme(isDark ? "dark" : "light");
  }, []);


  const toggleTheme = () => {
    // Placeholder for theme toggling
    if (currentTheme === "light") {
      document.documentElement.classList.add('dark');
      setCurrentTheme("dark");
    } else {
      document.documentElement.classList.remove('dark');
      setCurrentTheme("light");
    }
    // if (setTheme) {
    //   setTheme(theme === "light" ? "dark" : "light");
    // }
  };

  const getInitials = () => {
    if (currentUser?.displayName) {
      const names = currentUser.displayName.split(' ');
      if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    if (currentUser?.email) {
      return currentUser.email.substring(0, 2).toUpperCase();
    }
    return "MP"; // Fallback for MiinPlanner
  };


  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="hidden md:block">
        {/* Optionally add breadcrumbs or page title here */}
      </div>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        {currentUser && ( // Only show these buttons if user is logged in
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {currentTheme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <Avatar className="h-9 w-9">
              <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User Avatar"} data-ai-hint="user avatar" />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </header>
  );
}
