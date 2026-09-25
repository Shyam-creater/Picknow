import axiosInstance from './axiosInstance';

// Get all deals
export const getAllDeals = async () => {
  try {
    const response = await axiosInstance.get('/all/deals');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get deal by ID
export const getDealById = async (dealsId) => {
  try {
    const response = await axiosInstance.get(`/deals/${dealsId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Add new deal
export const addDeal = async (formData) => {
  try {
    // Ensure products is properly formatted in FormData
    const products = formData.get('products');
    if (!products) {
      throw new Error('Products are required');
    }

    // If products is already an array, stringify it
    if (Array.isArray(products)) {
      formData.set('products', JSON.stringify(products));
    }
    // If products is a string but not JSON, try to parse it
    else if (typeof products === 'string' && !products.startsWith('[')) {
      try {
        const parsedProducts = JSON.parse(products);
        if (Array.isArray(parsedProducts)) {
          formData.set('products', JSON.stringify(parsedProducts));
        }
      } catch (e) {
        throw new Error('Invalid products format');
      }
    }

    const response = await axiosInstance.post('/add/deals', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update deal
export const updateDeal = async (dealsId, formData) => {
  try {
    // Ensure products is properly formatted in FormData
    const products = formData.get('products');
    if (products) {
      // If products is already an array, stringify it
      if (Array.isArray(products)) {
        formData.set('products', JSON.stringify(products));
      }
      // If products is a string but not JSON, try to parse it
      else if (typeof products === 'string' && !products.startsWith('[')) {
        try {
          const parsedProducts = JSON.parse(products);
          if (Array.isArray(parsedProducts)) {
            formData.set('products', JSON.stringify(parsedProducts));
          }
        } catch (e) {
          throw new Error('Invalid products format');
        }
      }
    }

    const response = await axiosInstance.put(`/update/deals/${dealsId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete deal
export const deleteDeal = async (dealsId) => {
  try {
    const response = await axiosInstance.delete(`/delete/deals/${dealsId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
