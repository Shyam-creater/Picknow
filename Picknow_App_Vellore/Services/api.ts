export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://backmern.picknow.in/api').replace('/api', '');
export const API_BASE_URL = `${BASE_URL}/api`;

const handleResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message = (typeof data === 'object' && data !== null) ? (data.message || data.error) : data;
    throw new Error(message || 'Something went wrong');
  }
  return data;
};

export const authService = {
  register: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  login: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  verifyOtp: async (otp: string, activationToken: string) => {
    const response = await fetch(`${API_BASE_URL}/user/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activationToken}`, // 🔥 IMPORTANT
      },
      body: JSON.stringify({ otp }), // only otp in body
    });

    return handleResponse(response);
  },
  resendOtp: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/user/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },
  updateProfile: async (data: any, token: string) => {
    const response = await fetch(`${API_BASE_URL}/user/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  getProfile: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
  forgotPassword: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/user/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  deleteAccount: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/user/profile/delete`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  resetPassword: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/user/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getCart: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/cart/get`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
  addToCart: async (data: any, token: string) => {
    const response = await fetch(`${API_BASE_URL}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  updateCartItem: async (data: any, token: string) => {
    const response = await fetch(`${API_BASE_URL}/cart/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  removeFromCart: async (params: any, token: string) => {
    // Filter out undefined, null, or invalid values
    const cleanParams = Object.entries(params).reduce((acc: any, [key, value]) => {
      if (value !== undefined && value !== null && value !== 'undefined' && value !== 'null') {
        acc[key] = value;
      }
      return acc;
    }, {});
    const query = new URLSearchParams(cleanParams).toString();
    const response = await fetch(`${API_BASE_URL}/cart/remove?${query}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
  getWishlist: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/user/wishlist`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
  addToWishlist: async (productId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/user/wishlist/${productId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
  removeFromWishlist: async (params: { productId: string; variantId?: string }, token: string) => {
    const variantStr = params.variantId && params.variantId !== 'undefined' && params.variantId !== 'null'
      ? `?variantId=${params.variantId}`
      : '';
    const response = await fetch(`${API_BASE_URL}/user/wishlist/${params.productId}${variantStr}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
  getUserOrders: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/order/orders`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
  getOrderById: async (id: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/order/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
  cancelOrder: async (id: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/order/${id}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
  checkBalance: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/user/balance`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
  changePassword: async (data: any, token: string) => {
    const response = await fetch(`${API_BASE_URL}/user/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  getAddresses: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/user/addresses`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
  addAddress: async (data: any, token: string) => {
    const response = await fetch(`${API_BASE_URL}/user/address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  updateAddress: async (addressId: string, data: any, token: string) => {
    const response = await fetch(`${API_BASE_URL}/user/address/${addressId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  deleteAddress: async (addressId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/user/address/${addressId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
  setDefaultAddress: async (addressId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/user/address/${addressId}/default`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
  getTransactions: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/user/wallet/transactions`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
  getDeliveryData: async () => {
    const response = await fetch(`${API_BASE_URL}/delivery`, {
      method: 'GET',
    });
    return handleResponse(response);
  },
  addMoneyWithCodePass: async (data: { code: string; pass: string; amount: string }, token: string) => {
    const response = await fetch(`${API_BASE_URL}/user/add-money-with-code-pass`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  createRazorpayOrder: async (amount: number, token: string) => {
    const response = await fetch(`${API_BASE_URL}/createorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });
    return handleResponse(response);
  },
  verifyPayment: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/paymentVerification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  placeOrder: async (data: any, token: string) => {
    // If productId is provided, it's a direct order. Otherwise, it's a cart order.
    const isCartOrder = !data.productId && (!data.items || data.items.length === 0 || Array.isArray(data.items));
    const endpoint = isCartOrder ? '/order/cart' : '/order/direct';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  returnOrderItem: async (orderId: string, data: { productId: string; variantId?: string; reason: string }, token: string) => {
    const response = await fetch(`${API_BASE_URL}/order/${orderId}/return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  getReturnProductsByOrderId: async (orderId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/order/${orderId}/returns`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
  downloadInvoice: async (orderId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/order/${orderId}/invoice`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  },
  getSaveForLater: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/user/saveforlater`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(response);
  },
  addToSaveForLater: async (productId: string, token: string, variantId?: string) => {
    const response = await fetch(`${API_BASE_URL}/user/saveforlater/${productId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ variantId })
    });
    return handleResponse(response);
  },
  removeFromSaveForLater: async (productId: string, token: string, variantId?: string) => {
    const variantStr = variantId && variantId !== 'undefined' && variantId !== 'null'
      ? `?variantId=${variantId}`
      : '';
    const response = await fetch(`${API_BASE_URL}/user/saveforlater/${productId}${variantStr}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(response);
  },
};

export const categoryService = {
  getAllCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/category/all`);
    return handleResponse(response);
  },
  getProductsByCategory: async (categoryName: string) => {
    const response = await fetch(`${API_BASE_URL}/category/${categoryName}/products`);
    return handleResponse(response);
  }
};

export const productService = {
  getLatestProducts: async () => {
    const response = await fetch(`${API_BASE_URL}/products/latest`);
    return handleResponse(response);
  },
  getAllProducts: async (page = 1, limit = 20) => {
    const response = await fetch(`${API_BASE_URL}/products?page=${page}&limit=${limit}`);
    return handleResponse(response);
  },
  getOffers: async () => {
    const response = await fetch(`${API_BASE_URL}/products/offer`);
    return handleResponse(response);
  },
  getProductById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/product/${id}`);
    return handleResponse(response);
  },
  getReviews: async (productId: string) => {
    const response = await fetch(`${API_BASE_URL}/product/${productId}/reviews`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    return handleResponse(response);
  },
  addReview: async (productId: string, token: string, reviewData: { rating: number; review: string }) => {
    const response = await fetch(`${API_BASE_URL}/product/${productId}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(reviewData)
    });
    return handleResponse(response);
  },
  addReviewForm: async (productId: string, token: string, formData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/product/${productId}/reviews`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
        // Do NOT set Content-Type header when using FormData; the browser/environment sets it automatically with the boundary
      },
      body: formData
    });
    return handleResponse(response);
  },
  getRelatedProducts: async (productId: string) => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/related`);
    return handleResponse(response);
  },
  checkReviewEligibility: async (productId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/product/${productId}/canreview`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    return handleResponse(response);
  }
};

export const comboService = {
  getAllCombos: async () => {
    const response = await fetch(`${API_BASE_URL}/combo/all`);
    return handleResponse(response);
  },
};

export const dealService = {
  getAllDeals: async () => {
    const response = await fetch(`${API_BASE_URL}/all/deals`);
    return handleResponse(response);
  },
};

export const brandService = {
  getAllBrands: async () => {
    const response = await fetch(`${API_BASE_URL}/brand/all`);
    return handleResponse(response);
  },
  getProductsByBrand: async (brandName: string) => {
    const response = await fetch(`${API_BASE_URL}/product/brand/${brandName}`);
    return handleResponse(response);
  },
};

export const blogService = {
  getAllBlogs: async () => {
    const response = await fetch(`${API_BASE_URL}/blog/all`);
    return handleResponse(response);
  },
};

export const productVariantService = {
  getVariantsByProductId: async (productId: string) => {
    const response = await fetch(`${API_BASE_URL}/variant/product/${productId}`);
    return handleResponse(response);
  }
};

export const searchService = {
  search: async (query: string, type = 'all', page = 1, limit = 10) => {
    const params = new URLSearchParams({ query, type, page: String(page), limit: String(limit) });
    const response = await fetch(`${API_BASE_URL}/search?${params}`);
    return handleResponse(response);
  },
  getSuggestions: async (query: string, limit = 6) => {
    const params = new URLSearchParams({ query, limit: String(limit) });
    const response = await fetch(`${API_BASE_URL}/search/suggestions?${params}`);
    return handleResponse(response);
  },
};

// export const cartService = {
//   getCart: async (token: string) => {
//     const response = await fetch(`${API_BASE_URL}/cart/get`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//     });
//     return handleResponse(response);
//   },
//   addToCart: async (token: string, data: any) => {
//     const response = await fetch(`${API_BASE_URL}/cart/add`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(data),
//     });
//     return handleResponse(response);
//   },
//   updateCartItem: async (token: string, data: any) => {
//     const response = await fetch(`${API_BASE_URL}/cart/update`, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(data),
//     });
//     return handleResponse(response);
//   },
//   removeFromCart: async (token: string, searchParams: string) => {
//     const response = await fetch(`${API_BASE_URL}/cart/remove?${searchParams}`, {
//       method: 'DELETE',
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });
//     return handleResponse(response);
//   },
// };
// export const orderService = {
//   getUserOrders: async (token: string) => {
//     const response = await fetch(`${API_BASE_URL}/orders`, {
//       method: 'GET',
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });
//     return handleResponse(response);
//   }
// };
