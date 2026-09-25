import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_BASE_URL } from './api';
const API_URL = API_BASE_URL;

export async function registerForPushNotificationsAsync() {
  try {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      Constants?.manifest2?.extra?.eas?.projectId;

    if (!projectId) {
      console.warn('[NotificationService] Project ID not found. Attempting fallback...');
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      ...(projectId ? { projectId } : {}),
    });
    const token = tokenResponse.data;
    console.log('[NotificationService] Token:', token);

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        enableVibrate: true,
        showBadge: true,
      });
    }

    return token;
  } catch (e: any) {
    // Gracefully handle Firebase not being initialized (missing google-services.json)
    if (e?.message?.includes('FirebaseApp is not initialized')) {
      console.warn('Push notifications unavailable: Firebase is not configured. Add google-services.json and rebuild.');
    } else {
      console.error('Error getting push token:', e);
    }
    return null;
  }
}

export async function updatePushTokenOnBackend(userId: string, pushToken: string) {
  try {
    const response = await fetch(`${API_URL}/notifications/update-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, pushToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to update push token');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating push token on backend:', error);
    return null;
  }
}
