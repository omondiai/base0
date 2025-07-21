import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

async function verifyJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loginUrl = new URL('/login', request.url);
  const homeUrl = new URL('/', request.url);

  // 1. Get token from cookies
  const authToken = request.cookies.get('auth_token')?.value;

  // 2. Verify token
  const userPayload = authToken ? await verifyJwt(authToken) : null;
  const isAuthenticated = !!userPayload;

  // 3. Handle public and protected routes
  if (pathname.startsWith('/login')) {
    // If user is authenticated and on the login page, redirect to home
    if (isAuthenticated) {
      return NextResponse.redirect(homeUrl);
    }
    // Otherwise, allow access to the login page
    return NextResponse.next();
  }

  // For all other routes (protected routes)
  // If user is not authenticated, redirect to login page
  if (!isAuthenticated) {
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated, allow access to the protected route
  return NextResponse.next();
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
