import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import User from "@/lib/services/models/User";
import bcrypt from "bcryptjs";

// Get user(s)
export async function GET(req: Request) {
  await db();
  
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const userId = searchParams.get('id');
  
  if (userId) {
    const user = await User.findById(userId).select('-passwordHash').lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  }
  
  if (email) {
    const user = await User.findOne({ email }).select('-passwordHash').lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  }
  
  // List all users (limit for safety)
  const users = await User.find({ status: 'active' })
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  
  return NextResponse.json({ users });
}

// Create new user (signup)
export async function POST(req: Request) {
  await db();
  const body = await req.json();
  
  // Check if user exists
  const existing = await User.findOne({ email: body.email });
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }
  
  // Hash password if provided
  let passwordHash;
  if (body.password) {
    passwordHash = await bcrypt.hash(body.password, 10);
  }
  
  const user = await User.create({
    name: body.name,
    username: body.username,
    email: body.email,
    phone: body.phone,
    avatar: body.avatar,
    bio: body.bio,
    passwordHash,
  });
  
  // Don't return password hash
  const userObj = user.toObject();
  delete (userObj as any).passwordHash;
  
  return NextResponse.json(userObj, { status: 201 });
}

