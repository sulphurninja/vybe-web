import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import User from "@/lib/models/User";

type Ctx = { params: Promise<{ id: string }> };

// Get user by ID
export async function GET(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  
  const user = await User.findById(params.id).select('-passwordHash').lean();
  
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  
  return NextResponse.json(user);
}

// Update user
export async function PATCH(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const body = await req.json();
  
  try {
    // Check if username is being updated and if it's unique
    if (body.username) {
      const existingUser = await User.findOne({ 
        username: body.username,
        _id: { $ne: params.id } // Exclude current user
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 }
        );
      }
    }
    
    // Check if email is being updated and if it's unique
    if (body.email) {
      const existingUser = await User.findOne({ 
        email: body.email,
        _id: { $ne: params.id } // Exclude current user
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
    }
    
    // Update allowed fields only
    const allowedUpdates = [
      'name',
      'username',
      'email',
      'phone',
      'avatar',
      'bio',
      'preferences'
    ];
    
    const updates: any = {};
    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }
    
    updates.lastActive = new Date();
    
    const user = await User.findByIdAndUpdate(
      params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-passwordHash').lean();
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

// Delete user
export async function DELETE(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  
  try {
    // Soft delete - mark as deleted instead of removing
    const user = await User.findByIdAndUpdate(
      params.id,
      { status: 'deleted', lastActive: new Date() },
      { new: true }
    ).select('-passwordHash').lean();
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Account deleted' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}



