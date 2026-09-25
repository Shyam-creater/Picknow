import axiosInstance from './axiosInstance';

const vendorApi = {
  // Registration Steps
  checkRegistrationProgress: async () => {
    try {
      const token = localStorage.getItem('registrationToken');
      if (!token) {
        return { success: false, message: 'No registration token found' };
      }

      const response = await axiosInstance.get('/vendor/register/progress', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  registerStep1: async (data) => {
    try {
      const response = await axiosInstance.post('/vendor/register/step1', {
        vendorName: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.password
      });
      
      // Store the token if received
      if (response.data.token) {
        localStorage.setItem('registrationToken', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      // Handle other errors
      if (error.response?.data?.error?.includes('duplicate key error')) {
        if (error.response.data.error.includes('email')) {
          throw { message: 'Email already registered' };
        } else if (error.response.data.error.includes('phoneNumber')) {
          throw { message: 'Phone number already registered' };
        }
      }
      throw error.response?.data || error;
    }
  },

  verifyOTP: async (data) => {
    try {
      const token = localStorage.getItem('registrationToken');
      const response = await axiosInstance.post('/vendor/register/verify-otp', 
        {
          otp: data.otp
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  resendOTP: async (data) => {
    try {
      const token = localStorage.getItem('registrationToken');
      const response = await axiosInstance.post('/vendor/register/resend-otp', 
        {
          email: data.email
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  registerStep3: async (data) => {
    try {
      const token = localStorage.getItem('registrationToken');
      const response = await axiosInstance.post('/vendor/register/step3', 
        {
          businessName: data.businessName,
          businessType: data.businessType,
          productCategory: data.category,
          email: data.email
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error.response?.data || error;
    }
  },

  // Document Upload and Bank Details
  uploadDocuments: async (formData) => {
    try {
      const token = localStorage.getItem('registrationToken');
      const response = await axiosInstance.post('/vendor/register/complete', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Authentication
  login: async (credentials) => {
    try {
      const response = await axiosInstance.post('/vendor/login', {
        email: credentials.email,
        password: credentials.password
      });

      // Check if we have a valid response
      if (!response.data) {
        throw new Error('Invalid response from server');
      }

      // Handle email verification message
      if (response.data.message === "Please verify your email first") {
        throw new Error("Please verify your email first");
      }

      // Check if we have the necessary data
      if (!response.data.vendor && !response.data.incomplete) {
        throw new Error('Invalid response format from server');
      }

      // If it's a successful login, we must have a token
      if (!response.data.incomplete && 
          response.data.vendor?.adminApproval?.status === 'active' && 
          !response.data.token) {
        throw new Error('Missing authentication token');
      }

      return response.data;
    } catch (error) {
      // Handle axios errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw {
          message: error.response.data.message || 'Login failed',
          response: error.response
        };
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server. Please check your internet connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw error;
      }
    }
  },

  // Profile Management
  getProfile: async () => {
    try {
      const response = await axiosInstance.get('/vendor/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await axiosInstance.patch('/vendor/profile', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Product Management
  addProduct: async (formData) => {
    try {
      const response = await axiosInstance.post('/vendor/product/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateProduct: async (productId, formData) => {
    try {
      const response = await axiosInstance.patch(`/vendor/product/${productId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteProduct: async (productId) => {
    try {
      const response = await axiosInstance.delete(`/vendor/product/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getProducts: async () => {
    try {
      const response = await axiosInstance.get('/vendor/products');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getProductsByVendorId: async () => {
    try {
      const response = await axiosInstance.get('/vendor/products');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Dashboard
  getDashboard: async () => {
    try {
      const response = await axiosInstance.get('/vendor/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default vendorApi; 