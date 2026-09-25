import axiosInstance from "./axiosInstance";

// Calculate income statistics from orders
const calculateIncomeStats = (orders) => {
  const now = new Date();
  
  console.log('All orders:', orders); // Debug log
  
  // Filter completed orders (both confirmed and delivered)
  const completedOrders = orders.filter(order => {
    console.log('Order status:', order.orderStatus); // Debug log
    return order.orderStatus === 'CONFIRMED' || order.orderStatus === 'DELIVERED';
  });
  
  console.log('Completed orders:', completedOrders); // Debug log
  
  // Today's Income (completed orders)
  const dayIncome = completedOrders
    .filter(order => new Date(order.createdAt).toDateString() === now.toDateString())
    .reduce((sum, order) => {
      console.log('Order amount:', order.finalAmount); // Debug log
      return sum + (Number(order.finalAmount) || 0);
    }, 0);

  // Weekly Income (last 7 days, completed orders)
  const weekIncome = completedOrders
    .filter(order => {
      const orderDate = new Date(order.createdAt);
      const diffTime = Math.abs(now - orderDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    })
    .reduce((sum, order) => sum + (Number(order.finalAmount) || 0), 0);

  // Monthly Income (current month, completed orders)
  const monthIncome = completedOrders
    .filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() === now.getMonth() && 
             orderDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, order) => sum + (Number(order.finalAmount) || 0), 0);

  // Yearly Income (current year, completed orders)
  const yearIncome = completedOrders
    .filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, order) => sum + (Number(order.finalAmount) || 0), 0);

  const stats = {
    day: dayIncome,
    week: weekIncome,
    month: monthIncome,
    year: yearIncome
  };
  
  console.log('Income stats:', stats); // Debug log
  return stats;
};

// Get income statistics
const fetchIncomeStats = async () => {
  try {
    const response = await axiosInstance.get('/dashboard/income-stats');
    if (response.data.success) {
      return response.data.incomeStats;
    }
    return {
      day: 0,
      dayShipping: 0,
      week: 0,
      weekShipping: 0,
      month: 0,
      monthShipping: 0,
      year: 0,
      yearShipping: 0
    };
  } catch (error) {
    console.error('Error fetching income stats:', error);
    return {
      day: 0,
      dayShipping: 0,
      week: 0,
      weekShipping: 0,
      month: 0,
      monthShipping: 0,
      year: 0,
      yearShipping: 0
    };
  }
};

// Get total orders count
export const fetchOrders = async () => {
  try {
    const [ordersResponse, incomeStats] = await Promise.all([
      axiosInstance.get('/order/admin/orders'),
      fetchIncomeStats()
    ]);

    console.log('Orders API Response:', ordersResponse.data);
    console.log('Income Stats:', incomeStats);

    if (ordersResponse.data.success) {
      return { 
        ...ordersResponse.data, 
        incomeStats 
      };
    }
    return { 
      orders: [], 
      incomeStats: {
        day: 0,
        dayShipping: 0,
        week: 0,
        weekShipping: 0,
        month: 0,
        monthShipping: 0,
        year: 0,
        yearShipping: 0
      }
    };
  } catch (error) {
    console.error('Error fetching orders:', error.response?.data || error.message);
    return { 
      orders: [], 
      incomeStats: {
        day: 0,
        dayShipping: 0,
        week: 0,
        weekShipping: 0,
        month: 0,
        monthShipping: 0,
        year: 0,
        yearShipping: 0
      }
    };
  }
};

// Get total products count
export const fetchProducts = async () => {
  try {
    const response = await axiosInstance.get('/admin/product/all');
    console.log('Products API Response:', response.data);
    if (response.data.success) {
      return response.data;
    }
    return { products: [] };
  } catch (error) {
    console.error('Error fetching products:', error.response?.data || error.message);
    return { products: [] };
  }
};

// Get total vendors count
export const fetchVendors = async () => {
  try {
    const response = await axiosInstance.get('/vendor/admin/all');
    console.log('Vendors API Response:', response.data);
    if (response.data) {
      return { vendors: response.data };
    }
    return { vendors: [] };
  } catch (error) {
    console.error('Error fetching vendors:', error.response?.data || error.message);
    return { vendors: [] };
  }
};

// Get total categories count
export const fetchCategories = async () => {
  try {
    const response = await axiosInstance.get('/admin/categories');
    console.log('Categories API Response:', response.data);
    if (response.data.success) {
      return response.data;
    }
    return { categories: [] };
  } catch (error) {
    console.error('Error fetching categories:', error.response?.data || error.message);
    return { categories: [] };
  }
};

// Fetch all dashboard data at once
export const fetchDashboardData = async () => {
  try {
    console.log('Fetching dashboard data...');
    const [ordersData, productsData, vendorsData, categoriesData] = await Promise.all([
      fetchOrders(),
      fetchProducts(),
      fetchVendors(),
      fetchCategories()
    ]);

    const dashboardData = {
      orders: ordersData.orders || [],
      products: productsData.products || [],
      vendors: vendorsData.vendors || [],
      categories: categoriesData.categories || []
    };

    console.log('Dashboard Data:', dashboardData);
    return dashboardData;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      orders: [],
      products: [],
      vendors: [],
      categories: []
    };
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status, trackingNumber = null) => {
  try {
    const requestBody = { orderStatus: status };
    if (trackingNumber) {
      requestBody.trackingNumber = trackingNumber;
    }
    
    const response = await axiosInstance.put(`/order/status/${orderId}`, requestBody);
    console.log('Update Order Status Response:', response.data);
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || 'Failed to update order status');
  } catch (error) {
    console.error('Error updating order status:', error.response?.data || error.message);
    throw error;
  }
};