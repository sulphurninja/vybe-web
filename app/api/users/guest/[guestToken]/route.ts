import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import User from "@/lib/services/models/User";

type Ctx = { params: Promise<{ guestToken: string }> };

// Get guest user profile
export async function GET(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  
  try {
    const user = await User.findOne({ guestToken: params.guestToken });
    
    if (!user) {
      return NextResponse.json({ error: "Guest user not found" }, { status: 404 });
    }
    
    // Return user profile (same format as regular user)
    return NextResponse.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio || 'VYBE Guest User',
      isGuest: true,
      stats: user.stats,
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    console.error('Error fetching guest user:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch guest user' }, { status: 500 });
  }
}

