import axiosInstance from './axiosInstance';

export const userApi = {
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await axiosInstance.get('/user/all');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch users' };
    }
  },

  // Get user by id (admin)
  getUserById: async (userId) => {
    try {
      const response = await axiosInstance.get(`/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user' };
    }
  },

  

  // Get all users' wallet transactions (admin)
  getAllUsersTransactions: async (filters = {}) => {
    try {
      const params = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
        userId: filters.userId || undefined,
        type: filters.type || undefined,
        status: filters.status || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };
      const response = await axiosInstance.get('/user/transactions/all', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch transaction history' };
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      const response = await axiosInstance.put(`/user/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user' };
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await axiosInstance.delete(`/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete user' };
    }
  }
  
}; 