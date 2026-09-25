import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://backmern.picknow.in/api',
  // baseURL: 'https://backmern.picknow.in/api',

  headers: {
    'Content-Type': 'application/json'
  }
});



// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const checkUserAccess = () => {
  const token = localStorage.getItem('token');
  const isLoggedIn = localStorage.getItem('isLoggedIn');

  if (!token || !isLoggedIn) {
    throw new Error('Unauthorized access. Please login.');
  }
};

const transformImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http') || imagePath.startsWith('data:image')) {
    return imagePath;
  }
  const filename = imagePath.split('\\').pop().split('/').pop();
  return `https://backmern.picknow.in/uploads/${filename}`;
};

// Product APIs
export const productService = {
  getAllProducts: async () => {
    try {
      const response = await axiosInstance.get('/products');

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
      throw error.response?.data || { message: 'Failed to fetch products' };
    }
  },

  getProductById: async (id) => {
    try {
      const response = await axiosInstance.get(`/product/${id}`);
      if (response.data.product) {
        response.data.product.pImage = response.data.product.pImage.map(transformImageUrl);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch product' };
    }
  },

  searchProducts: (query) => axiosInstance.get('/products/search', { params: { q: query } }),
  getProductsByCategory: (categoryId) => axiosInstance.get(`/products/category/${categoryId}`)
};

// Cart APIs
export const cartService = {
  getCart: async () => {
    try {
      checkUserAccess();
      const response = await axiosInstance.get('/cart/get');
      if (response.data.cart?.items) {
        response.data.cart.items = response.data.cart.items.map(item => ({
          ...item,
          product: {
            ...item.product,
            pImage: item.product.pImage.map(transformImageUrl)
          }
        }));
      }
      return response.data;
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to fetch cart' };
    }
  },

  addToCart: async (productId, quantity) => {
    try {
      checkUserAccess();
      const response = await axiosInstance.post('/cart/add', { productId, quantity });
      return response.data;
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to add to cart' };
    }
  },

  updateCartItem: async (productId, quantity) => {
    try {
      checkUserAccess();
      const response = await axiosInstance.put('/cart/update', { productId, quantity });
      return response.data;
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to update cart' };
    }
  },

  removeFromCart: async (productId) => {
    try {
      checkUserAccess();
      const response = await axiosInstance.delete(`/cart/remove/${productId}`);
      return response.data;
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to remove from cart' };
    }
  },

  clearCart: () => axiosInstance.delete('/cart/clear')
};

// Auth APIs
export const authService = {
  login: async (credentials) => {
    try {
      const response = await axiosInstance.post('/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  register: async (userData) => {
    try {
      const response = await axiosInstance.post('/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  logout: async () => {
    try {
      checkUserAccess();
      const response = await axiosInstance.post('/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('isLoggedIn');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Logout failed' };
    }
  },

  getUserProfile: () => axiosInstance.get('/user/profile'),
  updateProfile: (userData) => axiosInstance.put('/user/update', userData)
};

// Order APIs b
export const orderService = {
  createOrder: async (orderData) => {
    try {
      checkUserAccess();
      const response = await axiosInstance.post('/order/create', orderData);
      return response.data;
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to create order' };
    }
  },

  getOrders: async () => {
    try {
      checkUserAccess();
      const response = await axiosInstance.get('/order/list');
      return response.data;
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to fetch orders' };
    }
  },

  getOrderById: (orderId) => axiosInstance.get(`/order/${orderId}`),
  cancelOrder: (orderId) => axiosInstance.put(`/order/${orderId}/cancel`)
};

// Category APIs
export const categoryService = {
  getAllCategories: () => axiosInstance.get('/category'),
  getCategoryById: (id) => axiosInstance.get(`/category/${id}`)
};

// User APIs
export const userService = {
  updatePassword: (passwordData) => axiosInstance.put('/user/password', passwordData),
  addAddress: (address) => axiosInstance.post('/user/address', address),
  updateAddress: (addressId, address) => axiosInstance.put(`/user/address/${addressId}`, address),
  deleteAddress: (addressId) => axiosInstance.delete(`/user/address/${addressId}`),
  getAddresses: () => axiosInstance.get('/user/addresses')
};

export default axiosInstance; 