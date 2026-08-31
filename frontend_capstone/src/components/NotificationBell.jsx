import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, Settings, Check, X } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    permission, 
    isSupported, 
    enableNotifications,
    foregroundMessage 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Handle foreground messages
  useEffect(() => {
    if (foregroundMessage) {
      const newNotification = {
        id: Date.now(),
        title: foregroundMessage.notification?.title || 'Notification',
        body: foregroundMessage.notification?.body || '',
        timestamp: new Date(),
        read: false,
        data: foregroundMessage.data,
      };
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
      setUnreadCount(prev => prev + 1);
    }
  }, [foregroundMessage]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Request permission on first render if not set
  useEffect(() => {
    if (user && permission === 'default' && isSupported) {
      const timer = setTimeout(() => {
        enableNotifications();
      }, 2000); // Wait 2 seconds after login
      
      return () => clearTimeout(timer);
    }
  }, [user, permission, isSupported, enableNotifications]);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Mark as read when opening
      setTimeout(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }, 1000);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.data?.click_action) {
      navigate(notification.data.click_action);
    }
    setIsOpen(false);
  };

  const handleEnableNotifications = async () => {
    const success = await enableNotifications();
    if (!success) {
      alert('Please allow notifications in your browser settings');
    }
  };

  if (!user || !isSupported) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        {permission === 'granted' ? (
          <Bell className="h-6 w-6" />
        ) : (
          <BellOff className="h-6 w-6" />
        )}
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            <button
              onClick={() => navigate('/settings/notifications')}
              className="text-gray-400 hover:text-white transition-colors"
              title="Notification Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {permission === 'denied' && (
              <div className="p-4 text-center">
                <BellOff className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400 text-sm mb-3">
                  Notifications are blocked. Please enable them in your browser settings.
                </p>
              </div>
            )}

            {permission === 'default' && (
              <div className="p-4 text-center">
                <Bell className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400 text-sm mb-3">
                  Enable notifications to stay updated on rental requests, payments, and more.
                </p>
                <button
                  onClick={handleEnableNotifications}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Enable Notifications
                </button>
              </div>
            )}

            {permission === 'granted' && notifications.length === 0 && (
              <div className="p-4 text-center">
                <Bell className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No notifications yet</p>
              </div>
            )}

            {permission === 'granted' && notifications.length > 0 && (
              <div className="divide-y divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition-colors ${
                      notification.read
                        ? 'hover:bg-gray-750'
                        : 'bg-gray-750 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white mb-1">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {permission === 'granted' && notifications.length > 0 && (
            <div className="p-3 border-t border-gray-700">
              <button
                onClick={() => {
                  setNotifications([]);
                  setUnreadCount(0);
                }}
                className="w-full text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatTimestamp(timestamp) {
  const now = new Date();
  const diff = now - new Date(timestamp);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}
