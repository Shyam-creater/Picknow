import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { vendorApi } from '../../api/vendorApi';

// Async thunk for fetching vendors
export const fetchVendors = createAsyncThunk(
  'vendors/fetchVendors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await vendorApi.getAllVendors();
      return response.vendors;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Async thunk for adding a vendor
export const addVendor = createAsyncThunk(
  'vendors/addVendor',
  async (vendorData, { rejectWithValue }) => {
    try {
      const response = await vendorApi.createVendor(vendorData);
      return response.vendor;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Async thunk for updating a vendor
export const updateVendor = createAsyncThunk(
  'vendors/updateVendor',
  async ({ id, vendorData }, { rejectWithValue }) => {
    try {
      const response = await vendorApi.updateVendor(id, vendorData);
      return response.vendor;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Async thunk for deleting a vendor
export const deleteVendor = createAsyncThunk(
  'vendors/deleteVendor',
  async (id, { rejectWithValue }) => {
    try {
      await vendorApi.deleteVendor(id);
      return id;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Async thunk for updating vendor status
export const updateVendorStatus = createAsyncThunk(
  'vendors/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await vendorApi.updateVendorStatus(id, status);
      return response.vendor;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Async thunk for updating vendor KYC status
export const updateVendorKYC = createAsyncThunk(
  'vendors/updateVendorKYC',
  async ({ id, kycStatus }, { rejectWithValue }) => {
    try {
      const response = await vendorApi.updateVendorKYC(id, kycStatus);
      return response.vendor;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const vendorSlice = createSlice({
  name: 'vendors',
  initialState: {
    vendors: [],
    loading: false,
    error: null,
    selectedVendor: null,
  },
  reducers: {
    setSelectedVendor: (state, action) => {
      state.selectedVendor = action.payload;
    },
    clearSelectedVendor: (state) => {
      state.selectedVendor = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch vendors
      .addCase(fetchVendors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.vendors = action.payload;
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add vendor
      .addCase(addVendor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addVendor.fulfilled, (state, action) => {
        state.loading = false;
        state.vendors.push(action.payload);
      })
      .addCase(addVendor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update vendor
      .addCase(updateVendor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVendor.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.vendors.findIndex(vendor => vendor._id === action.payload._id);
        if (index !== -1) {
          state.vendors[index] = action.payload;
        }
      })
      .addCase(updateVendor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete vendor
      .addCase(deleteVendor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteVendor.fulfilled, (state, action) => {
        state.loading = false;
        state.vendors = state.vendors.filter(vendor => vendor._id !== action.payload);
      })
      .addCase(deleteVendor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update vendor status
      .addCase(updateVendorStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVendorStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.vendors.findIndex(vendor => vendor._id === action.payload._id);
        if (index !== -1) {
          state.vendors[index] = action.payload;
        }
      })
      .addCase(updateVendorStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update vendor KYC status
      .addCase(updateVendorKYC.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVendorKYC.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.vendors.findIndex(vendor => vendor._id === action.payload._id);
        if (index !== -1) {
          state.vendors[index] = action.payload;
        }
      })
      .addCase(updateVendorKYC.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedVendor, clearSelectedVendor, clearError } = vendorSlice.actions;
export default vendorSlice.reducer; 