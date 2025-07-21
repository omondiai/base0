
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET ? new TextEncoder().encode(process.env.JWT_SECRET) : null;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // The only public path is the login page.
  const isPublicPath = pathname === '/login';

  // If the path is protected, we need to verify the token.
  if (!isPublicPath) {
    if (!token) {
      // No token, redirect to login.
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!SECRET_KEY) {
      console.error('JWT_SECRET is not configured on the server.');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // Verify the token for the protected route.
      await jwtVerify(token, SECRET_KEY);
      // Token is valid, allow access.
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

  // If the path is public (i.e., /login), check if the user is already logged in.
  if (isPublicPath && token) {
    try {
      if (SECRET_KEY) {
        // Verify the token.
        await jwtVerify(token, SECRET_KEY);
        // Token is valid, so the user is logged in. Redirect them to the homepage.
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (err) {
      // Token is invalid. Let the user stay on the login page to re-authenticate.
      return NextResponse.next();
    }
  }

  // If it's a public path and there's no token, or an invalid one, allow the request.
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
