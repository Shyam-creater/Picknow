import axiosInstance from "./axiosInstance";

// Brand API functions
export const createBrand = async (brandData) => {
  try {
    const response = await axiosInstance.post('/brand/create', brandData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

export const getAllBrands = async () => {
  try {
    const response = await axiosInstance.get('/brand/all');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

export const getBrandById = async (id) => {
  try {
    const response = await axiosInstance.get(`/brand/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

export const updateBrand = async (id, brandData) => {
  try {
    const response = await axiosInstance.put(`/brand/update/${id}`, brandData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

export const deleteBrand = async (id) => {
  try {
    const response = await axiosInstance.delete(`/brand/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};