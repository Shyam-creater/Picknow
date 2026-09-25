import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchNotifications, markNotificationAsRead } from '../APi/notificationApi';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user._id || user.id : null;
  };

  const loadNotifications = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchNotifications(userId);
      if (data?.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('System: Notification fetch failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = async (notificationId) => {
    const userId = getUserId();
    try {
      await markNotificationAsRead(notificationId, userId);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId || notificationId === 'all' ? { ...n, isRead: true } : n)
      );
      if (notificationId === 'all') {
        setUnreadCount(0);
      } else {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 120000); // 2 minute polling
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Handle login/logout
  useEffect(() => {
    const handleAuthChange = () => {
      loadNotifications();
    };
    window.addEventListener('loginStateChanged', handleAuthChange);
    return () => window.removeEventListener('loginStateChanged', handleAuthChange);
  }, [loadNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    refreshNotifications: loadNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
