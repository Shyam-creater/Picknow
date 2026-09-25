import axiosInstance from './axiosInstance';

const checkAdminAccess = () => {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');
  const isLoggedIn = localStorage.getItem('isLoggedIn');

  if (!token || !isLoggedIn || userType !== 'admin') {
    throw new Error('Unauthorized access. Please login as admin.');
  }
};



export const categoryApi = {
  getAllCategories: async () => {
    try {
      checkAdminAccess();
      const response = await axiosInstance.get('/category/all');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch categories' };
    }
  },



  createCategory: async (categoryData) => {
    try {
      checkAdminAccess();
      const formData = new FormData();

      formData.append('cName', categoryData.name);
      formData.append('cDescription', categoryData.description);
      formData.append('cStatus', categoryData.status);

      if (categoryData.image) {
        if (typeof categoryData.image === 'string' && categoryData.image.startsWith('data:image')) {
          // Convert base64 to file
          const response = await fetch(categoryData.image);
          const blob = await response.blob();
          const file = new File([blob], `category-${Date.now()}.jpg`, { type: 'image/jpeg' });
          formData.append('cImage', file);
        } else if (categoryData.image instanceof File) {
          formData.append('cImage', categoryData.image);
        }
      }

      const response = await axiosInstance.post('/admin/category/new', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create category' };
    }
  },

  updateCategory: async (id, categoryData) => {
    try {
      checkAdminAccess();


      if (categoryData.image) {
        const formData = new FormData();

        formData.append('cName', categoryData.name);
        formData.append('cDescription', categoryData.description);
        formData.append('cStatus', categoryData.status);
        if (typeof categoryData.image === 'string' && categoryData.image.startsWith('data:image')) {
          const response = await fetch(categoryData.image);
          const blob = await response.blob();
          const file = new File([blob], `category-${Date.now()}.jpg`, { type: 'image/jpeg' });
          formData.append('cImage', file);
        } else if (categoryData.image instanceof File) {
          formData.append('cImage', categoryData.image);
        }
        const response = await axiosInstance.put(`/admin/category/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;






      } else {
        const response = await axiosInstance.put(`/admin/category/${id}`, {
          cName: categoryData.name,
          cDescription: categoryData.description,
          cStatus: categoryData.status,
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
        });
        return response.data;

      }


    } catch (error) {
      throw error.response?.data || { message: 'Failed to update category' };
    }
  },

  deleteCategory: async (id) => {
    try {
      checkAdminAccess();
      const response = await axiosInstance.delete(`/admin/category/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete category' };
    }
  },

  getSubCategories: async (categoryId) => {
    try {
      checkAdminAccess();
      const response = await axiosInstance.get(`/category/${categoryId}/subcategories`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch subcategories' };
    }
  },

  createSubCategory: async (categoryId, formData) => {
    try {
      const response = await axiosInstance.post(
        `/admin/category/${categoryId}/subcategories`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create subcategory');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating subcategory:', error);
      throw error.response?.data || {
        success: false,
        message: error.message || 'Failed to create subcategory'
      };
    }
  },

  updateSubCategory: async (categoryId, subCategoryId, formData) => {
    try {
      const response = await axiosInstance.put(
        `/admin/category/${categoryId}/subcategories/${subCategoryId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update subcategory');
      }

      return response.data;
    } catch (error) {
      console.error('Error updating subcategory:', error);
      throw error.response?.data || {
        success: false,
        message: error.message || 'Failed to update subcategory'
      };
    }
  },

  deleteSubCategory: async (categoryId, subCategoryId) => {
    try {
      checkAdminAccess();
      const response = await axiosInstance.delete(`/admin/category/${categoryId}/subcategories/${subCategoryId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete subcategory' };
    }
  },

  getProductsByCategory: async (categoryName) => {
    try {
      checkAdminAccess();
      const response = await axiosInstance.get(`/category/${categoryName}/products`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch products by category' };
    }
  },

  getNestedSubCategories: async (categoryId, subCategoryId) => {
    try {
      const response = await axiosInstance.get(
        `/category/${categoryId}/subcategories/${subCategoryId}/nested`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch nested subcategories');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching nested subcategories:', error);
      throw error.response?.data || {
        success: false,
        message: 'Failed to fetch nested subcategories',
        subCategories: []
      };
    }
  },

  createNestedSubCategory: async (categoryId, parentSubCategoryId, formData) => {
    try {
      const response = await axiosInstance.post(
        `/admin/category/${categoryId}/subcategories/${parentSubCategoryId}/nested`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create nested subcategory');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating nested subcategory:', error);
      throw error.response?.data || {
        success: false,
        message: error.message || 'Failed to create nested subcategory'
      };
    }
  },

  deleteNestedSubCategory: async (categoryId, parentSubCategoryId, nestedSubCategoryId) => {
    try {
      console.log('API Delete call with:', {
        categoryId,
        parentSubCategoryId,
        nestedSubCategoryId
      });

      const response = await axiosInstance.delete(
        `/admin/category/${categoryId}/subcategories/${parentSubCategoryId}/nested/${nestedSubCategoryId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete nested subcategory');
      }

      return response.data;
    } catch (error) {
      console.error('Error deleting nested subcategory:', error);
      throw error.response?.data || {
        success: false,
        message: error.message || 'Failed to delete nested subcategory'
      };
    }
  },

  updateNestedSubCategory: async (categoryId, parentSubCategoryId, nestedSubCategoryId, formData) => {
    try {
      const response = await axiosInstance.put(
        `/admin/category/${categoryId}/subcategories/${parentSubCategoryId}/nested/${nestedSubCategoryId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update nested subcategory');
      }

      return response.data;
    } catch (error) {
      console.error('Error updating nested subcategory:', error);
      throw error.response?.data || {
        success: false,
        message: error.message || 'Failed to update nested subcategory'
      };
    }
  },


};