import axios from 'axios';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushNotificationPayload {
  to: string; // Expo push token
  sound?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
}

/**
 * Send a push notification via Expo
 */
export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  message: string,
  data?: Record<string, any>
) {
  if (!expoPushToken) {
    console.warn('⚠️ No push token provided');
    return null;
  }

  // Validate token format
  if (!expoPushToken.startsWith('ExponentPushToken[')) {
    console.warn(`⚠️ Invalid push token format: ${expoPushToken}`);
    return null;
  }

  try {
    const payload: PushNotificationPayload = {
      to: expoPushToken,
      sound: 'default',
      title,
      body: message,
      data: data || {},
      badge: 1,
    };

    console.log(`📱 Sending push notification to ${expoPushToken.substring(0, 30)}...`);

    const response = await axios.post(EXPO_PUSH_URL, payload, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });

    console.log(`✅ Push notification sent successfully:`, response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Error sending push notification:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Send push notifications to multiple users
 */
export async function sendBulkPushNotifications(
  tokens: string[],
  title: string,
  message: string,
  data?: Record<string, any>
) {
  const validTokens = tokens.filter(token => 
    token && token.startsWith('ExponentPushToken[')
  );

  if (validTokens.length === 0) {
    console.warn('⚠️ No valid push tokens provided');
    return [];
  }

  console.log(`📱 Sending bulk push notifications to ${validTokens.length} users`);

  const results = await Promise.allSettled(
    validTokens.map(token => 
      sendPushNotification(token, title, message, data)
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  console.log(`✅ Sent ${successful}/${validTokens.length} push notifications`);

  return results;
}

/**
 * Send notification based on event activity
 */
export async function sendEventNotification(
  userToken: string,
  type: 'user_joined' | 'option_added' | 'message' | 'vote',
  eventTitle: string,
  details: string,
  eventId?: string
) {
  const titles: Record<string, string> = {
    user_joined: '🎉 New participant!',
    option_added: '📍 New option added',
    message: '💬 New message',
    vote: '🗳️ Someone voted',
  };

  return sendPushNotification(
    userToken,
    titles[type] || 'VYBE Notification',
    details,
    {
      type,
      eventId,
      eventTitle,
    }
  );
}
