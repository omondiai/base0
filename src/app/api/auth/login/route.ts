
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

const SECRET_KEY = process.env.JWT_SECRET ? new TextEncoder().encode(process.env.JWT_SECRET) : null;

if (!SECRET_KEY) {
  throw new Error('JWT_SECRET is not defined in the environment variables.');
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const db = await getDb();
    const usersCollection = db.collection('users');

    // Find the user by username
    const user = await usersCollection.findOne({ username });

    if (!user) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }
    
    // For this example, let's assume the password in the database is plain text 'omondipa2@gmail.com'
    // In a real application, you should hash passwords.
    // Let's compare the provided password with the one in the DB.
    // Note: The prompt implies a plain text password check. In a real-world scenario, you would use something like bcrypt.compare
    const isPasswordValid = (password === user.password);

    if (isPasswordValid) {
      // User is authenticated, create a JWT
      const payload = { username: user.username, sub: user._id.toString() };
      
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
