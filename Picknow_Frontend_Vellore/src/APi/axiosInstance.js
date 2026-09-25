import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://backmern.picknow.in/api',
  // baseURL: 'https://backmern.picknow.in/api',
  headers: {
    'Content-Type': 'application/json'
  }
});


// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Get the appropriate token based on user type
    const userType = localStorage.getItem('userType');
    let token;

    if (userType === 'vendor') {
      token = localStorage.getItem('vendorToken');
    } else {
      token = localStorage.getItem('token');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Handle multipart/form-data
    if (config.headers['Content-Type'] === 'multipart/form-data') {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear all auth data
      localStorage.removeItem('token');
      localStorage.removeItem('vendorToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('currentVendor');
      localStorage.removeItem('vendorId');

      // Redirect based on user type
      const userType = localStorage.getItem('userType');
      if (userType === 'vendor') {
        window.location.href = '/vendor/login';
      }

      // else {
      //   // window.location.href = '/login';
      // }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 