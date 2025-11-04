import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import User from "@/lib/services/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  await db();
  
  try {
    const { email, password } = await req.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user has password set
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'No password set for this account. Please use phone/OTP login.' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    console.log(`✅ User logged in via email/password: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        phone: user.phone,
      },
      token: user._id.toString(), // Simple token for now (use JWT in production)
    });
  } catch (error: any) {
    console.error('Email login error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to login' },
      { status: 500 }
    );
  }
}

