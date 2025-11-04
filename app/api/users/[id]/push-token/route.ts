import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import User from '@/lib/services/models/User';

type Ctx = { params: Promise<{ id: string }> };

// POST - Save Expo push token for a user
export async function POST(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const { expoPushToken } = await req.json();

  if (!expoPushToken) {
    return NextResponse.json(
      { error: 'expoPushToken is required' },
      { status: 400 }
    );
  }

  // Validate Expo token format
  if (!expoPushToken.startsWith('ExponentPushToken[')) {
    return NextResponse.json(
      { error: 'Invalid Expo push token format' },
      { status: 400 }
    );
  }

  try {
    const user = await User.findByIdAndUpdate(
      params.id,
      {
        expoPushToken,
        'preferences.notifications.push': true,
        lastActive: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`📱 Saved Expo push token for user ${params.id}`);

    return NextResponse.json({
      message: 'Push token saved successfully',
      user: {
        _id: user._id,
        expoPushToken: user.expoPushToken,
        pushNotificationsEnabled: user.preferences?.notifications?.push,
      },
    });
  } catch (error: any) {
    console.error('Error saving push token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save push token' },
      { status: 500 }
    );
  }
}
