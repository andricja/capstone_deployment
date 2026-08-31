// Firebase Cloud Messaging Service Worker
// This handles background notifications when the app is not in focus

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

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

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'FERMs Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/logo.png',
    badge: payload.notification?.badge || '/logo.png',
    tag: payload.data?.type || 'general',
    data: payload.data,
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  // Get the click action URL
  const clickAction = event.notification.data?.click_action || '/';
  
  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(clickAction);
          return;
        }
      }
      
      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});

console.log('Firebase messaging service worker loaded');
