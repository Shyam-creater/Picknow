import axiosInstance from './axiosInstance';
import { checkUserAccess, isTokenExpired } from './utils';

export const orderApi = {
  createOrder: async (orderData) => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      // Determine if it's a cart order or direct order
      const isCartOrder = orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0;
      const endpoint = isCartOrder ? 'order/cart' : 'order/direct';

      const response = await axiosInstance.post(endpoint, orderData);
      return response.data;
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to create order' };
    }
  },

  getOrders: async () => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      console.log('Fetching orders...');
      const response = await axiosInstance.get('order/orders');
      console.log('Orders response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to fetch orders' };
    }
  },

  getOrderById: async (orderId) => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await axiosInstance.get(`order/${orderId}`);
      return response.data;
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to fetch order details' };
    }
  },

  cancelOrder: async (orderId) => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await axiosInstance.post(`order/${orderId}/cancel`);
      return response.data;
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to cancel order' };
    }
  },

  returnOrderItem: async (orderId, productId, variantId, reason) => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await axiosInstance.post(`order/${orderId}/return`, {
        productId,
        variantId,
        reason
      });
      return response.data;
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to return order item' };
    }
  },

  getReturnProducts: async (orderId) => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await axiosInstance.get(`order/${orderId}/returns`);
      return response.data;
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to fetch return products' };
    }
  }
};