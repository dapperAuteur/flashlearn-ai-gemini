import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password, zipCode, phoneNumber } = await req.json();

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !zipCode) {
      return new NextResponse('Please fill out all required fields.', { status: 400 });
    }

    if (password.length < 6) {
        return new NextResponse('Password must be at least 6 characters', { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return new NextResponse('User with this email already exists', { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      zipCode,
      phoneNumber,
    });

    await newUser.save();

    return new NextResponse('User created successfully', { status: 201 });

  } catch (error) {
    console.error('SIGNUP_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
