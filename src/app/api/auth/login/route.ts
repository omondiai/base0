
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/mongodb';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const ALG = 'HS256';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set.');
    }

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
      // Create JWT
      const token = await new SignJWT({ username: user.username, id: user._id.toString() })
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime('1h') // Token expires in 1 hour
        .sign(JWT_SECRET);
        
      // Set token in a secure, HTTP-only cookie
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
