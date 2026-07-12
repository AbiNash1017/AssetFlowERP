import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get("better-auth.session_token") || 
                       request.cookies.get("__secure-better-auth.session_token");

  const { pathname } = request.nextUrl;

  // Paths requiring authentication
  const isProtectedPath = pathname === "/" || 
                          pathname.startsWith("/organization") ||
                          pathname.startsWith("/assets") ||
                          pathname.startsWith("/allocation") ||
                          pathname.startsWith("/bookings") ||
                          pathname.startsWith("/maintenance") ||
                          pathname.startsWith("/audit") ||
                          pathname.startsWith("/reports") ||
                          pathname.startsWith("/notifications");

  // Auth pages (only visible to unauthenticated users)
  const isAuthPath = pathname.startsWith("/login") || 
                     pathname.startsWith("/signup") || 
                     pathname.startsWith("/forgot-password");

  if (isProtectedPath && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && sessionToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.png, etc.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
