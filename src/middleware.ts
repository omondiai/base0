import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for the simple "is logged in" cookie
  const isLoggedIn = request.cookies.get('isLoggedIn')?.value === 'true';

  const isLoginPage = pathname.startsWith('/login');

  // If the user is logged in and tries to access the login page, redirect them to the homepage
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If the user is not logged in and is trying to access any page other than the login page,
  // redirect them to the login page.
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow the request to proceed if:
  // 1. The user is logged in and accessing any page other than the login page.
  // 2. The user is not logged in and is accessing the login page.
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
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