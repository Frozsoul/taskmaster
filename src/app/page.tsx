
// This file effectively delegates to src/app/(app)/page.tsx due to route grouping.
// You can add a redirect here if needed, or specific landing page content
// if the dashboard is not the absolute root. For now, it will render the (app) layout's
// default page, which we will make the dashboard.

// Forcing the (app)/page.tsx to be rendered for the root path.
// If you want a separate landing page, create content here and a link to /dashboard (or whatever (app)/page is)
import DashboardPage from "./(app)/page";

export default function HomePage() {
  return <DashboardPage />;
}
