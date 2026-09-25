import { User } from "../models/User.js";

/**
 * Sends a push notification to a specific user or all users (if userId is null)
 * @param {string|null} userId - The ID of the user to notify, or null for all users
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Extra data to send with the notification
 */
export const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    let tokens = [];

    if (userId) {
      const user = await User.findById(userId).select("pushToken");
      if (user && user.pushToken) {
        tokens = [user.pushToken];
      }
    } else {
      // Global notification - fetch all users with tokens
      const users = await User.find({ pushToken: { $ne: null } }).select("pushToken");
      tokens = users.map(u => u.pushToken);
    }

    if (tokens.length === 0) return;

    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'default',
    }));

    // Expo Push API allows sending in chunks of 100
    const chunks = [];
    while (messages.length > 0) {
      chunks.push(messages.splice(0, 100));
    }

    for (const chunk of chunks) {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      const resData = await response.json();
      console.log('System: Push notification sent:', resData);
    }
  } catch (error) {
    console.error('System: Push Notification Error:', error);
  }
};
