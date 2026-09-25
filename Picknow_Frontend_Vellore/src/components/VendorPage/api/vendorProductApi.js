import axiosInstance from '../../../APi/axiosInstance';

// Product APIs
export const addProduct = async (formData) => {
  try {
    // Verify vendor token exists
    const vendorToken = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('currentVendor');
    
    if (!vendorToken || !vendorData) {
      throw new Error('Vendor authentication required');
    }

    // Add vendor role and ID to formData
    const vendor = JSON.parse(vendorData);
    formData.append('role', 'vendor');
    formData.append('vendorId', vendor._id);
    formData.append('createdBy', vendor._id);

    const response = await axiosInstance.post('/vendor/product/new', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${vendorToken}`
      },
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add product');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error.response?.data || {
      success: false,
      message: error.message || 'Failed to add product'
    };
  }
};

export const updateProduct = async (productId, formData) => {
  try {
    const vendorToken = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('currentVendor');
    
    if (!vendorToken || !vendorData) {
      throw new Error('Vendor authentication required');
    }

    const vendor = JSON.parse(vendorData);
    formData.append('role', 'vendor');
    formData.append('vendorId', vendor._id);
    formData.append('updatedBy', vendor._id);

    const response = await axiosInstance.put(`/vendor/product/${productId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${vendorToken}`
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update product');
    }

    return response.data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error.response?.data || {
      success: false,
      message: error.message || 'Failed to update product'
    };
  }
};

export const deleteProduct = async (productId) => {
  try {
    const vendorToken = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('currentVendor');
    
    if (!vendorToken || !vendorData) {
      console.error('Delete Product Error: Missing authentication', { vendorToken: !!vendorToken, vendorData: !!vendorData });
      throw new Error('Vendor authentication required');
    }

    console.log('Attempting to delete product:', { productId, vendorId: JSON.parse(vendorData)._id });
    
    const response = await axiosInstance.delete(`/vendor/product/${productId}`, {
      headers: {
        Authorization: `Bearer ${vendorToken}`
      }
    });

    console.log('Delete product response:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete product');
    }

    return response.data;
  } catch (error) {
    console.error('Error deleting product:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      productId
    });
    throw error.response?.data || {
      success: false,
      message: error.message || 'Failed to delete product'
    };
  }
};

export const getProducts = async () => {
  try {
    const response = await axiosInstance.get('/vendor/product/all');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Category APIs
export const getAllCategories = async () => {
  try {
    const response = await axiosInstance.get('/category/all');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getCategoryById = async (id) => {
  try {
    const response = await axiosInstance.get(`/category/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get subcategories for a category
export const getSubCategories = async (categoryId) => {
  try {
    const response = await axiosInstance.get(`/category/${categoryId}/subcategories`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get nested subcategories
export const getNestedSubCategories = async (categoryId, subCategoryId) => {
  try {
    const response = await axiosInstance.get(`/category/${categoryId}/subcategories/${subCategoryId}/nested`);

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
};

// Get products by category name
export const getProductsByCategory = async (categoryName) => {
  try {
    const response = await axiosInstance.get(`/category/${categoryName}/products`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getProductsByVendorId = async () => {
  try {
    const response = await axiosInstance.get('/vendor/product/vendorId');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Variant APIs
export const getProductVariants = async (productId) => {
  try {
    const vendorToken = localStorage.getItem('vendorToken');
    
    if (!vendorToken) {
      throw new Error('Vendor authentication required');
    }

    const response = await axiosInstance.get(`/variant/product/${productId}`, {
      headers: {
        Authorization: `Bearer ${vendorToken}`
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch product variants');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching variants:', error);
    throw error.response?.data || {
      success: false,
      message: error.message || 'Failed to fetch product variants'
    };
  }
};

export const createProductVariants = async (variants) => {
  try {
    const vendorToken = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('currentVendor');
    
    if (!vendorToken || !vendorData) {
      throw new Error('Vendor authentication required');
    }

    const vendor = JSON.parse(vendorData);
    const variantsWithVendor = variants.map(variant => ({
      ...variant,
      vendorId: vendor._id,
      createdBy: vendor._id
    }));

    const response = await axiosInstance.post('/variant/vendor/create', variantsWithVendor, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vendorToken}`
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create variants');
    }

    return response.data;
  } catch (error) {
    console.error('Error creating variants:', error);
    throw error.response?.data || {
      success: false,
      message: error.message || 'Failed to create variants'
    };
  }
};

export const updateProductVariant = async (variantId, variantData) => {
  try {
    const vendorToken = localStorage.getItem('vendorToken');
    
    if (!vendorToken) {
      throw new Error('Vendor authentication required');
    }

    const response = await axiosInstance.put(`/variant/vendor/update/${variantId}`, variantData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vendorToken}`
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update variant');
    }

    return response.data;
  } catch (error) {
    console.error('Error updating variant:', error);
    throw error.response?.data || {
      success: false,
      message: error.message || 'Failed to update variant'
    };
  }
};

export const deleteProductVariant = async (variantId) => {
  try {
    const vendorToken = localStorage.getItem('vendorToken');
    
    if (!vendorToken) {
      throw new Error('Vendor authentication required');
    }

    const response = await axiosInstance.delete(`/variant/vendor/delete/${variantId}`, {
      headers: {
        Authorization: `Bearer ${vendorToken}`
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete variant');
    }

    return response.data;
  } catch (error) {
    console.error('Error deleting variant:', error);
    throw error.response?.data || {
      success: false,
      message: error.message || 'Failed to delete variant'
    };
  }
};

