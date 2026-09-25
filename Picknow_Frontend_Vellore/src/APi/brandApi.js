import axiosInstance from './axiosInstance';

export const brandApi = {
  // Fetch all brands
  getAllBrands: async () => {
    try {
      const response = await axiosInstance.get('/brand/all');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch brands' };
    }
  },

  // Get products by brand
  getProductsByBrand: async (brand) => {
    try {
      const response = await axiosInstance.get(`/product/brand/${brand}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch products by brand' };
    }
  }
};
