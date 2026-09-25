import axiosInstance from './axiosInstance';

export const shippingApi = {
  // Get all delivery information
  getAllDeliveryInfo: async () => {
    try {
      const response = await axiosInstance.get('/delivery');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch delivery information' };
    }
  },

  // Update delivery information for a specific state
  updateDeliveryInfo: async (state, deliveryData) => {
    try {
      const response = await axiosInstance.put(`/delivery/${state}`, deliveryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update delivery information' };
    }
  },

  // Create new delivery information
  createDeliveryInfo: async (deliveryData) => {
    try {
      const response = await axiosInstance.post('/delivery', deliveryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create delivery information' };
    }
  }
};