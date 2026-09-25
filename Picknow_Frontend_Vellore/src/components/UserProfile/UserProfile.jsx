import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./UserProfile.css";
import { orderApi } from "../../APi/orderApi";
import { userApi } from "../../APi/userApi";
import { cartApi } from "../../APi/cartApi";
import { getWishlist, removeFromWishlist } from "../../APi/userApi";
import { authService } from "../../APi/baseApi";
import { toast } from "react-toastify";
import { useSnackbar } from "notistack";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FiExternalLink, FiChevronDown, FiSearch } from "react-icons/fi";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import {
  FaTrash,
  FaUser,
  FaHeart,
  FaBox,
  FaLock,
  FaSignOutAlt,
  FaWallet,
  FaArrowLeft,
  FaTimes,
  FaSave,
  FaPlus,
} from "react-icons/fa";
import { productApi } from "../../APi/productApi";
import { getComboById } from "../../APi/comboApi";
import ModernLoader from "../Loading/ModernLoader";
import { FiDownload } from "react-icons/fi";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import { Helmet } from "react-helmet";
import { ShoppingBag } from "lucide-react";
import ProductCard from "../ProductPage/ProductCard";
import PicknowLogo from "../../assets/PicknowLogo.png";


const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState({
    profile: true,
    orders: true,
    update: false,
  });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(localStorage.getItem("activeTab") || "profile");
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  // Add these state variables
  const [orderFilterStatus, setOrderFilterStatus] = useState('All');
  const [orderFilterTime, setOrderFilterTime] = useState('all');
  const [orderFilterPrice, setOrderFilterPrice] = useState('all');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter function
  const getFilteredOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (orderSearchTerm.trim()) {
      const term = orderSearchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order._id?.toLowerCase().includes(term) ||
        order.items?.some(item => item.product?.pName?.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (orderFilterStatus !== 'All') {
      if (orderFilterStatus === 'On the way') {
        filtered = filtered.filter(order =>
          ["ORDER PLACED", "CONFIRMED", "SHIPPED", "DISPATCHED", "PACKED"].includes(order.orderStatus)
        );
      } else if (orderFilterStatus === 'Returned') {
        filtered = filtered.filter(order => order.returnedItems && order.returnedItems.length > 0);
      } else {
        filtered = filtered.filter(order => order.orderStatus === orderFilterStatus.toUpperCase());
      }
    }

    // Time filter
    const now = new Date();
    const currentYear = now.getFullYear();

    if (orderFilterTime !== 'all') {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));

        switch (orderFilterTime) {
          case 'last7days':
            return daysDiff <= 7;
          case 'last30days':
            return daysDiff <= 30;
          case 'last3months':
            return daysDiff <= 90;
          case 'last6months':
            return daysDiff <= 180;
          case 'thisyear':
            return orderDate.getFullYear() === currentYear;
          case 'lastyear':
            return orderDate.getFullYear() === currentYear - 1;
          case 'older':
            return daysDiff > 365;
          default:
            return true;
        }
      });
    }

    // Price filter
    if (orderFilterPrice !== 'all') {
      filtered = filtered.filter(order => {
        const price = order.finalAmount || 0;

        switch (orderFilterPrice) {
          case 'under500':
            return price < 500;
          case '500to1000':
            return price >= 500 && price < 1000;
          case '1000to5000':
            return price >= 1000 && price < 5000;
          case '5000to10000':
            return price >= 5000 && price < 10000;
          case 'above10000':
            return price >= 10000;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  // Use filtered orders in your render
  const displayOrders = getFilteredOrders();
  // Password state
  const [showPasswordTab, setShowPasswordTab] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Add new state for address modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressData, setAddressData] = useState({
    type: "Home",
    name: "",
    mobile: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
    pincodeVerified: false,
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Add new state for PIN code loading
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();

  // Add password visibility state
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  // Add a new state for confirmation dialog
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Add wallet-related state
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState("");
  const [walletLoading, setWalletLoading] = useState({
    balance: true,
    transactions: true,
  });

  // Logout state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCodePassModal, setShowCodePassModal] = useState(false);
  const [codePassData, setCodePassData] = useState({
    code: "",
    pass: "",
    amount: "",
  });

  // Add return-related state
  /*
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedItemForReturn, setSelectedItemForReturn] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnProducts, setReturnProducts] = useState([]);
  const [eligibleReturnItems, setEligibleReturnItems] = useState([]);
  */

  // Add new state for review
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProductForReview, setSelectedProductForReview] =
    useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    review: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Toggle password visibility function
  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const fetchProfile = async () => {
    try {
      const response = await userApi.myProfile();
      setUser(response.user);
      setEditedUser(response.user);
      setLoading((prev) => ({ ...prev, profile: false }));
    } catch (err) {
      setError(err.message);
      setLoading((prev) => ({ ...prev, profile: false }));
      toast.error(err.message || "Failed to load profile");
    }
  };

  // Fetch user profile
  useEffect(() => {
    fetchProfile();
  }, []);

  // Persist active tab to localStorage
  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
    setIsMobileMenuOpen(false); // Close mobile menu when tab changes
  }, [activeTab]);

  // Handle tab switching from navigation state (e.g. from Cart)
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderApi.getOrders();
        setOrders(response.orders);
        setLoading((prev) => ({ ...prev, orders: false }));
      } catch (err) {
        setError(err.message);
        setLoading((prev) => ({ ...prev, orders: false }));
        toast.error(err.message || "Failed to load orders");
      }
    };

    if (activeTab === "orders") {
      fetchOrders();
    }
  }, [activeTab]);

  // Update fetchWishlist function
  const fetchWishlist = async () => {
    try {
      setWishlistLoading(true);
      const response = await getWishlist();

      const rawProducts = response.products ||
        response.wishlist?.products ||
        (Array.isArray(response.wishlist) ? response.wishlist : []) ||
        (Array.isArray(response) ? response : []);

      // Perform full detail fetch for each item to ensure images and prices are perfect
      const detailedItems = await Promise.all(
        rawProducts.map(async (item) => {
          try {
            const pId = item.product?._id || item._id || item.productId || item;
            if (typeof pId !== 'string' && typeof pId !== 'number') return null;

            const detailRes = await productApi.getProductById(pId);
            if (detailRes.success && detailRes.product) {
              const p = detailRes.product;

              // Ensure variants are present for price fallback in ProductCard
              if (!p.variants || p.variants.length === 0) {
                try {
                  const variantRes = await productApi.getProductVariants(pId);
                  if (variantRes.success) p.variants = variantRes.variants;
                } catch (e) { }
              }

              return p;
            }
            return item.product || item;
          } catch (err) {
            console.error("Deep fetch failed for item:", item, err);
            return item.product || item;
          }
        })
      );

      // Filter out nulls and normalize any remaining fields
      const finalItems = detailedItems.filter(Boolean).map(p => ({
        ...p,
        _id: p._id,
        pName: p.pName || p.name || "Product",
        pImage: Array.isArray(p.pImage) ? p.pImage : (p.image ? [p.image] : []),
        pPrice: p.pPrice || p.price || (p.variants?.[0]?.price) || 0,
        pPreviousPrice: p.pPreviousPrice || p.originalPrice || (p.variants?.[0]?.originalPrice) || 0
      }));

      setWishlistItems(finalItems);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setWishlistLoading(false);
    }
  };



  // Update useEffect to fetch wishlist when tab changes
  useEffect(() => {
    if (activeTab === "wishlist") {
      fetchWishlist();
    }
  }, [activeTab]);

  const handleEditToggle = () => {
    if (isEditing) {
      // If cancelling, reset the edited user state to current user data
      setEditedUser(user);
    }
    setIsEditing(!isEditing);
  };

  const handleProfileSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading((prev) => ({ ...prev, update: true }));
      const response = await userApi.updateProfile(editedUser);
      setUser(response.user || editedUser);
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
      setEditedUser(user);
    } finally {
      setLoading((prev) => ({ ...prev, update: false }));
    }
  };
  const confirmSaveProfile = () => {
    setShowSaveConfirm(false);
    handleProfileSave(); // your original save function
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = async (e) => {
    if (e) e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      await userApi.changePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success("Password changed successfully");
      setShowPasswordTab(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      toast.error(err.message || "Failed to change password");
    }
  };

  const confirmPasswordUpdate = () => {
    setShowPasswordConfirm(false);
    handlePasswordChange(); // your actual submit logic
  };

  const handleLogout = async () => {
    try {
      // Clear all possible tokens and flags from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('activeTab');
      localStorage.removeItem('isVendor');

      // Dispatch global event for other components (like Navbar) to sync
      window.dispatchEvent(new Event("loginStateChanged"));

      // Optionally call logout API if endpoint exists
      try {
        await authService.logout();
      } catch (apiError) {
        console.log('Logout API not available, but tokens cleared');
      }

      toast.success('Logged out successfully!');
      setShowLogoutConfirm(false);

      // Redirect to landing page instead of login for a smoother experience
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if something fails, clear everything and redirect
      localStorage.clear(); // Nuclear option
      window.dispatchEvent(new Event("loginStateChanged"));
      setShowLogoutConfirm(false);
      toast.warning('Session cleared');
      navigate('/');
    }
  };

  // --- Fetching Logic ---

  const fetchAddresses = async () => {
    try {
      // Use myProfile as it's the source of truth for the whole user object
      const response = await userApi.myProfile();
      setUser(response.user);
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    }
  };

  const handleViewOrderDetails = async (orderId) => {
    try {
      const response = await orderApi.getOrderById(orderId);

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch order details");
      }

      // Process each item to ensure proper data structure
      const processedItems = await Promise.all(
        response.order.items.map(async (item) => {
          try {
            // Determine if it's a combo product
            const isCombo = item.isCombo === true ||
              item.product?.pType === "combo" ||
              (item.product?._id && item.product._id.toString().includes("combo-"));

            // Get the product data safely
            const productData = item.product || {};

            // Handle product image
            let productImage = null;
            if (productData.pImage) {
              if (Array.isArray(productData.pImage)) {
                productImage = productData.pImage[0];
              } else if (typeof productData.pImage === "string") {
                productImage = productData.pImage.split(",")[0];
              }
            }

            // If no image found, use placeholder
            if (!productImage) {
              productImage = "https://via.placeholder.com/300x300?text=Product+Image";
            }

            return {
              ...item,
              product: {
                _id: productData._id,
                pName: productData.pName || "Product Name Not Available",
                pDescription: productData.pDescription || "",
                pImage: productImage,
                pType: productData.pType || (isCombo ? "combo" : "product"),
                pPrice: productData.pPrice || item.price || 0,
                pPreviousPrice: productData.pPreviousPrice || 0,
                pOffer: productData.pOffer || 0,
                pShortDescription: productData.pShortDescription || "",
                pCategory: productData.pCategory || "",
                pBrand: productData.pBrand || "",
                pStatus: productData.pStatus || "active",
              },
              isCombo: isCombo,
              variantInfo: item.variantInfo || null,
              reviewed: item.reviewed || false
            };
          } catch (err) {
            console.error(`Error processing item:`, err);
            return {
              ...item,
              product: {
                _id: item.product?._id || "unknown",
                pName: "Product Not Available",
                pDescription: "",
                pImage: "https://via.placeholder.com/300x300?text=Product+Not+Available",
                pType: "unknown",
                pPrice: item.price || 0
              },
              isCombo: false,
              reviewed: false
            };
          }
        })
      );

      const orderWithProducts = {
        ...response.order,
        items: processedItems
      };

      setSelectedOrder(orderWithProducts);
      setShowOrderDetails(true);
    } catch (err) {
      console.error("Error fetching order details:", err);
      toast.error(err.message || "Failed to fetch order details");
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditingAddress) {
        await userApi.updateAddress(addressData);
        toast.success("Address updated successfully");
      } else {
        await userApi.addAddress(addressData);
        toast.success("Address added successfully");
      }

      // Refresh user data to get updated addresses
      const response = await userApi.myProfile();
      setUser(response.user);

      // Reset form and close modal
      setAddressData({
        type: "Home",
        street: "",
        city: "",
        state: "",
        pincode: "",
        isDefault: false,
        pincodeVerified: false,
      });
      setShowAddressModal(false);
      setIsEditingAddress(false);
    } catch (err) {
      toast.error(err.message || "Failed to save address");
    }
  };

  const formatProfessionalDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const getShippingContact = (order) =>
    order?.shippingAddress?.mobile ||
    order?.shippingAddress?.contact ||
    order?.shippingAddress?.phone ||
    "N/A";

  const getVoucherAmount = (order) =>
    order?.discount || order?.kaitCoinsUsed || 0;

  const getDisplayPaymentMethod = (order) =>
    order?.paymentMethod || "RAZORPAY/VOUCHER";

  const getDisplayPaymentStatus = (order) =>
    order?.paymentStatus || "PAID";

  const getINRPaid = (order) => {
    const voucher = getVoucherAmount(order);
    return (order?.finalAmount || 0) - voucher;
  };

  const getStageDate = (order, stage) => {
    if (!order) return null;
    if (stage === "ORDER PLACED") return order.createdAt;
    if (stage === "PACKED") {
      if (["PACKED", "DISPATCHED", "DELIVERED"].includes(order.orderStatus)) {
        return order.updatedAt || order.createdAt;
      }
    }
    if (stage === "DISPATCHED") {
      if (["DISPATCHED", "DELIVERED"].includes(order.orderStatus)) {
        return order.updatedAt || order.createdAt;
      }
    }
    if (stage === "DELIVERED") {
      if (order.orderStatus === "DELIVERED") {
        return order.updatedAt || order.createdAt;
      }
    }
    if (stage === "CANCELLED") {
      if (order.orderStatus === "CANCELLED") {
        return order.updatedAt || order.createdAt;
      }
    }
    return null;
  };

  const handleDownloadInvoice = () => {
    if (!selectedOrder) return;

    // Calculate listing price (MRP total)
    const listingPrice = selectedOrder.items?.reduce((sum, item) => {
      const mrp = item.variantId?.previousPrice || item.product?.pPreviousPrice || item.product?.pMrp || item.price;
      return sum + (mrp * item.quantity);
    }, 0) || 0;

    // Calculate selling price (actual price total)
    const sellingPrice = selectedOrder.items?.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0) || 0;

    const totalDiscount = listingPrice - sellingPrice;

    const invoiceHtml = `<!DOCTYPE html>
    <html>
      <head>
        <title>Invoice - ${selectedOrder._id}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #212121;
            background: #fff;
            padding: 20px;
            line-height: 1.4;
          }
          .invoice-card {
            max-width: 850px;
            margin: 0 auto;
            background: #fff;
            padding: 30px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .logo-box img {
            height: 55px;
            object-fit: contain;
          }
          .invoice-txt {
            text-align: right;
            margin-top: 18px;
          }
          .invoice-txt h1 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 5px;
          }
          .invoice-txt p {
            font-size: 11px;
            color: #444;
            
          }

          .address-container {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .addr-box h3 {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #000;
            text-transform: uppercase;
            border-bottom: 1px solid #ddd;
            padding-bottom: 4px;
          }
          .addr-box p {
            font-size: 13px;
            color: #212121;
            margin-bottom: 2px;
            
          }

          .order-meta {
            background: #f9f9f9;
            padding: 12px 15px;
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
            border: 1px solid #eee;
          }
          .meta-item {
            font-size: 13px;
          }
          .meta-item strong {
            color: #555;
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .items-table th {
            background: #f2f2f2;
            text-align: left;
            padding: 10px 12px;
            font-size: 13px;
            font-weight: 600;
            border: 1px solid #ddd;
          }
          .items-table td {
            padding: 12px;
            font-size: 13px;
            border: 1px solid #ddd;
            vertical-align: top;
          }
          .text-right { text-align: right !important; }
          
          .summary-wrapper {
            display: flex;
            justify-content: flex-end;
          }
          .summary-table {
            width: 320px;
          }
          .summary-table td {
            padding: 6px 10px;
            font-size: 14px;
          }
          .summary-table .total-row {
            border-top: 2px solid #333;
            font-weight: 700;
            font-size: 18px;
            background: #f9f9f9;
          }
          .discount-txt {
            color: #1b5e20;
            font-weight: 600;
          }

          .status-table-box {
            border: 1px solid #eee;
            margin-bottom: 30px;
            background: #fafafa;
          }
          .status-table-header {
            background: #f1f1f1;
            padding: 8px 15px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            border-bottom: 1px solid #eee;
          }
          .status-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
          }
          .status-item {
            padding: 15px;
            text-align: center;
            border-right: 1px solid #eee;
          }
          .status-item:last-child {
            border-right: none;
          }
          .status-label {
            font-size: 13px;
            font-weight: 700;
            color: #000000ff;
            margin-bottom: 4px;
          }
          .status-date {
            font-size: 11px;
            color: #666;
          }

          .footer {
            margin-top: 50px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            text-align: center;
          }
          .footer p {
            font-size: 11px;
            color: #666;
            margin-bottom: 4px;
          }
          
          @media print {
            body { padding: 0; }
            .invoice-card { max-width: 100%; width: 100%; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-card">
          <div class="header">
            <div class="logo-box">
              <img src="${window.location.origin}${PicknowLogo}" alt="PickNow Logo" onerror="this.src='https://via.placeholder.com/200x60?text=PickNow'">
              <div style="font-size:11px; color:#666; margin-top:-10px; font-weight:500;">Your one-stop destination for 100% organic products. Shop natural, live healthy!</div>
            </div>
            <div class="invoice-txt">
              <h1>Tax Invoice</h1>
              <p>Download date: ${formatProfessionalDate(new Date())}</p>
            </div>
          </div>

          <div class="address-container">
            <div class="addr-box">
              <h3>Sold By:</h3>
              <p><strong>PickNow Quick Commerce</strong></p>
              <p>34, T M Nagar 1st Cross, Saravana Stores,</p>
              <p>Mattuthavani, Madurai, TN - 625107</p>
              <p style="margin-top:5px;"><span style="color:#878787;">GSTIN:</span> 33AABCXXXXX</p>
            </div>
            <div class="addr-box">
              <h3>Billing Address:</h3>
              <p><strong>${selectedOrder.shippingAddress.name || ''}</strong></p>
              <p>${selectedOrder.shippingAddress.address || ''}</p>
              <p>${selectedOrder.shippingAddress.city || ''}, ${selectedOrder.shippingAddress.state || ''} - ${selectedOrder.shippingAddress.pincode || ''}</p>
            </div>
            <div class="addr-box">
              <h3>Order Details:</h3>
              <p><span style="color:#878787;">Order ID:</span> ${selectedOrder._id.toUpperCase()}</p>
              <p><span style="color:#878787;">Order Date:</span> ${formatProfessionalDate(getStageDate(selectedOrder, 'ORDER PLACED') || new Date())}</p>
              <p><span style="color:#878787;">Invoice No:</span> #PN-${selectedOrder._id.slice(-6).toUpperCase()}</p>
            </div>
          </div>

          <!-- ORDER STATUS GRID -->
          <div class="status-table-box">
            <div class="status-table-header">Order Status Timeline</div>
            <div class="status-grid" style="grid-template-columns: ${selectedOrder.orderStatus === 'CANCELLED' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'};">
              <div class="status-item">
                <div class="status-label">Ordered</div>
                <div class="status-date">${getStageDate(selectedOrder, 'ORDER PLACED') ? formatProfessionalDate(getStageDate(selectedOrder, 'ORDER PLACED')) : formatProfessionalDate(selectedOrder.createdAt)}</div>
              </div>
              ${selectedOrder.orderStatus === 'CANCELLED' ? `
                <div class="status-item">
                  <div class="status-label" style="color: #ff3f6c;">Cancelled</div>
                  <div class="status-date">${getStageDate(selectedOrder, 'CANCELLED') ? formatProfessionalDate(getStageDate(selectedOrder, 'CANCELLED')) : formatProfessionalDate(selectedOrder.updatedAt)}</div>
                </div>
              ` : `
                <div class="status-item">
                  <div class="status-label">Packed</div>
                  <div class="status-date">${(getStageDate(selectedOrder, 'CONFIRMED') || getStageDate(selectedOrder, 'PACKED')) ? formatProfessionalDate(getStageDate(selectedOrder, 'CONFIRMED') || getStageDate(selectedOrder, 'PACKED')) : 'Pending'}</div>
                </div>
                <div class="status-item">
                  <div class="status-label">Shipped</div>
                  <div class="status-date">${(getStageDate(selectedOrder, 'DISPATCHED') || getStageDate(selectedOrder, 'SHIPPED')) ? formatProfessionalDate(getStageDate(selectedOrder, 'DISPATCHED') || getStageDate(selectedOrder, 'SHIPPED')) : 'Pending'}</div>
                </div>
                <div class="status-item">
                  <div class="status-label">Delivered</div>
                  <div class="status-date">${getStageDate(selectedOrder, 'DELIVERED') ? formatProfessionalDate(getStageDate(selectedOrder, 'DELIVERED')) : 'Pending'}</div>
                </div>
              `}
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th width="5%">S.No</th>
                <th>Description</th>
                <th class="text-right" width="15%">Unit Price</th>
                <th class="text-right" width="10%">Qty</th>
                <th class="text-right" width="18%">Net Amount</th>
              </tr>
            </thead>
            <tbody>
              ${selectedOrder.items.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>
                    <div style="font-weight:600;">${item.product.pName}</div>
                    ${item.variantInfo ? `<div style="color:#666; font-size:11px; margin-top:3px;">Variant: ${item.variantInfo}</div>` : ''}
                  </td>
                  <td class="text-right">${numberFormat(item.price)}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${numberFormat(item.price * item.quantity)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary-wrapper">
            <table class="summary-table">
              <tr>
                <td>Subtotal</td>
                <td class="text-right">${numberFormat(sellingPrice)}</td>
              </tr>
              <tr>
                <td>Shipping Charges</td>
                <td class="text-right">${numberFormat(selectedOrder.shippingCharges || 0)}</td>
              </tr>
              <tr>
                <td>Platform Fee</td>
                <td class="text-right">${numberFormat(selectedOrder.platformFee || 0)}</td>
              </tr>
              ${totalDiscount > 0 ? `
              <tr>
                <td>Discount Saved</td>
                <td class="text-right discount-txt">-${numberFormat(totalDiscount)}</td>
              </tr>
              ` : ''}
              ${getVoucherAmount(selectedOrder) > 0 ? `
              <tr>
                <td>Voucher/Wallet Applied</td>
                <td class="text-right discount-txt">-${numberFormat(getVoucherAmount(selectedOrder))}</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td>Total Amount</td>
                <td class="text-right">${numberFormat(selectedOrder.finalAmount || 0)}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 30px; font-size:13px; line-height:1.6;">
            <p><strong>Payment Mode:</strong> ${getDisplayPaymentMethod(selectedOrder).toUpperCase()}</p>
            <p><strong>Payment Status:</strong> ${getDisplayPaymentStatus(selectedOrder).toUpperCase()}</p>
          </div>

          <div class="footer">
            <p>This is a computer generated invoice and does not require a signature.</p>
            <p>Certified that the particulars given above are true and correct.</p>
            <p style="margin-top:10px; font-weight:600; color:#000; font-size:13px;">Thank you for shopping with PickNow!</p>
          </div>
        </div>
      </body>
    </html>`;

    const invoiceWindow = window.open('', '_blank');
    if (invoiceWindow) {
      invoiceWindow.document.write(invoiceHtml);
      invoiceWindow.document.close();
      invoiceWindow.focus();
      setTimeout(() => {
        invoiceWindow.print();
      }, 300);
    }
  };
  const getTransactionMessage = (transaction) => {
    const action = transaction.type === "credit" ? "Added" : "Subtracted";
    const amount = transaction.amount || 0;

    if (transaction.orderId) {
      const reason = transaction.type === "credit" ? "Cancelling" : "Placing";
      return `${amount} Kaitcoins has been  ${reason} order ${transaction.orderId} to your wallet.`;
    }

    if (transaction.description) {
      return `${amount} Kaitcoins has been ${transaction.description} to your wallet.`;
    }

    return `${amount} Kaitcoins has been to your wallet.`;
  };

  const numberFormat = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(value);

  const handleEditAddress = (address) => {
    setAddressData(address);
    setIsEditingAddress(true);
    setShowAddressModal(true);
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await userApi.deleteAddress(addressId);
      toast.success("Address deleted successfully");

      // Refresh user data
      const response = await userApi.myProfile();
      setUser(response.user);
    } catch (err) {
      toast.error(err.message || "Failed to delete address");
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      await userApi.setDefaultAddress(addressId);
      toast.success("Default address updated");

      // Refresh user data
      const response = await userApi.myProfile();
      setUser(response.user);
    } catch (err) {
      toast.error(err.message || "Failed to set default address");
    }
  };

  // Function to fetch address details from PIN code
  const fetchAddressFromPincode = async (pincode) => {
    try {
      setIsPincodeLoading(true);
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`
      );
      const data = await response.json();

      if (data[0].Status === "Success") {
        const postOffice = data[0].PostOffice[0];
        setAddressData((prev) => ({
          ...prev,
          city: postOffice.District,
          state: postOffice.State,
          pincodeVerified: true,
        }));
      } else {
        toast.error("Invalid PIN code");
        setAddressData((prev) => ({
          ...prev,
          city: "",
          state: "",
          pincodeVerified: false,
        }));
      }
    } catch (error) {
      console.error("Error fetching PIN code details:", error);
      toast.error("Failed to fetch address details");
      setAddressData((prev) => ({
        ...prev,
        city: "",
        state: "",
        pincodeVerified: false,
      }));
    } finally {
      setIsPincodeLoading(false);
    }
  };

  // Modify the existing handleChange function in the address modal
  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;

    // If trying to change city or state when pincode is verified, don't allow it
    if ((name === "city" || name === "state") && addressData.pincodeVerified) {
      return;
    }

    // Handle checkbox properly
    if (type === "checkbox") {
      setAddressData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    // For mobile number, only allow digits
    if (name === "mobile") {
      const mobileValue = value.replace(/\D/g, "");
      if (mobileValue.length <= 10) {
        setAddressData((prev) => ({
          ...prev,
          [name]: mobileValue,
        }));
      }
      return;
    }

    setAddressData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // If pincode field is changed and has 6 digits, fetch address details
    if (name === "pincode" && value.length === 6) {
      fetchAddressFromPincode(value);
    }

    // If pincode is changed and not 6 digits, reset city and state
    if (name === "pincode" && value.length !== 6) {
      setAddressData((prev) => ({
        ...prev,
        city: "",
        state: "",
        pincodeVerified: false,
      }));
    }
  };

  const handleRemove = async (productId, variantId = null) => {
    try {
      const response = await removeFromWishlist(productId, variantId);
      if (response.success) {
        enqueueSnackbar("Removed from wishlist", { variant: "success" });
        fetchWishlist();
        window.dispatchEvent(new CustomEvent("wishlistUpdated"));
      }
    } catch (err) {
      enqueueSnackbar(err.message || "Failed to remove item", { variant: "error" });
    }
  };

  const handleClearAllWishlist = async () => {
    if (!window.confirm("Are you sure you want to clear your entire wishlist?")) return;
    try {
      setWishlistLoading(true);
      await Promise.all(wishlistItems.map((item) => removeFromWishlist(item._id, item.variantId)));
      enqueueSnackbar("Wishlist cleared successfully", { variant: "success" });
      fetchWishlist();
      window.dispatchEvent(new CustomEvent("wishlistUpdated"));
    } catch (err) {
      enqueueSnackbar("Failed to clear some items from wishlist", { variant: "error" });
      fetchWishlist();
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = async (productId, variantId) => {
    try {
      const cartData = {
        productId,
        quantity: 1,
        variantId: variantId || undefined,
        variantType: variantId ? "size" : undefined,
        variantValue: variantId ? "default" : undefined,
        price: undefined,
      };
      await cartApi.addToCart(cartData);
      toast.success("Product added to cart");
      await removeFromWishlist(productId, variantId);
      fetchWishlist();
    } catch (err) {
      console.error("Add to cart error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to add to cart");
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setCancelLoading(true);
      const response = await orderApi.cancelOrder(orderId);
      if (response.success) {
        toast.success("Order cancelled successfully");
        const ordersResponse = await orderApi.getOrders();
        setOrders(ordersResponse.orders);
        if (selectedOrder && selectedOrder._id === orderId) {
          const updatedOrderResponse = await orderApi.getOrderById(orderId);
          setSelectedOrder(updatedOrderResponse.order);
        }
      } else {
        toast.error(response.message || "Failed to cancel order");
      }
    } catch (err) {
      toast.error(err.message || "Failed to cancel order");
    } finally {
      setShowCancelConfirm(false);
      setOrderToCancel(null);
      setCancelLoading(false);
    }
  };

  const canCancelOrder = (status) => status === "ORDER PLACED";

  const initiateCancel = (order) => {
    if (!canCancelOrder(order.orderStatus)) {
      toast.error("Order can only be cancelled when in Order Placed status");
      return;
    }
    setOrderToCancel(order);
    setShowCancelConfirm(true);
  };

  const fetchWalletBalance = async () => {
    try {
      setWalletLoading((prev) => ({ ...prev, balance: true }));
      const response = await userApi.getWalletBalance();
      setWalletBalance(response.walletBalance || 0);
    } catch (err) {
      console.error("Failed to fetch wallet balance:", err);
    } finally {
      setWalletLoading((prev) => ({ ...prev, balance: false }));
    }
  };

  const fetchWalletTransactions = async () => {
    try {
      setWalletLoading((prev) => ({ ...prev, transactions: true }));
      const response = await userApi.getWalletTransactions();
      setWalletTransactions(response.data || []);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setWalletLoading((prev) => ({ ...prev, transactions: false }));
    }
  };

  const handleAddMoney = async (e) => {
    e.preventDefault();
    if (!addMoneyAmount || isNaN(addMoneyAmount) || addMoneyAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    try {
      await userApi.addMoneyToWallet(parseFloat(addMoneyAmount));
      toast.success("Money added to wallet successfully");
      setShowAddMoneyModal(false);
      setAddMoneyAmount("");
      fetchWalletBalance();
      fetchWalletTransactions();
    } catch (err) {
      toast.error(err.message || "Failed to add money to wallet");
    }
  };

  const handleCodePassSubmit = async (e) => {
    e.preventDefault();
    if (!codePassData.code || !codePassData.pass || !codePassData.amount) {
      toast.error("Please enter code, pass, and amount");
      return;
    }
    try {
      await userApi.addMoneyWithCodePass({
        code: codePassData.code,
        pass: codePassData.pass,
        amount: parseFloat(codePassData.amount),
      });
      toast.success("Money added to wallet successfully");
      setShowCodePassModal(false);
      setCodePassData({ code: "", pass: "", amount: "" });
      fetchWalletBalance();
      fetchWalletTransactions();
    } catch (err) {
      toast.error(err.message || "Failed to add money with code and pass");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewData.rating || !reviewData.review.trim()) {
      toast.error("Please provide both rating and review");
      return;
    }
    try {
      setSubmittingReview(true);
      const response = await productApi.addReview(
        selectedProductForReview.product._id,
        reviewData.rating,
        reviewData.review.trim()
      );
      if (response.success) {
        toast.success("Review submitted successfully");
        setShowReviewModal(false);
        setReviewData({ rating: 0, review: "" });
        setSelectedProductForReview(null);
        if (selectedOrder) {
          const updatedOrder = await orderApi.getOrderById(selectedOrder._id);
          setSelectedOrder(updatedOrder.order);
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const canReviewProduct = (product) => {
    return selectedOrder?.orderStatus === "DELIVERED" && !product.reviewed;
  };

  const getOrderDisplayStatus = (order) => {
    if (order.returnedItems && order.returnedItems.length > 0) return "RETURNED";
    return order.orderStatus === "PENDING" ? "ORDER CONFIRMED" : order.orderStatus;
  };

  const getStatusClass = (order) => {
    if (order.returnedItems && order.returnedItems.length > 0) return "returned";
    const status = order.orderStatus.toLowerCase();
    if (status === "pending") return "pending";
    if (status === "order placed") return "order-placed";
    if (status === "dispatched") return "dispatched";
    if (status === "delivered") return "delivered";
    if (status === "cancelled" || status === "canceled") return "cancelled";
    return status;
  };

  useEffect(() => {
    if (activeTab === "wallet") {
      fetchWalletBalance();
      fetchWalletTransactions();
    }
  }, [activeTab]);

  if (loading.profile) {
    return (
      <div className="loading-container-full">
        <ModernLoader
          showTiming={false}
          animationType="wave"
          size={0.8}
          customMessage="Loading profile..."
          showProgress={true}
        />
      </div>
    );
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-sidebar">
        <div className="user-info-card">
          <div className="avatar-section">
            <div className="avatar-wrapper">
              <FaUser size={24} color="#2874f0" />
            </div>
            <div className="user-text">
              <span className="greeting">Hello,</span>
              <h2 className="user-name">{user?.name || "User"}</h2>
            </div>
          </div>
        </div>

        <div className="sidebar-nav-container">
          <div className="nav-group">
            <button
              className={`nav-group-header ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              <FaBox className="header-icon" />
              <span>MY ORDERS</span>
              <FiExternalLink className="header-arrow" />
            </button>
          </div>

          <div className="nav-group">
            <div className="nav-group-header">
              <FaUser className="header-icon" />
              <span>ACCOUNT SETTINGS</span>
            </div>
            <div className="nav-group-items">
              <button
                className={activeTab === "profile" ? "active" : ""}
                onClick={() => setActiveTab("profile")}
              >
                Profile Information
              </button>
              <button
                className={activeTab === "addresses" ? "active" : ""}
                onClick={() => setActiveTab("addresses")}
              >
                Manage Addresses
              </button>
              <button
                className={activeTab === "password" ? "active" : ""}
                onClick={() => setActiveTab("password")}
              >
                Change Password
              </button>
            </div>
          </div>

          <div className="nav-group">
            <div className="nav-group-header">
              <FaWallet className="header-icon" />
              <span>PAYMENTS</span>
            </div>
            <div className="nav-group-items">
              <button
                className={activeTab === "wallet" ? "active" : ""}
                onClick={() => setActiveTab("wallet")}
              >
                My Wallet
              </button>
            </div>
          </div>

          <div className="nav-group">
            <div className="nav-group-header">
              <FaHeart className="header-icon" />
              <span>MY STUFF</span>
            </div>
            <div className="nav-group-items">
              <button
                className={activeTab === "wishlist" ? "active" : ""}
                onClick={() => setActiveTab("wishlist")}
              >
                My Wishlist
              </button>
            </div>
          </div>

          <div className="nav-group logout-section">
            <button className="logout-nav-btn" onClick={() => setShowLogoutConfirm(true)}>
              <FaSignOutAlt className="header-icon" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="profile-content">
        {/* Mobile Navigation Dropdown */}
        <div className="mobile-nav-dropdown-container">
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="mobile-nav-dropdown-header"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className="dropdown-label-group">
              <span className="dropdown-current-label">
                {activeTab === "orders" ? "MY ORDERS" :
                  activeTab === "profile" ? "Profile Information" :
                    activeTab === "addresses" ? "Manage Addresses" :
                      activeTab === "password" ? "Change Password" :
                        activeTab === "wallet" ? "My Wallet" :
                          activeTab === "wishlist" ? "My Wishlist" : "MENU"}
              </span>
            </div>
            <motion.div
              animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "anticipate" }}
            >
              <FiChevronDown className="dropdown-chevron" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="mobile-nav-dropdown-menu"
              >
                <div className="dropdown-scroll-container">
                  <button
                    className={activeTab === "orders" ? "active" : ""}
                    onClick={() => setActiveTab("orders")}
                  >
                    <FaBox className="dropdown-icon" /> MY ORDERS
                  </button>
                  <div className="dropdown-divider">ACCOUNT SETTINGS</div>
                  <button
                    className={activeTab === "profile" ? "active" : ""}
                    onClick={() => setActiveTab("profile")}
                  >
                    <FaUser className="dropdown-icon" /> Profile Information
                  </button>
                  <button
                    className={activeTab === "addresses" ? "active" : ""}
                    onClick={() => setActiveTab("addresses")}
                  >
                    <FaPlus className="dropdown-icon" /> Manage Addresses
                  </button>
                  <button
                    className={activeTab === "password" ? "active" : ""}
                    onClick={() => setActiveTab("password")}
                  >
                    <FaLock className="dropdown-icon" /> Change Password
                  </button>
                  <div className="dropdown-divider">PAYMENTS</div>
                  <button
                    className={activeTab === "wallet" ? "active" : ""}
                    onClick={() => setActiveTab("wallet")}
                  >
                    <FaWallet className="dropdown-icon" /> My Wallet
                  </button>
                  <div className="dropdown-divider">MY STUFF</div>
                  <button
                    className={activeTab === "wishlist" ? "active" : ""}
                    onClick={() => setActiveTab("wishlist")}
                  >
                    <FaHeart className="dropdown-icon" /> My Wishlist
                  </button>
                  <div className="dropdown-divider"></div>
                  <button
                    className="logout-dropdown-btn"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setShowLogoutConfirm(true);
                    }}
                  >
                    <FaSignOutAlt className="dropdown-icon" /> Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="active-tab-content-wrapper"
        >
          {activeTab === "profile" && (
            <div className="personal-info-section">
              <div className="content-header">
                <h1 className="content-title">Personal Information</h1>
                <button
                  className="edit-link-btn"
                  onClick={handleEditToggle}
                >
                  {isEditing ? "Cancel" : "Edit"}
                </button>
              </div>

              <div className="info-form-grid-v2 responsive-grid">
                {/* Name Field */}
                <div className="form-field-v2">
                  <span className="field-label-v2">Full Name</span>
                  <div className="input-group-v2">
                    <input
                      type="text"
                      name="name"
                      value={isEditing ? editedUser.name : user?.name || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder=" "
                      className="premium-input-v21"
                      id="user-name"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="form-field-v2">
                  <span className="field-label-v2">Email Address</span>
                  <div className="input-group-v2">
                    <input
                      type="email"
                      name="email"
                      value={isEditing ? editedUser.email : user?.email || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder=" "
                      className="premium-input-v21"
                      id="user-email"
                    />
                  </div>
                </div>

                {/* Mobile Field */}
                <div className="form-field-v2">
                  <span className="field-label-v2">Mobile Number</span>
                  <div className="input-group-v2">
                    <input
                      type="tel"
                      name="contact"
                      value={isEditing ? editedUser.contact : user?.contact || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder=" "
                      className="premium-input-v21"
                      id="user-phone"
                    />
                  </div>
                </div>
              </div>

              {/* SAVE Button Area */}
              {isEditing && (
                <div className="form-actions-v2">
                  <button
                    className="premium-save-btn"
                    onClick={() => setShowSaveConfirm(true)}
                  >
                    SAVE CHANGES
                  </button>
                </div>
              )}
              {showSaveConfirm && (
                <div className="prime-modal-overlay">
                  <div className="prime-modal" style={{ maxWidth: '420px' }}>

                    <div
                      className="prime-modal-body"
                      style={{ textAlign: 'center', padding: '40px 24px' }}
                    >
                      {/* You can change icon if needed */}
                      <FaSave
                        style={{
                          fontSize: '3rem',
                          color: '#2874f0',
                          marginBottom: '1.5rem'
                        }}
                      />

                      <h3
                        style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#212121',
                          margin: '0 0 12px 0'
                        }}
                      >
                        Save Changes?
                      </h3>

                      <p
                        style={{
                          fontSize: '14px',
                          color: '#878787',
                          margin: '0 0 24px 0',
                          lineHeight: '1.5'
                        }}
                      >
                        Are you sure you want to save the changes to your profile?
                      </p>
                    </div>

                    <div className="prime-modal-footer">
                      <button
                        type="button"
                        className="prime-btn prime-btn-secondary"
                        onClick={() => setShowSaveConfirm(false)}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="prime-btn prime-btn-primary"
                        onClick={confirmSaveProfile}
                      >
                        Yes, Save
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "wishlist" && (
            <div className="wishlist-section-v2">
              <div className="wishlist-page-container">
                <Helmet>
                  <title>My Favorites | Picknow</title>
                </Helmet>

                <div className="wishlist-minimal-header11">
                  <div className="content-header">
                    <h1 className="content-title">My Wishlist ({wishlistItems.length})</h1>
                    {wishlistItems.length > 0 && (
                      <button
                        className="edit-link-btn danger"
                        onClick={handleClearAllWishlist}
                        title="Clear all items"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                <div className="container py-4 min-vh-75 wishlist-content-main">
                  {wishlistLoading ? (
                    <div className="wishlist-loader-box">
                      {/* Loader removed as per request */}
                    </div>
                  ) : wishlistItems.length > 0 ? (
                    <div className="premium-discovery-grid">
                      {wishlistItems.map((item) => (
                        <div key={item._id} className="wishlist-item-wrapper">
                          <ProductCard
                            product={item}
                            isInitialWishlisted={true}
                            onAddToCartSuccess={handleRemove}
                          />
                          <button
                            className="remove-wish-btn"
                            onClick={() => handleRemove(item._id)}
                            title="Remove"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="wishlist-empty-state">
                      <h3>Your wishlist is empty</h3>
                      <p>You have no products saved in your wishlist.</p>
                      <button onClick={() => navigate("/")} className="primary-action-btn">
                        Start shopping
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="orders-section">
              <div className="content-header">
                <h1 className="content-title">My Orders ({orders.length})</h1>
                <button
                  className="shop-now-button hide-on-mobile"
                  onClick={() => navigate("/")}
                >
                  Continue Shopping
                </button>
              </div>

              {!showOrderDetails && !loading.orders && orders.length > 0 && (
                <div className="orders-filter-container-fk">
                  <div className="filters-wrapper-fk">
                    {/* Search Bar - Now at Top */}
                    <div className="order-search-wrapper-fk">
                      <FiSearch className="search-icon-fk" />
                      <input
                        type="text"
                        placeholder="Search your orders here"
                        value={orderSearchTerm}
                        onChange={(e) => setOrderSearchTerm(e.target.value)}
                        className="order-search-input-fk"
                      />
                    </div>

                    <div className="filter-inline-group-fk">
                      <div className="filter-section-fk">
                        <span className="filter-title-fk">Status</span>
                        <select
                          className="filter-select-fk"
                          value={orderFilterStatus}
                          onChange={(e) => setOrderFilterStatus(e.target.value)}
                        >
                          <option value="All">All Orders</option>
                          <option value="On the way">On the way</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Returned">Returned</option>
                        </select>
                      </div>

                      <div className="filter-section-fk">
                        <span className="filter-title-fk">Time</span>
                        <select
                          className="filter-select-fk"
                          value={orderFilterTime}
                          onChange={(e) => setOrderFilterTime(e.target.value)}
                        >
                          <option value="all">All Time</option>
                          <option value="last7days">Last 7 days</option>
                          <option value="last30days">Last 30 days</option>
                          <option value="last3months">Last 3 months</option>
                          <option value="last6months">Last 6 months</option>
                          <option value="thisyear">This Year ({new Date().getFullYear()})</option>
                          <option value="lastyear">Last Year ({new Date().getFullYear() - 1})</option>
                          <option value="older">Older than a year</option>
                        </select>
                      </div>

                      <div className="filter-section-fk">
                        <span className="filter-title-fk">Value</span>
                        <select
                          className="filter-select-fk"
                          value={orderFilterPrice}
                          onChange={(e) => setOrderFilterPrice(e.target.value)}
                        >
                          <option value="all">Any Amount</option>
                          <option value="under500">Under ₹500</option>
                          <option value="500to1000">₹500 - ₹1,000</option>
                          <option value="1000to5000">₹1,000 - ₹5,000</option>
                          <option value="5000to10000">₹5,000 - ₹10,000</option>
                          <option value="above10000">Above ₹10,000</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {loading.orders ? (
                <div className="orders-loading">

                </div>
              ) : showOrderDetails && selectedOrder ? (
                <div className="order-details-v3">
                  <button
                    className="back-btn-v3"
                    onClick={() => setShowOrderDetails(false)}
                  >
                    <FaArrowLeft /> BACK TO ORDERS
                  </button>

                  <div className="order-details-layout-v3">
                    <div className="order-header-v3">
                      <div className="order-header-v3-main">
                        <h2 className="order-details-title-v3">Order Details</h2>
                        <p className="order-id-label-v3">
                          Order ID: <span>{selectedOrder._id}</span>
                        </p>
                      </div>

                      <button
                        className="download-invoice-btn-v3"
                        onClick={handleDownloadInvoice}
                        title="Download Invoice"
                      >
                        <FiDownload />
                      </button>
                    </div>

                    {/* NEW: Product List */}
                    <div className="order-products-list-v3">
                      {selectedOrder.items?.map((item, index) => {
                        const productImage = Array.isArray(item.product?.pImage)
                          ? item.product.pImage[0]
                          : item.product?.pImage?.split(",")[0];

                        return (
                          <div key={index} className="order-product-row-v3">
                            {/* Image */}
                            <img
                              src={productImage || "https://via.placeholder.com/80"}
                              alt="Product Unavailable"
                              className="order-product-img-v3"
                             
                            />

                            {/* Details */}
                            <div className="order-product-info-v3">
                              <div className="product-name-v3">
                                <Link to={item.product?._id ? `/product/${item.product._id}` : "#"} className="item-title1">
                                  {item.product?.pName || "Product Unavailable"}
                                  {!item.product && (
                                    <span className="unavailable-point-fk"> (Currently Unavailable)</span>
                                  )}
                                </Link>
                              </div>

                              <div className="product-brand-v3">
                                {item.product?.pBrand || "Unavailable"}
                              </div>

                              {item.variantValue && (
                                <div className="product-variant-v3">
                                  {item.variantType && !["Variant", "Details"].includes(item.variantType)
                                    ? `${item.variantType}: ` : ""}
                                  {item.variantValue}
                                </div>
                              )}

                              <div className="product-qty-v3">
                                Quantity: {item.quantity}
                              </div>
                            </div>

                            {/* Price */}
                            <div className="order-product-price-v3">
                              <div className="price-item-v3">
                                <span className="selling-price-v3">₹{item.price?.toLocaleString()}</span>
                                {(item.variantId?.previousPrice || item.product?.pPreviousPrice || item.product?.pMrp) > item.price && (
                                  <span className="original-price-v3">₹{(item.variantId?.previousPrice || item.product?.pPreviousPrice || item.product?.pMrp)?.toLocaleString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Tracking Section (Full Width Top) */}
                    <div className="tracker-card-v3">
                      <div className={`tracker-horizontal-v3 ${selectedOrder.orderStatus === "CANCELLED" ? "two-steps" : ""}`}>

                        {/* PROGRESS LINE */}
                        <div
                          className={`tracker-progress-v3 ${selectedOrder.orderStatus === "CANCELLED" ? "cancelled" : ""}`}
                          style={{
                            width:
                              selectedOrder.orderStatus === "CANCELLED" ? "100%" :
                                selectedOrder.orderStatus === "ORDER PLACED" ? "0%" :
                                  selectedOrder.orderStatus === "CONFIRMED" ? "25%" :
                                    selectedOrder.orderStatus === "SHIPPED" ? "50%" :
                                      selectedOrder.orderStatus === "DELIVERED" ? "75%" :
                                        "0%"
                          }}
                        ></div>

                        {selectedOrder.orderStatus === "CANCELLED" ? (
                          <>
                            {/* ORDERED */}
                            <div className="track-step active">
                              <div className="step-dot"></div>
                              <span className="step-label">Ordered</span>
                              <span className="step-date">
                                {formatProfessionalDate(getStageDate(selectedOrder, 'ORDER PLACED'))}
                              </span>
                            </div>

                            {/* CANCELLED */}
                            <div className="track-step active cancelled">
                              <div className="step-dot"></div>
                              <span className="step-label">Cancelled</span>
                              <span className="step-date">
                                {formatProfessionalDate(getStageDate(selectedOrder, 'CANCELLED'))}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* ORDERED */}
                            <div className="track-step active">
                              <div className="step-dot"></div>
                              <span className="step-label">Ordered</span>
                              <span className="step-date">
                                {formatProfessionalDate(getStageDate(selectedOrder, 'ORDER PLACED'))}
                              </span>
                            </div>

                            {/* PACKED */}
                            <div className={`track-step ${['CONFIRMED', 'SHIPPED', 'DISPATCHED', 'DELIVERED', 'PACKED'].includes(selectedOrder.orderStatus) ? 'active' : ''}`}>
                              <div className="step-dot"></div>
                              <span className="step-label">Packed</span>
                              <span className="step-date">
                                {getStageDate(selectedOrder, 'PACKED')
                                  ? formatProfessionalDate(getStageDate(selectedOrder, 'PACKED'))
                                  : 'Pending'}
                              </span>
                            </div>

                            {/* SHIPPED */}
                            <div className={`track-step ${['SHIPPED', 'DISPATCHED', 'DELIVERED'].includes(selectedOrder.orderStatus) ? 'active' : ''}`}>
                              <div className="step-dot"></div>
                              <span className="step-label">Shipped</span>
                              <span className="step-date">
                                {getStageDate(selectedOrder, 'DISPATCHED')
                                  ? formatProfessionalDate(getStageDate(selectedOrder, 'DISPATCHED'))
                                  : 'Pending'}
                              </span>
                            </div>

                            {/* DELIVERED */}
                            <div className={`track-step ${selectedOrder.orderStatus === 'DELIVERED' ? 'active' : ''}`}>
                              <div className="step-dot"></div>
                              <span className="step-label">Delivered</span>
                              <span className="step-date">
                                {getStageDate(selectedOrder, 'DELIVERED')
                                  ? formatProfessionalDate(getStageDate(selectedOrder, 'DELIVERED'))
                                  : 'Pending'}
                              </span>
                            </div>
                          </>
                        )}

                      </div>
                    </div>

                    <div className="details-grid-v3">
                      {/* Left: Info Blocks */}
                      <div className="info-column-v3">
                        <div className="premium-card-v3">
                          <h4 className="card-title-v3">Delivery details</h4>
                          <div className="address-snapshot-v3">
                            <p className="user-name-v3">{selectedOrder.shippingAddress.name}</p>
                            <p>{selectedOrder.shippingAddress.address}</p>
                            <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}</p>
                            <p className="user-phone-v3">{getShippingContact(selectedOrder)}</p>
                          </div>
                        </div>
                        <div className="premium-card-v3">

                          {/* ✅ Show ONLY when delivered AND review available */}
                          {selectedOrder.orderStatus === "DELIVERED" &&
                            selectedOrder.items.some(canReviewProduct) && (

                              <>
                                <h4 className="card-title-v3">Rate & Review Products</h4>

                                {selectedOrder.items.map((item, idx) => (
                                  <div key={item._id || idx} className="detail-row-v3">

                                    {/* Image */}
                                    <img
                                      src={item.product?.pImage || "https://via.placeholder.com/80"}
                                      alt="Product Unavailable"
                                      className="thumb-v3"
                                    />

                                    {/* Content */}
                                    <div className="item-meta-v3">
                                      <Link to={item.product?._id ? `/product/${item.product._id}` : "#"} className="item-title1" alt="Product Unavailable">
                                        {item.product?.pName || "Product Unavailable"}
                                        {!item.product && (
                                          <span className="unavailable-point-fk"> (Currently Unavailable)</span>
                                        )}
                                      </Link>

                                      <span className="product-brand-v3">
                                        {item.product?.pBrand}
                                      </span>

                                      <span className="pqty-v3">Quantity: {item.quantity}</span>
                                      {item.variantValue && (
                                        <span className="pvariant-v3">
                                          {item.variantType && !["Variant", "Details"].includes(item.variantType)
                                            ? `${item.variantType}: ` : ""}
                                          {item.variantValue}
                                        </span>
                                      )}
                                      <div className="pprice-v3">
                                        <span className="selling-p-v3">{numberFormat(item.price * item.quantity)}</span>
                                        {(item.variantId?.previousPrice || item.product?.pPreviousPrice || item.product?.pMrp) > item.price && (
                                          <span className="original-p-v3">{numberFormat((item.variantId?.previousPrice || item.product?.pPreviousPrice || item.product?.pMrp) * item.quantity)}</span>
                                        )}
                                      </div>

                                      {/* Button */}
                                      {canReviewProduct(item) && (
                                        <button
                                          type="button"
                                          className="review-action-btn-v3"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedProductForReview(item);
                                            setShowReviewModal(true);
                                          }}
                                        >
                                          Rate & Review
                                        </button>
                                      )}
                                    </div>

                                  </div>
                                ))}
                              </>
                            )}

                          {/* Cancel Order Section */}
                          {selectedOrder.orderStatus === "CANCELLED" ? (
                            <div className="card-footer-v3">
                              <button
                                className="cancel-btn-v3 disabled"
                                disabled
                                style={{ color: '#ff3f6c', borderColor: '#ff3f6c', background: 'transparent', fontWeight: 'bold' }}
                              >
                                CANCELLED
                              </button>
                            </div>
                          ) : canCancelOrder(selectedOrder.orderStatus) && (
                            <div className="card-footer-v3">
                              <button
                                className="cancel-btn-v3"
                                onClick={() => initiateCancel(selectedOrder)}
                              >
                                CANCEL THIS ORDER
                              </button>
                            </div>
                          )}

                        </div>

                      </div>

                      {/* Right: Items List */}
                      <div className="items-column-v3">
                        <div className="premium-card-v3">
                          <h4 className="card-title-v3">Payment details</h4>
                          <div className="payment-info">
                            <div className="payment-details">
                              <div className="payment-row">
                                <span className="label">Payment Method:</span>
                                <span className="value">{getDisplayPaymentMethod(selectedOrder)}</span>
                              </div>
                              <div className="payment-row">
                                <span className="label">Payment Status:</span>
                                <span className="value">
                                  <span className={`payment-status-pill ${getDisplayPaymentStatus(selectedOrder).toLowerCase()}`}>
                                    {getDisplayPaymentStatus(selectedOrder)}
                                  </span>
                                </span>
                              </div>
                              <div className="payment-row">
                                <span className="label-v3">Listing Price:</span>
                                <span className="value-v3">
                                  {numberFormat(
                                    selectedOrder.items?.reduce((sum, item) => {
                                      const mrp = item.variantId?.previousPrice || item.product?.pPreviousPrice || item.product?.pMrp || item.price;
                                      return sum + (mrp * item.quantity);
                                    }, 0) || 0
                                  )}
                                </span>
                              </div>
                              <div className="payment-row">
                                <span className="label">Selling Price:</span>
                                <span className="value">
                                  {numberFormat(
                                    selectedOrder.items?.reduce((sum, item) => {
                                      return sum + (item.price * item.quantity);
                                    }, 0) || 0
                                  )}
                                </span>
                              </div>
                              <div className="payment-row">
                                <span className="label">Platform Fee:</span>
                                <span className="value">{numberFormat(selectedOrder.platformFee || 0)}</span>
                              </div>
                              <div className="payment-row">
                                <span className="label">Shipping Charges:</span>
                                <span className="value">{numberFormat(selectedOrder.shippingCharges || 0)}</span>
                              </div>
                              <div className="payment-row">
                                <span className="label">Total Amount:</span>
                                <span className="value">{numberFormat(selectedOrder.finalAmount || 0)}</span>
                              </div>
                              <div className="payment-row">
                                <span className="label">Voucher Amount Applied:</span>
                                <span className="value">- {numberFormat(getVoucherAmount(selectedOrder))}</span>
                              </div>
                              <div className="payment-row">
                                <span className="label">INR Paid:</span>
                                <span className="value">{numberFormat(getINRPaid(selectedOrder))}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : orders.length > 0 ? (
                <div className="orders-list-container-fk">
                  {displayOrders.map((order) => {
                    const statusClass = getStatusClass(order);
                    const itemsToShow = order.items?.slice(0, 4) || [];

                    return (
                      <div
                        key={order._id}
                        className="order-card-fk"
                        onClick={() => handleViewOrderDetails(order._id)}
                      >
                        {/* Top Section: Order ID and Status */}
                        <div className="order-top-section-fk">
                          <div className="order-id-section-fk">
                            <span className="order-id-label-fk">Order id</span>
                            <span className="order-id-value-fk">
                              {order._id.toUpperCase()}
                            </span>
                          </div>
                          <div className="order-status-section-fk">
                            <div className={`status-indicator-fk ${statusClass}`}></div>
                            <span className={`status-text-fk ${statusClass}`}>{getOrderDisplayStatus(order)}</span>
                          </div>
                        </div>

                        {/* Middle Section: Products and Order Info */}
                        <div className="order-middle-section-fk">
                          {/* Product Images Grid */}
                          <div className="order-products-fk">
                            {itemsToShow.map((item, idx) => {
                              const productImage = Array.isArray(item.product?.pImage)
                                ? item.product.pImage[0]
                                : item.product?.pImage?.split(",")[0];

                              return (
                                <div key={idx} className="order-product-item-fk">

                                  <div className="order-product-thumb-fk">
                                    <img
                                      src={productImage || "https://via.placeholder.com/64x64"}
                                      alt={item.product?.pName || "Product Unavailable"}
                                    />
                                  </div>

                                  <div className="order-product-text-fk">
                                    <div className="product-name-fk">
                                      <Link to={item.product?._id ? `/product/${item.product._id}` : "#"} className="item-title1">
                                        {item.product?.pName || "Product Unavailable"}
                                        {!item.product && (
                                          <span className="unavailable-point-fk"> (Currently Unavailable)</span>
                                        )}
                                      </Link>
                                    </div>
                                    <div className="product-brand-fk">
                                      {item.product?.pBrand || "Unavailable"}
                                    </div>
                                    {item.variantValue && (
                                      <div className="product-variant-fk">
                                        {item.variantType && !["Variant", "Details"].includes(item.variantType)
                                          ? `${item.variantType}: ` : ""}
                                        {item.variantValue}
                                      </div>
                                    )}
                                    <div className="product-qty-v3">
                                      Quantity: {item.quantity}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {order.items.length > 4 && (
                              <div className="order-product-more-fk">
                                +{order.items.length - 4}
                              </div>
                            )}

                          </div>

                          {/* Order Details */}
                          <div className="order-info-fk">

                            <div className="order-items-count-fk">

                              <span className="items-count-label-fk">{order.items?.length}</span>
                              <span className="items-unit-fk">Item{order.items?.length !== 1 ? "s" : ""}</span>
                            </div>
                            <div className="order-date-fk">
                              Ordered on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Section: Price and Chevron */}
                        <div className="order-bottom-section-fk">
                          <div className="order-total-fk">
                            <span className="total-label-fk">Total Amount</span>
                            <span className="total-value-fk">₹{order.finalAmount?.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="order-action-chevron-fk">
                            <FiChevronDown size={20} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-orders-v2">
                  <p>You haven't placed any orders yet</p>
                  <button
                    onClick={() => navigate("/")}
                    className="shop-now-button"
                  >
                    Start Shopping
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Add cancel confirmation dialog */}
          {showCancelConfirm && orderToCancel && (
            <div className="modal-overlay">
              <div className="cancel-modal">
                <h3>Cancel Order</h3>
                <p>Are you sure you want to cancel this order?</p>
                <p className="order-id-text">Order ID: {orderToCancel._id}</p>

                <div className="cancel-actions">
                  <button
                    className="confirm-cancel"
                    onClick={() => handleCancelOrder(orderToCancel._id)}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? (
                      <>
                        <div className="button-spinner"></div>
                        Cancelling...
                      </>
                    ) : (
                      "Yes, Cancel Order"
                    )}
                  </button>
                  <button
                    className="reject-cancel"
                    onClick={() => {
                      setShowCancelConfirm(false);
                      setOrderToCancel(null);
                    }}
                    disabled={cancelLoading}
                  >
                    No, Keep Order
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "addresses" && (
            <div className="manage-addresses-section">
              <div className="content-header">
                <h1 className="content-title">Manage Addresses</h1>
              </div>

              <div
                className="premium-add-card-v3"
                onClick={() => {
                  setAddressData({
                    type: "Home",
                    name: "",
                    mobile: "",
                    street: "",
                    city: "",
                    state: "",
                    pincode: "",
                    isDefault: false,
                    pincodeVerified: false,
                  });
                  setIsEditingAddress(false);
                  setShowAddressModal(true);
                }}
              >
                <FaPlus className="plus-icon-v3" />
                <span className="add-label-v3">ADD A NEW ADDRESS</span>
              </div>

              <div className="addresses-grid-v3">
                {user.addresses && user.addresses.length > 0 ? (
                  user.addresses.map((address) => (
                    <div key={address._id} className="address-tile-v3">
                      <div className="tile-header-v3">
                        <span className="type-badge-v3">{address.type}</span>
                        {address.isDefault && <span className="default-pill-v3">DEFAULT</span>}
                      </div>

                      <div className="tile-body-v3">
                        <div className="contact-row-v3">
                          <span className="name-v3">{address.name}</span>
                          <span className="phone-v3">{address.mobile}</span>
                        </div>
                        <p className="address-text-v3">
                          {address.street}, {address.city}, {address.state} - <span className="pin-v3">{address.pincode}</span>
                        </p>
                      </div>

                      <div className="tile-actions-v3">
                        <button
                          className="tile-btn edit"
                          onClick={() => handleEditAddress(address)}
                        >
                          EDIT
                        </button>
                        <button
                          className="tile-btn delete"
                          onClick={() => handleDeleteAddress(address._id)}
                        >
                          DELETE
                        </button>
                        {!address.isDefault && (
                          <button
                            className="tile-btn set-default"
                            onClick={() => handleSetDefaultAddress(address._id)}
                          >
                            SET DEFAULT
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-addresses-v3">
                    <p>You haven't added any addresses yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {showAddressModal && (
            <div className="modal-overlay">
              <div className="premium-modal-v3">

                {/* Header */}
                <div className="premium-modal-header-v3">
                  <div>
                    <h3>{isEditingAddress ? "Edit Address" : "Add Delivery Address"}</h3>
                    <p style={{ color: "#a8c8ff", fontSize: "13px", margin: "4px 0 0" }}>
                      Enter complete address details
                    </p>
                  </div>
                  <button
                    type="button"
                    className="premium-close-btn-v3"
                    onClick={() => {
                      setShowAddressModal(false);
                      setIsEditingAddress(false);
                      setAddressData({
                        type: "Home",
                        name: "",
                        mobile: "",
                        street: "",
                        city: "",
                        state: "",
                        pincode: "",
                        isDefault: false,
                        pincodeVerified: false,
                      });
                    }}
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleAddressSubmit} className="premium-modal-form-v3">
                  <div className="modal-grid-v3">

                    {/* Address Type Toggle */}
                    <div className="modal-field-v3" style={{ gridColumn: "1 / -1" }}>
                      <span className="field-label-v2">Address Type</span>
                      <div className="address-type-row">
                        {["Home", "Work", "Other"].map((type) => (
                          <button
                            key={type}
                            type="button"
                            className={`address-type-btn ${addressData.type === type ? "active" : ""}`}
                            onClick={() =>
                              handleAddressChange({ target: { name: "type", value: type } })
                            }
                          >
                            {type === "Home" ? "Home" : type === "Work" ? "Work" : "Other"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Full Name */}
                    <div className="modal-field-v3">
                      <div className="input-group-v2">
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={addressData.name}
                          onChange={handleAddressChange}
                          required
                          placeholder=" "
                          className="premium-input-v2"
                        />
                        <label htmlFor="name">Full Name</label>
                      </div>
                    </div>

                    {/* Mobile Number */}
                    <div className="modal-field-v3">
                      <div className="input-group-v2">
                        <input
                          type="tel"
                          id="mobile"
                          name="mobile"
                          value={addressData.mobile}
                          onChange={handleAddressChange}
                          required
                          pattern="[0-9]{10}"
                          maxLength="10"
                          placeholder=" "
                          className="premium-input-v2"
                        />
                        <label htmlFor="mobile">10-digit Mobile Number</label>
                      </div>
                    </div>

                    {/* PIN Code */}
                    <div className="modal-field-v3">
                      <div className="input-group-v2">
                        <input
                          type="text"
                          id="pincode"
                          name="pincode"
                          value={addressData.pincode}
                          onChange={handleAddressChange}
                          pattern="[0-9]{6}"
                          maxLength="6"
                          required
                          placeholder=" "
                          className="premium-input-v2"
                        />
                        <label htmlFor="pincode">6-digit PIN Code</label>
                        {isPincodeLoading && (
                          <span className="premium-loader-inline-v3"></span>
                        )}
                      </div>
                    </div>

                    {/* City */}
                    <div className="modal-field-v3">
                      <div className="input-group-v2">
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={addressData.city}
                          onChange={handleAddressChange}
                          required
                          disabled={isPincodeLoading || addressData.pincodeVerified}
                          placeholder=" "
                          className="premium-input-v2"
                        />
                        <label htmlFor="city">City / District</label>
                      </div>
                    </div>

                    {/* Street Address */}
                    <div className="modal-field-v3 full-width-v2">
                      <div className="input-group-v2">
                        <input
                          type="text"
                          id="street"
                          name="street"
                          value={addressData.street}
                          onChange={handleAddressChange}
                          required
                          placeholder=" "
                          className="premium-input-v2"
                        />
                        <label htmlFor="street">Flat, House no., Building, Area</label>
                      </div>
                    </div>

                    {/* State */}
                    <div className="modal-field-v3 full-width-v2">
                      <div className="input-group-v2">
                        <input
                          type="text"
                          id="state"
                          name="state"
                          value={addressData.state}
                          onChange={handleAddressChange}
                          required
                          disabled={isPincodeLoading || addressData.pincodeVerified}
                          placeholder=" "
                          className="premium-input-v2"
                        />
                        <label htmlFor="state">State</label>
                      </div>
                    </div>

                  </div>

                  {/* Default Address Checkbox */}
                  <div className="default-address-row">
                    <input
                      type="checkbox"
                      id="isDefault"
                      name="isDefault"
                      checked={addressData.isDefault}
                      onChange={handleAddressChange}
                    />
                    <label htmlFor="isDefault">Make this my default address</label>
                  </div>

                  {/* Footer */}
                  <div className="premium-modal-footer-v3">
                    <button
                      type="submit"
                      className="premium-save-btn-v3"
                      disabled={isPincodeLoading}
                    >
                      {isEditingAddress ? "UPDATE ADDRESS" : "SAVE AND DELIVER HERE"}
                    </button>
                    <button
                      type="button"
                      className="premium-cancel-btn-v3"
                      onClick={() => {
                        setShowAddressModal(false);
                        setIsEditingAddress(false);
                        setAddressData({
                          type: "Home",
                          name: "",
                          mobile: "",
                          street: "",
                          city: "",
                          state: "",
                          pincode: "",
                          isDefault: false,
                          pincodeVerified: false,
                        });
                      }}
                    >
                      CANCEL
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}



          {activeTab === "password" && (
            <div className="password-section-v2">
              <div className="content-header">
                <h1 className="content-title">Change Password</h1>
              </div>

              <form onSubmit={handlePasswordChange} className="password-form-v2">
                <div className="form-field-v2 full-width-v2">
                  <span className="field-label-v2">Current Password</span>
                  <div className="input-group-v2">
                    <input
                      type={showPasswords.currentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      placeholder=" "
                      className="premium-input-v21"
                      id="currentPassword"
                      required

                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      onClick={() => togglePasswordVisibility("currentPassword")}
                    >
                      {showPasswords.currentPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                    </button>
                  </div>
                </div>

                <div className="form-field-v2 full-width-v2">
                  <span className="field-label-v2">New Password</span>
                  <div className="input-group-v2">
                    <input
                      type={showPasswords.newPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      placeholder=" "
                      className="premium-input-v21"
                      id="newPassword"
                      required

                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      onClick={() => togglePasswordVisibility("newPassword")}
                    >
                      {showPasswords.newPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                    </button>
                  </div>
                </div>

                <div className="form-field-v2 full-width-v2">
                  <span className="field-label-v2">Confirm New Password</span>
                  <div className="input-group-v2">
                    <input
                      type={showPasswords.confirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder=" "
                      className="premium-input-v21"
                      id="confirmPassword"
                      required

                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      onClick={() => togglePasswordVisibility("confirmPassword")}
                    >
                      {showPasswords.confirmPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                    </button>
                  </div>
                </div>

                <div className="form-actions-v2">
                  <button
                    type="button"
                    className="premium-save-btn"
                    onClick={() => setShowPasswordConfirm(true)}
                  >
                    UPDATE PASSWORD
                  </button>
                </div>
                {showPasswordConfirm && (
                  <div className="prime-modal-overlay">
                    <div className="prime-modal" style={{ maxWidth: '420px' }}>

                      <div
                        className="prime-modal-body"
                        style={{ textAlign: 'center', padding: '40px 24px' }}
                      >
                        <FaLock
                          style={{
                            fontSize: '3rem',
                            color: '#2874f0',
                            marginBottom: '1.5rem'
                          }}
                        />

                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#212121',
                          margin: '0 0 12px 0'
                        }}>
                          Update Password?
                        </h3>

                        <p style={{
                          fontSize: '14px',
                          color: '#878787',
                          margin: '0 0 24px 0',
                          lineHeight: '1.5'
                        }}>
                          Are you sure you want to update your password?
                        </p>
                      </div>

                      <div className="prime-modal-footer">
                        <button
                          type="button"
                          className="prime-btn prime-btn-secondary"
                          onClick={() => setShowPasswordConfirm(false)}
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          className="prime-btn prime-btn-primary"
                          onClick={confirmPasswordUpdate}
                        >
                          Yes, Update
                        </button>
                      </div>

                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === "wallet" && (
            <div className="wallet-section-v2">
              <div className="content-header">
                <h1 className="content-title">My Wallet</h1>
              </div>
              <div
                className="premium-add-card-v3"
                onClick={() => setShowCodePassModal(true)}
                style={{ marginTop: "10px", marginBottom: "5px" }}
              >
                <FaPlus className="plus-icon-v3" />
                <span className="add-label-v3">ADD MONEY</span>
              </div>

              {/* Wallet Balance Card */}
              <div className="fk-wallet-card">
                <div className="fk-wallet-left">
                  <span className="fk-wallet-label">Available Balance</span>
                  {walletLoading.balance ? (
                    <div className="fk-wallet-shimmer" />
                  ) : (
                    <span className="fk-wallet-amount">
                      ₹{walletBalance.toLocaleString()}
                    </span>
                  )}
                  <span className="fk-wallet-sub">Picknow Wallet</span>
                </div>
                <div className="fk-wallet-right">
                  <div className="fk-wallet-icon-wrap">
                    <FaWallet size={26} color="#2874f0" />
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="fk-txn-section">
                <div className="fk-txn-header">
                  <h3 className="fk-txn-title">Transaction History</h3>
                </div>

                {walletLoading.transactions ? (
                  <div className="fk-txn-loading">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="fk-txn-skeleton">
                        <div className="fk-skeleton-icon" />
                        <div className="fk-skeleton-body">
                          <div className="fk-skeleton-line wide" />
                          <div className="fk-skeleton-line narrow" />
                        </div>
                        <div className="fk-skeleton-amount" />
                      </div>
                    ))}
                  </div>
                ) : walletTransactions.length > 0 ? (
                  <div className="fk-txn-list">
                    {walletTransactions.map((transaction, index) => (
                      <div
                        key={index}
                        className={`fk-txn-item ${transaction.type}`}
                      >
                        {/* Icon */}
                        <div className={`fk-txn-icon ${transaction.type}`}>
                          {transaction.type === "credit"
                            ? <FaArrowDown size={13} />
                            : <FaArrowUp size={13} />}
                        </div>

                        {/* Details */}
                        <div className="fk-txn-details">
                          <span className="fk-txn-desc">
                            {getTransactionMessage(transaction)}
                          </span>
                          <div className="fk-txn-meta">
                            <span className="fk-txn-id">
                              {transaction._id
                                ? `TXN${transaction._id.substring(transaction._id.length - 8).toUpperCase()}`
                                : "N/A"}
                            </span>
                            <span className="fk-txn-dot">•</span>
                            <span className="fk-txn-date">
                              {formatProfessionalDate(transaction.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Right: Amount + Badge */}
                        <div className="fk-txn-right">
                          <span className={`fk-txn-amount ${transaction.type}`}>
                            {transaction.type === "credit" ? "+" : "−"}₹{transaction.amount.toLocaleString()}
                          </span>
                          <span className={`fk-txn-badge ${transaction.status || "success"}`}>
                            {(transaction.status || "Completed").toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="fk-txn-empty">
                    <div className="fk-txn-empty-icon">
                      <FaWallet size={32} color="#c8c8c8" />
                    </div>
                    <p className="fk-txn-empty-title">No transactions yet</p>
                    <p className="fk-txn-empty-sub">
                      Your transaction history will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>





        {/* Code & Pass Modal */}
        {/* Code & Pass Modal */}
        {showCodePassModal && (
          <div className="modal-overlay">
            <div className="premium-modal-v3">

              {/* Header */}
              <div className="premium-modal-header-v3">
                <div>
                  <h3>Add Money with Code & Pass</h3>
                  <p style={{ color: "#a8c8ff", fontSize: "13px", margin: "4px 0 0" }}>
                    Enter your code, pass and amount
                  </p>
                </div>
                <button
                  type="button"
                  className="premium-close-btn-v3"
                  onClick={() => {
                    setShowCodePassModal(false);
                    setCodePassData({ code: "", pass: "", amount: "" });
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCodePassSubmit} className="premium-modal-form-v3">
                <div className="modal-grid-v3">

                  {/* Code */}
                  <div className="modal-field-v3 full-width-v2">
                    <div className="input-group-v2">
                      <input
                        type="text"
                        id="code"
                        name="code"
                        value={codePassData.code}
                        onChange={(e) =>
                          setCodePassData((prev) => ({ ...prev, code: e.target.value }))
                        }
                        required
                        placeholder=" "
                        className="premium-input-v2"
                      />
                      <label htmlFor="code">Enter Code</label>
                    </div>
                  </div>

                  {/* Pass */}
                  <div className="modal-field-v3 full-width-v2">
                    <div className="input-group-v2">
                      <input
                        type="password"
                        id="pass"
                        name="pass"
                        value={codePassData.pass}
                        onChange={(e) =>
                          setCodePassData((prev) => ({ ...prev, pass: e.target.value }))
                        }
                        required
                        placeholder=" "
                        className="premium-input-v2"
                      />
                      <label htmlFor="pass">Enter Pass</label>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="modal-field-v3 full-width-v2">
                    <div className="input-group-v2">
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={codePassData.amount}
                        onChange={(e) =>
                          setCodePassData((prev) => ({ ...prev, amount: e.target.value }))
                        }
                        required
                        min="1"
                        placeholder=" "
                        className="premium-input-v2 amount-input"
                      />
                      <label htmlFor="amount">Amount</label>
                      <span className="currency-symbol">₹</span>
                    </div>
                  </div>

                  {/* Quick Amount Chips */}
                  <div className="modal-field-v3 full-width-v2">
                    <div className="quick-amount-row">
                      {[100, 250, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          className={`quick-amount-chip ${Number(codePassData.amount) === amt ? "active" : ""
                            }`}
                          onClick={() =>
                            setCodePassData((prev) => ({ ...prev, amount: String(amt) }))
                          }
                        >
                          + ₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="premium-modal-footer-v3">
                  <button
                    type="submit"
                    className="premium-save-btn-v3"
                  >
                    ADD MONEY
                  </button>
                  <button
                    type="button"
                    className="premium-cancel-btn-v3"
                    onClick={() => {
                      setShowCodePassModal(false);
                      setCodePassData({ code: "", pass: "", amount: "" });
                    }}
                  >
                    CANCEL
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* Return Modal - Commented out
      {showReturnModal && selectedItemForReturn && (
        <div className="modal-overlay">
          <div className="return-modal">
            <h3>Return Product</h3>
            <div className="return-details">
              <h4>Order Details</h4>
              <p>Order ID: {selectedItemForReturn._id}</p>
              <p>Order Date: {new Date(selectedItemForReturn.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="return-items">
              <h4>Eligible Items for Return</h4>
              {eligibleReturnItems && eligibleReturnItems.length > 0 ? (
                <div className="eligible-items-list">
                  {eligibleReturnItems.map((item) => (
                    <div 
                      key={`${item.productId || 'unknown'}-${item.variantId || 'no-variant'}`} 
                      className="eligible-item"
                    >
                      <div className="product-image-container">
                        {item.productImage ? (
                          <img 
                            src={item.productImage}
                            alt={item.productName}
                            onError={(e) => {
                              e.target.onerror = null; // Prevent infinite loop
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiNFNUU3RUIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY2NiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                            }}
                          />
                        ) : (
                          <div className="no-image">
                            <span>No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="item-details">
                        <h5>{item.productName}</h5>
                        <p>Quantity: {item.quantity}</p>
                        <p>Price: ₹{item.price.toLocaleString()}</p>
                        <p>Return Policy: {item.returnPolicy} days</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No items eligible for return</p>
              )}
            </div>

            <form onSubmit={handleReturnSubmit}>
              <div className="form-group">
                <label htmlFor="returnReason">Reason for Return</label>
                <textarea
                  id="returnReason"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Please provide a reason for return"
                  required
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="return-button"
                  disabled={returnLoading || !eligibleReturnItems || eligibleReturnItems.length === 0}
                >
                  {returnLoading ? (
                    <>
                      <div className="button-spinner"></div>
                      Processing...
                    </>
                  ) : (
                    'Submit Return Request'
                  )}
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowReturnModal(false);
                    setSelectedItemForReturn(null);
                    setReturnReason('');
                  }}
                  disabled={returnLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      */}

        {/* Add the review modal */}
        {showReviewModal && selectedProductForReview && (
          <div className="modal-overlay">
            <div className="premium-modal-v3">

              {/* Header */}
              <div className="premium-modal-header-v3">
                <div>
                  <h3>Write a Review</h3>
                  <p style={{ color: "#a8c8ff", fontSize: "13px", margin: "4px 0 0" }}>
                    Your feedback helps other shoppers
                  </p>
                </div>
                <button
                  type="button"
                  className="premium-close-btn-v3"
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedProductForReview(null);
                    setReviewData({ rating: 0, review: "" });
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              {/* Product Preview */}
              <div className="review-product-preview">
                <img
                  src={selectedProductForReview.product.pImage}
                  alt={selectedProductForReview.product.pName}
                  className="review-product-thumb"
                />
                <div className="review-product-info">
                  <h4 className="review-product-name">
                    {selectedProductForReview.product.pName}
                  </h4>
                  <p className="review-product-sub">Share your experience with this product</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitReview} className="premium-modal-form-v3">

                {/* Star Rating */}
                <div className="review-rating-section">
                  <span className="review-section-label">Rate this product</span>
                  <div className="review-stars-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`review-star-btn ${reviewData.rating >= star ? "active" : ""}`}
                        onClick={() =>
                          setReviewData((prev) => ({ ...prev, rating: star }))
                        }
                        onMouseEnter={() => {
                          document.querySelectorAll(".review-star-btn").forEach((s, i) => {
                            i < star ? s.classList.add("hover") : s.classList.remove("hover");
                          });
                        }}
                        onMouseLeave={() => {
                          document.querySelectorAll(".review-star-btn").forEach((s) =>
                            s.classList.remove("hover")
                          );
                        }}
                      >
                        ★
                      </button>
                    ))}
                    {reviewData.rating > 0 && (
                      <span className="review-rating-label">
                        {reviewData.rating === 1 ? "Poor"
                          : reviewData.rating === 2 ? "Fair"
                            : reviewData.rating === 3 ? "Good"
                              : reviewData.rating === 4 ? "Very Good"
                                : "Excellent"}
                      </span>
                    )}
                  </div>

                  {reviewData.rating > 0 && (
                    <div className="review-rating-feedback">
                      {reviewData.rating === 1
                        ? "We're sorry to hear that. Please let us know what went wrong."
                        : reviewData.rating === 2
                          ? "We appreciate your feedback. What could we improve?"
                          : reviewData.rating === 3
                            ? "Thanks! What did you like and what could be better?"
                            : reviewData.rating === 4
                              ? "Great! What did you like most about the product?"
                              : "Excellent! What made it perfect for you?"}
                    </div>
                  )}
                </div>

                {/* Review Textarea */}
                <div className="review-text-section">
                  <span className="review-section-label">Your Review</span>
                  <div className="review-textarea-wrap">
                    <textarea
                      id="review"
                      value={reviewData.review}
                      onChange={(e) =>
                        setReviewData((prev) => ({ ...prev, review: e.target.value }))
                      }
                      placeholder="Share your experience — quality, fit, value for money. Would you recommend it?"
                      required
                      rows={4}
                      maxLength={500}
                      className="review-textarea"
                    />
                    <span className={`review-char-count ${reviewData.review.length >= 450 ? "warn" : ""}`}>
                      {reviewData.review.length}/500
                    </span>
                  </div>
                </div>

                {/* Tips */}
                <div className="review-tips-box">
                  <span className="review-tips-title">Tips for a helpful review</span>
                  <ul className="review-tips-list">
                    <li>Comment on product quality and durability</li>
                    <li>Mention if it met your expectations</li>
                    <li>Include pros and cons you noticed</li>
                    <li>Would you recommend it to others?</li>
                  </ul>
                </div>

                {/* Footer */}
                <div className="premium-modal-footer-v3">
                  <button
                    type="submit"
                    className="premium-save-btn-v3"
                    disabled={submittingReview || !reviewData.rating || !reviewData.review.trim()}
                  >
                    {submittingReview ? (
                      <>
                        <span className="premium-loader-inline-v3"></span>
                        &nbsp; SUBMITTING...
                      </>
                    ) : (
                      "SUBMIT REVIEW"
                    )}
                  </button>
                  <button
                    type="button"
                    className="premium-cancel-btn-v3"
                    disabled={submittingReview}
                    onClick={() => {
                      setShowReviewModal(false);
                      setSelectedProductForReview(null);
                      setReviewData({ rating: 0, review: "" });
                    }}
                  >
                    CANCEL
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* Logout Confirmation Popup */}
        <AnimatePresence>
          {showLogoutConfirm && (
            <div className="prime-modal-overlay">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="prime-modal logout-modal-v2"
              >
                <div className="prime-modal-body">
                  <div className="logout-logo-container">
                    <img src={PicknowLogo} alt="Picknow" className="logout-brand-logo" />
                  </div>
                  <h3 className="logout-title-v2">See you soon!</h3>
                  <p className="logout-message-v2">
                    You are about to log out from your account. Are you sure you want to leave?
                  </p>
                </div>

                <div className="logout-footer-v2">
                  <button
                    type="button"
                    className="logout-btn-cancel"
                    onClick={() => setShowLogoutConfirm(false)}
                  >
                    Stay Here
                  </button>
                  <button
                    type="button"
                    className="logout-btn-confirm"
                    onClick={handleLogout}
                  >
                    Yes, Log Out
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UserProfile;

