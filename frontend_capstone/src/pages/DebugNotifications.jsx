import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Bell, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function DebugNotifications() {
  const { user } = useAuth();
  const [debug, setDebug] = useState({
    browserSupport: false,
    permission: 'unknown',
    serviceWorkerRegistered: false,
    fcmToken: null,
    tokensInBackend: 0,
    lastError: null,
  });
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkEverything();
  }, []);

  const checkEverything = async () => {
    setLoading(true);
    const results = {
      browserSupport: false,
      permission: 'unknown',
      serviceWorkerRegistered: false,
      fcmToken: null,
      tokensInBackend: 0,
      lastError: null,
    };

    try {
      // Check browser support
      results.browserSupport = 'Notification' in window && 'serviceWorker' in navigator;

      // Check permission
      if ('Notification' in window) {
        results.permission = Notification.permission;
      }

      // Check service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        results.serviceWorkerRegistered = !!registration;
      }

      // Get FCM token from localStorage or try to get new one
      const storedToken = localStorage.getItem('fcmToken');
      if (storedToken) {
        results.fcmToken = storedToken.substring(0, 30) + '...';
      }

      // Check backend tokens
      try {
        const response = await api.get('/fcm/tokens');
        results.tokensInBackend = response.data.tokens?.length || 0;
      } catch (err) {
        results.lastError = 'Failed to fetch backend tokens: ' + err.message;
      }

    } catch (error) {
      results.lastError = error.message;
    }

    setDebug(results);
    setLoading(false);
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      await checkEverything();
      
      if (permission === 'granted') {
        alert('✅ Permission granted! Now registering FCM token...');
        window.location.reload();
      } else {
        alert('❌ Permission denied or dismissed');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const sendTestNotification = async () => {
    setTestResult(null);
    try {
      const response = await api.post('/notifications/test');
      setTestResult({
        success: response.data.success,
        message: JSON.stringify(response.data, null, 2),
      });
      
      if (response.data.success) {
        alert('✅ Test notification sent! Check your notification tray in a few seconds.');
      } else {
        alert('❌ Failed: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message,
      });
      alert('❌ Error: ' + error.message);
    }
  };

  const StatusIcon = ({ condition }) => {
    if (condition === true) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (condition === false) return <XCircle className="w-5 h-5 text-red-500" />;
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading debug info...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold">Push Notification Debug</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">User Info</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Role:</strong> {user?.role}</p>
          <p><strong>User ID:</strong> {user?.id}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Browser Check</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <StatusIcon condition={debug.browserSupport} />
            <span>Browser supports notifications: <strong>{debug.browserSupport ? 'YES' : 'NO'}</strong></span>
          </div>
          
          <div className="flex items-center gap-3">
            <StatusIcon condition={debug.permission === 'granted'} />
            <span>Permission status: <strong className={
              debug.permission === 'granted' ? 'text-green-600' :
              debug.permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
            }>{debug.permission.toUpperCase()}</strong></span>
          </div>
          
          <div className="flex items-center gap-3">
            <StatusIcon condition={debug.serviceWorkerRegistered} />
            <span>Service Worker registered: <strong>{debug.serviceWorkerRegistered ? 'YES' : 'NO'}</strong></span>
          </div>
          
          <div className="flex items-center gap-3">
            <StatusIcon condition={!!debug.fcmToken} />
            <span>FCM Token: <strong>{debug.fcmToken || 'Not found'}</strong></span>
          </div>
          
          <div className="flex items-center gap-3">
            <StatusIcon condition={debug.tokensInBackend > 0} />
            <span>Tokens in backend: <strong>{debug.tokensInBackend}</strong></span>
          </div>
        </div>
      </div>

      {debug.lastError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
          <p className="text-sm text-red-700">{debug.lastError}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Actions</h2>
        <div className="space-y-3">
          {debug.permission !== 'granted' && (
            <button
              onClick={requestPermission}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg"
            >
              🔔 Request Notification Permission
            </button>
          )}
          
          {debug.permission === 'granted' && (
            <button
              onClick={sendTestNotification}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg"
            >
              🚀 Send Test Notification
            </button>
          )}
          
          <button
            onClick={checkEverything}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg"
          >
            🔄 Refresh Debug Info
          </button>
        </div>
      </div>

      {testResult && (
        <div className={`rounded-lg p-4 mb-6 ${
          testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <h3 className={`font-semibold mb-2 ${
            testResult.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {testResult.success ? '✅ Test Sent' : '❌ Test Failed'}
          </h3>
          <pre className="text-xs overflow-auto">{testResult.message}</pre>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">📋 Instructions:</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Make sure all checks above are green ✅</li>
          <li>If permission is not granted, click "Request Notification Permission"</li>
          <li>After granting permission, click "Send Test Notification"</li>
          <li>Check your notification tray (pull down from top of phone)</li>
          <li>If still no notification, check phone Settings → Apps → Chrome → Notifications</li>
        </ol>
      </div>
    </div>
  );
}
