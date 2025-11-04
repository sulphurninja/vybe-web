import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import User from "@/lib/services/models/User";
import OTP from "@/lib/services/models/OTP";

export async function POST(req: Request) {
  await db();
  
  try {
    const { phoneOrEmail, type, name } = await req.json();

    if (!phoneOrEmail || !type || !name) {
      return NextResponse.json(
        { error: 'Phone/email, type, and name are required' },
        { status: 400 }
      );
    }

    // Verify that OTP was verified recently
    const verifiedOTP = await OTP.findOne({ 
      phoneOrEmail, 
      verified: true,
      createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // Within last 15 mins
    }).sort({ createdAt: -1 });

    if (!verifiedOTP) {
      return NextResponse.json(
        { error: 'Verification expired. Please start again.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = type === 'email' 
      ? await User.findOne({ email: phoneOrEmail })
      : await User.findOne({ phone: phoneOrEmail });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Generate username from name
    const baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;
    
    // Ensure unique username
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Create user
    const userData: any = {
      name: name.trim(),
      username,
      status: 'active',
      lastActive: new Date(),
    };

    if (type === 'email') {
      userData.email = phoneOrEmail;
      userData.emailVerified = true;
    } else {
      userData.phone = phoneOrEmail;
      userData.phoneVerified = true;
      // For phone signup, we need a placeholder email
      userData.email = `${username}@vybe.temp`;
    }

    const user = await User.create(userData);

    // Delete the used OTP
    await OTP.findByIdAndDelete(verifiedOTP._id);

    const userObj = user.toObject();
    delete (userObj as any).passwordHash;

    console.log('✅ User created:', user._id, username);

    return NextResponse.json({
      success: true,
      user: userObj,
      message: 'Account created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Complete signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete signup' },
      { status: 500 }
    );
  }
}





