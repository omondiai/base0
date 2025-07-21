
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
    
    // NOTE: In a production app, passwords should be hashed.
    // Comparing plain text passwords as per the current requirement.
    const isPasswordValid = (password === user.password);

    if (isPasswordValid) {
      // Set a simple session cookie
      cookies().set('is_logged_in', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60, // 1 hour
      });

      return NextResponse.json({ success: true, message: 'Authentication successful' }, { status: 200 });
    } else {
      // Invalid credentials
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
