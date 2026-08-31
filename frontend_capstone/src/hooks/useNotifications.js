import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import {
  requestNotificationPermission,
  onMessageListener,
  isNotificationSupported,
  getNotificationPermission,
} from '../lib/firebase';

export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState(getNotificationPermission());
  const [token, setToken] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [foregroundMessage, setForegroundMessage] = useState(null);

  /**
   * Register FCM token with backend
   */
  const registerToken = async (fcmToken) => {
    if (!fcmToken || !user) return;

    try {
      const browserInfo = getBrowserInfo();
      
      const response = await api.post('/fcm/token', {
        token: fcmToken,
        device_type: 'web',
        browser: browserInfo.name,
      });

      if (response.data.success) {
        console.log('FCM token registered with backend');
        return true;
      }
    } catch (error) {
      console.error('Error registering FCM token:', error);
      return false;
    }
  };

  /**
   * Request notification permission and register token
   */
  const enableNotifications = async () => {
    if (!isNotificationSupported()) {
      alert('Your browser does not support notifications');
      return false;
    }

    setIsRegistering(true);

    try {
      const fcmToken = await requestNotificationPermission();
      
      if (fcmToken) {
        setToken(fcmToken);
        setPermission('granted');
        
        // Register with backend
        await registerToken(fcmToken);
        return true;
      } else {
        setPermission(Notification.permission);
        return false;
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return false;
    } finally {
      setIsRegistering(false);
    }
  };

  /**
   * Remove FCM token from backend
   */
  const disableNotifications = async () => {
    if (!token) return;

    try {
      await api.delete('/fcm/token', {
        data: { token },
      });
      
      setToken(null);
      console.log('Notifications disabled');
    } catch (error) {
      console.error('Error disabling notifications:', error);
    }
  };

  /**
   * Send test notification
   */
  const sendTestNotification = async () => {
    try {
      const response = await api.post('/notifications/test');
      return response.data;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  };

  /**
   * Get notification preferences
   */
  const getPreferences = async () => {
    try {
      const response = await api.get('/notifications/preferences');
      return response.data.preferences;
    } catch (error) {
      console.error('Error getting preferences:', error);
      return null;
    }
  };

  /**
   * Update notification preferences
   */
  const updatePreferences = async (preferences) => {
    try {
      const response = await api.put('/notifications/preferences', {
        preferences,
      });
      return response.data.preferences;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  /**
   * Listen for foreground messages
   */
  useEffect(() => {
    if (permission === 'granted') {
      onMessageListener()
        .then((payload) => {
          console.log('Received foreground message:', payload);
          setForegroundMessage(payload);
          
          // Show browser notification for foreground messages
          if (payload.notification) {
            new Notification(payload.notification.title, {
              body: payload.notification.body,
              icon: payload.notification.icon || '/logo.png',
              badge: payload.notification.badge || '/logo.png',
              tag: payload.data?.type || 'general',
            });
          }
        })
        .catch((err) => console.log('Failed to receive foreground message:', err));
    }
  }, [permission]);

  /**
   * Auto-register on mount if permission already granted
   */
  useEffect(() => {
    const autoRegister = async () => {
      if (user && permission === 'granted' && !token) {
        const fcmToken = await requestNotificationPermission();
        if (fcmToken) {
          setToken(fcmToken);
          await registerToken(fcmToken);
        }
      }
    };

    autoRegister();
  }, [user, permission]);

  return {
    permission,
    token,
    isRegistering,
    foregroundMessage,
    isSupported: isNotificationSupported(),
    enableNotifications,
    disableNotifications,
    sendTestNotification,
    getPreferences,
    updatePreferences,
  };
}

/**
 * Get browser information
 */
function getBrowserInfo() {
  const ua = navigator.userAgent;
  let name = 'Unknown';

  if (ua.includes('Firefox')) {
    name = 'Firefox';
  } else if (ua.includes('Chrome') && !ua.includes('Edg')) {
    name = 'Chrome';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    name = 'Safari';
  } else if (ua.includes('Edg')) {
    name = 'Edge';
  } else if (ua.includes('Opera') || ua.includes('OPR')) {
    name = 'Opera';
  }

  return { name };
}
