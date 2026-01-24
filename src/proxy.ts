import { type NextRequest } from "next/server";
import { refreshSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 Proxy
 *
 * This replaces the deprecated middleware.ts pattern.
 * Proxy should ONLY handle routing concerns:
 * - Cookie/session refresh
 * - Rewrites
 * - Redirects based on request path (not auth state)
 * - Response headers
 *
 * Auth checks should be handled in layouts:
 * - src/app/(dashboard)/layout.tsx - protects dashboard routes
 * - src/app/(auth)/layout.tsx - redirects logged-in users
 */
export async function proxy(request: NextRequest) {
  // Only refresh session cookies - no auth redirects here
  return await refreshSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
