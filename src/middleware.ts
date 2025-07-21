import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loginUrl = new URL('/login', request.url);
  const homeUrl = new URL('/', request.url);
  
  const publicPaths = ['/login', '/signup'];

  const isLoggedIn = request.cookies.get('is_logged_in')?.value === 'true';

  const isPublicPath = publicPaths.some(p => pathname.startsWith(p));

  if (isLoggedIn) {
    if (isPublicPath) {
      return NextResponse.redirect(homeUrl);
    }
    return NextResponse.next();
  } else {
    if (!isPublicPath) {
      return NextResponse.redirect(loginUrl);
    }
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
