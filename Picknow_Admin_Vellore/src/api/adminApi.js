import axiosInstance from './axiosInstance';

export const adminApi = {
  login: async (credentials) => {
    try {
      const response = await axiosInstance.post('/admin/login', credentials);
      if (response.data.success) {
        return {
          success: true,
          token: response.data.token,
          admin: response.data.admin,
          message: response.data.message,
        };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { message: error.message || 'Login failed' };
    }
  },

  getAllAdmins: async () => {
    try {
      const response = await axiosInstance.get('/admin/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch admins' };
    }
  },

  createAdmin: async (adminData) => {
    try {
      const response = await axiosInstance.post('/admin/users', adminData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create admin' };
    }
  },

  updateAdmin: async (id, adminData) => {
    try {
      const response = await axiosInstance.put(`/admin/users/${id}`, adminData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update admin' };
    }
  },

  deleteAdmin: async (id) => {
    try {
      const response = await axiosInstance.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete admin' };
    }
  }
}; 
