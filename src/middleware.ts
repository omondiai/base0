
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET ? new TextEncoder().encode(process.env.JWT_SECRET) : null;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Define public paths that don't require authentication
  const publicPaths = ['/login'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // If the user has a valid token and tries to access a public path like /login,
  // redirect them to the home page.
  if (token && isPublicPath) {
    try {
      if (SECRET_KEY) {
        await jwtVerify(token, SECRET_KEY);
        // Token is valid, redirect to home
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (err) {
      // Token is invalid, let them stay on the login page by doing nothing here.
    }
  }

  // If the path is public and there's no token (or it's invalid), let the request through
  if (isPublicPath) {
    return NextResponse.next();
  }

  // At this point, the path is a protected route.

  // If no token, redirect to login page
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (!SECRET_KEY) {
    console.error('JWT_SECRET is not configured on the server.');
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  try {
    // Verify the token for protected routes
    await jwtVerify(token, SECRET_KEY);
    // If token is valid, proceed with the request
    return NextResponse.next();
  } catch (err) {
    // If token is invalid (e.g., expired or malformed), redirect to login
    console.error('JWT Verification Error:', err);
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Also clear the invalid cookie
    const response = NextResponse.redirect(url);
    response.cookies.set('auth_token', '', { maxAge: 0 });
    return response;
  }
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
