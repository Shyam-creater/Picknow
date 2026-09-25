import axiosInstance from './axiosInstance';
import { transformImageUrl } from './utils';

export const productApi = {
  // Fetch all available product brands
  getBrands: async (categories) => {
    try {
      const response = await axiosInstance.post(`/products/brand`, { categories: categories });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch brands' };
    }
  },

  getAllProducts: async (page = 1, limit = 20) => {
    try {
      const response = await axiosInstance.get(`/products?page=${page}&limit=${limit}&includeVariants=true`);

      if (response.data.products) {
        response.data.products = response.data.products.map(product => ({
          ...product,
          pImage: Array.isArray(product.pImage)
            ? product.pImage.map(transformImageUrl)
            : [],
          variants: product.variants || []
        }));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getProductById: async (id) => {
    try {
      const response = await axiosInstance.get(`/product/${id}`);
      if (response.data.success) {
        const product = response.data.product;
        if (product.pImage) {
          product.pImage = product.pImage.map(img => {
            if (img.includes('cloudinary.com')) {
              return img;
            }
            if (img.startsWith('http')) {
              return img;
            }
            return `${img}`;
          });
        }
        return response.data;
      }
      throw new Error('Failed to fetch product');
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  searchProducts: (query) => axiosInstance.get('/products/search', { params: { q: query } }),
  getSearchSuggestions: (query) => axiosInstance.get('/search/suggestions', { params: { query } }),
  getProductsByCategory: (categoryId) => axiosInstance.get(`/product/category/${categoryId}`).then(res => res.data),

  // Add review methods
  addReview: async (productId, rating, review) => {
    try {
      const response = await axiosInstance.post(`/product/${productId}/reviews`, {
        rating: Number(rating),
        review: review
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add review' };
    }
  },

  getReviews: async (productId) => {
    try {
      const response = await axiosInstance.get(`/product/${productId}/reviews`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch reviews' };
    }
  },
  getAuthReviews: async (productId) => {
    try {
      const response = await axiosInstance.get(`/product/${productId}/canreview`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch reviews' };
    }
  },

  deleteReview: async (productId, reviewId) => {
    try {
      const response = await axiosInstance.delete(`/product/${productId}/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete review' };
    }
  },

  getProductsBySubCategory: async (subCategoryId) => {
    try {
      const response = await axiosInstance.get(`/products/subcategory/${subCategoryId}`);
      console.log('API Response for subcategory:', response.data); // Debug log

      if (response.data.products) {
        response.data.products = response.data.products.map(product => ({
          ...product,
          pImage: Array.isArray(product.pImage)
            ? product.pImage.map(transformImageUrl)
            : []
        }));
      }

      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error.response?.data || { message: 'Failed to fetch products by subcategory' };
    }
  },

  getProductsByNestedSubCategory: async (nestedSubCategoryId) => {
    try {
      const response = await axiosInstance.get(`/products/nested-subcategory/${nestedSubCategoryId}`);
      console.log('API Response:', response.data); // Debug log

      if (response.data.products) {
        response.data.products = response.data.products.map(product => ({
          ...product,
          pImage: Array.isArray(product.pImage)
            ? product.pImage.map(transformImageUrl)
            : []
        }));
      }

      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error.response?.data || { message: 'Failed to fetch products by nested subcategory' };
    }
  },
  getProductsBrandSubCategory: async (nestedSubCategoryId, selectedBrands) => {
    try {
      const response = await axiosInstance.get(`/products/nested-subbrand/${nestedSubCategoryId}/${selectedBrands}`);
      console.log('API Response:', response.data); // Debug log

      if (response.data.products) {
        response.data.products = response.data.products.map(product => ({
          ...product,
          pImage: Array.isArray(product.pImage)
            ? product.pImage.map(transformImageUrl)
            : []
        }));
      }

      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error.response?.data || { message: 'Failed to fetch products by nested subcategory' };
    }
  },
  getNestedSubCategoryWithMoreThan10Products: async (nestedSubCategoryId) => {
    try {
      const response = await axiosInstance.get(`/products/nested-subcategory/${nestedSubCategoryId}`);
      if (response.data.products && response.data.products.length > 10) {
        return response.data.products;
      }
      throw new Error('Not enough products in this subcategory');
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch nested subcategory products' };
    }
  },



  getRelatedProducts: async (productId) => {
    try {
      const response = await axiosInstance.get(`/products/${productId}/related`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch related products' };
    }
  },

  getProductByBrand: async (brand) => {
    try {
      const response = await axiosInstance.get(`/product/brand/${brand}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch products by brand' };
    }
  },

  getAllProductByOffer: async (minOffer = 1, limit = 20) => {
    try {
      console.log('Fetching products with offers');
      const response = await axiosInstance.get(`/products/offer?minOffer=${minOffer}&limit=${limit}`);

      if (response.data && response.data.success) {
        // Server returns the data in the 'data' property
        return {
          success: true,
          data: response.data.data || []
        };
      } else if (response.data && Array.isArray(response.data)) {
        // Handle legacy format (direct array)
        return {
          success: true,
          data: response.data
        };
      } else if (response.data && Array.isArray(response.data.products)) {
        // Handle alternate format
        return {
          success: true,
          data: response.data.products
        };
      }

      console.error('Unexpected response format:', response.data);
      throw new Error('Invalid response format from offer products endpoint');
    } catch (error) {
      console.error('Error fetching offer products:', error);
      if (error.response?.status === 404) {
        throw new Error('No offer products found');
      }
      throw error.response?.data || error;
    }
  },

  getLatestProduct: async () => {
    try {
      const response = await axiosInstance.get('/products/latest');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch latest products' };
    }
  },

  // Add method to fetch product variants
  getProductVariants: async (productId) => {
    try {
      const response = await axiosInstance.get(`/variant/product/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch product variants' };
    }
  },

  //get product variant by id
  getProductVariantById: async (variantId) => {
    try {
      const response = await axiosInstance.get(`/variant/${variantId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch product variant by id' };
    }
  },

  getProductByType: async (type) => {
    try {
      const response = await axiosInstance.get(`/producttype/combo`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch product by type' };
    }
  },

  getProductsGroupedByName: async () => {
    try {
      const response = await axiosInstance.get(`/products/group`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch products grouped by name' };
    }
  }

};
