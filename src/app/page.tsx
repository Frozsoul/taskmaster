
// This file is the root entry point for the '/' path.
// It redirects to '/dashboard' which is handled by the (app) route group
// to ensure the AuthenticatedAppLayout (with sidebar) is applied.
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/dashboard');
  // For server components, the redirect call is sufficient and will stop rendering.
  // No explicit return null is typically needed unless for specific linting or type reasons.
}
