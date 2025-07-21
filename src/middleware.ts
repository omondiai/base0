
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET ? new TextEncoder().encode(process.env.JWT_SECRET) : null;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  const isLoginPage = pathname === '/login';

  if (!SECRET_KEY) {
    console.error('JWT_SECRET is not configured on the server. Redirecting all to login.');
    if (!isLoginPage) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  let isTokenValid = false;
  if (token) {
    try {
      await jwtVerify(token, SECRET_KEY);
      isTokenValid = true;
    } catch (err) {
      isTokenValid = false;
    }
  }

  // If the user is authenticated and tries to visit the login page, redirect them to the homepage.
  if (isTokenValid && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If the user is not authenticated and tries to visit any page other than the login page, redirect them to the login page.
  if (!isTokenValid && !isLoginPage) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    // It's good practice to clear any invalid token cookie
    if (token) {
       response.cookies.set('auth_token', '', { maxAge: 0 });
    }
    return response;
  }

  // If none of the above conditions are met, allow the request to proceed.
  // This covers:
  // - Authenticated users accessing any page other than login.
  // - Unauthenticated users accessing the login page.
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
