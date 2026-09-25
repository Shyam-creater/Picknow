import axiosInstance from "./axiosInstance";

export const variantApi = {
  // Create product variants
  // Accepts meta fields: pvMetaTitle, pvMetaKeywords, pvMetaDescription, pvCanonicalUrl for each variant object
  createProductVariants: async (variants) => {
    try {
      const response = await axiosInstance.post('/variant/create', variants);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all variants for a product
  getProductVariants: async (productId) => {
    try {
      const response = await axiosInstance.get(`/variant/product/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get a single variant by ID
  getVariantById: async (variantId) => {
    try {
      const response = await axiosInstance.get(`/variant/${variantId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update a product variant
  // Accepts meta fields: pvMetaTitle, pvMetaKeywords, pvMetaDescription, pvCanonicalUrl in `data`
  updateProductVariant: async (variantId, data) => {
    try {
      const response = await axiosInstance.put(`/variant/update/${variantId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete a product variant
  deleteProductVariant: async (variantId) => {
    try {
      const response = await axiosInstance.delete(`/variant/delete/${variantId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}; 