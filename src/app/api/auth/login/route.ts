
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.JWT_SECRET || new TextEncoder().encode('a-secure-secret-for-jwt-that-is-at-least-32-bytes-long');

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // These are the credentials provided in the prompt.
    // In a real application, you would validate against a database.
    const validUsername = "omondiai";
    const validPassword = "omondipa2@gmail.com";

    if (username === validUsername && password === validPassword) {
      // User is authenticated, create a JWT
      const payload = { username, sub: 'user_omondi_ai' };
      
      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h') // Token expires in 1 hour
        .sign(SECRET_KEY);

      // Set the token in a secure, HTTP-only cookie
      cookies().set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60, // 1 hour
      });

      return NextResponse.json({ message: 'Authentication successful' }, { status: 200 });
    } else {
      // Invalid credentials
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
