
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const db = await getDb();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ username });

    if (!user) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }

    // In a real application, you would hash passwords. For this prototype, we are comparing plain text.
    const isPasswordValid = (password === user.password);

    if (isPasswordValid) {
      // User is authenticated. Set a simple, secure, HTTP-only cookie.
      cookies().set('isLoggedIn', 'true', {
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
