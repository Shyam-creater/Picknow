import { Box, Grid, Paper, Typography, useTheme, Tab, Tabs, Button, IconButton, Menu, MenuItem, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar, LinearProgress, CircularProgress, Card, CardContent, Stack, Chip, Tooltip, Link, Select, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel } from '@mui/material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { useState, useEffect } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import PieChartIcon from '@mui/icons-material/PieChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import Badge from '@mui/material/Badge';
import DateRangeIcon from '@mui/icons-material/DateRange';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GetAppIcon from '@mui/icons-material/GetApp';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import GroupIcon from '@mui/icons-material/Group';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { UserAvatar } from '../components/UserAvatar';
import { SAMPLE_IMAGES, SAMPLE_USERS } from '../utils/sampleData';
import { useNavigate } from 'react-router-dom';
import CategoryIcon from '@mui/icons-material/Category';
import PeopleIcon from '@mui/icons-material/People';
import { fetchOrders } from '../api/dashboardApi';
import { categoryApi } from '../api/categoryApi';
import { vendorApi } from '../api/vendorApi'; 
import { productApi } from '../api/productApi';
import PersonIcon from '@mui/icons-material/Person';
import { userApi } from '../api/userApi';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const Dashboard = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('today');
  const [anchorEl, setAnchorEl] = useState(null);
  const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [statCardAnchorEl, setStatCardAnchorEl] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [vendorCount, setVendorCount] = useState(0);
  const [users, setUsers] = useState([]);
  const [dashboardView, setDashboardView] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date()
  });
  const [incomeStats, setIncomeStats] = useState({
    day: 0,
    week: 0,
    month: 0,
    year: 0
  });
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active'
  });
  const [ordersRes, setOrdersRes] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  // Add chart data states
  const [salesData, setSalesData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Sales 2024',
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      borderColor: theme.palette.primary.main,
      backgroundColor: `${theme.palette.primary.main}15`,
      tension: 0.4,
    }]
  });

  const [orderStatusData, setOrderStatusData] = useState({
    labels: ['ORDER PLACED', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'],
    datasets: [{
      data: [15, 25, 30, 20, 10],
      backgroundColor: [
        theme.palette.warning.main,
        theme.palette.info.main,
        theme.palette.primary.main,
        theme.palette.success.main,
        theme.palette.error.main,
      ],
    }]
  });

  const [revenueByCategoryData, setRevenueByCategoryData] = useState({
    labels: ['Electronics', 'Fashion', 'Home', 'Books', 'Others'],
    datasets: [{
      label: 'Revenue',
      data: [450000, 350000, 300000, 250000, 200000],
      backgroundColor: theme.palette.primary.main,
    }]
  });

  const [monthlyPerformanceData, setMonthlyPerformanceData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Orders',
      data: [150, 180, 220, 280, 250, 300],
      backgroundColor: theme.palette.primary.main,
    }, {
      label: 'Revenue',
      data: [250000, 300000, 350000, 400000, 380000, 450000],
      backgroundColor: theme.palette.secondary.main,
    }]
  });

  const [customerGrowthData, setCustomerGrowthData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'New Customers',
      data: [50, 65, 80, 95, 110, 130],
      borderColor: theme.palette.success.main,
      backgroundColor: `${theme.palette.success.main}15`,
      tension: 0.4,
    }]
  });

  // Add doughnut chart specific options
  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#333',
        bodyColor: '#666',
        bodyFont: {
          size: 13,
        },
        borderColor: '#e0e0e0',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return ` ${label}: ${value} orders (${percentage}%)`;
          }
        }
      }
    }
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
        },
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#333',
        bodyColor: '#666',
        bodyFont: {
          size: 13,
        },
        borderColor: '#e0e0e0',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return ` ${label}: ${value} orders (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f0f0f0',
        },
        ticks: {
          callback: (value) => formatINR(value),
          font: {
            size: 12,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
        },
      },
    },
  };

  // Add new chart components
  const SalesTrendChart = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Sales Trend
          </Typography>
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        </Box>
        <Box sx={{ height: 300 }}>
          <Line data={salesData} options={chartOptions} />
        </Box>
      </CardContent>
    </Card>
  );

  const OrderStatusChart = () => {
    const [orderStatusFilter, setOrderStatusFilter] = useState('overall');
    const [orderStatusAnchorEl, setOrderStatusAnchorEl] = useState(null);

    const handleFilterClick = (event) => {
      setOrderStatusAnchorEl(event.currentTarget);
    };

    const handleFilterClose = () => {
      setOrderStatusAnchorEl(null);
    };

    const handleFilterChange = (filter) => {
      setOrderStatusFilter(filter);
      handleFilterClose();
      // Update chart data based on selected filter
      if (ordersRes?.orders) {
        const filteredOrders = ordersRes.orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          const now = new Date();
          switch (filter) {
            case 'today':
              return orderDate.toDateString() === now.toDateString();
            case 'week':
              const weekAgo = new Date(now.setDate(now.getDate() - 7));
              return orderDate >= weekAgo;
            case 'month':
              const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
              return orderDate >= monthAgo;
            case 'year':
              const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
              return orderDate >= yearAgo;
            default:
              return true; // 'overall' - show all orders
          }
        });

        // Initialize status counts
        const statusCounts = {
          'ORDER PLACED': 0,
          'CONFIRMED': 0,
          'DISPATCHED': 0,
          'DELIVERED': 0,
          'CANCELLED': 0
        };

        // Count filtered orders by status
        filteredOrders.forEach(order => {
          const status = (order.orderStatus || 'ORDER PLACED').toUpperCase();
          if (status in statusCounts) {
            statusCounts[status]++;
          } else {
            statusCounts['ORDER PLACED']++;
          }
        });

        // Update chart data
        setOrderStatusData({
          labels: [
            'Order Placed',
            'Confirmed',
            'Dispatched',
            'Delivered',
            'Cancelled'
          ],
          datasets: [{
            data: [
              statusCounts['ORDER PLACED'],
              statusCounts['CONFIRMED'],
              statusCounts['DISPATCHED'],
              statusCounts['DELIVERED'],
              statusCounts['CANCELLED']
            ],
            backgroundColor: [
              theme.palette.warning.main,
              theme.palette.info.main,
              theme.palette.primary.main,
              theme.palette.success.main,
              theme.palette.error.main,
            ],
          }]
        });
      }
    };

    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            flexWrap: 'nowrap'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Order Status Distribution
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  backgroundColor: 'action.hover',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: '0.75rem'
                }}
              >
                {orderStatusFilter.charAt(0).toUpperCase() + orderStatusFilter.slice(1)}
              </Typography>
            </Box>
            <Box sx={{ position: 'relative' }}>
              <IconButton 
                size="small"
                onClick={handleFilterClick}
                sx={{
                  backgroundColor: 'action.hover',
                  '&:hover': {
                    backgroundColor: 'action.selected'
                  }
                }}
              >
                <FilterListIcon fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={orderStatusAnchorEl}
                open={Boolean(orderStatusAnchorEl)}
                onClose={handleFilterClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    mt: 1,
                    minWidth: 180,
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                    '& .MuiMenuItem-root': {
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      fontSize: '0.875rem',
                      margin: '2px 8px',
                      '&:first-of-type': {
                        mt: 1
                      },
                      '&:last-of-type': {
                        mb: 1
                      },
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'primary.lighter',
                        color: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'primary.lighter'
                        }
                      }
                    }
                  }
                }}
              >
                <MenuItem 
                  onClick={() => handleFilterChange('overall')}
                  selected={orderStatusFilter === 'overall'}
                >
                  Overall
                </MenuItem>
                <MenuItem 
                  onClick={() => handleFilterChange('today')}
                  selected={orderStatusFilter === 'today'}
                >
                  Today
                </MenuItem>
                <MenuItem 
                  onClick={() => handleFilterChange('week')}
                  selected={orderStatusFilter === 'week'}
                >
                  This Week
                </MenuItem>
                <MenuItem 
                  onClick={() => handleFilterChange('month')}
                  selected={orderStatusFilter === 'month'}
                >
                  This Month
                </MenuItem>
                <MenuItem 
                  onClick={() => handleFilterChange('year')}
                  selected={orderStatusFilter === 'year'}
                >
                  This Year
                </MenuItem>
              </Menu>
            </Box>
          </Box>
          <Box sx={{ height: 300, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Doughnut 
              data={orderStatusData} 
              options={doughnutChartOptions} 
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  const RevenueByCategoryChart = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Revenue by Category
          </Typography>
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        </Box>
        <Box sx={{ height: 300 }}>
          <Bar data={revenueByCategoryData} options={chartOptions} />
        </Box>
      </CardContent>
    </Card>
  );

  const MonthlyPerformanceChart = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Monthly Performance
          </Typography>
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        </Box>
        <Box sx={{ height: 300 }}>
          <Bar data={monthlyPerformanceData} options={chartOptions} />
        </Box>
      </CardContent>
    </Card>
  );

  const CustomerGrowthChart = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Customer Growth
          </Typography>
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        </Box>
        <Box sx={{ height: 300 }}>
          <Line data={customerGrowthData} options={chartOptions} />
        </Box>
      </CardContent>
    </Card>
  );

  // Add fetchUsers function
  const fetchUsers = async () => {
    try {
      const response = await userApi.getAllUsers();
      if (response.success) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      enqueueSnackbar(error.message || 'Failed to fetch users', { variant: 'error' });
    }
  };

  // Generate notifications from orders
  const generateNotificationsFromOrders = (orders) => {
    if (!orders || !Array.isArray(orders)) return [];
    
    const orderNotifications = orders
      .filter(order => order.orderStatus === 'ORDER PLACED')
      .slice(0, 10) // Show only latest 10 new orders
      .map(order => ({
        id: order._id,
        type: 'order',
        title: 'New Order Received',
        message: `Order #${order._id.slice(-6)} from ${order.shippingAddress?.name || 'Customer'}`,
        time: getTimeAgo(order.createdAt),
        read: false,
        priority: 'high',
        orderId: order._id,
        orderAmount: order.finalAmount,
        orderStatus: order.orderStatus
      }));

    const paymentNotifications = orders
      .filter(order => order.paymentStatus === 'PAID' && order.orderStatus === 'CONFIRMED')
      .slice(0, 5)
      .map(order => ({
        id: `payment-${order._id}`,
        type: 'payment',
        title: 'Payment Processed',
        message: `Payment for Order #${order._id.slice(-6)} has been processed`,
        time: getTimeAgo(order.updatedAt || order.createdAt),
        read: false,
        priority: 'medium',
        orderId: order._id,
        orderAmount: order.finalAmount
      }));

    return [...orderNotifications, ...paymentNotifications].sort((a, b) => 
      new Date(b.time) - new Date(a.time)
    );
  };

  // Helper function to get time ago
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  // Update sales data from orders
  const updateSalesDataFromOrders = (orders) => {
    if (!orders || !Array.isArray(orders)) return;
    
    const currentYear = new Date().getFullYear();
    const monthlySales = Array(12).fill(0);
    
    orders.forEach(order => {
      if (order.orderStatus === 'DELIVERED' || order.orderStatus === 'CONFIRMED') {
        const orderDate = new Date(order.createdAt);
        if (orderDate.getFullYear() === currentYear) {
          const month = orderDate.getMonth();
          monthlySales[month] += order.finalAmount || 0;
        }
      }
    });
    
    setSalesData(prev => ({
      ...prev,
      datasets: [{
        ...prev.datasets[0],
        data: monthlySales
      }]
    }));
  };

  // Modify useEffect to include users fetch
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [ordersRes, productsRes, categoriesRes, vendorsRes] = await Promise.all([
          fetchOrders(),
          productApi.getAllProducts(),
          categoryApi.getAllCategories(),
          vendorApi.getAllVendors()
        ]);
        
        // Store orders data for notifications and sales chart
        setOrdersRes(ordersRes);
        
        setOrderCount(ordersRes?.orders?.length || 0);
        setProductCount(productsRes?.totalProducts || productsRes?.products?.length || 0);
        setCategoryCount(Array.isArray(categoriesRes) ? categoriesRes.length : (categoriesRes?.categories?.length || 0));
        setVendorCount(Array.isArray(vendorsRes) ? vendorsRes.length : (vendorsRes?.vendors?.length || 0));

        // Set income statistics from API response
        setIncomeStats(ordersRes?.incomeStats || {
          day: 0,
          week: 0,
          month: 0,
          year: 0
        });

        // Generate notifications from orders
        if (ordersRes?.orders) {
          const orderNotifications = generateNotificationsFromOrders(ordersRes.orders);
          setNotifications(orderNotifications);
          setUnreadCount(orderNotifications.filter(n => !n.read).length);
          
          // Update sales data from orders
          updateSalesDataFromOrders(ordersRes.orders);
        }

        // Calculate order status distribution
        if (ordersRes?.orders) {
          // Initialize status counts with all possible statuses
          const statusCounts = {
            'ORDER PLACED': 0,
            'CONFIRMED': 0,
            'DISPATCHED': 0,
            'DELIVERED': 0,
            'CANCELLED': 0  // Fixed spelling to match backend
          };

          // Count orders by status
          ordersRes.orders.forEach(order => {
            // Normalize the status by converting to uppercase and handling null/undefined
            const status = (order.orderStatus || 'ORDER PLACED').toUpperCase();
            
            // Update the count if it's a valid status
            if (status in statusCounts) {
              statusCounts[status]++;
            } else {
              // If status doesn't match any known status, count as ORDER PLACED
              statusCounts['ORDER PLACED']++;
            }
          });

          // Update the chart data
          setOrderStatusData({
            labels: [
              'Order Placed',
              'Confirmed',
              'Dispatched',
              'Delivered',
              'Cancelled'
            ],
            datasets: [{
              data: [
                statusCounts['ORDER PLACED'],
                statusCounts['CONFIRMED'],
                statusCounts['DISPATCHED'],
                statusCounts['DELIVERED'],
                statusCounts['CANCELLED']
              ],
              backgroundColor: [
                theme.palette.warning.main,   // Order Placed - Orange
                theme.palette.info.main,      // Confirmed - Blue
                theme.palette.primary.main,   // Dispatched - Primary
                theme.palette.success.main,   // Delivered - Green
                theme.palette.error.main,     // Canceled - Red
              ],
            }]
          });
        }
        
        // Fetch users
        await fetchUsers();
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchCounts();
  }, [theme.palette]);

  // Add real-time refresh for notifications
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const ordersRes = await fetchOrders();
        if (ordersRes?.orders) {
          const orderNotifications = generateNotificationsFromOrders(ordersRes.orders);
          setNotifications(orderNotifications);
          setUnreadCount(orderNotifications.filter(n => !n.read).length);
          updateSalesDataFromOrders(ordersRes.orders);
        }
      } catch (error) {
        console.error('Error refreshing notifications:', error);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCalendarClick = (event) => {
    event.stopPropagation();
    setCalendarAnchorEl(event.currentTarget);
  };

  const handleNotificationClick = (event) => {
    event.stopPropagation();
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleStatCardClick = (event, cardId) => {
    event.stopPropagation();
    setStatCardAnchorEl({ element: event.currentTarget, id: cardId });
  };

  const handleCloseAll = () => {
    setCalendarAnchorEl(null);
    setNotificationAnchorEl(null);
    setStatCardAnchorEl(null);
  };

  const StatCard = ({ id, title, value, description, change, icon: Icon, color }) => (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        height: '100%',
        borderRadius: 2,
        backgroundColor: '#fff',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          '& .stat-menu': {
            opacity: 1,
          },
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          backgroundColor: color || theme.palette.primary.main,
        },
      }}
    >
      <Box 
        className="stat-menu"
        sx={{ 
          position: 'absolute', 
          right: 8, 
          top: 8,
          opacity: 0,
          transition: 'opacity 0.2s ease',
          zIndex: 1,
        }}
      >
        <IconButton 
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleStatCardClick(e, id);
          }}
        >
          <MoreHorizIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body1" color="text.secondary" gutterBottom>
        {title}
      </Typography>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
        {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: `${color || theme.palette.primary.main}15`,
            p: 1,
            borderRadius: 2,
            color: color || theme.palette.primary.main,
          }}
        >
          <Icon />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
        <Typography
          variant="body2"
          sx={{
            color: change >= 0 ? 'success.main' : 'error.main',
            fontWeight: 500,
            mr: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ShowChartIcon sx={{ fontSize: 16, mr: 0.5 }} />
          {change >= 0 ? '+' : ''}{change}%
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
      </Box>
    </Paper>
  );

  const TopProductsTable = () => {
    const products = [
      {
        id: 1,
        name: 'iPhone 13 Pro',
        image: SAMPLE_IMAGES.iphone,
        sales: 2345600,
        orders: 234,
        trend: 12.5,
        stock: 75
      },
      {
        id: 2,
        name: 'Smart TV',
        image: SAMPLE_IMAGES.tv,
        sales: 1845600,
        orders: 156,
        trend: -5.2,
        stock: 50
      },
      {
        id: 3,
        name: 'Laptop Pro',
        image: SAMPLE_IMAGES.laptop,
        sales: 1645600,
        orders: 145,
        trend: 8.7,
        stock: 60
      },
      {
        id: 4,
        name: 'Wireless Earphones',
        image: SAMPLE_IMAGES.earphones,
        sales: 945600,
        orders: 189,
        trend: 15.8,
        stock: 40
      },
    ];

    return (
      <TableContainer sx={{ minWidth: 650 }}>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: { xs: 1, md: 2 } }}>Product</TableCell>
              <TableCell align="right">Sales</TableCell>
              <TableCell align="right">Orders</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell align="right" sx={{ pr: { xs: 1, md: 2 } }}>Trend</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                <TableCell sx={{ pl: { xs: 1, md: 2 } }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 1, md: 2 }
                  }}>
                    <Avatar 
                      src={product.image} 
                      variant="rounded"
                      sx={{ width: { xs: 40, md: 50 }, height: { xs: 40, md: 50 } }}
                    />
                    <Typography variant="body2">{product.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">{formatINR(product.sales)}</TableCell>
                <TableCell align="right">{product.orders}</TableCell>
                <TableCell align="right">
                  <Chip 
                    label={product.stock > 50 ? 'In Stock' : 'Low Stock'} 
                    color={product.stock > 50 ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right" sx={{ pr: { xs: 1, md: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                    {product.trend > 0 ? (
                      <ArrowUpwardIcon color="success" sx={{ fontSize: 16 }} />
                    ) : (
                      <ArrowDownwardIcon color="error" sx={{ fontSize: 16 }} />
                    )}
                    <Typography
                      variant="body2"
                      color={product.trend > 0 ? 'success.main' : 'error.main'}
                    >
                      {Math.abs(product.trend)}%
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const CategoryProgress = () => {
    const categories = [
      { name: 'Electronics', value: 85, color: 'primary.main' },
      { name: 'Fashion', value: 65, color: 'secondary.main' },
      { name: 'Home & Living', value: 45, color: 'success.main' },
      { name: 'Books', value: 35, color: 'warning.main' },
    ];

  return (
      <Box>
        {categories.map((category) => (
          <Box key={category.name} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">{category.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {category.value}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={category.value}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: `${category.color}22`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: category.color,
                  borderRadius: 4,
                },
              }}
            />
          </Box>
        ))}
      </Box>
    );
  };

  const DashboardHeader = ({ timeRange, setTimeRange, handleMenuClick }) => {
    const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);

    const handleNotificationClick = (event) => {
      event.stopPropagation();
      setNotificationAnchorEl(event.currentTarget);
    };

    const handleNotificationClose = () => {
      setNotificationAnchorEl(null);
    };

    return (
      <Box sx={{ mb: { xs: 2, md: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', md: 'center' },
          gap: { xs: 2, md: 0 },
          mb: { xs: 2, md: 3 }
        }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Admin Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            alignItems: 'center',
            justifyContent: { xs: 'flex-start', md: 'flex-end' }
          }}>
            {/* <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                variant="outlined"
              >
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="year">This Year</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={handleCalendarClick} title="Calendar">
              <CalendarTodayIcon />
            </IconButton> */}
            <IconButton 
              onClick={handleNotificationClick} 
              title="Notifications"
              sx={{ position: 'relative' }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Button 
              variant="contained" 
              startIcon={<FileDownloadIcon />}
              sx={{ 
                '&:focus': { outline: 'none' },
                flex: { xs: 1, md: 'none' }
              }}
            >
              Export Report
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Tabs 
            value={dashboardView} 
            onChange={(e, newValue) => setDashboardView(newValue)}
            sx={{ 
              mb: 2,
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTabs-indicator': {
                backgroundColor: 'primary.main',
                height: 3,
                borderRadius: '3px 3px 0 0'
              },
              '& .MuiTab-root': {
                minHeight: 53,
                textTransform: 'none',
                fontWeight: 500,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  color: 'primary.main'
                },
                '&.Mui-selected': {
                  color: 'primary.main',
                  fontWeight: 600,
                  '& .MuiSvgIcon-root': {
                    color: 'primary.main'
                  }
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '1.3rem',
                  marginRight: 1,
                  transition: 'color 0.2s ease-in-out'
                }
              }
            }}
          >
            <Tab 
              label="Overview" 
              value="overview" 
              icon={<PieChartIcon />} 
              iconPosition="start"
              sx={{ 
                borderRadius: '8px 8px 0 0',
                mr: 1
              }}
            />
            {/* <Tab 
              label="Sales Analytics" 
              value="sales" 
              icon={<ShowChartIcon />} 
              iconPosition="start"
              sx={{ 
                borderRadius: '8px 8px 0 0',
                mr: 1
              }}
            />
            <Tab 
              label="Inventory" 
              value="inventory" 
              icon={<InventoryIcon />} 
              iconPosition="start"
              sx={{ 
                borderRadius: '8px 8px 0 0',
                mr: 1
              }}
            />
            <Tab 
              label="Customer Insights" 
              value="customers" 
              icon={<GroupIcon />} 
              iconPosition="start"
              sx={{ 
                borderRadius: '8px 8px 0 0'
              }}
            /> */}
          </Tabs>
        </Box>

        <NotificationsMenu 
          anchorEl={notificationAnchorEl} 
          onClose={handleNotificationClose} 
        />
      </Box>
    );
  };

  const DashboardMenus = ({ anchorEl, handleMenuClose }) => (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      PaperProps={{
        elevation: 2,
        sx: {
          mt: 1,
          minWidth: 200,
        },
      }}
    >
      <MenuItem onClick={handleMenuClose}>
        <RefreshIcon sx={{ mr: 2, fontSize: 20 }} />
        Refresh Data
      </MenuItem>
      <MenuItem onClick={handleMenuClose}>
        <TimelineIcon sx={{ mr: 2, fontSize: 20 }} />
        View Analytics
      </MenuItem>
      <MenuItem onClick={handleMenuClose}>
        <FileDownloadIcon sx={{ mr: 2, fontSize: 20 }} />
        Download Report
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleMenuClose}>
        <PieChartIcon sx={{ mr: 2, fontSize: 20 }} />
        Advanced Analytics
      </MenuItem>
      <MenuItem onClick={handleMenuClose}>
        <MoreHorizIcon sx={{ mr: 2, fontSize: 20 }} />
        Settings
      </MenuItem>
    </Menu>
  );

  const NotificationsMenu = ({ anchorEl, onClose }) => {
    const [activeTab, setActiveTab] = useState('all');
    const [filter, setFilter] = useState('all');

    const filteredNotifications = notifications.filter(notification => {
      if (filter === 'unread') return !notification.read;
      if (filter === 'priority') return notification.priority === 'high';
      return true;
    });

    // Handle notification click to mark as read
    const handleNotificationClick = (notificationId) => {
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    // Mark all notifications as read
    const markAllAsRead = () => {
      setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
      setUnreadCount(0);
    };

    const getNotificationIcon = (type) => {
      switch (type) {
        case 'order':
          return <ShoppingCartIcon />;
        case 'payment':
          return <AccountBalanceWalletIcon />;
        case 'product':
          return <InventoryIcon />;
        case 'system':
          return <NotificationsIcon />;
        case 'vendor':
          return <StorefrontIcon />;
        default:
          return <NotificationsIcon />;
      }
    };

    const getColorByType = (type) => {
      switch (type) {
        case 'order': return {
          light: '#e3f2fd', 
          main: '#2196f3', 
          gradient: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)'
        };
        case 'payment': return {
          light: '#e8f5e9', 
          main: '#4caf50',
          gradient: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)'
        };
        case 'product': return {
          light: '#fff8e1', 
          main: '#ff9800',
          gradient: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)'
        };
        case 'system': return {
          light: '#e1f5fe', 
          main: '#03a9f4',
          gradient: 'linear-gradient(135deg, #03a9f4 0%, #4fc3f7 100%)'
        };
        case 'vendor': return {
          light: '#f3e5f5', 
          main: '#9c27b0',
          gradient: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)'
        };
        default: return {
          light: '#e3f2fd', 
          main: '#2196f3',
          gradient: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)'
        };
      }
    };

    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'high': return '#f44336';
        case 'medium': return '#ff9800';
        case 'low': return '#4caf50';
        default: return '#9e9e9e';
      }
    };

    const handleTabChange = (event, newValue) => {
      setActiveTab(newValue);
      setFilter(newValue);
    };

    return (
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={onClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 8,
          sx: { 
            mt: 1.5,
            width: 380,
            maxHeight: 550,
            borderRadius: 2,
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            overflow: 'visible',
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 18,
              width: 12,
              height: 12,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
            '& .MuiList-root': {
              p: 0
            }
          },
        }}
      >
        {/* Header with gradient background */}
        <Box 
          sx={{ 
            p: 2.5, 
            background: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
            color: 'white',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '-25%',
              left: '-10%',
              width: '75%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
              transform: 'rotate(20deg)',
              zIndex: 0
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 0.5 }}>
              Notifications Center
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Badge 
                badgeContent={unreadCount} 
                color="error"
                sx={{ 
                  '& .MuiBadge-badge': { 
                    fontSize: '0.7rem', 
                    fontWeight: 'bold',
                    minWidth: '20px',
                    height: '20px'
                  }
                }}
              >
                <NotificationsIcon fontSize="small" />
              </Badge>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                You have {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
              </Typography>
            </Stack>
          </Box>
        </Box>

        {/* Tabs for filtering */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              minHeight: '48px',
              '& .MuiTab-root': {
                minHeight: '48px',
                fontWeight: 500,
                fontSize: '0.85rem',
                textTransform: 'none',
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: 'primary.main',
                  fontWeight: 600
                }
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0'
              }
            }}
          >
            <Tab value="all" label="All" />
            <Tab value="unread" label="Unread" />
            <Tab value="priority" label="Priority" />
          </Tabs>
        </Box>

        <Box sx={{ maxHeight: 400, overflow: 'auto', pb: 0.5 }}>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const colorSet = getColorByType(notification.type);
              return (
                <Box 
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id)}
                  sx={{ 
                    py: 2,
                    px: 2.5,
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    borderLeft: !notification.read ? `3px solid ${colorSet.main}` : '3px solid transparent',
                    '&:not(:last-child)': {
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    },
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.02)'
                    },
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2
                  }}
                >
                  {/* Icon with gradient background */}
                  <Box 
                    sx={{ 
                      width: 45,
                      height: 45,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: colorSet.gradient,
                      color: 'white',
                      boxShadow: `0 4px 12px ${colorSet.light}`
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: notification.read ? 500 : 600,
                          color: notification.read ? 'text.primary' : 'text.primary',
                          mb: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        {notification.title}
                        {notification.priority === 'high' && (
                          <Box 
                            component="span" 
                            sx={{ 
                              display: 'inline-block',
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: getPriorityColor(notification.priority)
                            }}
                          />
                        )}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'text.secondary',
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          bgcolor: 'action.hover',
                          px: 1,
                          py: 0.5,
                          borderRadius: 10
                        }}
                      >
                        {notification.time}
                      </Typography>
                    </Box>
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        fontWeight: notification.read ? 400 : 500,
                        opacity: notification.read ? 0.8 : 1,
                        mb: 0.5
                      }}
                    >
                      {notification.message}
                    </Typography>
                    {notification.orderAmount && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'success.main',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      >
                        Amount: {formatINR(notification.orderAmount)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )
            })
          ) : (
            <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <NotificationsOffIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications found
              </Typography>
            </Box>
          )}
        </Box>

        <Box 
          sx={{ 
            p: 2, 
            borderTop: '1px solid', 
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <Button 
            variant="text" 
            color="primary"
            size="small"
            onClick={onClose}
            startIcon={<VisibilityIcon fontSize="small" />}
            sx={{ fontWeight: 500 }}
          >
            View All
          </Button>
          <Button 
            variant="text" 
            color="primary"
            size="small"
            onClick={markAllAsRead}
            startIcon={<RefreshIcon fontSize="small" />}
            sx={{ fontWeight: 500 }}
          >
            Mark All Read
          </Button>
        </Box>
      </Menu>
    );
  };

  const StatCardMenu = ({ anchorEl, onClose }) => (
    <Menu
      anchorEl={anchorEl?.element}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      PaperProps={{
        elevation: 2,
        sx: { 
          mt: 0.5,
          minWidth: 200,
        },
      }}
    >
      <MenuItem onClick={onClose}>
        <VisibilityIcon sx={{ mr: 2, fontSize: 20 }} />
        View Details
      </MenuItem>
      <MenuItem onClick={onClose}>
        <GetAppIcon sx={{ mr: 2, fontSize: 20 }} />
        Download Report
      </MenuItem>
      <MenuItem onClick={onClose}>
        <PrintIcon sx={{ mr: 2, fontSize: 20 }} />
        Print
      </MenuItem>
      <Divider />
      <MenuItem onClick={onClose}>
        <ShareIcon sx={{ mr: 2, fontSize: 20 }} />
        Share
      </MenuItem>
    </Menu>
  );

  const QuickActions = () => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Business Performance
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Box sx={{ 
                p: 1, 
                borderRadius: 1, 
                bgcolor: 'success.light',
                color: 'success.dark'
              }}>
                <TrendingUpIcon />
              </Box>
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle2">Revenue Growth</Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  <Typography variant="h6" color="success.main">
                    +{((incomeStats.monthTotal - incomeStats.lastMonthTotal) / incomeStats.lastMonthTotal * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    vs Last Month
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Box sx={{ 
                p: 1, 
                borderRadius: 1, 
                bgcolor: 'primary.light',
                color: 'primary.dark'
              }}>
                <ShoppingCartIcon />
              </Box>
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle2">Conversion Rate</Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  <Typography variant="h6" color="primary.main">
                    {((orderCount / users.length) * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Orders per Customer
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Box sx={{ 
                p: 1, 
                borderRadius: 1, 
                bgcolor: 'warning.light',
                color: 'warning.dark'
              }}>
                <LocalMallIcon />
              </Box>
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle2">Average Order Value</Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  <Typography variant="h6" color="warning.main">
                    {formatINR(parseFloat(incomeStats.monthTotal / orderCount || 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Per Transaction
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Box sx={{ 
                p: 1, 
                borderRadius: 1, 
                bgcolor: 'error.light',
                color: 'error.dark'
              }}>
                <CompareArrowsIcon />
              </Box>
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle2">Return Rate</Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  <Typography variant="h6" color="error.main">
                    2.5%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Of Total Orders
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );

  const RecentActivities = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Recent Activities
        </Typography>
        <Stack spacing={2}>
          {[
            {
              action: 'New order received',
              details: 'Order #12345 from John Doe',
              time: '2 minutes ago',
              type: 'order'
            },
            {
              action: 'Payment processed',
              details: 'Payment for Order #12342',
              time: '5 minutes ago',
              type: 'payment'
            },
            {
              action: 'Product updated',
              details: 'iPhone 13 Pro stock updated',
              time: '10 minutes ago',
              type: 'product'
            }
          ].map((activity, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <CircularProgress
                variant="determinate"
                value={100}
                size={10}
                sx={{ 
                  mt: 1,
                  color: activity.type === 'order' 
                    ? 'success.main' 
                    : activity.type === 'payment' 
                    ? 'primary.main' 
                    : 'secondary.main'
                }}
              />
              <Box>
                <Typography variant="subtitle2">{activity.action}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {activity.details}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {activity.time}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );

  const TopCustomers = () => {
    const recentUsers = SAMPLE_USERS.map(user => ({
      ...user,
      avatarComponent: <UserAvatar user={user} size={50} />
    }));

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Top Customers
            </Typography>
            <Button size="small" endIcon={<ArrowForwardIcon />}>
              View All
            </Button>
          </Box>
          <Stack spacing={2}>
            {recentUsers.map((user) => (
              <Box
                key={user.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'background.default',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {user.avatarComponent}
                  <Box>
                    <Typography variant="subtitle2">{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2">{formatINR(user.spent)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.orders} orders
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  const SalesByLocation = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Sales by Location
          </Typography>
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        </Box>
        <Stack spacing={2}>
          {[
            { location: 'Mumbai', sales: 1245600, percentage: 35 },
            { location: 'Delhi', sales: 985000, percentage: 28 },
            { location: 'Bangalore', sales: 754000, percentage: 21 },
            { location: 'Chennai', sales: 562000, percentage: 16 }
          ].map((item) => (
            <Box key={item.location}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">{item.location}</Typography>
                <Typography variant="body2">{formatINR(item.sales)}</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={item.percentage}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: `${theme.palette.primary.main}15`,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    backgroundColor: theme.palette.primary.main,
                  },
                }}
              />
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );

  
  const stats = [
    {
      title: 'Total Orders',
      value: orderCount.toString(),
      icon: <ShoppingCartIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
      path: '/orders',
      color: '#1976d2',
      buttonText: 'Manage Orders'
    },
    {
      title: 'Total Products',
      value: productCount.toString(),
      icon: <InventoryIcon sx={{ fontSize: 40, color: '#2e7d32' }} />,
      path: '/products',
      color: '#2e7d32',
      buttonText: 'Manage Products'
    },
    {
      title: 'Total Categories',
      value: categoryCount.toString(),
      icon: <CategoryIcon sx={{ fontSize: 40, color: '#ed6c02' }} />,
      path: '/categories',
      color: '#ed6c02',
      buttonText: 'Manage Categories'
    },
    {
      title: 'Total Vendors',
      value: vendorCount.toString(),
      icon: <PeopleIcon sx={{ fontSize: 40, color: '#9c27b0' }} />,
      path: '/vendors',
      color: '#9c27b0',
      buttonText: 'Manage Vendors'
    }
  ];

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      status: user.status || 'active'
    });
    setUserDialogOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await userApi.deleteUser(userId);
        if (response.success) {
          enqueueSnackbar('User deleted successfully', { variant: 'success' });
          fetchUsers();
        }
      } catch (error) {
        enqueueSnackbar(error.message || 'Failed to delete user', { variant: 'error' });
      }
    }
  };

  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await userApi.updateUser(selectedUser._id, userFormData);
      if (response.success) {
        enqueueSnackbar('User updated successfully', { variant: 'success' });
        setUserDialogOpen(false);
        fetchUsers();
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to update user', { variant: 'error' });
    }
  };

  const UsersSection = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Recent Users
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/users')}
            endIcon={<ArrowForwardIcon />}
          >
            View All Users
          </Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Orders</TableCell>
                <TableCell>Total Spent</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.slice(0, 5).map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <UserAvatar user={user} />
                      <Box>
                        <Typography variant="subtitle2">{user.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={(user.status || 'inactive').charAt(0).toUpperCase() + (user.status || 'inactive').slice(1)}
                      color={user.status === 'active' ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{user.ordersCount || 0}</TableCell>
                  <TableCell>₹{user.totalSpent?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleEditUser(user)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteUser(user._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  // Add UserDialog component
  const UserDialog = () => (
    <Dialog 
      open={userDialogOpen} 
      onClose={() => setUserDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Edit User
      </DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={userFormData.name}
            onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={userFormData.email}
            onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={userFormData.phone}
            onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={userFormData.status}
              onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value })}
              label="Status"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
        <Button onClick={handleUserFormSubmit} variant="contained">
          Update User
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Modify IncomeOverview component to show traditional income statistics
  const IncomeOverview = () => (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: 0,
            width: 60,
            height: 3,
            backgroundColor: 'primary.main',
            borderRadius: 1.5
          }
        }}>
          Income Statistics
        </Typography>
        <Button
          startIcon={<FileDownloadIcon />}
          variant="outlined"
          size="small"
          sx={{
            borderRadius: 2,
            textTransform: 'none'
          }}
        >
          Export Report
        </Button>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: (theme) => theme.shadows[10],
              '& .icon-wrapper': {
                transform: 'scale(1.1)',
              }
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'primary.main',
              borderRadius: '4px 4px 0 0'
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'space-between',
                mb: 2
              }}>
                <Box className="icon-wrapper" sx={{ 
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'primary.lighter',
                  transition: 'transform 0.3s ease-in-out'
                }}>
                  <AttachMoneyIcon color="primary" sx={{ fontSize: 32 }} />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Today's Income
                  </Typography>
                  <Typography variant="h5" color="primary.main" sx={{ fontWeight: 600 }}>
                    {formatINR(parseFloat(incomeStats.dayTotal || 0))}
                  </Typography>
                </Box>
              </Box>
              <Stack spacing={1}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Order Amount
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                    {formatINR(parseFloat(incomeStats.day || 0))}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Shipping
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                    {formatINR(parseFloat(incomeStats.dayShipping || 0))}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: (theme) => theme.shadows[10],
              '& .icon-wrapper': {
                transform: 'scale(1.1)',
              }
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'success.main',
              borderRadius: '4px 4px 0 0'
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'space-between',
                mb: 2
              }}>
                <Box className="icon-wrapper" sx={{ 
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'success.lighter',
                  transition: 'transform 0.3s ease-in-out'
                }}>
                  <AttachMoneyIcon color="success" sx={{ fontSize: 32 }} />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Weekly Income
                  </Typography>
                  <Typography variant="h5" color="success.main" sx={{ fontWeight: 600 }}>
                    {formatINR(parseFloat(incomeStats.weekTotal || 0))}
                  </Typography>
                </Box>
              </Box>
              <Stack spacing={1}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Order Amount
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                    {formatINR(parseFloat(incomeStats.week || 0))}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Shipping
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                    {formatINR(parseFloat(incomeStats.weekShipping || 0))}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: (theme) => theme.shadows[10],
              '& .icon-wrapper': {
                transform: 'scale(1.1)',
              }
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'warning.main',
              borderRadius: '4px 4px 0 0'
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'space-between',
                mb: 2
              }}>
                <Box className="icon-wrapper" sx={{ 
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'warning.lighter',
                  transition: 'transform 0.3s ease-in-out'
                }}>
                  <AttachMoneyIcon color="warning" sx={{ fontSize: 32 }} />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Monthly Income
                  </Typography>
                  <Typography variant="h5" color="warning.main" sx={{ fontWeight: 600 }}>
                    {formatINR(parseFloat(incomeStats.monthTotal || 0))}
                  </Typography>
                </Box>
              </Box>
              <Stack spacing={1}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Order Amount
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                    {formatINR(parseFloat(incomeStats.month || 0))}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Shipping
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                    {formatINR(parseFloat(incomeStats.monthShipping || 0))}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: (theme) => theme.shadows[10],
              '& .icon-wrapper': {
                transform: 'scale(1.1)',
              }
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'secondary.main',
              borderRadius: '4px 4px 0 0'
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'space-between',
                mb: 2
              }}>
                <Box className="icon-wrapper" sx={{ 
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'secondary.lighter',
                  transition: 'transform 0.3s ease-in-out'
                }}>
                  <AttachMoneyIcon color="secondary" sx={{ fontSize: 32 }} />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Yearly Income
                  </Typography>
                  <Typography variant="h5" color="secondary.main" sx={{ fontWeight: 600 }}>
                    {formatINR(parseFloat(incomeStats.yearTotal || 0))}
                  </Typography>
                </Box>
              </Box>
              <Stack spacing={1}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Order Amount
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                    {formatINR(parseFloat(incomeStats.year || 0))}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Shipping
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                    {formatINR(parseFloat(incomeStats.yearShipping || 0))}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, bgcolor: 'background.default' }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <DashboardHeader 
            timeRange={timeRange} 
            setTimeRange={setTimeRange}
            handleMenuClick={handleMenuClick}
          />
          
          {dashboardView === 'overview' && (
            <>
              <IncomeOverview />
              <Grid container spacing={3}>
                {stats.map((stat, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          boxShadow: 6,
                          transform: 'translateY(-4px)',
                          transition: 'all 0.3s ease-in-out'
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '4px',
                          backgroundColor: stat.color,
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          mb: 2 
                        }}>
                          <Box sx={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: `${stat.color}15`
                          }}>
                            {stat.icon}
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h4" sx={{ color: stat.color, fontWeight: 600 }}>
                              {stat.value}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {stat.title}
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={() => navigate(stat.path)}
                          sx={{ 
                            color: stat.color,
                            borderColor: stat.color,
                            '&:hover': {
                              borderColor: stat.color,
                              bgcolor: `${stat.color}10`
                            }
                          }}
                        >
                          {stat.buttonText}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              <Grid container spacing={3} sx={{ mt: 3 }}>
                <Grid item xs={12} md={8}>
                  <SalesTrendChart />
                </Grid>
                <Grid item xs={12} md={4}>
                  <OrderStatusChart />
                </Grid>
              </Grid>
            </>
          )}

          {dashboardView === 'sales' && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <RevenueByCategoryChart />
              </Grid>
              <Grid item xs={12} md={6}>
                <MonthlyPerformanceChart />
              </Grid>
              <Grid item xs={12}>
                <CustomerGrowthChart />
              </Grid>
            </Grid>
          )}

          {dashboardView === 'inventory' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TopProductsTable />
              </Grid>
              <Grid item xs={12} md={4}>
                <SalesByLocation />
              </Grid>
            </Grid>
          )}

          {dashboardView === 'customers' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TopCustomers />
              </Grid>
              <Grid item xs={12}>
                <UsersSection />
              </Grid>
            </Grid>
          )}
        </>
      )}
      <UserDialog />
    </Box>
  );
};

export default Dashboard; 