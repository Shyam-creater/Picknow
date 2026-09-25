import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Menu,
  MenuItem,
  Card,
  CardMedia,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Tooltip,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PrintIcon from "@mui/icons-material/Print";
import { fetchOrders, updateOrderStatus } from "../api/dashboardApi";
import { productApi } from "../api/productApi";
import { variantApi } from "../api/variantApi";
import { comboApi } from "../api/comboApi";
import { userApi } from "../api/userApi";
import { useOrderNotifications } from "../context/OrderNotificationContext";
import { useSnackbar } from "notistack";

const getStatusIcon = (status) => {
  if (!status) return <ShoppingCartIcon fontSize="small" />;

  const statusUpper = status.toUpperCase();
  switch (statusUpper) {
    case "ORDER PLACED":
    case "PENDING":
      return <ShoppingCartIcon fontSize="small" />;
    case "DISPATCHED":
      return <LocalShippingIcon fontSize="small" />;
    case "DELIVERED":
      return <CheckCircleIcon fontSize="small" />;
    case "CANCELLED":
    case "CANCELED":
      return <CancelIcon fontSize="small" />;
    case "RETURNED":
      return <CancelIcon fontSize="small" />;
    default:
      return <ShoppingCartIcon fontSize="small" />;
  }
};

const getStatusColor = (status) => {
  if (!status) return "default";

  const statusUpper = status.toUpperCase();
  switch (statusUpper) {
    case "ORDER PLACED":
    case "PENDING":
      return "warning";
    case "DISPATCHED":
      return "secondary";
    case "DELIVERED":
      return "success";
    case "CANCELLED":
    case "CANCELED":
      return "error";
    case "RETURNED":
      return "error";
    default:
      return "default";
  }
};

const getDisplayStatus = (status) => {
  if (!status) return "N/A";

  const statusUpper = status.toUpperCase();
  switch (statusUpper) {
    case "PENDING":
      return "ORDER PLACED";
    case "CANCELLED":
    case "CANCELED":
      return "CANCELLED";
    case "RETURNED":
      return "RETURNED";
    default:
      return statusUpper;
  }
};

const getNetPayableAmount = (order) => {
  const finalAmount = Number(order?.finalAmount || 0);
  const walletUsed = Number(order?.kaitCoinsUsed || 0);
  const netAmount = finalAmount - walletUsed;
  return netAmount > 0 ? netAmount : 0;
};

const StatusOption = ({ status, selected, onClick, disabled }) => {
  const getStatusInfo = (status) => {
    switch (status) {
      case "ORDER PLACED":
        return {
          icon: <ShoppingCartIcon />,
          color: "#ed6c02", // warning color
          description: "Order is pending admin review",
          subtext: "Awaiting admin confirmation",
        };
      case "DISPATCHED":
        return {
          icon: <LocalShippingIcon />,
          color: "#9c27b0", // secondary color
          description: "Order is ready for shipping",
          subtext: "Admin has confirmed and prepared for delivery",
        };
      case "DELIVERED":
        return {
          icon: <CheckCircleIcon />,
          color: "#2e7d32", // success color
          description: "Order completed successfully",
          subtext: "Admin has marked as delivered",
        };
      case "CANCELLED":
        return {
          icon: <CancelIcon />,
          color: "#d32f2f", // error color
          description: "Order cancelled by admin",
          subtext: "Admin has cancelled the order",
        };
      default:
        return {
          icon: <ShoppingCartIcon />,
          color: "#757575",
          description: "Status unknown",
          subtext: "Please select a valid status",
        };
    }
  };

  const info = getStatusInfo(status);

  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 2,
        cursor: disabled ? "not-allowed" : "pointer",
        border: selected ? `2px solid ${info.color}` : "2px solid transparent",
        opacity: disabled ? 0.6 : 1,
        transition: "all 0.2s ease",
        "&:hover": {
          transform: disabled ? "none" : "translateY(-2px)",
          boxShadow: disabled ? 1 : 3,
        },
        display: "flex",
        gap: 2,
        mb: 2,
      }}
    >
      <Box sx={{ color: info.color, display: "flex", alignItems: "center" }}>
        {info.icon}
      </Box>
      <Box>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: info.color }}
        >
          {status}
        </Typography>
        <Typography variant="body2" color="text.primary">
          {info.description}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {info.subtext}
        </Typography>
      </Box>
    </Paper>
  );
};

// Add this custom component for mobile order cards
const OrderCard = ({ order, onActionClick }) => {
  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Order ID
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {order._id}
          </Typography>
        </Box>
        <IconButton onClick={(e) => onActionClick(e, order)} size="small">
          <MoreVertIcon />
        </IconButton>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Customer
          </Typography>
          <Typography variant="body2">{order.user?.name || "N/A"}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Date
          </Typography>
          <Typography variant="body2">
            {new Date(order.createdAt).toLocaleDateString("en-GB")}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Total
          </Typography>
          <Typography variant="body2">
            ₹{getNetPayableAmount(order).toFixed(2)}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Status
          </Typography>
          <Chip
            icon={getStatusIcon(order.orderStatus)}
            label={getDisplayStatus(order.orderStatus) || "N/A"}
            color={getStatusColor(order.orderStatus)}
            size="small"
            sx={{
              "& .MuiChip-icon": { color: "inherit" },
              fontWeight: 600,
              mt: 0.5,
            }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

const Orders = () => {
  const theme = useTheme();
  const { newOrdersCount, resetNewOrdersCount } = useOrderNotifications();
  const { enqueueSnackbar } = useSnackbar();
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasShownNewOrderNotification, setHasShownNewOrderNotification] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrderForMenu, setSelectedOrderForMenu] = useState(null);
  const [productDetails, setProductDetails] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [openTrackingDialog, setOpenTrackingDialog] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [dateFilter, setDateFilter] = useState("all"); // 'all', 'week', 'month', 'year'
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'ORDER PLACED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'
  const [variantDetails, setVariantDetails] = useState({});

  // Define order status options
  const orderStatusOptions = [
    "ORDER PLACED",
    "DISPATCHED",
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
  ];

  useEffect(() => {
    loadOrders();
    // Reset notification count when user visits the orders page
    resetNewOrdersCount();
    setHasShownNewOrderNotification(false);
  }, []);

  // Show notification when new orders arrive
  useEffect(() => {
    if (newOrdersCount > 0 && !hasShownNewOrderNotification) {
      enqueueSnackbar(
        `${newOrdersCount} new order${newOrdersCount > 1 ? 's' : ''} ${newOrdersCount > 1 ? 'have' : 'has'} been placed!`,
        {
          variant: 'info',
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          },
        }
      );
      setHasShownNewOrderNotification(true);
    }
  }, [newOrdersCount, hasShownNewOrderNotification, enqueueSnackbar]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchOrders();
      setOrders(response.orders || []);
    } catch (err) {
      setError("Failed to load orders. Please try again later.");
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event, order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrderForMenu(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrderForMenu(null);
  };

  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    setLoadingProducts(true);
    try {
      // Fetch details for each product in the order
      const productDetailsPromises = order.items.map(async (item) => {
        if (!item.product) return null;

        try {
          if (item.product.startsWith("combo-")) {
            const response = await comboApi.getComboById(item.product);
            return response.combo || null;
          } else {
            const response = await productApi.getProductById(item.product);
            return response.product || null;
          }
        } catch (error) {
          console.error("Error fetching product details:", error);
          return null;
        }
      });

      const details = await Promise.all(productDetailsPromises);
      const productDetailsMap = {};
      const variantDetailsMap = {};

      // Fetch variant details for each item (only for non-combo products)
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        if (
          item.product &&
          item.variant &&
          !item.product.startsWith("combo-")
        ) {
          try {
            const variantResponse = await variantApi.getVariantById(
              item.variant
            );
            if (variantResponse.success) {
              variantDetailsMap[item.variant] = variantResponse.variant;
            }
          } catch (error) {
            console.error("Error fetching variant details:", error);
          }
        }
      }

      details.forEach((detail, index) => {
        if (detail && order.items[index].product) {
          productDetailsMap[order.items[index].product] = detail;
        }
      });

      setProductDetails(productDetailsMap);
      setVariantDetails(variantDetailsMap);
    } catch (err) {
      console.error("Error fetching product details:", err);
      setSnackbar({
        open: true,
        message: "Error loading some product details",
        severity: "error",
      });
    } finally {
      setLoadingProducts(false);
      setOpenDialog(true);
      handleMenuClose();
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
    setProductDetails({});
  };

  // Open status change dialog
  const handleOpenStatusDialog = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus || "");
    setOpenStatusDialog(true);
    handleMenuClose();
  };

  // Close status change dialog
  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
    setSelectedOrder(null);
    setNewStatus("");
  };

  // Open tracking dialog
  const handleOpenTrackingDialog = (order) => {
    setSelectedOrder(order);
    setNewStatus("DISPATCHED");
    setTrackingNumber("");
    setOpenTrackingDialog(true);
    handleMenuClose();
  };

  // Close tracking dialog
  const handleCloseTrackingDialog = () => {
    setOpenTrackingDialog(false);
    setSelectedOrder(null);
    setNewStatus("");
    setTrackingNumber("");
  };

  // Handle status change
  const handleStatusChange = async () => {
    if (!selectedOrder || !newStatus) return;

    setStatusLoading(true);
    try {
      const response = await updateOrderStatus(selectedOrder._id, newStatus);

      // Update local state to reflect the change
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === selectedOrder._id
            ? { ...order, orderStatus: newStatus }
            : order
        )
      );

      setSnackbar({
        open: true,
        message: `Order status updated to ${newStatus}`,
        severity: "success",
      });

      // Refresh orders list to ensure we have the latest data
      loadOrders();

      handleCloseStatusDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || "Failed to update order status",
        severity: "error",
      });
    } finally {
      setStatusLoading(false);
    }
  };

  // Handle tracking status change
  const handleTrackingStatusChange = async () => {
    if (!selectedOrder || !trackingNumber.trim()) {
      setSnackbar({
        open: true,
        message: "Please enter a tracking number",
        severity: "error",
      });
      return;
    }

    setTrackingLoading(true);
    try {
      const response = await updateOrderStatus(
        selectedOrder._id,
        "DISPATCHED",
        trackingNumber.trim()
      );

      // Update local state to reflect the change
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === selectedOrder._id
            ? {
                ...order,
                orderStatus: "DISPATCHED",
                trackingInfo: { trackingNumber: trackingNumber.trim() },
              }
            : order
        )
      );

      setSnackbar({
        open: true,
        message: `Order status updated to DISPATCHED with tracking number: ${trackingNumber}`,
        severity: "success",
      });

      // Refresh orders list to ensure we have the latest data
      loadOrders();

      handleCloseTrackingDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || "Failed to update order status",
        severity: "error",
      });
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const getStatusDescription = (status) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case "ORDER PLACED":
      case "PENDING":
        return "Order has been confirmed and is being processed";
      case "DISPATCHED":
        return "Order is on the way to delivery";
      case "DELIVERED":
        return "Order has been successfully delivered";
      case "CANCELLED":
      case "CANCELED":
        return "Order has been canceled";
      // case 'RETURNED':
      //   return 'Order has been returned';
      default:
        return "Status unknown";
    }
  };

  // Date filter functions
  const isWithinDateRange = (date, range) => {
    const orderDate = new Date(date);
    const now = new Date();

    switch (range) {
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= weekAgo;
      case "month":
        const monthAgo = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate()
        );
        return orderDate >= monthAgo;
      case "year":
        const yearAgo = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate()
        );
        return orderDate >= yearAgo;
      default:
        return true;
    }
  };

  const handleDateFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setDateFilter(newFilter);
    }
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const filteredOrders = orders.filter((order) => {
    // Apply status filter
    if (statusFilter !== "all") {
      const orderStatus = order.orderStatus?.toUpperCase();
      const filterStatus = statusFilter.toUpperCase();

      // Special handling for RETURNED status
      // if (filterStatus === 'RETURNED') {
      //   return order.returnedItems?.length > 0 || orderStatus === 'RETURNED';
      // }

      if (orderStatus !== filterStatus) {
        return false;
      }
    }

    // Apply date filter
    if (!isWithinDateRange(order.createdAt, dateFilter)) {
      return false;
    }

    // Apply search filter
    if (!searchQuery) return true;

    const searchFields = [
      order._id,
      order.user?.name,
      order.orderStatus,
      order.paymentMethod,
      order.paymentStatus,
      order.finalAmount?.toString(),
      order.shippingAddress?.address,
      order.shippingAddress?.city,
      order.shippingAddress?.state,
      order.shippingAddress?.pincode,
    ];

    const searchTermLower = searchQuery.toLowerCase();
    return searchFields.some(
      (field) =>
        field && field.toString().toLowerCase().includes(searchTermLower)
    );
  });

  // Add responsive styles to print functions
  const getResponsivePrintStyles = () => `
    @media screen and (max-width: 600px) {
      body { margin: 10px; }
      .header { margin-bottom: 20px; }
      .header h1 { font-size: 24px; }
      .section-title { font-size: 16px; }
      table { font-size: 14px; }
      th, td { padding: 6px; }
      .info-row { flex-direction: column; gap: 4px; }
      .info-row .label { margin-bottom: 2px; }
    }
  `;

  // Modify handleBulkPrint and handlePrint to include responsive styles
  const handleBulkPrint = () => {
    const printWindow = window.open("", "_blank");
    const now = new Date().toLocaleDateString("en-GB");

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Orders Report - ${dateFilter.toUpperCase()}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
              color: white;
              padding: 30px;
              text-align: center;
              position: relative;
            }
            .logo {
              position: absolute;
              left: 30px;
              top: 50%;
              transform: translateY(-50%);
              width: 60px;
              height: 60px;
              background: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            .logo img {
              width: 40px;
              height: 40px;
              object-fit: contain;
            }
            .header h1 { 
              margin: 0; 
              font-size: 2.5rem; 
              font-weight: 700;
              text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .header p { 
              margin: 10px 0 0 0; 
              font-size: 1.1rem; 
              opacity: 0.9;
            }
            .content { padding: 30px; }
            .section { 
              margin-bottom: 30px; 
              page-break-inside: avoid; 
            }
            .section-title { 
              color: #2c3e50; 
              font-size: 1.4rem; 
              font-weight: 600; 
              margin-bottom: 20px; 
              padding-bottom: 10px; 
              border-bottom: 3px solid #3498db;
              position: relative;
            }
            .section-title::after {
              content: '';
              position: absolute;
              bottom: -3px;
              left: 0;
              width: 50px;
              height: 3px;
              background: #e74c3c;
            }
            .info-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 12px; 
              padding: 8px 0;
              border-bottom: 1px solid #ecf0f1;
            }
            .label { 
              color: #7f8c8d; 
              font-weight: 500;
            }
            .value { 
              font-weight: 600; 
              color: #2c3e50;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px; 
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            th, td { 
              border: none; 
              padding: 15px 12px; 
              text-align: left; 
            }
            th { 
              background: linear-gradient(135deg, #3498db, #2980b9);
              color: white;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 0.9rem;
              letter-spacing: 0.5px;
            }
            tr:nth-child(even) { background-color: #f8f9fa; }
            tr:hover { background-color: #e8f4f8; }
            .order-card { 
              border: none;
              border-radius: 12px;
              padding: 25px; 
              margin-bottom: 25px; 
              page-break-inside: avoid; 
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              box-shadow: 0 4px 15px rgba(0,0,0,0.08);
              position: relative;
              overflow: hidden;
            }
            .order-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
            }
            .status-chip { 
              padding: 8px 16px; 
              border-radius: 25px; 
              display: inline-block; 
              font-weight: 600;
              font-size: 0.9rem;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .summary-box { 
              border: none;
              border-radius: 12px;
              padding: 25px; 
              margin-bottom: 30px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
            }
            .summary-box .section-title {
              color: white;
              border-bottom-color: rgba(255,255,255,0.3);
            }
            .summary-box .section-title::after {
              background: #ffd700;
            }
            .summary-box .label { color: rgba(255,255,255,0.8); }
            .summary-box .value { color: white; font-size: 1.1rem; }
            .shipping-info {
              background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
              padding: 20px;
              border-radius: 8px;
              margin: 15px 0;
            }
            .shipping-info h4 {
              margin: 0 0 10px 0;
              color: #2c3e50;
              font-size: 1.1rem;
            }
            .shipping-info p {
              margin: 5px 0;
              color: #34495e;
            }
            .tracking-info {
              background: #e8f5e8;
              padding: 10px 15px;
              border-radius: 6px;
              border-left: 4px solid #27ae60;
              margin-top: 10px;
            }
            .tracking-info strong {
              color: #27ae60;
            }
            @media print {
              body { 
                background: white; 
                margin: 0; 
                padding: 0;
              }
              .container {
                box-shadow: none;
                border-radius: 0;
              }
              .no-print { display: none; }
              .page-break { page-break-before: always; }
            }
            ${getResponsivePrintStyles()}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <img src="/PicknowLogo.png" alt="Picknow Logo" onerror="this.style.display='none'">
              </div>
              <h1>Orders Report</h1>
              <p>Period: ${dateFilter.toUpperCase()}</p>
              <p>Generated on: ${now}</p>
            </div>

            <div class="content">
              <div class="summary-box">
                <div class="section-title">Summary</div>
                <div class="info-row">
                  <span class="label">Total Orders:</span>
                  <span class="value">${filteredOrders.length}</span>
                </div>
                <div class="info-row">
                  <span class="label">Total Amount:</span>
                  <span class="value">₹${filteredOrders
                    .reduce((sum, order) => sum + (order.finalAmount || 0), 0)
                    .toFixed(2)}</span>
                </div>
              </div>

              ${filteredOrders
                .map(
                  (order, index) => `
                ${index > 0 ? '<div class="page-break"></div>' : ""}
                <div class="order-card">
                  <div class="section-title">Order #${order._id}</div>
                  
                  <div class="info-row">
                    <span class="label">Date:</span>
                    <span class="value">${new Date(
                      order.createdAt
                    ).toLocaleDateString("en-GB")}</span>
                  </div>
                  
                  <div class="info-row">
                    <span class="label">Customer:<strong> ${
                      order.user?.name || "N/A"
                    }</strong></span>
                  </div>
                  
                  <div class="info-row">
                    <span class="label">Status:</span>
                    <span class="status-chip" style="background-color: ${
                      theme.palette[getStatusColor(order.orderStatus)].light
                    }; color: ${
                    theme.palette[getStatusColor(order.orderStatus)].dark
                  }">
                      ${getDisplayStatus(order.orderStatus)}
                    </span>
                  </div>

                  ${
                    order.shippingAddress
                      ? `
                  <div class="shipping-info">
                    <h4>Shipping Address</h4>
                    <p><strong>${order.shippingAddress.name}</strong></p>
                    <p>${order.shippingAddress.address}</p>
                    <p>${order.shippingAddress.city}, ${
                          order.shippingAddress.state
                        } - ${order.shippingAddress.pincode}</p>
                    <p>Contact: ${order.shippingAddress.contact || "N/A"}</p>
                    ${
                      order.trackingInfo?.trackingNumber
                        ? `
                    <div class="tracking-info">
                      <strong>Tracking ID:</strong> ${order.trackingInfo.trackingNumber}
                    </div>
                    `
                        : ""
                    }
                  </div>
                  `
                      : ""
                  }

                  <div class="section" style="margin-top: 20px;">
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${order.items
                          .map((item) => {
                            const productDetail = item.product
                              ? productDetails[item.product]
                              : null;
                            const isCombo = item.product?.startsWith("combo-");
                            const productName = productDetail
                              ? isCombo
                                ? productDetail.comboName
                                : productDetail.pName
                              : isCombo
                              ? "Combo Package"
                              : "Product Not Found";

                            return `
                            <tr>
                              <td>${productName}</td>
                              <td>${item.quantity}</td>
                              <td>₹${item.price}</td>
                              <td>₹${item.price * item.quantity}</td>
                            </tr>
                          `;
                          })
                          .join("")}
                      </tbody>
                    </table>
                  </div>

                  <div style="margin-top: 20px;">
                    <div class="info-row">
                      <span class="label">Subtotal:</span>
                      <span class="value">₹${order.totalAmount}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Platform Fee:</span>
                      <span class="value">₹${order.tax}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Shipping:</span>
                      <span class="value">₹${order.shippingCharges}</span>
                    </div>
                    ${
                      order.kaitCoinsUsed > 0
                        ? `
                    <div class="info-row">
                      <span class="label">Wallet Used:</span>
                      <span class="value" style="color: #e74c3c">-₹${order.kaitCoinsUsed}</span>
                    </div>
                    `
                        : ""
                    }
                    <div class="info-row" style="margin-top: 15px; font-size: 1.2rem; border-top: 2px solid #3498db; padding-top: 10px;">
                      <span class="label"><strong>Total:</strong></span>
                      <span class="value"><strong>₹${
                        order.finalAmount
                      }</strong></span>
                    </div>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Modify handlePrint to include responsive styles
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const orderDate = new Date(selectedOrder.createdAt).toLocaleDateString(
      "en-GB"
    );

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${selectedOrder._id}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
            }
            .container {
              max-width: 1000px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
              color: white;
              padding: 30px;
              text-align: center;
              position: relative;
            }
            .logo {
              position: absolute;
              left: 30px;
              top: 50%;
              transform: translateY(-50%);
              width: 60px;
              height: 60px;
              background: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            .logo img {
              width: 40px;
              height: 40px;
              object-fit: contain;
            }
            .header h1 { 
              margin: 0; 
              font-size: 2.5rem; 
              font-weight: 700;
              text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .header p { 
              margin: 10px 0 0 0; 
              font-size: 1.1rem; 
              opacity: 0.9;
            }
            .content { padding: 30px; }
            .section { 
              margin-bottom: 30px; 
              page-break-inside: avoid; 
            }
            .section-title { 
              color: #2c3e50; 
              font-size: 1.4rem; 
              font-weight: 600; 
              margin-bottom: 20px; 
              padding-bottom: 10px; 
              border-bottom: 3px solid #3498db;
              position: relative;
            }
            .section-title::after {
              content: '';
              position: absolute;
              bottom: -3px;
              left: 0;
              width: 50px;
              height: 3px;
              background: #e74c3c;
            }
            .info-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 12px; 
              padding: 8px 0;
              border-bottom: 1px solid #ecf0f1;
            }
            .label { 
              color: #7f8c8d; 
              font-weight: 500;
            }
            .value { 
              font-weight: 600; 
              color: #2c3e50;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px; 
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            th, td { 
              border: none; 
              padding: 15px 12px; 
              text-align: left; 
            }
            th { 
              background: linear-gradient(135deg, #3498db, #2980b9);
              color: white;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 0.9rem;
              letter-spacing: 0.5px;
            }
            tr:nth-child(even) { background-color: #f8f9fa; }
            tr:hover { background-color: #e8f4f8; }
            .status-chip { 
              padding: 8px 16px; 
              border-radius: 25px; 
              display: inline-block; 
              font-weight: 600;
              font-size: 0.9rem;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .from-section { 
              background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
              padding: 25px; 
              border-radius: 12px; 
              margin-bottom: 25px;
              box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            }
            .from-section h3 {
              color: #2c3e50;
              margin: 0 0 15px 0;
              font-size: 1.3rem;
              font-weight: 600;
            }
            .from-section p {
              margin: 8px 0;
              color: #34495e;
              font-weight: 500;
            }
            .shipping-info {
              background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
              padding: 20px;
              border-radius: 8px;
              margin: 15px 0;
            }
            .shipping-info h4 {
              margin: 0 0 10px 0;
              color: #2c3e50;
              font-size: 1.1rem;
            }
            .shipping-info p {
              margin: 5px 0;
              color: #34495e;
            }
            .tracking-info {
              background: #e8f5e8;
              padding: 10px 15px;
              border-radius: 6px;
              border-left: 4px solid #27ae60;
              margin-top: 10px;
            }
            .tracking-info strong {
              color: #27ae60;
            }
            .total-section { 
              margin-top: 30px; 
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              padding: 25px;
              border-radius: 12px;
              box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            }
            .total-section .info-row:last-child {
              border-top: 2px solid #3498db;
              padding-top: 15px;
              margin-top: 15px;
              font-size: 1.2rem;
            }
            @media print {
              body { 
                background: white; 
                margin: 0; 
                padding: 0;
              }
              .container {
                box-shadow: none;
                border-radius: 0;
              }
              .no-print { display: none; }
            }
            ${getResponsivePrintStyles()}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <img src="/PicknowLogo.png" alt="Picknow Logo" onerror="this.style.display='none'">
              </div>
              <h1>Invoice</h1>
              <p>Order ID: ${selectedOrder._id}</p>
              <p>Date: ${orderDate}</p>
            </div>

            <div class="content">
              <div class="from-section">
                <h3>From</h3>
                <p><strong>Picknow</strong></p>
                <p>India</p>
                <p>Phone: +91 7092770118</p>
                <p>Email: support@picknow.in</p>
              </div>

              <div class="section">
                <div class="section-title">Customer Information</div>
                <div class="info-row">
                  <span class="label">Name: <strong>${
                    selectedOrder.user?.name || "N/A"
                  }</strong></span>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Shipping Address</div>
                <div class="shipping-info">
                  <h4>Delivery Address</h4>
                  <p><strong>${
                    selectedOrder.shippingAddress?.name || "N/A"
                  }</strong></p>
                  <p>${selectedOrder.shippingAddress?.address || "N/A"}</p>
                  <p>${selectedOrder.shippingAddress?.city || "N/A"}, ${
      selectedOrder.shippingAddress?.state || "N/A"
    } - ${selectedOrder.shippingAddress?.pincode || "N/A"}</p>
                  <p>Contact: ${
                    selectedOrder.shippingAddress?.contact || "N/A"
                  }</p>
                  ${
                    selectedOrder.trackingInfo?.trackingNumber
                      ? `
                  <div class="tracking-info">
                    <strong>Tracking ID:</strong> ${selectedOrder.trackingInfo.trackingNumber}
                  </div>
                  `
                      : ""
                  }
                </div>
              </div>

              <div class="section">
                <div class="section-title">Order Status</div>
                <div class="info-row">
                  <span class="label">Status:</span>
                  <span class="status-chip" style="background-color: ${
                    theme.palette[getStatusColor(selectedOrder.orderStatus)]
                      .light
                  }; color: ${
      theme.palette[getStatusColor(selectedOrder.orderStatus)].dark
    }">
                    ${getDisplayStatus(selectedOrder.orderStatus)}
                  </span>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Products</div>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                  ${selectedOrder.items
                    .map((item) => {
                      const product = productDetails[item.product];
                      const isCombo = item.product?.startsWith("combo-");
                      const variant = variantDetails[item.variant];
                      
                      // Build variant display text
                      let variantText = "";
                      if (variant) {
                        if (variant.type) {
                          variantText = `${variant.type}${variant.size ? ` - ${variant.size}` : ""}`;
                        } else if (variant.attributes) {
                          const attrs = [
                            variant.attributes.size,
                            variant.attributes.weight,
                            variant.attributes.color,
                          ].filter(Boolean).join(" ");
                          variantText = attrs || "";
                        }
                      }

                      return `
                      <tr>
                        <td>
                          ${
                            isCombo
                              ? product?.comboName || "Combo Package"
                              : product?.pName || "Product Not Found"
                          }
                          ${variantText ? `<br><small style="color: #7f8c8d;">Variant: ${variantText}</small>` : ""}
                          ${
                            isCombo && product?.products
                              ? `<br><small style="color: #7f8c8d;">Includes: ${product.products
                                  .map(
                                    (p) =>
                                      `${p.quantity}x ${
                                        p.product?.pName || "Product"
                                      }`
                                  )
                                  .join(", ")}</small>`
                              : ""
                          }
                        </td>
                        <td>${item.quantity}</td>
                        <td>₹${item.price}</td>
                        <td>₹${item.price * item.quantity}</td>
                      </tr>
                    `;
                    })
                    .join("")}
                  </tbody>
                </table>
              </div>

              <div class="section total-section">
                <div class="section-title">Order Summary</div>
                <div class="info-row">
                  <span class="label">Subtotal:</span>
                  <span class="value">₹${
                    selectedOrder.totalAmount?.toFixed(2) || "0.00"
                  }</span>
                </div>
                <div class="info-row">
                  <span class="label">Platform Fee:</span>
                  <span class="value">₹${
                    selectedOrder.tax?.toFixed(2) || "8.00"
                  }</span>
                </div>
                <div class="info-row">
                  <span class="label">Shipping Charges:</span>
                  <span class="value">₹${
                    selectedOrder.shippingCharges?.toFixed(2) || "0.00"
                  }</span>
                </div>
                ${
                  selectedOrder.kaitCoinsUsed > 0
                    ? `
                <div class="info-row">
                  <span class="label">Wallet Used:</span>
                  <span class="value" style="color: #e74c3c">-₹${
                    selectedOrder.kaitCoinsUsed?.toFixed(2) || "0.00"
                  }</span>
                </div>
                `
                    : ""
                }
                <div class="info-row">
                  <span class="label"><strong>Total Amount:</strong></span>
                  <span class="value"><strong>₹${
                    getNetPayableAmount(selectedOrder).toFixed(2)
                  }</strong></span>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
  // return print code
  // ${selectedOrder.orderStatus === 'RETURNED' && `
  //   <div class="section">
  //     <div class="section-title">Return Information</div>
  //     <div class="info-row">
  //       <span class="label">Return Date:</span>
  //       <span class="value">${selectedOrder.returnDate ? new Date(selectedOrder.returnDate).toLocaleDateString() : 'N/A'}</span>
  //     </div>
  //     <div class="info-row">
  //       <span class="label">Return Reason:</span>
  //       <span class="value">${selectedOrder.returnReason || 'N/A'}</span>
  //     </div>
  //   </div>
  // `}
  const productTotal =
    selectedOrder?.items?.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    ) || 0;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography
          variant="h4"
          sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }}
        >
          Orders Management
        </Typography>
        {newOrdersCount > 0 && (
          <Chip
            icon={<ShoppingCartIcon />}
            label={`${newOrdersCount} New Order${newOrdersCount > 1 ? 's' : ''}`}
            color="error"
            sx={{
              fontWeight: 600,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: '0 0 0 0 rgba(211, 47, 47, 0.7)',
                },
                '70%': {
                  boxShadow: '0 0 0 10px rgba(211, 47, 47, 0)',
                },
                '100%': {
                  boxShadow: '0 0 0 0 rgba(211, 47, 47, 0)',
                },
              },
            }}
          />
        )}
      </Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
        Total Orders: {orders.length}
      </Typography>

      <Box
        sx={{
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          alignItems: { xs: "stretch", md: "center" },
        }}
      >
        <TextField
          sx={{ flex: 1 }}
          variant="outlined"
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            width: { xs: "100%", md: "auto" },
          }}
        >
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="Status"
              size="small"
            >
              <MenuItem value="all">All Status</MenuItem>
              {orderStatusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <ToggleButtonGroup
            value={dateFilter}
            exclusive
            onChange={handleDateFilterChange}
            aria-label="date filter"
            sx={{
              display: "flex",
              flexWrap: { xs: "wrap", sm: "nowrap" },
              "& .MuiToggleButton-root": {
                flex: { xs: "1 1 calc(50% - 8px)", sm: "none" },
                whiteSpace: "nowrap",
              },
            }}
          >
            <ToggleButton value="all" aria-label="all dates">
              All
            </ToggleButton>
            <ToggleButton value="week" aria-label="last week">
              Week
            </ToggleButton>
            <ToggleButton value="month" aria-label="last month">
              Month
            </ToggleButton>
            <ToggleButton value="year" aria-label="last year">
              Year
            </ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handleBulkPrint}
            disabled={filteredOrders.length === 0}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Print {dateFilter !== "all" ? dateFilter : ""} Report
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <>
          {/* Desktop view */}
{/* Desktop view */}
<Box sx={{ display: { xs: "none", md: "block" } }}>
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Date</TableCell>
          <TableCell>Customer Name</TableCell>
          <TableCell>Final Amount</TableCell>
          <TableCell>KaitcoinUsed</TableCell>
          <TableCell>INR</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Order ID</TableCell>
          <TableCell align="right">Action</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {filteredOrders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} align="center">
              No orders found
            </TableCell>
          </TableRow>
        ) : (
          filteredOrders.map((order) => (
            <TableRow key={order._id}>
              <TableCell>
                {new Date(order.createdAt).toLocaleDateString("en-GB")}
              </TableCell>
              <TableCell>{order.user?.name || "N/A"}</TableCell>
              <TableCell>₹{order.finalAmount.toFixed(2)}</TableCell>
              <TableCell>
                {order.kaitCoinsUsed > 0 
                  ? `₹${order.kaitCoinsUsed.toFixed(2)}` 
                  : "₹0.00"}
              </TableCell>
              <TableCell>
                ₹{getNetPayableAmount(order).toFixed(2)}
              </TableCell>
              <TableCell>
                <Chip
                  icon={getStatusIcon(order.orderStatus)}
                  label={getDisplayStatus(order.orderStatus) || "N/A"}
                  color={getStatusColor(order.orderStatus)}
                  size="small"
                  sx={{
                    "& .MuiChip-icon": { color: "inherit" },
                    fontWeight: 600,
                  }}
                />
              </TableCell>
              <TableCell>{order._id}</TableCell>
              <TableCell align="right">
                <IconButton onClick={(e) => handleMenuClick(e, order)}>
                  <MoreVertIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </TableContainer>
</Box>

          {/* Mobile view */}
          <Box sx={{ display: { xs: "block", md: "none" } }}>
            {filteredOrders.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography color="text.secondary">No orders found</Typography>
              </Paper>
            ) : (
              filteredOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onActionClick={handleMenuClick}
                />
              ))
            )}
          </Box>
        </>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewOrder(selectedOrderForMenu)}>
          <VisibilityIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
        {selectedOrderForMenu &&
          !["CANCELLED", "DELIVERED", "RETURNED"].includes(
            selectedOrderForMenu.orderStatus?.toUpperCase()
          ) && (
            <MenuItem
              onClick={() => handleOpenStatusDialog(selectedOrderForMenu)}
            >
              <LocalShippingIcon sx={{ mr: 1 }} /> Change Status
            </MenuItem>
          )}
        {selectedOrderForMenu &&
          selectedOrderForMenu.orderStatus === "ORDER PLACED" && (
            <MenuItem
              onClick={() => handleOpenTrackingDialog(selectedOrderForMenu)}
            >
              <LocalShippingIcon sx={{ mr: 1 }} /> Dispatch Order
            </MenuItem>
          )}
        {selectedOrderForMenu &&
          (selectedOrderForMenu.orderStatus === "ORDER PLACED" ||
            selectedOrderForMenu.orderStatus === "PENDING") && (
            <MenuItem
              onClick={() => {
                handleMenuClose();
                if (
                  window.confirm("Are you sure you want to cancel this order?")
                ) {
                  updateOrderStatus(selectedOrderForMenu._id, "CANCELLED")
                    .then(() => {
                      setSnackbar({
                        open: true,
                        message: "Order canceled successfully",
                        severity: "success",
                      });
                      loadOrders();
                    })
                    .catch((err) => {
                      setSnackbar({
                        open: true,
                        message: err.message || "Failed to cancel order",
                        severity: "error",
                      });
                    });
                }
              }}
            >
              <EditIcon sx={{ mr: 1 }} /> Cancel Order
            </MenuItem>
          )}
      </Menu>

      {/* Order Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            "& .MuiDialogTitle-root": {
              borderBottom: "1px solid",
              borderColor: "divider",
              pb: 2,
            },
          },
        }}
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Order Details
            </Typography>
            <Chip
              icon={getStatusIcon(selectedOrder?.orderStatus)}
              label={getDisplayStatus(selectedOrder?.orderStatus) || "N/A"}
              color={getStatusColor(selectedOrder?.orderStatus)}
              sx={{
                "& .MuiChip-icon": { color: "inherit" },
                fontWeight: 600,
                px: 1,
              }}
            />
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedOrder && (
            <Box>
              <Grid container spacing={3}>
                {/* Order Information */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, height: "100%", bgcolor: "#f8fafc" }}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ color: "primary.main", fontWeight: 600 }}
                    >
                      Order Information
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography color="text.secondary">Order ID</Typography>
                        <Typography sx={{ fontWeight: 500 }}>
                          {selectedOrder._id}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography color="text.secondary">Customer</Typography>
                        <Typography sx={{ fontWeight: 500 }}>
                          {selectedOrder.user?.name || "N/A"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography color="text.secondary">Date</Typography>
                        <Typography sx={{ fontWeight: 500 }}>
                          {new Date(selectedOrder.createdAt).toLocaleDateString(
                            "en-GB"
                          )}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography color="text.secondary">
                          Payment Method
                        </Typography>
                        <Typography sx={{ fontWeight: 500 }}>
                          {selectedOrder.paymentMethod}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography color="text.secondary">
                          Payment Status
                        </Typography>
                        <Chip
                          label={selectedOrder.paymentStatus}
                          color={
                            selectedOrder.paymentStatus === "PAID"
                              ? "success"
                              : "warning"
                          }
                          size="small"
                        />
                      </Box>
                      {selectedOrder.useKaitCoins &&
                        selectedOrder.kaitCoinsUsed > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography color="text.secondary">
                              Wallet Used
                            </Typography>
                            <Typography sx={{ fontWeight: 500 }}>
                              ₹{Number(selectedOrder.kaitCoinsUsed).toFixed(2)}
                            </Typography>
                          </Box>
                        )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Shipping Information */}
                {selectedOrder.shippingAddress && (
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: "100%", bgcolor: "#f8fafc" }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ color: "primary.main", fontWeight: 600 }}
                      >
                        Shipping Address
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Typography>
                          {selectedOrder.shippingAddress.name}
                        </Typography>
                        <Typography sx={{ fontWeight: 500 }}>
                          {selectedOrder.shippingAddress.address}
                        </Typography>

                        <Typography>
                          {selectedOrder.shippingAddress.city},{" "}
                          {selectedOrder.shippingAddress.state}
                        </Typography>
                        <Typography>
                          {selectedOrder.shippingAddress.contact || "N/A"}
                        </Typography>
                        <Typography>
                          {selectedOrder.shippingAddress.pincode}
                        </Typography>
                        <Typography>
                          Tracking ID:{" "}
                          {selectedOrder.trackingInfo?.trackingNumber || "N/A"}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                )}

                {/* Products Section */}
                <Grid item xs={12}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: "primary.main", fontWeight: 600, mt: 2 }}
                  >
                    Products
                  </Typography>
                  {loadingProducts ? (
                    <Box display="flex" justifyContent="center" my={4}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {selectedOrder.items.map((item, index) => {
                        const productDetail = item.product
                          ? productDetails[item.product]
                          : null;
                        const isCombo = item.product?.startsWith("combo-");

                        // Handle missing product details
                        if (!productDetail) {
                          return (
                            <Grid item xs={12} key={index}>
                              <Card
                                sx={{
                                  display: "flex",
                                  borderRadius: 2,
                                  overflow: "hidden",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 200,
                                    height: 200,
                                    bgcolor: "#f8fafc",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Typography color="text.secondary">
                                    Image not available
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                  }}
                                >
                                  <CardContent sx={{ flex: "1 0 auto", pb: 1 }}>
                                    <Typography
                                      variant="h6"
                                      sx={{ fontWeight: 600, mb: 1 }}
                                    >
                                      {isCombo
                                        ? "Combo (Details not available)"
                                        : "Product Not Found"}
                                    </Typography>
                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                      <Grid item xs={6} md={3}>
                                        <Typography
                                          color="text.secondary"
                                          variant="body2"
                                        >
                                          Quantity
                                        </Typography>
                                        <Typography
                                          variant="body1"
                                          sx={{ fontWeight: 500 }}
                                        >
                                          {item.quantity}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6} md={3}>
                                        <Typography
                                          color="text.secondary"
                                          variant="body2"
                                        >
                                          Price
                                        </Typography>
                                        <Typography
                                          variant="body1"
                                          sx={{ fontWeight: 500 }}
                                        >
                                          ₹{item.price} × {item.quantity} = ₹
                                          {item.price * item.quantity}
                                        </Typography>
                                      </Grid>
                                    </Grid>
                                  </CardContent>
                                </Box>
                              </Card>
                            </Grid>
                          );
                        }

                        return (
                          <Grid item xs={12} key={index}>
                            <Card
                              sx={{
                                display: "flex",
                                borderRadius: 2,
                                overflow: "hidden",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                              }}
                            >
                              <Box
                                sx={{
                                  width: 200,
                                  height: 200,
                                  position: "relative",
                                }}
                              >
                                {productDetail?.pImage?.[0] && (
                                  <CardMedia
                                    component="img"
                                    image={productDetail.pImage[0]}
                                    alt={
                                      isCombo
                                        ? productDetail?.comboName || "Combo"
                                        : productDetail?.pName || "Product"
                                    }
                                    sx={{
                                      height: "100%",
                                      objectFit: "contain",
                                      bgcolor: "#f8fafc",
                                    }}
                                  />
                                )}
                                {!isCombo && productDetail?.pOffer > 0 && (
                                  <Chip
                                    label={`${productDetail.pOffer}% OFF`}
                                    color="error"
                                    size="small"
                                    sx={{
                                      position: "absolute",
                                      top: 8,
                                      right: 8,
                                      fontWeight: 600,
                                    }}
                                  />
                                )}
                              </Box>
                              <Box
                                sx={{
                                  flex: 1,
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <CardContent sx={{ flex: "1 0 auto", pb: 1 }}>
                                  <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 600, mb: 1 }}
                                  >
                                    {isCombo
                                      ? productDetail?.comboName || "Combo"
                                      : productDetail?.pName ||
                                        "Product Not Found"}
                                  </Typography>
                                  <Typography
                                    color="text.secondary"
                                    gutterBottom
                                  >
                                    {isCombo
                                      ? "Combo Package"
                                      : productDetail?.pShortDescription}
                                  </Typography>

                                  {isCombo ? (
                                    <Box sx={{ mt: 2 }}>
                                      <Typography
                                        variant="subtitle2"
                                        color="text.secondary"
                                        gutterBottom
                                      >
                                        Includes:
                                      </Typography>
                                      <List dense sx={{ py: 0 }}>
                                        {productDetail?.products?.map(
                                          (comboItem, comboIndex) => (
                                            <ListItem
                                              key={comboIndex}
                                              sx={{ py: 0.5 }}
                                            >
                                              <ListItemText
                                                primary={`${
                                                  comboItem.quantity
                                                }x ${
                                                  comboItem.product?.pName ||
                                                  "Product"
                                                }`}
                                                primaryTypographyProps={{
                                                  variant: "body2",
                                                }}
                                              />
                                            </ListItem>
                                          )
                                        )}
                                      </List>
                                    </Box>
                                  ) : (
                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                      <Grid item xs={6} md={3}>
                                        <Typography
                                          color="text.secondary"
                                          variant="body2"
                                        >
                                          Quantity
                                        </Typography>
                                        <Typography
                                          variant="body1"
                                          sx={{ fontWeight: 500 }}
                                        >
                                          {item.quantity}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6} md={3}>
                                        <Typography
                                          color="text.secondary"
                                          variant="body2"
                                        >
                                          Price
                                        </Typography>
                                        <Typography
                                          variant="body1"
                                          sx={{ fontWeight: 500 }}
                                        >
                                          ₹{item.price} × {item.quantity} = ₹
                                          {item.price * item.quantity}
                                        </Typography>
                                      </Grid>
                                      {item.variant && (
                                        <Grid item xs={6} md={3}>
                                          <Typography
                                            color="text.secondary"
                                            variant="body2"
                                          >
                                            Variant
                                          </Typography>
                                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {variantDetails[item.variant]?.type
                                              ? `${variantDetails[item.variant]?.type} - ${variantDetails[item.variant]?.size || ""}`
                                              : `${[
                                                  variantDetails[item.variant]?.attributes?.size,
                                                  variantDetails[item.variant]?.attributes?.weight,
                                                  variantDetails[item.variant]?.attributes?.color,
                                                ]
                                                  .filter(Boolean)
                                                  .join(" ")}`|| "N/A"}
                                          </Typography>

                                        </Grid>
                                      )}
                                      {productDetail && !isCombo && (
                                        <Grid item xs={6} md={3}>
                                          <Typography
                                            color="text.secondary"
                                            variant="body2"
                                          >
                                            Brand
                                          </Typography>
                                          <Typography
                                            variant="body1"
                                            sx={{ fontWeight: 500 }}
                                          >
                                            {productDetail.pBrand}
                                          </Typography>
                                        </Grid>
                                      )}
                                    </Grid>
                                  )}
                                </CardContent>
                              </Box>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </Grid>

                {/* Order Summary */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, mt: 2, bgcolor: "#f8fafc" }}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ color: "primary.main", fontWeight: 600 }}
                    >
                      Order Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography color="text.secondary">
                              product Total
                            </Typography>
                            <Typography>₹{productTotal.toFixed(2)}</Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography color="text.secondary">
                              Platform Fee
                            </Typography>
                            <Typography>
                              ₹{selectedOrder.tax?.toFixed(2) || "8.00"}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography color="text.secondary">
                              Subtotal
                            </Typography>
                            <Typography>
                              ₹{selectedOrder.totalAmount?.toFixed(2) || "0.00"}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography color="text.secondary">
                              Shipping Charges
                            </Typography>
                            <Typography>
                              ₹
                              {selectedOrder.shippingCharges?.toFixed(2) ||
                                "0.00"}
                            </Typography>
                          </Box>
                          {/* <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography color="text.secondary">
                              Discount
                            </Typography>
                            <Typography color="error.main">
                              -₹{selectedOrder.discount?.toFixed(2) || "0.00"}
                            </Typography>
                          </Box> */}
                          {selectedOrder.useKaitCoins &&
                            selectedOrder.kaitCoinsUsed > 0 && (
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Typography color="text.secondary">
                                  Wallet Used
                                </Typography>
                                <Typography color="error.main">
                                  -₹
                                  {Number(selectedOrder.kaitCoinsUsed).toFixed(
                                    2
                                  )}
                                </Typography>
                              </Box>
                            )}
                          <Divider sx={{ my: 1 }} />
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Total Amount (INR)
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              ₹{getNetPayableAmount(selectedOrder).toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {selectedOrder.orderStatus === "RETURNED" && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, mt: 2, bgcolor: "#fef2f2" }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ color: "#991b1b", fontWeight: 600 }}
                      >
                        Return Information
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography color="text.secondary">
                            Return Date
                          </Typography>
                          <Typography sx={{ fontWeight: 500 }}>
                            {selectedOrder.returnDate
                              ? new Date(
                                  selectedOrder.returnDate
                                ).toLocaleDateString("en-GB")
                              : "N/A"}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography color="text.secondary">
                            Return Reason
                          </Typography>
                          <Typography sx={{ fontWeight: 500 }}>
                            {selectedOrder.returnReason || "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          {/* Return Products Button - Commented out
          {selectedOrder && !['CANCELLED', 'RETURNED'].includes(selectedOrder.orderStatus?.toUpperCase()) && (
            <Button
              onClick={handleOpenReturnDialog}
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              sx={{ mr: 1, borderRadius: 2 }}
            >
              Return Products
            </Button>
          )}
          */}
          <Button
            onClick={handlePrint}
            variant="outlined"
            startIcon={<PrintIcon />}
            sx={{ mr: 1, borderRadius: 2 }}
          >
            Print
          </Button>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog
        open={openStatusDialog}
        onClose={handleCloseStatusDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6">Change Order Status</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Select the new status for this order
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Current Status
                </Typography>
                <Chip
                  icon={getStatusIcon(selectedOrder.orderStatus)}
                  label={getDisplayStatus(selectedOrder.orderStatus) || "N/A"}
                  color={getStatusColor(selectedOrder.orderStatus)}
                  size="small"
                  sx={{
                    "& .MuiChip-icon": {
                      color: "inherit",
                    },
                    fontWeight: 600,
                    borderRadius: "8px",
                    px: 1,
                    "& .MuiChip-label": {
                      px: 1,
                    },
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                  }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Select New Status
              </Typography>

              <Box sx={{ mt: 2 }}>
                {orderStatusOptions.map((status) => {
                  const isDisabled =
                    // Prevent changing to ORDER PLACED if current status is beyond that
                    (status === "ORDER PLACED" &&
                      selectedOrder.orderStatus !== "ORDER PLACED") ||
                    // Prevent changing to DISPATCHED if order is DELIVERED or CANCELED
                    (status === "DISPATCHED" &&
                      ["DELIVERED", "CANCELLED"].includes(
                        selectedOrder.orderStatus
                      )) ||
                    // Prevent changing to DELIVERED if order isn't DISPATCHED
                    (status === "DELIVERED" &&
                      selectedOrder.orderStatus !== "DISPATCHED");

                  return (
                    <StatusOption
                      key={status}
                      status={status}
                      selected={newStatus === status}
                      onClick={() => !isDisabled && setNewStatus(status)}
                      disabled={isDisabled}
                    />
                  );
                })}

                {selectedOrder.orderStatus === "ORDER PLACED" && (
                  <Box
                    sx={{ mt: 2, p: 2, bgcolor: "info.light", borderRadius: 1 }}
                  >
                    <Typography variant="body2" color="info.dark">
                      💡 <strong>Tip:</strong> To dispatch an order with
                      tracking information, use the "Dispatch Order" option from
                      the actions menu instead.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseStatusDialog}
            disabled={statusLoading}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStatusChange}
            variant="contained"
            color="primary"
            disabled={
              statusLoading ||
              !newStatus ||
              newStatus === selectedOrder?.orderStatus
            }
            startIcon={statusLoading ? <CircularProgress size={20} /> : null}
          >
            {statusLoading ? "Updating..." : "Update Status"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tracking Dialog */}
      <Dialog
        open={openTrackingDialog}
        onClose={handleCloseTrackingDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6">Dispatch Order</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Enter tracking information to dispatch this order
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Order Information
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Order ID: {selectedOrder._id}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Customer: {selectedOrder.user?.name || "N/A"}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Tracking Information
              </Typography>

              <TextField
                fullWidth
                label="Tracking Number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
                variant="outlined"
                sx={{ mt: 2 }}
                helperText="Enter the courier tracking number for this order"
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseTrackingDialog}
            disabled={trackingLoading}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleTrackingStatusChange}
            variant="contained"
            color="primary"
            disabled={trackingLoading || !trackingNumber.trim()}
            startIcon={trackingLoading ? <CircularProgress size={20} /> : null}
          >
            {trackingLoading ? "Dispatching..." : "Dispatch Order"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Orders;
