import axiosInstance from './axiosInstance';

const checkAdminAccess = () => {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');
  const isLoggedIn = localStorage.getItem('isLoggedIn');

  if (!token || !isLoggedIn || userType !== 'admin') {
    throw new Error('Unauthorized access. Please login as admin.');
  }
};

const dataURLtoFile = (dataUrl, filename) => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export const vendorApi = {
  // Get all vendors
  getAllVendors: async () => {
    try {
      checkAdminAccess();
      const response = await axiosInstance.get('/vendor');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch vendors' };
    }
  },

  // Get single vendor by ID
  getVendorById: async (id) => {
    try {
      checkAdminAccess();
      const response = await axiosInstance.get(`/vendor/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch vendor' };
    }
  },

  // Create new vendor
  createVendor: async (vendorData) => {
    try {
      checkAdminAccess();
      const formData = new FormData();

      // Add basic vendor data
      Object.keys(vendorData).forEach(key => {
        if (key !== 'image' && key !== 'confirmPassword') {
          formData.append(key, vendorData[key]);
        }
      });

      // Handle image upload
      if (vendorData.image) {
        if (typeof vendorData.image === 'string' && vendorData.image.startsWith('data:image')) {
          const file = dataURLtoFile(vendorData.image, `vendor-${Date.now()}.jpg`);
          formData.append('image', file);
        } else if (vendorData.image instanceof File) {
          formData.append('image', vendorData.image);
        }
      }

      const response = await axiosInstance.post('/vendor/register/complete', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create vendor' };
    }
  },

  // Update vendor
  updateVendor: async (id, vendorData) => {
    try {
      checkAdminAccess();
      const formData = new FormData();

      // Add basic vendor data
      Object.keys(vendorData).forEach(key => {
        if (key !== 'image' && key !== 'confirmPassword') {
          formData.append(key, vendorData[key]);
        }
      });

      // Handle image upload
      if (vendorData.image) {
        if (typeof vendorData.image === 'string' && vendorData.image.startsWith('data:image')) {
          const file = dataURLtoFile(vendorData.image, `vendor-${Date.now()}.jpg`);
          formData.append('image', file);
        } else if (vendorData.image instanceof File) {
          formData.append('image', vendorData.image);
        }
      }

      const response = await axiosInstance.patch(`/vendor/${id}/status`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update vendor' };
    }
  },

  // Delete vendor
  deleteVendor: async (id) => {
    try {
      checkAdminAccess();
      const response = await axiosInstance.delete(`/vendor/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete vendor' };
    }
  },

  // Vendor login
  loginVendor: (credentials) => {
    return axiosInstance.post('/vendors/login', credentials);
  },

  // Update vendor status
  updateVendorStatus: async (id, status) => {
    try {
      checkAdminAccess();
      const response = await axiosInstance.patch(`/vendor/${id}/status`, { 
        ...(status.adminApprovalStatus && {
          adminApprovalStatus: status.adminApprovalStatus,
          adminMessage: status.adminMessage
        }),
        ...(status.vendorStatus && {
          status: status.vendorStatus
        })
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update vendor status' };
    }
  },

  // Update vendor KYC status
  updateVendorKYC: async (id, kycStatus) => {
    try {
      checkAdminAccess();
      const response = await axiosInstance.patch(`/vendor/${id}/status`, { 
        adminApprovalStatus: kycStatus 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update vendor KYC status' };
    }
  },

  // Get vendor statistics
  getVendorStats: (id) => {
    return axiosInstance.get(`/vendors/${id}/stats`);
  },

  // Upload vendor documents
  uploadDocuments: async (id, documents) => {
    try {
      checkAdminAccess();
      const formData = new FormData();
      Object.keys(documents).forEach(key => {
        if (documents[key] instanceof File) {
          formData.append(key, documents[key]);
        }
      });
      const response = await axiosInstance.post(`/vendors/${id}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to upload documents' };
    }
  },

  // Get document URL
  getDocumentUrl: async (documentId) => {
    try {
      checkAdminAccess();
      const response = await axiosInstance.get(`/documents/${documentId}/url`);
      return response.data.url;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get document URL' };
    }
  },

  // Get vendor documents
  getDocuments: (id) => {
    return axiosInstance.get(`/vendors/${id}/documents`);
  },

  // Update vendor bank details
  updateBankDetails: (id, bankDetails) => {
    return axiosInstance.patch(`/vendors/${id}/bank-details`, bankDetails);
  },

  // Get vendor products
  getVendorProducts: (id) => {
    return axiosInstance.get(`/vendors/${id}/products`);
  },

  // Get vendor orders
  getVendorOrders: (id, params) => {
    return axiosInstance.get(`/vendors/${id}/orders`, { params });
  }
}; 
