
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET ? new TextEncoder().encode(process.env.JWT_SECRET) : null;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Define public paths that do not require authentication.
  const isPublicPath = pathname === '/login';

  if (!SECRET_KEY) {
    console.error('JWT_SECRET is not configured on the server. Redirecting to login.');
    // If the secret is missing, we can't verify any token, so treat all paths as needing a redirect to login
    // unless it's the login page itself, to avoid a redirect loop.
    if (!isPublicPath) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // If trying to access a public path
  if (isPublicPath) {
    // If the user is already logged in (has a valid token), redirect them away from the login page to the homepage.
    if (token) {
      try {
        await jwtVerify(token, SECRET_KEY);
        // Token is valid, redirect to home.
        return NextResponse.redirect(new URL('/', request.url));
      } catch (err) {
        // Token is invalid, let them stay on the login page.
        // It's good practice to clear the invalid cookie.
        const response = NextResponse.next();
        response.cookies.set('auth_token', '', { maxAge: 0 });
        return response;
      }
    }
    // If it's a public path and there's no token, allow access.
    return NextResponse.next();
  }

  // If trying to access a protected path
  if (!token) {
    // No token, redirect to login.
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify the token for the protected route.
    await jwtVerify(token, SECRET_KEY);
    // Token is valid, allow access to the protected route.
    return NextResponse.next();
  } catch (err) {
    // Token is invalid (expired, malformed, etc.), redirect to login.
    console.error('JWT Verification Error:', err);
    const response = NextResponse.redirect(new URL('/login', request.url));
    // Clear the invalid cookie.
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
