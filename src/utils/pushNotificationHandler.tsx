import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';

// 🔹 Ask for notification permissions
export async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    await getFCMToken();
  } else {
  }
}

// 🔹 Get FCM token
async function getFCMToken() {
  try {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
    } else {
    }
  } catch (e) {
  }
}

// 🔹 Handle notification services
export function NotificationServices() {
  if (Platform.OS === 'android') {
    PushNotification.createChannel(
      {
        channelId: 'default-channel',
        channelName: 'Default Channel',
        importance: 4, // High importance
        vibrate: true,
        playSound: true,
        soundName: 'default',
      },
      created => console.log(`📢 Notification channel created: '${created}'`)
    );
  }

  // ✅ Foreground notifications
  const unsubscribe = messaging().onMessage(async remoteMessage => {

    // Show notification manually when app is open
    PushNotification.localNotification({
      channelId: 'default-channel',
      title: remoteMessage.notification?.title || 'New Message',
      message: remoteMessage.notification?.body || '',
      bigPictureUrl: remoteMessage.notification?.android?.imageUrl,
      smallIcon: 'ic_notification',
      playSound: true,
      soundName: 'default',
      priority: 'high',
    });
  });

  return unsubscribe; // 🔹 Helps prevent duplicate listeners
}

// 🔹 Background/quit state handler (must be in index.js, not here)
messaging().setBackgroundMessageHandler(async remoteMessage => {
});
