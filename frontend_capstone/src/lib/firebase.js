import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// ============================================
// Firebase Configuration
// ============================================
// Firebase Project: Gemini (ferms-93bfe)
// Configuration Date: August 24, 2026
const firebaseConfig = {
  apiKey: "AIzaSyBvahPhW0pugapKnWWAHW0TuHvHdkG19h0",
  authDomain: "ferms-93bfe.firebaseapp.com",
  projectId: "ferms-93bfe",
  storageBucket: "ferms-93bfe.firebasestorage.app",
  messagingSenderId: "639221514224",
  appId: "1:639221514224:web:a779df5929186f3d85a735"
};

// VAPID Key (Web Push certificate)
// Generated: August 24, 2026
const VAPID_KEY = "BJsi9a-2SHdghi_X51m963xfo2RzkBZV3ICa3dgZ0eRGnmQhuRN0eAUHNJHD4acrVpoeTik4ENRB9X4NpNAAqFA";

// Initialize Firebase
let app;
let messaging = null;

try {
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Cloud Messaging
  if ('serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

/**
 * Request notification permission and get FCM token
 */
export const requestNotificationPermission = async () => {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      
      // Get FCM token
      if (messaging) {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        console.log('FCM Token:', token);
        return token;
      }
    } else if (permission === 'denied') {
      console.warn('Notification permission denied');
    } else {
      console.warn('Notification permission dismissed');
    }
    
    return null;
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

/**
 * Listen for foreground messages (when app is open)
 */
export const onMessageListener = () => {
  return new Promise((resolve) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        resolve(payload);
      });
    }
  });
};

/**
 * Get current FCM token
 */
export const getCurrentToken = async () => {
  try {
    if (messaging) {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Check if notifications are supported
 */
export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Get notification permission status
 */
export const getNotificationPermission = () => {
  if ('Notification' in window) {
    return Notification.permission;
  }
  return 'unsupported';
};

export { messaging };
