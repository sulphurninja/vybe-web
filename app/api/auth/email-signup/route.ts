import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import User from "@/lib/services/models/User";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/services/sendgrid";

export async function POST(req: Request) {
  await db();
  
  try {
    const { name, email, password } = await req.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      emailVerified: true, // Auto-verify for email/password signup
      passwordHash,
      stats: {
        eventsCreated: 0,
        eventsJoined: 0,
        totalVotes: 0,
      },
    });

    console.log(`✅ User created via email/password: ${email}`);

    // Send welcome email (don't wait for it)
    sendWelcomeEmail(user.email, user.name).catch((error) => {
      console.error('Failed to send welcome email:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
      token: user._id.toString(), // Simple token for now (use JWT in production)
    }, { status: 201 });
  } catch (error: any) {
    console.error('Email signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 500 }
    );
  }
}

