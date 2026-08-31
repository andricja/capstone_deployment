import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle, XCircle, TestTube } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import toast from 'react-hot-toast';

export default function NotificationSettings() {
  const {
    permission,
    isSupported,
    enableNotifications,
    disableNotifications,
    sendTestNotification,
    getPreferences,
    updatePreferences,
  } = useNotifications();

  const [preferences, setPreferences] = useState({
    rental_updates: true,
    payment_notifications: true,
    equipment_alerts: true,
    admin_notifications: true,
    marketing: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const prefs = await getPreferences();
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (permission === 'granted') {
      await disableNotifications();
      toast.success('Notifications disabled');
    } else {
      const success = await enableNotifications();
      if (success) {
        toast.success('Notifications enabled!');
      } else {
        toast.error('Failed to enable notifications. Please check browser settings.');
      }
    }
  };

  const handlePreferenceChange = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await updatePreferences(preferences);
      toast.success('Preferences saved!');
    } catch (error) {
      toast.error('Failed to save preferences');
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    if (permission !== 'granted') {
      toast.error('Please enable notifications first');
      return;
    }

    setIsTesting(true);
    try {
      const result = await sendTestNotification();
      if (result.success) {
        toast.success('Test notification sent! Check your notifications.');
      } else {
        toast.error('Failed to send test notification');
      }
    } catch (error) {
      toast.error('Error sending test notification');
      console.error('Test notification error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <BellOff className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Notifications Not Supported
            </h2>
            <p className="text-gray-400">
              Your browser does not support push notifications. Please use a modern browser like Chrome, Firefox, or Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Notification Settings</h1>
          <p className="text-gray-400">
            Manage your notification preferences and permissions
          </p>
        </div>

        {/* Permission Status Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {permission === 'granted' ? (
                <CheckCircle className="h-12 w-12 text-green-500" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500" />
              )}
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {permission === 'granted' ? 'Notifications Enabled' : 'Notifications Disabled'}
                </h3>
                <p className="text-gray-400 text-sm">
                  {permission === 'granted'
                    ? 'You will receive browser notifications for important updates'
                    : permission === 'denied'
                    ? 'Notifications are blocked. Enable them in your browser settings.'
                    : 'Click the button to enable notifications'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleNotifications}
              disabled={permission === 'denied'}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                permission === 'granted'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : permission === 'denied'
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {permission === 'granted' ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        {/* Test Notification */}
        {permission === 'granted' && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <TestTube className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Test Notification</h3>
                  <p className="text-gray-400 text-sm">
                    Send a test notification to verify everything is working
                  </p>
                </div>
              </div>
              <button
                onClick={handleTestNotification}
                disabled={isTesting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTesting ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>
        )}

        {/* Notification Preferences */}
        {permission === 'granted' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">
              Notification Preferences
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Choose which types of notifications you want to receive
            </p>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading preferences...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Rental Updates */}
                <div className="flex items-center justify-between p-4 bg-gray-750 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">Rental Updates</h4>
                    <p className="text-gray-400 text-sm">
                      Notifications about rental request approvals, rejections, and status changes
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.rental_updates}
                      onChange={() => handlePreferenceChange('rental_updates')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {/* Payment Notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-750 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">Payment Notifications</h4>
                    <p className="text-gray-400 text-sm">
                      Notifications about payment confirmations and reminders
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.payment_notifications}
                      onChange={() => handlePreferenceChange('payment_notifications')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {/* Equipment Alerts */}
                <div className="flex items-center justify-between p-4 bg-gray-750 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">Equipment Alerts</h4>
                    <p className="text-gray-400 text-sm">
                      Notifications about new rental requests and equipment availability
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.equipment_alerts}
                      onChange={() => handlePreferenceChange('equipment_alerts')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {/* Admin Notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-750 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">Admin Notifications</h4>
                    <p className="text-gray-400 text-sm">
                      System notifications and important announcements
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.admin_notifications}
                      onChange={() => handlePreferenceChange('admin_notifications')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {/* Marketing */}
                <div className="flex items-center justify-between p-4 bg-gray-750 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">Marketing & Updates</h4>
                    <p className="text-gray-400 text-sm">
                      Promotional offers, tips, and feature updates
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={() => handlePreferenceChange('marketing')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <button
                    onClick={handleSavePreferences}
                    disabled={isSaving}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Browser Compatibility Info */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h4 className="text-white font-medium mb-2">Browser Compatibility</h4>
          <p className="text-gray-400 text-sm">
            Push notifications are supported on Chrome, Firefox, Edge, Opera, and Samsung Internet.
            Safari on iOS does not support web push notifications.
          </p>
        </div>
      </div>
    </div>
  );
}
