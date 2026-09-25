import axiosInstance from './baseApi';

export const categoryApi = {
  getAllCategories: async () => {
    try {
      const response = await axiosInstance.get('/category/all');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch categories' };
    }
  },
  getCategoryById: async (id) => {
    try {
      const response = await axiosInstance.get(`/category/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch category' };
    }
  },

  getSubCategories: async (categoryId) => {
    try {
      const response = await axiosInstance.get(`/category/${categoryId}/subcategories`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch subcategories' };
    }
  },

  getNestedSubCategories: async (categoryId, subCategoryId) => {
    try {
      const response = await axiosInstance.get(
        `/category/${categoryId}/subcategories/${subCategoryId}/nested`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch nested subcategories' };
    }
  }
}; 