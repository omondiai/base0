import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET as string);

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
  
  const authToken = request.cookies.get('auth_token')?.value;
  const isLoginPage = pathname.startsWith('/login');
  
  let userPayload = null;
  if (authToken) {
    userPayload = await verifyJwt(authToken);
  }

  // If the user is authenticated (has a valid token)
  if (userPayload) {
    // and tries to access the login page, redirect them to the homepage
    if (isLoginPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Otherwise, allow them to proceed
    return NextResponse.next();
  }

  // If the user is not authenticated
  // and is trying to access any page other than the login page,
  // redirect them to the login page.
  if (!isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow unauthenticated users to access the login page
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
