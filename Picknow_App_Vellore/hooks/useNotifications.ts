import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, updatePushTokenOnBackend } from '@/Services/notificationService';
import { useAuth } from '@/context/AuthContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    const userId = user?._id || user?.id || (typeof user === 'string' ? user : null);
    if (!userId) {
      console.log('[Notification] No User ID yet, waiting for authentication...');
      return;
    }

    const setupNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          setExpoPushToken(token);
          await updatePushTokenOnBackend(userId, token);
          console.log('System: Push Registration Success!');
        }
      } catch (error) {
        console.error('System: Notification Setup Error:', error);
      }
    };

    setupNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(receivedNotification => {
      setNotification(receivedNotification);
      console.log('Notification Received:', receivedNotification);

      // Explicitly show alert if app is in foreground
      const content = receivedNotification?.request?.content;
      if (content) {
        const { title, body } = content;
        Alert.alert(title || 'Notification', body || '');
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification Tapped:', response);
      // Handle navigation or action here based on response.notification.request.content.data
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user?._id || user?.id]);

  return { expoPushToken, notification };
}
