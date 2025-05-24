
// This page used to contain the dashboard content.
// It now redirects to /dashboard to ensure the correct layout (with sidebar) is applied.
import { redirect } from 'next/navigation';

export default function OldRootDashboardPage() {
  redirect('/dashboard');
  // Return null or a loading indicator if needed, as redirect() will throw an error.
  // For server components, the redirect is sufficient.
}
