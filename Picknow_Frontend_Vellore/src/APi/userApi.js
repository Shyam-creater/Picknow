import axiosInstance from './axiosInstance';
import { checkUserAccess, isTokenExpired } from './utils';

export const userApi = {
  // Get user profile
  myProfile: async () => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await axiosInstance.get('/user/profile');
      return response.data;
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to fetch profile' };
    }
  },
  deliverydata: async () => {
    try {
      const response = await axiosInstance.get('/delivery');
      return response.data;
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to fetch data' };
    }
  },
  // Update user profile
  updateProfile: async (userData) => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await axiosInstance.put('/user/update', userData);
      return response.data;
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await axiosInstance.put('/user/change-password', passwordData);
      return response.data;
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to change password' };
    }
  },

  // Add new address
  addAddress: async (addressData) => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await axiosInstance.post('/user/address', addressData);
      return response.data;
    } catch (error) {
      console.error('Add address error:', error);
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to add address' };
    }
  },

  // Get all addresses
  getAddresses: async () => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await axiosInstance.get('/user/addresses');
      return response.data;
    } catch (error) {
      console.error('Get addresses error:', error);
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to get addresses' };
    }
  },

  // Update address
  updateAddress: async (addressData) => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      const { _id, ...addressFields } = addressData;
      const response = await axiosInstance.put(`/user/address/${_id}`, addressFields);
      return response.data;
    } catch (error) {
      console.error('Update address error:', error);
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to update address' };
    }
  },

  // Delete address
  deleteAddress: async (addressId) => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await axiosInstance.delete(`/user/address/${addressId}`);
      return response.data;
    } catch (error) {
      console.error('Delete address error:', error);
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to delete address' };
    }
  },

  // Set default address
  setDefaultAddress: async (addressId) => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await axiosInstance.put(`/user/address/${addressId}/default`);
      return response.data;
    } catch (error) {
      console.error('Set default address error:', error);
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to set default address' };
    }
  },

  // Update notification preferences
  updateNotificationPreferences: async (preferences) => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await axiosInstance.put('/user/notifications', preferences);
      return response.data;
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to update notification preferences' };
    }
  },

  // Delete account
  deleteAccount: async () => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await axiosInstance.delete('/user/delete-account');
      return response.data;
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to delete account' };
    }
  },

  // Get wallet balance
  getWalletBalance: async () => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await axiosInstance.get('/user/wallet/balance');
      return response.data;
    } catch (error) {
      console.error('Get wallet balance error:', error);
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to get wallet balance' };
    }
  },

  // Add money to wallet
  addMoneyToWallet: async (amount) => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await axiosInstance.post('/user/wallet/add-money', { amount });
      return response.data;
    } catch (error) {
      console.error('Add money to wallet error:', error);
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to add money to wallet' };
    }
  },

  // Get wallet transactions
  getWalletTransactions: async () => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await axiosInstance.get('/user/wallet/transactions');
      return response.data;
    } catch (error) {
      console.error('Get wallet transactions error:', error);
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to get wallet transactions' };
    }
  },

  addMoneyWithCodePass: async (data) => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await axiosInstance.post('/user/add-money-with-code-pass', data);
      return response.data;
    } catch (error) {
      console.error('Add money with code pass error:', error);
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to add money with code and pass' };
    }
  },

  // Google Sign-In (register if user doesn't exist)
  googleLogin: async (idToken) => {
    try {
      const response = await axiosInstance.post('/user/google/login', { idToken });
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: 'Failed to login with Google' }
      );
    }
  }
};

export const addToWishlist = async (productId, variantId = null) => {
  try {
    // Check if user is logged in
    const token = checkUserAccess();
    if (isTokenExpired(token)) {
      throw new Error('Session expired. Please login again.');
    }

    // Prepare robust payload with both IDs
    const payload = {
      productId: productId
    };
    if (variantId) payload.variantId = variantId;

    const response = await axiosInstance.post(`/user/wishlist/${productId}`, payload);
    return response.data;
  } catch (error) {
    // Gracefully handle "Already in wishlist" errors which often return 400
    const errorMsg = error.response?.data?.message || error.message || "";
    if (error.response?.status === 400 && 
       (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('exists'))) {
       return { success: true, message: "Handled duplicate" };
    }

    if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
      throw { message: error.message };
    }
    throw error.response?.data || { message: 'Failed to add to wishlist' };
  }
}

export const removeFromWishlist = async (productId, variantId = null) => {
  try {
    // Check if user is logged in
    const token = checkUserAccess();
    if (isTokenExpired(token)) {
      throw new Error('Session expired. Please login again.');
    }

    const response = await axiosInstance.delete(`/user/wishlist/${productId}`, {
      params: { variantId }
    });
    return response.data;
  } catch (error) {
    if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
      throw { message: error.message };
    }
    throw error.response?.data || { message: 'Failed to remove from wishlist' };
  }
}

let _getWishlistPromise = null;
export const getWishlist = async () => {
  if (_getWishlistPromise) return _getWishlistPromise;

  _getWishlistPromise = (async () => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }
      const response = await axiosInstance.get('/user/wishlist');
      return response.data;
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to fetch wishlist' };
    } finally {
      setTimeout(() => { _getWishlistPromise = null; }, 1000);
    }
  })();

  return _getWishlistPromise;
}

export const addToSaveForLater = async (productId, variantId = null) => {
  try {
    const token = checkUserAccess();
    if (isTokenExpired(token)) {
      throw new Error('Session expired. Please login again.');
    }

    const payload = { productId };
    if (variantId) payload.variantId = variantId;

    const response = await axiosInstance.post(`/user/saveforlater/${productId}`, payload);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || "";
    if (error.response?.status === 400 && 
       (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('exists'))) {
       return { success: true, message: "Handled duplicate" };
    }
    if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
      throw { message: error.message };
    }
    throw error.response?.data || { message: 'Failed to add to Save for Later' };
  }
}

export const removeFromSaveForLater = async (productId, variantId = null) => {
  try {
    const token = checkUserAccess();
    if (isTokenExpired(token)) {
      throw new Error('Session expired. Please login again.');
    }

    const response = await axiosInstance.delete(`/user/saveforlater/${productId}`, {
      params: { variantId }
    });
    return response.data;
  } catch (error) {
    if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
      throw { message: error.message };
    }
    throw error.response?.data || { message: 'Failed to remove from Save for Later' };
  }
}

let _getSaveForLaterPromise = null;
export const getSaveForLater = async () => {
  if (_getSaveForLaterPromise) return _getSaveForLaterPromise;

  _getSaveForLaterPromise = (async () => {
    try {
      const token = checkUserAccess();
      if (isTokenExpired(token)) {
        throw new Error('Session expired. Please login again.');
      }
      const response = await axiosInstance.get('/user/saveforlater');
      return response.data;
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.' || error.message === 'Session expired. Please login again.') {
        throw { message: error.message };
      }
      throw error.response?.data || { message: 'Failed to fetch Save for Later items' };
    } finally {
      setTimeout(() => { _getSaveForLaterPromise = null; }, 1000);
    }
  })();

  return _getSaveForLaterPromise;
}

// //addMoneyWithCodePass
// export const addMoneyWithCodePass = async (code, pass, amount) => {
//   try {
//     const response = await axiosInstance.post('/user/wallet/add-money', { code, pass, amount });
//     return response.data;
//   } catch (error) {
//     throw error.response?.data || { message: 'Failed to add money with code and pass' };
//   }
// }
