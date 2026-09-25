import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trash,
  ShoppingBag,
  AlertCircle,
  LogIn,
  Package,
  ArrowRight,
  Plus,
  Minus,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import { useSnackbar } from "notistack";
import { motion, AnimatePresence } from "framer-motion";
import { cartApi } from "../../APi/cartApi";
import { transformImageUrl } from "../../APi/utils";
import CheckoutPage from "./CheckoutPage";
import "./CartPage.css";

const ModernCartPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [cart, setCart] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutProcessing, setCheckoutProcessing] = useState(false);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [updatingQuantityId, setUpdatingQuantityId] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const [cartSummary, setCartSummary] = useState({
    subtotal: 0,
    platformFee: 0,
    shippingCharges: 0,
    finalAmount: 0,
  });

  // Fetch cart data on component mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      enqueueSnackbar("Please login to access your cart", {
        variant: "warning",
        autoHideDuration: 3000,
        anchorOrigin: { vertical: "top", horizontal: "right" },
      });
      setIsLoading(false);
    } else {
      setIsAuthenticated(true);
      fetchCart();
    }
  };

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const response = await cartApi.getCart();

      if (response.success) {
        const cartItems = response.cart?.items || [];
        const itemsWithDetails = cartItems.map(item => ({
          ...item,
          product: item.product ? {
            ...item.product,
            pImage: Array.isArray(item.product.pImage)
              ? item.product.pImage.map(transformImageUrl)
              : []
          } : null
        }));

        setCart(itemsWithDetails);
        updateCartSummary(response.cart);
        updateCartCount(itemsWithDetails);
      } else {
        throw new Error(response.message || "Failed to fetch cart");
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      enqueueSnackbar(error.message || "Failed to load cart", {
        variant: "error",
        autoHideDuration: 3000,
        anchorOrigin: { vertical: "top", horizontal: "right" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartSummary = (cartData) => {
    setCartSummary({
      subtotal: cartData?.totalAmount || 0,
      platformFee: cartData?.platformFee || 0,
      shippingCharges: cartData?.shippingCharges || 0,
      finalAmount: cartData?.finalAmount || 0,
    });
  };

  const updateCartCount = (items) => {
    const totalItems = items.length;
    window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { count: totalItems } }));
  };

  const handleUpdateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return;

    const itemId = item._id;
    const isVariant = !!item.variantId;

    try {
      setUpdatingQuantityId(itemId);

      const response = await cartApi.updateQuantity(
        itemId,
        newQuantity,
        isVariant
      );

      if (response.success) {
        setCart(prevCart =>
          prevCart.map(cartItem =>
            cartItem._id === itemId
              ? { ...cartItem, quantity: newQuantity }
              : cartItem
          )
        );
        updateCartSummary(response.cart);
        updateCartCount(response.cart?.items || []);

        enqueueSnackbar("Quantity updated", {
          variant: "success",
          autoHideDuration: 1500,
          anchorOrigin: { vertical: "top", horizontal: "right" },
        });
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      enqueueSnackbar(error.message || "Failed to update quantity", {
        variant: "error",
        autoHideDuration: 3000,
        anchorOrigin: { vertical: "top", horizontal: "right" },
      });
      // Re-fetch to ensure sync
      fetchCart();
    } finally {
      setUpdatingQuantityId(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      setRemovingItemId(itemId);
      const response = await cartApi.removeItem(itemId);

      if (response.success) {
        setCart(prevCart => prevCart.filter(item => item._id !== itemId));
        updateCartSummary(response.cart);
        updateCartCount(response.cart?.items || []);

        enqueueSnackbar("Item removed from cart", {
          variant: "success",
          autoHideDuration: 3000,
          anchorOrigin: { vertical: "top", horizontal: "right" },
        });
      }
    } catch (error) {
      console.error("Error removing item:", error);
      enqueueSnackbar(error.message || "Failed to remove item", {
        variant: "error",
        autoHideDuration: 3000,
        anchorOrigin: { vertical: "top", horizontal: "right" },
      });
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      enqueueSnackbar("Please login to proceed to checkout", {
        variant: "warning",
        autoHideDuration: 3000,
        anchorOrigin: { vertical: "top", horizontal: "right" },
      });
      return;
    }
    setShowCheckout(true);
  };

  const handleOrderPlaced = () => {
    setShowCheckout(false);
    fetchCart();
  };

  // Calculate discount percentage if original price is available
  const calculateDiscount = (item) => {
    if (!item.product?.pOriginalPrice || item.product.pOriginalPrice <= item.price) return 0;
    return Math.round(((item.product.pOriginalPrice - item.price) / item.product.pOriginalPrice) * 100);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your cart...</p>
      </div>
    );
  }

  // Render empty cart state
  if (cart.length === 0 && !isLoading) {
    return (
      <div className="empty-cart">
        <ShoppingCart size={64} className="empty-cart-icon" />
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything to your cart yet.</p>
        <Link to="/" className="shop-button">
          Continue Shopping <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <header className="cart-header">
        <button onClick={() => navigate(-1)} className="back-button" aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <h1>
          Your Shopping Cart
          <span className="cart-count-badge">
            {cart.length} items
          </span>
        </h1>
      </header>

      <div className="cart-content">
        <div className="cart-items">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                key={item._id}
                className="cart-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100, height: 0, padding: 0, margin: 0, border: 0 }}
                transition={{ duration: 0.3 }}
                layout
              >
                <div className="cart-item-image-container">
                  {item.product?.pImage?.[0] ? (
                    <img
                      src={item.product.pImage[0]}
                      alt={item.product.pName || 'Product'}
                      className="cart-item-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-product.jpg';
                      }}
                    />
                  ) : (
                    <div className="cart-item-image-placeholder">
                      <Package size={32} />
                    </div>
                  )}
                </div>

                <div className="cart-item-info">
                  <h3>{item.product?.pName || 'Product'}</h3>
                  <p className="item-weight">{item.weight || '1 kg'}</p>

                  <div className="price-section">
                    <span className="current-price">
                      ₹{item.price?.toFixed(2) || '0.00'}
                    </span>
                    {item.product?.pOriginalPrice > item.price && (
                      <span className="original-price">
                        ₹{item.product.pOriginalPrice.toFixed(2)}
                      </span>
                    )}
                    {calculateDiscount(item) > 0 && (
                      <span className="discount-badge">
                        {calculateDiscount(item)}% OFF
                      </span>
                    )}
                  </div>
                </div>

                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button
                      className="quantity-button"
                      onClick={() => handleUpdateQuantity(item, (item.quantity || 1) - 1)}
                      disabled={updatingQuantityId === item._id || (item.quantity || 1) <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={16} />
                    </button>

                    <input
                      type="number"
                      className="quantity-input"
                      value={item.quantity || 1}
                      min="1"
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        handleUpdateQuantity(item, value);
                      }}
                      disabled={updatingQuantityId === item._id}
                      aria-label="Quantity"
                    />

                    <button
                      className="quantity-button"
                      onClick={() => handleUpdateQuantity(item, (item.quantity || 1) + 1)}
                      disabled={updatingQuantityId === item._id}
                      aria-label="Increase quantity"
                    >
                      {updatingQuantityId === item._id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Plus size={16} />
                      )}
                    </button>
                  </div>

                  <button
                    className="remove-button"
                    onClick={() => handleRemoveItem(item._id)}
                    disabled={removingItemId === item._id}
                  >
                    {removingItemId === item._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash size={16} />
                    )}
                    <span>Remove</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="cart-summary-container">
          <motion.div
            className="cart-summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="summary-title">
              <ShoppingBag size={20} /> Order Summary
            </h3>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{cartSummary.subtotal?.toFixed(2)}</span>
            </div>

            <div className="summary-row summary-total">
              <span>Total</span>
              <span>₹{cartSummary.subtotal?.toFixed(2)}</span>
            </div>

            <button
              className="checkout-button"
              onClick={handleProceedToCheckout}
              disabled={!isAuthenticated || checkoutProcessing}
            >
              {checkoutProcessing ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Checkout
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {!isAuthenticated && (
              <div className="auth-prompt">
                <AlertCircle size={16} />
                <span>
                  Please <Link to="/login">login</Link> to proceed to checkout
                </span>
              </div>
            )}
          </motion.div>

          <motion.div
            className="continue-shopping"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/" className="text-link">
              <ArrowLeft size={16} /> Continue Shopping
            </Link>
          </motion.div>
        </div>
      </div>

      {showCheckout && (
        <CheckoutPage
          cart={cart}
          cartSummary={cartSummary}
          onClose={() => setShowCheckout(false)}
          onOrderPlaced={handleOrderPlaced}
        />
      )}
    </div>
  );
};

export default ModernCartPage;
