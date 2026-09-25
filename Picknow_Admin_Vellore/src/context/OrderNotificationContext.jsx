import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchOrders } from '../api/dashboardApi';

const OrderNotificationContext = createContext();

export const useOrderNotifications = () => {
  const context = useContext(OrderNotificationContext);
  if (!context) {
    throw new Error('useOrderNotifications must be used within OrderNotificationProvider');
  }
  return context;
};

export const OrderNotificationProvider = ({ children }) => {
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [lastCheckedTime, setLastCheckedTime] = useState(() => {
    // Get last checked time from localStorage or use current time
    const stored = localStorage.getItem('lastOrderCheckTime');
    return stored ? new Date(stored) : new Date();
  });
  const [isPolling, setIsPolling] = useState(false);

  // Check for new orders
  const checkNewOrders = useCallback(async () => {
    try {
      setIsPolling(true);
      const response = await fetchOrders();
      const orders = response.orders || [];
      
      // Get the latest check time from local storage directly to avoid dependency issues
      const stored = localStorage.getItem('lastOrderCheckTime');
      const checkTime = stored ? new Date(stored) : new Date();

      // Filter orders that are new (created after last check time)
      const newOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate > checkTime && 
               (order.orderStatus === 'ORDER PLACED' || order.orderStatus === 'PENDING');
      });

      setNewOrdersCount(newOrders.length);
      
      // Update last checked time
      const now = new Date();
      setLastCheckedTime(now);
      localStorage.setItem('lastOrderCheckTime', now.toISOString());
    } catch (error) {
      console.error('Error checking for new orders:', error);
    } finally {
      setIsPolling(false);
    }
  }, []); // <-- Removed dependency on lastCheckedTime to fix infinite loop

  // Reset new orders count (when user views orders page)
  const resetNewOrdersCount = useCallback(() => {
    setNewOrdersCount(0);
    const now = new Date();
    setLastCheckedTime(now);
    localStorage.setItem('lastOrderCheckTime', now.toISOString());
  }, []);

  // Poll for new orders every 30 seconds
  useEffect(() => {
    // Initial check
    checkNewOrders();

    // Set up polling interval
    const interval = setInterval(() => {
      checkNewOrders();
    }, 30000); // Check every 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [checkNewOrders]);

  // Reset count when component mounts (if user just logged in)
  useEffect(() => {
    // Only reset if there's no stored last check time
    const stored = localStorage.getItem('lastOrderCheckTime');
    if (!stored) {
      const now = new Date();
      setLastCheckedTime(now);
      localStorage.setItem('lastOrderCheckTime', now.toISOString());
    }
  }, []);

  const value = {
    newOrdersCount,
    resetNewOrdersCount,
    checkNewOrders,
    isPolling,
  };

  return (
    <OrderNotificationContext.Provider value={value}>
      {children}
    </OrderNotificationContext.Provider>
  );
};

