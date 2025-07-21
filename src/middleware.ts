import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loginUrl = new URL('/login', request.url);
  const homeUrl = new URL('/', request.url);

  // 1. Check for the session cookie
  const isLoggedIn = request.cookies.get('is_logged_in')?.value === 'true';

  // 2. Handle redirection logic
  if (isLoggedIn) {
    // If the user is logged in and tries to access the login page,
    // redirect them to the homepage.
    if (pathname.startsWith('/login')) {
      return NextResponse.redirect(homeUrl);
    }
    // Otherwise, allow access to the requested page.
    return NextResponse.next();
  } else {
    // If the user is not logged in and is trying to access any page
    // other than the login page, redirect them to the login page.
    if (!pathname.startsWith('/login')) {
      return NextResponse.redirect(loginUrl);
    }
    // Allow access to the login page for non-logged-in users.
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
