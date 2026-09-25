import axiosInstance from './axiosInstance';

export const cartApi = {
  _getCartPromise: null,
  getCart: async () => {
    // Return existing promise if a request is already in flight
    if (cartApi._getCartPromise) return cartApi._getCartPromise;

    cartApi._getCartPromise = (async () => {
      try {
        const response = await axiosInstance.get('cart/get');
        return response.data;
      } catch (error) {
        console.error('Cart API error:', error.response || error);
        throw error.response?.data || { message: 'Failed to fetch cart' };
      } finally {
        // Clear promise after short delay to allow fresh fetches later
        setTimeout(() => { cartApi._getCartPromise = null; }, 1000);
      }
    })();

    return cartApi._getCartPromise;
  },
  checkbalance: async () => {
    try {
      const response = await axiosInstance.get('user/balance');
      return response.data;
    } catch (error) {
      console.error('Cart API error:', error.response || error);
      throw error.response?.data || { message: 'Failed to fetch cart' };
    }
  },
  addToCart: async (cartData) => {
    try {
      // Validate inputs
      if (!cartData.productId || !cartData.quantity || cartData.quantity < 1) {
        throw { message: 'Invalid product ID or quantity' };
      }

      const response = await axiosInstance.post('cart/add', {
        productId: cartData.productId,
        quantity: parseInt(cartData.quantity),  // Ensure quantity is a number
        variantId: cartData.variantId,
        variantType: cartData.variantType,
        variantValue: cartData.variantValue,
        price: cartData.price,
        comboName: cartData.comboName,
        comboImage: cartData.comboImage
      });
      return response.data;

    } catch (error) {
      if (error.response?.status === 401) {
        throw { message: 'Unauthorized access. Please login.' };
      }
      throw error.response?.data || error;
    }
  },

  updateQuantity: async (identifier, quantity, isVariantId = false, itemData = null) => {
    try {
      // If identifier is a variantId, use it directly; otherwise, treat it as a productId
      let payload;
      if (isVariantId) {
        payload = { variantId: identifier, quantity };
      } else {
        // For productId, we need to include variantType and variantValue if available
        payload = { productId: identifier, quantity };
        if (itemData) {
          payload.variantType = itemData.variantType;
          payload.variantValue = itemData.variantValue;
        }
      }

      const response = await axiosInstance.put('cart/update', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update quantity' };
    }
  },

  removeItem: async (identifier, isVariantId = false) => {
    try {
      // Correctly handle parameters for both variant and product removal
      const params = isVariantId
        ? { variantId: identifier }
        : { productId: identifier };

      const response = await axiosInstance.delete('cart/remove', {
        params
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw { message: 'Unauthorized access. Please login.' };
      }
      throw error.response?.data || { message: 'Failed to remove item' };
    }
  },

  clearCart: async () => {
    try {
      const response = await axiosInstance.delete('cart/clear');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to clear cart' };
    }
  },
  CreateRazorpay: async (data) => {
    try {
      const response = await axiosInstance.post('createorder', data);
      return response.data;
    } catch (error) {
      console.error('Cart API error:', error.response || error);
      throw error.response?.data || { message: 'Failed to fetch cart' };
    }
  },
  VerifyPayment: async (data) => {
    try {
      const response = await axiosInstance.post('paymentVerification', data);
      return response.data;
    } catch (error) {
      console.error('Cart API error:', error.response || error);
      throw error.response?.data || { message: 'Failed to fetch cart' };
    }
  },
  PlaceOrder: async (data) => {
    try {
      const response = await axiosInstance.post('order/cart', data);
      return response.data;
    } catch (error) {
      console.error('Cart API error:', error.response || error);
      throw error.response?.data || { message: 'Failed to fetch cart' };
    }
  }
};
