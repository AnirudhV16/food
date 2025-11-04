// frontend/services/notificationService.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
  }

  /**
   * Register for push notifications
   * Call this when user logs in
   */
  async registerForPushNotifications(userId) {
    try {
      console.log('📱 Registering for push notifications...');

      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices');
        return null;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Permission not granted for notifications');
        return null;
      }

      console.log('✅ Notification permissions granted');

      // Get Expo push token
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('📱 Expo Push Token:', token);

      // Save token to Firestore
      await this.saveTokenToFirestore(userId, token);

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
        });
      }

      return token;
    } catch (error) {
      console.error('❌ Error registering for notifications:', error);
      return null;
    }
  }

  /**
   * Save FCM token to Firestore
   */
  async saveTokenToFirestore(userId, token) {
    try {
      console.log('💾 Saving token to Firestore...');
      
      await setDoc(
        doc(db, 'users', userId),
        {
          fcmToken: token,
          tokenUpdatedAt: new Date().toISOString(),
          platform: Platform.OS,
        },
        { merge: true }
      );

      console.log('✅ Token saved to Firestore');
    } catch (error) {
      console.error('❌ Error saving token:', error);
      throw error;
    }
  }

  /**
   * Set up notification listeners
   */
  setupNotificationListeners() {
    console.log('🎧 Setting up notification listeners...');

    // Notification received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('🔔 Notification received:', notification);
        // You can show custom UI here
      }
    );

    // User tapped on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification tapped:', response);
        const data = response.notification.request.content.data;
        
        // Handle navigation based on notification type
        if (data.type === 'expiry_warning' || data.type === 'daily_expiry') {
          // Navigate to Items tab
          console.log('Navigate to product:', data.productId);
        } else if (data.type === 'weekly_summary') {
          // Navigate to Items tab
          console.log('Navigate to items list');
        }
      }
    );

    console.log('✅ Notification listeners set up');
  }

  /**
   * Clean up listeners
   */
  removeNotificationListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
    console.log('🧹 Notification listeners removed');
  }

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleTestNotification() {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: 'This is a test notification from AI Food Tracker',
          data: { type: 'test' },
        },
        trigger: {
          seconds: 2,
        },
      });

      console.log('✅ Test notification scheduled:', id);
      return id;
    } catch (error) {
      console.error('❌ Error scheduling test notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🧹 All scheduled notifications cancelled');
  }
}

export default new NotificationService();