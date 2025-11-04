import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import OTP from "@/lib/services/models/OTP";
import User from "@/lib/services/models/User";

export async function POST(req: Request) {
  await db();
  
  try {
    const { phoneOrEmail, code } = await req.json();

    if (!phoneOrEmail || !code) {
      return NextResponse.json(
        { error: 'Phone/email and code are required' },
        { status: 400 }
      );
    }

    // Find the OTP
    const otp = await OTP.findOne({ 
      phoneOrEmail, 
      verified: false 
    }).sort({ createdAt: -1 });

    if (!otp) {
      return NextResponse.json(
        { error: 'No OTP found. Please request a new one.' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > otp.expiresAt) {
      await OTP.findByIdAndDelete(otp._id);
      return NextResponse.json(
        { error: 'OTP expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check attempts
    if (otp.attempts >= otp.maxAttempts) {
      await OTP.findByIdAndDelete(otp._id);
      return NextResponse.json(
        { error: 'Too many attempts. Please request a new OTP.' },
        { status: 429 }
      );
    }

    // Verify code
    if (otp.code !== code) {
      // Increment attempts
      otp.attempts += 1;
      await otp.save();
      
      return NextResponse.json(
        { 
          error: 'Invalid code', 
          attemptsRemaining: otp.maxAttempts - otp.attempts 
        },
        { status: 400 }
      );
    }

    // Mark as verified
    otp.verified = true;
    await otp.save();

    // Check if user exists
    const existingUser = otp.type === 'email' 
      ? await User.findOne({ email: phoneOrEmail })
      : await User.findOne({ phone: phoneOrEmail });

    if (existingUser) {
      // User exists - this is a login
      // Update verification status
      if (otp.type === 'email') {
        existingUser.emailVerified = true;
      } else {
        existingUser.phoneVerified = true;
      }
      existingUser.lastActive = new Date();
      await existingUser.save();

      const userObj = existingUser.toObject();
      delete (userObj as any).passwordHash;

      return NextResponse.json({
        success: true,
        isNewUser: false,
        user: userObj,
        message: 'Login successful',
      });
    }

    // New user - needs to complete signup with name
    return NextResponse.json({
      success: true,
      isNewUser: true,
      verified: true,
      phoneOrEmail,
      type: otp.type,
      message: 'Verification successful. Please complete your profile.',
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}





