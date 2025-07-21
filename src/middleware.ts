
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
      // Token is invalid, will be treated as if no token exists.
      isTokenValid = false;
    }
  }

  // Scenario 1: User is logged in (has a valid token)
  if (isTokenValid) {
    // If they try to access the login page, redirect them to the homepage.
    if (isLoginPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Otherwise, allow them to access any other page.
    return NextResponse.next();
  }

  // Scenario 2: User is NOT logged in (no valid token)
  if (!isTokenValid) {
    // If they are trying to access any page other than the login page, redirect them to login.
    if (!isLoginPage) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      // It's good practice to clear any invalid token cookie
      if (token) {
         response.cookies.set('auth_token', '', { maxAge: 0 });
      }
      return response;
    }
    // If they are already on the login page, let them stay.
    return NextResponse.next();
  }

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
