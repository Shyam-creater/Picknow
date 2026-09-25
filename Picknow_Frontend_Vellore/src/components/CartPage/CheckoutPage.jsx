import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MapPin, Plus, Edit2, Trash2, Check, ChevronRight,
  CreditCard, Wallet, Smartphone, Building2, Package,
  ShieldCheck, Tag, Star, Bookmark, Zap, Receipt, Info, Truck, Calendar
} from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import ConfettiExplosion from "react-confetti-explosion";
import "./CheckoutPage.css";
import { cartApi } from "../../APi/cartApi";
import { userApi } from "../../APi/userApi";
import { transformImageUrl } from "../../APi/utils";
import ModernLoader from "../Loading/ModernLoader";

// --- SUB-COMPONENTS (Defined outside to prevent remount issues) ---
const CheckoutProgressBar = ({ currentStep, Check }) => {
  const steps = [
    { id: 1, label: "Address", icon: <MapPin size={14} /> },
    { id: 2, label: "Order Summary", icon: <Package size={14} /> },
    { id: 3, label: "Payment", icon: <CreditCard size={14} /> },
  ];

  return (
    <div className="checkout-header-wrapper">
      {/* Mobile Step Text */}
      <div className="mobile-step-info">
        Step {currentStep} of 3: <strong>{steps[currentStep - 1].label}</strong>
      </div>

      <div className="checkout-progress-bar">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div className={`progress-step-column ${isActive ? "active" : ""}`}>
                <div className={`step-circle ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}>
                  {isCompleted ? (
                    <Check size={14} strokeWidth={3} color="#fff" />
                  ) : (
                    <span className={`circle-icon ${isActive ? "active" : ""}`}>
                      {step.icon}
                    </span>
                  )}
                </div>
                <span className={`step-label ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}>
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <div className="progress-line-track">
                  <div
                    className="progress-line-fill"
                    style={{ width: isCompleted ? "100%" : "0%" }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const AddressStep = ({ addresses, selectedAddress, setSelectedAddress, navigate, Plus, handleContinueToSummary }) => (
  <div className="checkout-card">
    <div className="checkout-card-header">
      <h3>Select Delivery Address</h3>
      <button
        className="change-addr-btn"
        onClick={() => navigate("/profile", { state: { activeTab: "addresses" } })}
      >
        <Plus size={16} /> Add New Address
      </button>
    </div>
    <div className="address-list-container" style={{ padding: '24px' }}>
      {addresses.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#666', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <MapPin size={48} color="#ccc" strokeWidth={1} />
          <p style={{ fontSize: '15px', color: '#878787' }}>No addresses found in your profile.</p>
          <button
            className="change-addr-btn"
            style={{ float: 'none', background: '#2874f0', color: '#fff', border: 'none', padding: '8px 24px' }}
            onClick={() => navigate("/profile", { state: { activeTab: "addresses" } })}
          >
            <Plus size={16} /> ADD NEW ADDRESS
          </button>
        </div>
      ) : (
        addresses.map((addr) => (
          <div
            key={addr._id}
            className={`address-card ${selectedAddress === addr._id ? "selected" : ""}`}
            onClick={() => handleContinueToSummary(addr._id)}
            style={{
              border: selectedAddress === addr._id ? '1px solid #2874f0' : '1px solid #ddd',
              borderRadius: '4px',
              padding: '16px',
              marginBottom: '12px',
              cursor: 'pointer',
              background: selectedAddress === addr._id ? '#f5faff' : '#fff',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <input
                type="radio"
                checked={selectedAddress === addr._id}
                onChange={() => { }} // Controlled by parent div click
              />
              <span style={{ fontWeight: '600', fontSize: '14px' }}>{addr.name}</span>
              <span style={{
                fontSize: '11px',
                background: '#eee',
                padding: '2px 6px',
                borderRadius: '2px',
                textTransform: 'uppercase'
              }}>{addr.type || 'home'}</span>
              <span style={{ fontWeight: '600', fontSize: '14px', marginLeft: 'auto' }}>{addr.mobile}</span>
            </div>
            <p style={{ fontSize: '14px', color: '#444', marginLeft: '24px' }}>
              {addr.street}, {addr.locality}, {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
            </p>
          </div>
        ))
      )}
    </div>
  </div>
);

const SummaryStep = ({
  addresses,
  selectedAddress,
  cartItems,
  formatINR,
  transformImageUrl,
  setCurrentStep,
  handleContinueToPayment,
  navigate,
  handleUpdateQuantity,
  handleRemoveItem,
  handleSaveForLater,
  updatingQuantityId,
  removingItemId,
  isBuyNow,
  cartSummary
}) => {
  const activeAddress = addresses.find(a => a._id === selectedAddress);
  const deliveryDate = getDeliveryDate();
  const totalItems = cartItems.length;

  return (
    <div className="checkout-left-content">
      <div className="checkout-card">
        <div className="checkout-card-header">
          <h3>{isBuyNow ? "Order Summary" : `Order Summary (${totalItems})`}</h3>
        </div>
        <div className="deliver-card-internal">
          <div className="deliver-info">
            {activeAddress ? (
              <>
                <div className="deliver-label">Deliver to:</div>
                <div className="deliver-name-row">
                  <span className="deliver-name-pin">
                    {activeAddress.name}, {activeAddress.pincode}
                  </span>
                </div>
                <div className="deliver-address-line">
                  {activeAddress.street}, {activeAddress.city}, {activeAddress.state}
                </div>
                {activeAddress.mobile && (
                  <span className="deliver-phone">{activeAddress.mobile}</span>
                )}
              </>
            ) : (
              <div className="deliver-info-empty">
                <div className="deliver-label" style={{ color: '#ff6161' }}>Attention Required:</div>
                <div className="deliver-address-line" style={{ color: '#878787', fontStyle: 'italic', marginTop: '4px' }}>
                  No delivery address selected. Please add or select an address.
                </div>
              </div>
            )}
          </div>
          <button
            className="change-addr-btn"
            onClick={() => navigate("/profile", { state: { activeTab: "addresses" } })}
          >
            {activeAddress ? "Change" : "Add Address"}
          </button>
        </div>
      </div>

      <div className="checkout-card">
        <div className="summary-item-list">
          <AnimatePresence>
            {cartItems.map((item) => {
              const { id, isVariant } = getItemIdentifier(item);
              const isUpdating = String(updatingQuantityId) === String(id);
              const isRemoving = String(removingItemId) === String(id);
              const availableStock = getAvailableStock(item);
              const itemPrice = item.price || item.product?.pPrice || 0;
              const totalPrice = itemPrice * item.quantity;
              const discPct = getDiscountPercent(item);
              const mrp = getMrp(item);
              const rating = item.product?.pRating || 0;
              const ratingCount = item.product?.pRatingCount || item.product?.ratingCount || 0;
              const pName = item.variantType === "combo" ? item.comboName : (item.product?.pName || "Product");
              const rawImg = item.variantType === "combo"
                ? item.comboImage
                : (item.product?.pImage?.[0] || item.product?.pImage || "/placeholder.jpg");
              const productImg = transformImageUrl(rawImg);

              return (
                <motion.div
                  key={String(id)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="cart-item"
                >
                  <div className="cart-item-top">
                    <div className="item-left-col">
                      <div className="item-img-container">
                        <img className="item-img" src={productImg} alt={pName} />
                      </div>
                      <div className="qty-wrapper">
                        <button
                          className="qty-btn"
                          disabled={isUpdating || item.quantity <= 1}
                          onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="qty-input">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          disabled={isUpdating || item.quantity >= availableStock}
                          onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="item-right-col">
                      <div className="item-title-container">
                        <div className="item-title">
                          {pName}
                        </div>
                      </div>

                      {item.product?.pBrand && (
                        <span className="item-brand-tag">{item.product.pBrand}</span>
                      )}

                      {item.variantType && item.variantValue && (
                        <div className="item-variant">
                          {item.variantType}: {item.variantValue}
                        </div>
                      )}

                      {/* <div className="item-rating-row">
                        {rating > 0 && (
                          <>
                            <span className="rating-stars">
                              {rating.toFixed(1)} <Star size={10} fill="white" stroke="none" />
                            </span>
                            <span className="rating-count">({ratingCount.toLocaleString("en-IN")})</span>
                          </>
                        )}
                      </div> */}

                      <div className="item-price-section">
                        <span className="price-now">₹{formatINR(totalPrice)}</span>
                        {mrp > 0 && mrp > itemPrice && (
                          <>
                            <span className="price-old">₹{formatINR(mrp * item.quantity)}</span>
                            <span className="price-disc-pct">{discPct}% off</span>
                          </>
                        )}
                      </div>

                      <div className="item-delivery-info">
                        <div className="stock-info">
                          <Package size={14} style={{ color: availableStock <= 5 ? "#ff6161" : "#388e3c" }} />
                          {availableStock > 0 ? (
                            <span className={availableStock <= 5 ? "stock-alert" : "stock-available"}>
                              {availableStock <= 5 ? `Only ${availableStock} left` : `${availableStock} in stock`}
                            </span>
                          ) : (
                            <span className="stock-alert">Out of stock</span>
                          )}
                        </div>
                      </div>
                      <span className="delivery-right">
                        <Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', marginTop: '-2px' }} />
                        Delivery by {deliveryDate}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const PaymentStep = ({ selectedPayment, setSelectedPayment, isProcessing, handlePlaceOrder, cartSummary, formatINR }) => (
  <div className="checkout-card">
    <div className="checkout-card-header">
      <h3>Payment Options</h3>
    </div>
    <div style={{ padding: '24px' }}>
      <div
        className={`payment-option ${selectedPayment === 'ONLINE' ? 'selected' : ''}`}
        onClick={() => setSelectedPayment(selectedPayment === 'ONLINE' ? null : 'ONLINE')}
        style={{
          border: '1px solid #ddd',
          padding: '16px',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
          background: selectedPayment === 'ONLINE' ? '#f5faff' : '#fff'
        }}
      >
        <input type="radio" checked={selectedPayment === 'ONLINE'} readOnly />
        <div>
          <div style={{ fontWeight: '600' }}>Online Payment (Razorpay)</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Cards, UPI, NetBanking, Wallets</div>
        </div>
      </div>

    </div>
  </div>
);

const formatINR = (n) => Number(n || 0).toLocaleString("en-IN");

// Platform fee matches backend constant (see cartController.js)
const PLATFORM_FEE = 8;

const getDeliveryDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};

const getItemIdentifier = (item) => {
  if (item.variantType === "combo" || item.variantId)
    return { id: item.variantId, isVariant: true };
  return { id: item.product?._id, isVariant: false };
};

const getAvailableStock = (item) => {
  if (item.variantType === "combo") return 10;
  if (item.variantId) {
    const variants = item.product?.variants || [];
    const v = variants.find((v) =>
      (v?._id?.toString() || v?.id?.toString()) === item.variantId?.toString()
    );
    if (v) return Number(v.stock || v.pStock || 0);
    if (item.product?.variants?._id?.toString() === item.variantId?.toString())
      return Number(item.product.variants.stock || 0);
  }
  return Number(item.product?.pStock || 0);
};

const getDiscountPercent = (item) => {
  const variant = item.variantId && item.product?.variants?.find(v => (v?._id || v?.id)?.toString() === item.variantId?.toString());
  if (variant?.offer) return Number(variant.offer);
  if (item.product?.pOffer > 0) return Number(item.product.pOffer);

  const price = item.price || item.product?.pPrice || 0;
  const prev = variant?.previousPrice || item.product?.pPreviousPrice || item.product?.pMrp || item.product?.pOriginalPrice || 0;
  if (prev > price && prev > 0) return Math.round(((prev - price) / prev) * 100);
  return 0;
};

const getMrp = (item) => {
  const variant = item.variantId && item.product?.variants?.find(v => (v?._id || v?.id)?.toString() === item.variantId?.toString());
  if (variant?.previousPrice) return Number(variant.previousPrice);
  if (item.product?.pPreviousPrice) return Number(item.product.pPreviousPrice);
  if (item.product?.pMrp) return Number(item.product.pMrp);
  if (item.product?.pOriginalPrice) return Number(item.product.pOriginalPrice);

  const price = item.price || item.product?.pPrice || 0;
  const disc = getDiscountPercent(item);
  if (disc > 0) return Math.round(price * (100 / (100 - disc)));
  return 0;
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // User info
  const [userInfo, setUserInfo] = useState(
    JSON.parse(localStorage.getItem("user")) || {}
  );

  // Step management
  const [currentStep, setCurrentStep] = useState(2); // Start directly at Order Summary as confirmed in cart

  const [removingItemId, setRemovingItemId] = useState(null);
  const [updatingQuantityId, setUpdatingQuantityId] = useState(null);

  // Cart data
  const [cartItems, setCartItems] = useState([]);

  const handleUpdateQuantity = async (item, newQuantity) => {
    try {
      const { id, isVariant } = getItemIdentifier(item);
      if (newQuantity < 1) { await handleRemoveOriginal(item); return; }
      if (updatingQuantityId === id) return;
      setUpdatingQuantityId(id);
      const stock = getAvailableStock(item);
      if (newQuantity > stock) {
        toast.warning(`Only ${stock} items available`);
        newQuantity = stock;
      }
      const response = await cartApi.updateQuantity(id, newQuantity, isVariant, item);
      if (response.success) {
        const updatedItems = cartItems.map((ci) => {
          const ciId = getItemIdentifier(ci);
          const match = isVariant ? String(ciId.id) === String(id) : ci.product?._id === id;
          return match ? { ...ci, quantity: newQuantity } : ci;
        });

        setCartItems(updatedItems);
        toast.success("Quantity updated");

        // --- BUY NOW MODE: Local Update ---
        if (location.state?.cart && location.state?.isFromCart === false) {
          const priceDetails = calculatePriceDetails(updatedItems);
          setCartSummary((prev) => {
            const newSubtotal = updatedItems.reduce((sum, i) => sum + (i.price || i.product?.pPrice || 0) * i.quantity, 0);
            // Re-calculate basic shipping if needed, though useEffect will do the precision check
            const initialShipping = (newSubtotal >= 500 || updatedItems.every(i => i.product?.freeshipping === true)) ? 0 : prev.shippingfee;

            return {
              ...prev,
              subtotal: newSubtotal,
              total: priceDetails.offerPrice + prev.platformFee + initialShipping - prev.kaitCoinsUsed,
              originalTotal: priceDetails.offerPrice,
              cashPayment: priceDetails.offerPrice + prev.platformFee + initialShipping - prev.kaitCoinsUsed,
              originalPrice: priceDetails.originalPrice,
              offerPrice: priceDetails.offerPrice,
              totalSavings: priceDetails.totalSavings,
              shippingfee: initialShipping,
            };
          });
        } else {
          // --- REGULAR MODE: Refetch cart ---
          const cartRes = await cartApi.getCart();
          if (cartRes.success) {
            window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { count: cartRes.cart?.items?.length || 0 } }));

            const newSubtotal = cartRes.cart?.totalAmount || 0;
            const newPlatformFee = cartRes.cart?.platformFee || PLATFORM_FEE;

            setCartSummary((prev) => {
              // Priority: 1. Backend shipping, 2. Local threshold check, 3. Previous value
              let effectiveShipping = cartRes.cart?.shippingCharges;
              if (effectiveShipping === undefined || effectiveShipping === null) {
                effectiveShipping = (newSubtotal >= 500 || (cartRes.cart?.items || []).every(i => i.product?.freeshipping === true)) ? 0 : prev.shippingfee;
              }

              const total = newSubtotal + newPlatformFee + effectiveShipping - prev.kaitCoinsUsed;

              return {
                ...prev,
                originalTotal: newSubtotal,
                subtotal: newSubtotal,
                discount: cartRes.cart?.totalDiscount || 0,
                platformFee: newPlatformFee,
                shippingfee: effectiveShipping,
                total: total,
                cashPayment: total,
              };
            });

            // Explicitly trigger shipping update if address is selected
            if (selectedAddress && addresses.length > 0 && isDeliveryDataLoaded) {
              const activeAddr = addresses.find(a => a._id === selectedAddress);
              if (activeAddr && activeAddr.state) {
                updateShippingFee(deliverydata, activeAddr.state, cartRes.cart?.items || updatedItems);
              }
            }
          }
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to update quantity");
    } finally {
      setUpdatingQuantityId(null);
    }
  };

  const handleRemoveOriginal = async (item) => {
    const { id, isVariant } = getItemIdentifier(item);
    try {
      setRemovingItemId(id);
      const response = await cartApi.removeItem(id, isVariant);
      if (response.success) {
        // --- BUY NOW MODE ---
        if (location.state?.cart && location.state?.isFromCart === false) {
          toast.success("Item removed");
          navigate("/cart");
          return;
        }

        // --- REGULAR MODE ---
        const updatedItems = response.cart?.items || [];
        setCartItems(updatedItems);

        const newSubtotal = response.cart?.totalAmount || 0;
        const newPlatformFee = response.cart?.platformFee || PLATFORM_FEE;

        setCartSummary((prev) => {
          let effectiveShipping = response.cart?.shippingCharges;
          if (effectiveShipping === undefined || effectiveShipping === null) {
            effectiveShipping = (newSubtotal >= 500 || updatedItems.every(i => i.product?.freeshipping === true)) ? 0 : prev.shippingfee;
          }

          const total = newSubtotal + newPlatformFee + effectiveShipping - prev.kaitCoinsUsed;

          return {
            ...prev,
            originalTotal: newSubtotal,
            subtotal: newSubtotal,
            discount: response.cart?.totalDiscount || 0,
            platformFee: newPlatformFee,
            shippingfee: effectiveShipping,
            total: total,
            cashPayment: total,
          };
        });

        // Explicitly trigger shipping update
        if (selectedAddress && addresses.length > 0 && isDeliveryDataLoaded) {
          const activeAddr = addresses.find(a => a._id === selectedAddress);
          if (activeAddr && activeAddr.state) {
            updateShippingFee(deliverydata, activeAddr.state, updatedItems);
          }
        }
        toast.success("Item removed");
        if (updatedItems.length === 0) navigate("/cart");
      }
    } catch (error) {
      toast.error("Failed to remove item");
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleSaveForLater = async (item) => {
    const { id, isVariant } = getItemIdentifier(item);
    try {
      const response = await addToWishlist(
        isVariant ? item.product?._id : id,
        isVariant ? id : null
      );
      if (response.success) {
        await handleRemoveOriginal(item);
        toast.success("Moved to wishlist");
      }
    } catch (error) {
      toast.error("Failed to save for later");
    }
  };
  const [loading, setLoading] = useState(true);

  // Address management
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: "",
    mobile: "",
    pincode: "",
    street: "",
    locality: "",
    city: "",
    state: "",
    type: "home",
    isDefault: false
  });

  // Payment
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Delivery data
  const [deliverydata, setdeliverydata] = useState([]);
  const [isDeliveryDataLoaded, setIsDeliveryDataLoaded] = useState(false);

  // Voucher system
  const [useKaitCoins50, setUseKaitCoins50] = useState(false);
  const [useKaitCoins100, setUseKaitCoins100] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showVoucherConfetti, setShowVoucherConfetti] = useState(false);

  // Cart summary
  const [cartSummary, setCartSummary] = useState({
    subtotal: 0,
    platformFee: 0,
    total: 0,
    originalTotal: 0,
    kaitCoinsUsed: 0,
    cashPayment: 0,
    shippingfee: 0,
    originalPrice: 0,
    offerPrice: 0,
    totalSavings: 0,
  });

  // Helper functions
  const isComboItem = (item) =>
    (item.product?.pType || item.variantType) === "combo";

  const hasCombo = cartItems.some(isComboItem);
  const hasvoucher50 = cartItems.some(
    (item) =>
      isComboItem(item) || (item.product?.pis_voucher_50 || false) === true
  );
  const hasvoucher100 = cartItems.some(
    (item) =>
      isComboItem(item) || (item.product?.pis_voucher_100 || false) === true
  );
  const hasVoucherEligibleItems = hasvoucher50 || hasvoucher100;

  const voucherSubtotal50 = cartItems.reduce((sum, item) => {
    if (isComboItem(item) || item.product?.pis_voucher_50 === true) {
      const unitPrice = item.price || item.product?.pPrice || 0;
      return sum + unitPrice * (item.quantity || 1);
    }
    return sum;
  }, 0);

  const voucherSubtotal100 = cartItems.reduce((sum, item) => {
    if (isComboItem(item) || item.product?.pis_voucher_100 === true) {
      const unitPrice = item.price || item.product?.pPrice || 0;
      return sum + unitPrice * (item.quantity || 1);
    }
    return sum;
  }, 0);

  const productSubtotal = cartItems.reduce((sum, item) => {
    if ((item.product?.pType || item.variantType) !== "combo") {
      const unitPrice = item.price || item.product?.pPrice || 0;
      return sum + unitPrice * (item.quantity || 1);
    }
    return sum;
  }, 0);

  const calculatePriceDetails = (items) => {
    let totalOriginalPrice = 0;
    let totalOfferPrice = 0;
    let totalSavings = 0;

    items.forEach((item) => {
      const quantity = item.quantity || 1;
      let currentPrice = item.price || item.product?.pPrice || 0;
      let originalPrice = currentPrice;
      let offerPrice = currentPrice;

      if (
        item.variantId &&
        item.product?.variants &&
        item.product.variants.length > 0
      ) {
        const variant = item.product.variants.find(
          (v) => v._id === item.variantId
        );
        if (variant) {
          if (variant.previousPrice && variant.previousPrice > 0) {
            originalPrice = variant.previousPrice;
            offerPrice = variant.price || currentPrice;
          }
        }
      } else if (item.product) {
        if (item.product.pPreviousPrice && item.product.pPreviousPrice > 0) {
          originalPrice = item.product.pPreviousPrice;
          offerPrice = currentPrice;
        }
      }

      totalOriginalPrice += originalPrice * quantity;
      totalOfferPrice += offerPrice * quantity;
    });

    totalSavings = totalOriginalPrice - totalOfferPrice;

    return {
      originalPrice: totalOriginalPrice,
      offerPrice: totalOfferPrice,
      totalSavings: totalSavings,
    };
  };

  const updateShippingFee = (deliveryData, state, itemsOverride = null) => {
    const itemsToUse = itemsOverride || cartItems;

    // Early return if no items to calculate for - prevents race conditions during initialization
    if (!itemsToUse || itemsToUse.length === 0) return 0;

    // Calculate current subtotal for itemsToUse to avoid relying on potentially stale outer state
    const currentSubtotal = (itemsToUse || []).reduce((sum, item) => {
      if ((item.product?.pType || item.variantType) !== "combo") {
        const unitPrice = item.price || item.product?.pPrice || 0;
        return sum + unitPrice * (item.quantity || 1);
      }
      return sum;
    }, 0);

    const allItemsFreeShipping =
      Array.isArray(itemsToUse) &&
      itemsToUse.length > 0 &&
      itemsToUse.every((item) => item?.product?.freeshipping === true);

    if (allItemsFreeShipping) {
      setCartSummary((prev) => ({
        ...prev,
        shippingfee: 0,
        total: prev.originalTotal + prev.platformFee - prev.kaitCoinsUsed,
        cashPayment: prev.originalTotal + prev.platformFee - prev.kaitCoinsUsed,
      }));
      return 0;
    }

    if (!state || !deliveryData || deliveryData.length === 0) {
      // Use standard fallback if data isn't ready yet or missing
      const fallbackFee = currentSubtotal >= 500 ? 0 : 40;
      setCartSummary((prev) => ({
        ...prev,
        shippingfee: fallbackFee,
        total: prev.originalTotal + prev.platformFee - prev.kaitCoinsUsed + fallbackFee,
        cashPayment: prev.originalTotal + prev.platformFee - prev.kaitCoinsUsed + fallbackFee,
      }));
      return fallbackFee;
    }

    const normalizedValue = state.toLowerCase().trim().replace(/\s+/g, "");
    const filteredInfo = deliveryData.find(
      ({ state: deliveryState }) =>
        deliveryState &&
        deliveryState.toLowerCase().trim().replace(/\s+/g, "") ===
        normalizedValue
    );

    if (!filteredInfo) {
      console.warn(`State "${state}" not found in delivery data`);
      const fallbackFee = currentSubtotal >= 500 ? 0 : 40;
      setCartSummary((prev) => ({
        ...prev,
        shippingfee: fallbackFee,
        total: prev.originalTotal + prev.platformFee - prev.kaitCoinsUsed + fallbackFee,
        cashPayment: prev.originalTotal + prev.platformFee - prev.kaitCoinsUsed + fallbackFee,
      }));
      return fallbackFee;
    }

    // Only consider products that are NOT marked for free shipping when calculating the fee
    const paidProducts = Array.isArray(itemsToUse) ? itemsToUse.filter(item =>
      item?.product?.freeshipping !== true && (item.product?.pType || item.variantType || item.variant_type) !== "combo"
    ) : [];

    const paidCombos = Array.isArray(itemsToUse) ? itemsToUse.filter(item =>
      item?.product?.freeshipping !== true && (item.product?.pType || item.variantType || item.variant_type) === "combo"
    ) : [];

    const paidProductSubtotal = paidProducts.reduce((sum, i) => {
      return sum + (i.price || i.product?.pPrice || 0) * (i.quantity || 1);
    }, 0);

    const hasPaidProducts = paidProducts.length > 0;
    const hasPaidCombos = paidCombos.length > 0;

    if (!hasPaidProducts && !hasPaidCombos) {
      // If no paid items remain, shipping is 0
      setCartSummary((prev) => ({
        ...prev,
        shippingfee: 0,
        total: prev.originalTotal + prev.platformFee - prev.kaitCoinsUsed,
        cashPayment: prev.originalTotal + prev.platformFee - prev.kaitCoinsUsed,
      }));
      return 0;
    }

    let shippingFee = 0;

    if (hasPaidProducts && paidProductSubtotal >= 500) {
      shippingFee = filteredInfo?.above500_deliveryfee || 0;
    } else if (hasPaidProducts && hasPaidCombos) {
      // Mixed cart below 500: prioritize product fee or above500 if applicable
      shippingFee = filteredInfo?.above500_deliveryfee || filteredInfo?.productdeliveryfee || 40;
    } else if (hasPaidCombos) {
      shippingFee = filteredInfo?.combodeliveryfee || 40;
    } else if (hasPaidProducts) {
      shippingFee = filteredInfo?.productdeliveryfee || 40;
    }

    setCartSummary((prev) => ({
      ...prev,
      shippingfee: shippingFee,
      total: prev.originalTotal + prev.platformFee - prev.kaitCoinsUsed + shippingFee,
      cashPayment: prev.originalTotal + prev.platformFee - prev.kaitCoinsUsed + shippingFee,
    }));

    return shippingFee;
  };

  const fetchCityStateByPincode = async (pincode) => {
    if (!pincode || String(pincode).length !== 6) return;
    try {
      const res = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`
      );
      const data = await res.json();
      if (
        Array.isArray(data) &&
        data[0]?.Status === "Success" &&
        Array.isArray(data[0]?.PostOffice) &&
        data[0].PostOffice.length > 0
      ) {
        const office = data[0].PostOffice[0];
        const autoCity = office?.District || "";
        const autoState = office?.State || "";

        setAddressForm((prev) => ({
          ...prev,
          city: autoCity,
          state: autoState,
        }));

        let currentDeliveryData = deliverydata;
        if (!isDeliveryDataLoaded || deliverydata.length === 0) {
          currentDeliveryData = await fetchdeliveryfees();
        }
        updateShippingFee(currentDeliveryData, autoState);
      }
    } catch (err) {
      console.error("Failed to auto-fill city/state from PIN code:", err);
    }
  };

  const fetchdeliveryfees = async () => {
    try {
      const response = await userApi.deliverydata();
      if (response && response.data) {
        setdeliverydata(response.data);
        setIsDeliveryDataLoaded(true);
        return response.data;
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch delivery data:", err);
      toast.error(err.message || "Failed to load delivery information");
      return [];
    }
  };

  // Initialize component data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // --- BUY NOW MODE ---
        if (location.state?.cart && location.state?.isFromCart === false) {
          const items = location.state.cart;
          setCartItems(items);
          const priceDetails = calculatePriceDetails(items);

          const subtotalValue = items.reduce((sum, i) => sum + (i.price || i.product?.pPrice || 0) * i.quantity, 0);
          const initialShipping = (subtotalValue >= 500 || items.every(i => i.product?.freeshipping === true)) ? 0 : 40;

          setCartSummary({
            subtotal: subtotalValue,
            platformFee: PLATFORM_FEE,
            total: priceDetails.offerPrice + PLATFORM_FEE + initialShipping,
            originalTotal: priceDetails.offerPrice,
            kaitCoinsUsed: 0,
            cashPayment: priceDetails.offerPrice + PLATFORM_FEE + initialShipping,
            shippingfee: initialShipping,
            originalPrice: priceDetails.originalPrice,
            offerPrice: priceDetails.offerPrice,
            totalSavings: priceDetails.totalSavings,
          });

          const dData = await fetchdeliveryfees();
          if (dData && dData.length > 0) {
            // Check if we have an address to calculate fee immediately
            const response = await userApi.getAddresses();
            if (response.success && response.addresses.length > 0) {
              const defaultAddr = response.addresses.find(a => a.isDefault) || response.addresses[0];
              if (defaultAddr && defaultAddr.state) {
                updateShippingFee(dData, defaultAddr.state, items);
              }
            }
          }
          return;
        }

        // --- REGULAR CART MODE ---
        const cartResponse = await cartApi.getCart();
        if (cartResponse.success) {
          const items = cartResponse.cart.items || [];
          setCartItems(items);

          const priceDetails = calculatePriceDetails(items);
          const subtotalValue = cartResponse.cart.totalAmount || 0;
          const initialShipping = (subtotalValue >= 500 || items.every(i => i.product?.freeshipping === true)) ? 0 : 40;

          setCartSummary({
            subtotal: subtotalValue,
            platformFee: cartResponse.cart.platformFee || PLATFORM_FEE,
            total: subtotalValue + (cartResponse.cart.platformFee || PLATFORM_FEE) + initialShipping,
            originalTotal: subtotalValue,
            kaitCoinsUsed: 0,
            cashPayment: subtotalValue + (cartResponse.cart.platformFee || PLATFORM_FEE) + initialShipping,
            shippingfee: initialShipping,
            originalPrice: priceDetails.originalPrice,
            offerPrice: priceDetails.offerPrice,
            totalSavings: priceDetails.totalSavings,
          });
        }

        await fetchdeliveryfees();
      } catch (error) {
        console.error("Error initializing data:", error);
        toast.error("Failed to load checkout data. Please try again.");
      }
    };

    fetchData();
  }, [location.state]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userApi.myProfile();
        const updatedUser = response.user;
        setUserInfo(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        toast.error(err.message || "Failed to load profile");
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchUserAddresses = async () => {
      try {
        const response = await userApi.getAddresses();
        if (response.success && response.addresses.length > 0) {
          setAddresses(response.addresses);

          // Auto-select default address
          const defaultAddr = response.addresses.find(a => a.isDefault) || response.addresses[0];
          if (defaultAddr) {
            setSelectedAddress(defaultAddr._id);

            // Auto-update shipping based on default address
            if (defaultAddr.state) {
              let currentDeliveryData = deliverydata;
              if (!isDeliveryDataLoaded || deliverydata.length === 0) {
                currentDeliveryData = await fetchdeliveryfees();
              }
              updateShippingFee(currentDeliveryData, defaultAddr.state);
            }
          }
        } else {
          // If no addresses, force to step 1
          setCurrentStep(1);
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
        toast.error("Failed to load addresses");
        setCurrentStep(1);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAddresses();
  }, []);

  useEffect(() => {
    if (!hasVoucherEligibleItems && (useKaitCoins50 || useKaitCoins100)) {
      setUseKaitCoins50(false);
      setUseKaitCoins100(false);
      setCartSummary((prev) => ({
        ...prev,
        total: prev.originalTotal + prev.platformFee + prev.shippingfee,
        kaitCoinsUsed: 0,
        cashPayment: prev.originalTotal + prev.platformFee + prev.shippingfee,
      }));
    }
  }, [hasVoucherEligibleItems, useKaitCoins50, useKaitCoins100]);

  useEffect(() => {
    if (!hasVoucherEligibleItems) return;
    if (!useKaitCoins50 && !useKaitCoins100) return;
    const wallet = userInfo?.walletBalance || 0;
    const baseSubtotal = useKaitCoins50
      ? voucherSubtotal50
      : voucherSubtotal100;
    const voucherCap = useKaitCoins50 ? baseSubtotal * 0.5 : baseSubtotal;
    const applied = Math.min(wallet, voucherCap);

    setCartSummary((prev) => ({
      ...prev,
      total: prev.originalTotal + prev.platformFee - applied + prev.shippingfee,
      kaitCoinsUsed: applied,
      cashPayment: prev.originalTotal + prev.platformFee - applied + prev.shippingfee,
    }));
  }, [
    voucherSubtotal50,
    voucherSubtotal100,
    userInfo?.walletBalance,
    useKaitCoins50,
    useKaitCoins100,
    hasVoucherEligibleItems,
  ]);

  // Update shipping fee when address or cart items change
  useEffect(() => {
    if (selectedAddress && addresses.length > 0 && isDeliveryDataLoaded) {
      const activeAddr = addresses.find(a => a._id === selectedAddress);
      if (activeAddr && activeAddr.state) {
        updateShippingFee(deliverydata, activeAddr.state);
      }
    }
  }, [selectedAddress, cartItems, addresses, isDeliveryDataLoaded, deliverydata]);


  const handleContinueToSummary = (addrId) => {
    const finalId = addrId || selectedAddress;
    if (!finalId) {
      toast.warning("Please select a delivery address");
      return;
    }

    // Update shipping fee for the selected address immediately
    if (addrId) {
      const selectedAddr = addresses.find(a => a._id === addrId);
      if (selectedAddr && selectedAddr.state) {
        updateShippingFee(deliverydata, selectedAddr.state);
      }
      setSelectedAddress(addrId);
    } else if (selectedAddress) {
      const selectedAddr = addresses.find(a => a._id === selectedAddress);
      if (selectedAddr && selectedAddr.state) {
        updateShippingFee(deliverydata, selectedAddr.state);
      }
    }

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleContinueToPayment = () => {
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUseKaitCoins50Change = (event) => {
    const isChecked = event.target.checked;
    setUseKaitCoins50(isChecked);
    setUseKaitCoins100(false);
    if (isChecked) {
      setShowVoucherConfetti(true);
      setTimeout(() => setShowVoucherConfetti(false), 3000);

      const kaitCoinBalance = userInfo?.walletBalance || 0;
      const fiftyPercentAmount = voucherSubtotal50 * 0.5;
      const kaitCoinValue = Math.min(kaitCoinBalance, fiftyPercentAmount);
      setCartSummary((prev) => {
        const cashPayment = prev.originalTotal + prev.platformFee - kaitCoinValue;
        return {
          ...prev,
          total: cashPayment + prev.shippingfee,
          kaitCoinsUsed: kaitCoinValue,
          cashPayment: cashPayment + prev.shippingfee,
        };
      });
    } else {
      setCartSummary((prev) => ({
        ...prev,
        total: prev.originalTotal + prev.platformFee + prev.shippingfee,
        kaitCoinsUsed: 0,
        cashPayment: prev.originalTotal + prev.platformFee + prev.shippingfee,
      }));
    }
  };

  const handleUseKaitCoins100Change = (event) => {
    const isChecked = event.target.checked;
    setUseKaitCoins100(isChecked);
    setUseKaitCoins50(false);
    if (isChecked) {
      setShowVoucherConfetti(true);
      setTimeout(() => setShowVoucherConfetti(false), 3000);

      const kaitCoinBalance = userInfo?.walletBalance || 0;
      const hundredPercentAmount = voucherSubtotal100;
      const kaitCoinValue = Math.min(kaitCoinBalance, hundredPercentAmount);
      setCartSummary((prev) => {
        const cashPayment = prev.originalTotal + prev.platformFee - kaitCoinValue;
        return {
          ...prev,
          total: cashPayment + prev.shippingfee,
          kaitCoinsUsed: kaitCoinValue,
          cashPayment: cashPayment + prev.shippingfee,
        };
      });
    } else {
      setCartSummary((prev) => ({
        ...prev,
        total: prev.originalTotal + prev.platformFee + prev.shippingfee,
        kaitCoinsUsed: 0,
        cashPayment: prev.originalTotal + prev.platformFee + prev.shippingfee,
      }));
    }
  };

  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const checkOutHandler = async () => {
    const res = await loadScript(
      "https://checkout.razorpay.com/v1/checkout.js"
    );

    if (!res) {
      toast.error("Razorpay SDK failed to load");
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    try {
      var precheckdata = {
        useKaitCoins: useKaitCoins50 || useKaitCoins100,
        kaitCoinsUsed: cartSummary.kaitCoinsUsed,
        cashPayment: cartSummary.cashPayment,
        total: cartSummary.total,
        shippingfee: cartSummary.shippingfee,
        platformFee: cartSummary.platformFee,
      };

      if (precheckdata.useKaitCoins) {
        const checkbal = await cartApi.checkbalance();
        if (checkbal.data?.walletBalance) {
          if (+checkbal.data?.walletBalance < +precheckdata.kaitCoinsUsed) {
            toast.warning("Insufficient Balance in your Wallet");
            return;
          }
        } else {
          toast.error("Can't fetch your wallet details");
          return;
        }
      }

      const result = await cartApi.CreateRazorpay({
        amount: +cartSummary.cashPayment.toFixed(2),
      });

      if (!result) {
        toast.error("Failed to create payment order");
        return;
      } else {
        const { amount, id: order_id, currency } = result.order;

        const options = {
          key: "rzp_live_MigiyKCfLulpBY",
          amount: amount,
          currency: currency,
          name: "PickNow",
          description: "ECOMMERCE",
          image:
            "https://play-lh.googleusercontent.com/QGUisJxsTg4SPMgTEN7n3G9TYrQT54j2F0SI35xvC293neDyhp8WWeqOYKlR7aLBJ5PE",
          order_id: order_id,
          handler: async function (response) {
            try {
              const data = {
                orderCreationId: order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              };

              const result = await cartApi.VerifyPayment(data);

              if (result.status) {
                await createAnOrder({
                  PaymentId: response.razorpay_payment_id,
                  paymentMethod: "ONLINE",
                });
              } else {
                toast.error("Payment verification failed");
              }
            } catch (error) {
              toast.error("Error processing payment");
              console.error("Payment processing error:", error);
            }
          },
          prefill: {
            name: userInfo.name,
            email: userInfo.email,
            contact: userInfo.contact,
          },
          notes: {
            address: addresses.find(a => a._id === selectedAddress)?.street || "",
          },
          theme: {
            color: "#16cc16",
          },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      }
    } catch (error) {
      toast.error("Error initiating payment");
      console.error("Payment initiation error:", error);
    }
  };

  const createAnOrder = async (data) => {
    try {
      const selectedAddr = addresses.find(a => a._id === selectedAddress);

      const orderData = {
        PaymentId: data.PaymentId,
        shippingAddress: {
          address: selectedAddr?.street || "",
          street: selectedAddr?.street || "",
          city: selectedAddr?.city || "",
          state: selectedAddr?.state || "",
          contact: selectedAddr?.mobile || "",
          name: selectedAddr?.name || "",
          pincode: selectedAddr?.pincode || "",
          country: "India",
        },
        useKaitCoins: useKaitCoins50 || useKaitCoins100,
        kaitCoinsUsed: cartSummary.kaitCoinsUsed,
        cashPayment: cartSummary.cashPayment,
        paymentMethod: data.paymentMethod,
        total: cartSummary.total,
        shippingfee: cartSummary.shippingfee,
        platformFee: cartSummary.platformFee,
        items: cartItems, // Send the current items (supports selective Buy Now)
        checkoutType: location.state?.isFromCart === false ? "BUY_NOW" : "CART"
      };

      const orderresult = await cartApi.PlaceOrder(orderData);

      if (orderresult.success) {
        toast.success("Order placed successfully!");
        await cartApi.clearCart();
        navigate("/profile");
      } else {
        if (
          orderresult.message &&
          orderresult.message.includes("no longer available")
        ) {
          toast.error(orderresult.message);
        } else {
          toast.error(orderresult.message || "Failed to place order");
        }
      }
    } catch (error) {
      console.error("Order creation error:", error);
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        if (errorMessage.includes("no longer available")) {
          toast.error(errorMessage);
        } else {
          toast.error(errorMessage);
        }
      }
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedPayment) {
      toast.warning("Please select a payment method");
      return;
    }

    if (!selectedAddress) {
      toast.warning("Please select a delivery address");
      return;
    }

    setIsProcessing(true);

    if (useKaitCoins100 && cartSummary.total == 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
      await createAnOrder({
        PaymentId: `PickNow${new Date().getTime()}`,
        paymentMethod: "VOUCHER",
      });
      setIsProcessing(false);
    } else {
      await checkOutHandler();
      setIsProcessing(false);
    }
  };



  const totalItems = cartItems.length;

  if (loading) {
    return (
      <div className="loader-wrap">
        <ModernLoader
          showTiming={false}
          animationType="morph"
          size={0.7}
          customMessage="Preparing checkout..."
          showProgress
        />
      </div>
    );
  }

  // --- SUB-COMPONENTS ---

  return (
    <div className="checkout-page">
      {showVoucherConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          style={{ position: "fixed", top: 0, left: 0, zIndex: 9999, pointerEvents: "none" }}
        />
      )}

      {showConfetti && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none", zIndex: 2000,
        }}>
          <ConfettiExplosion
            force={0.9} duration={4000} particleCount={300}
            width={typeof window !== "undefined" ? window.innerWidth : 1600}
          />
        </div>
      )}

      <CheckoutProgressBar currentStep={currentStep} Check={Check} />

      <div className="checkout-wrapper">
        <div className="checkout-left">
          <div className="checkout-content">
            {currentStep === 1 && (
              <AddressStep
                addresses={addresses}
                selectedAddress={selectedAddress}
                setSelectedAddress={setSelectedAddress}
                navigate={navigate}
                Plus={Plus}
                handleContinueToSummary={handleContinueToSummary}
              />
            )}
            {currentStep === 2 && (
              <SummaryStep
                addresses={addresses}
                selectedAddress={selectedAddress}
                cartItems={cartItems}
                formatINR={formatINR}
                transformImageUrl={transformImageUrl}
                setCurrentStep={setCurrentStep}
                handleContinueToPayment={handleContinueToPayment}
                navigate={navigate}
                handleUpdateQuantity={handleUpdateQuantity}
                handleRemoveItem={handleRemoveOriginal}
                handleSaveForLater={handleSaveForLater}
                updatingQuantityId={updatingQuantityId}
                removingItemId={removingItemId}
                isBuyNow={location.state?.isFromCart === false}
                cartSummary={cartSummary}
              />
            )}
            {currentStep === 3 && (
              <PaymentStep
                selectedPayment={selectedPayment}
                setSelectedPayment={setSelectedPayment}
                isProcessing={isProcessing}
                handlePlaceOrder={handlePlaceOrder}
                cartSummary={cartSummary}
                formatINR={formatINR}
              />
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - PRICE SUMMARY */}
        <div className="checkout-right">
          <div className="price-summary-card">
            <div className="price-summary-title">Price Details</div>
            <div className="price-summary-body">

              {cartSummary.totalSavings > 0 && (
                <>
                  <div className="price-row">
                    <span className="price-row-label"><Receipt size={14} /> Total MRP ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
                    <span className="price-old">₹{formatINR(cartSummary.originalPrice)}</span>
                  </div>
                  <div className="price-row">
                    <span className="price-row-label"><Zap size={14} className="discount-text" /> Discount</span>
                    <span className="discount-text">− ₹{formatINR(cartSummary.totalSavings)}</span>
                  </div>
                  <hr className="price-divider" />
                </>
              )}

              <div className="price-row">
                <span className="price-row-label"><Package size={14} /> Subtotal {cartSummary.totalSavings <= 0 && `(${totalItems} item${totalItems !== 1 ? "s" : ""})`}</span>
                <span>₹{formatINR(cartSummary.subtotal)}</span>
              </div>

              <div className="price-row">
                <span className="price-row-label"><Info size={14} /> Platform Fee</span>
                <span>₹{formatINR(cartSummary.platformFee)}</span>
              </div>

              <div className="price-row">
                <span className="price-row-label"><Truck size={14} /> Delivery Charges</span>
                {cartSummary.shippingfee <= 0 ? (
                  <span className="discount-text">FREE</span>
                ) : (
                  <span>₹{formatINR(cartSummary.shippingfee)}</span>
                )}
              </div>

              {/* {hasVoucherEligibleItems && (
                <>
                  {hasvoucher50 && (
                    <div className="voucher-option">
                      <label className="voucher-label">
                        <input
                          type="checkbox"
                          checked={useKaitCoins50}
                          onChange={handleUseKaitCoins50Change}
                        />
                        <div className="voucher-info">
                          <span className="voucher-title">Use Voucher (50%)</span>
                          <span className="voucher-balance">Balance: ₹{formatINR(userInfo?.walletBalance || 0)}</span>
                          {useKaitCoins50 && (
                            <span className="voucher-applied">
                              ₹{formatINR(Math.min(userInfo?.walletBalance || 0, voucherSubtotal50 * 0.5))} applied
                            </span>
                          )}
                        </div>
                      </label>
                    </div>
                  )}
                </>
              )}

              {hasVoucherEligibleItems && (useKaitCoins50 || useKaitCoins100) && (
                <>
                  <div className="price-row">
                    <span>Voucher Discount ({useKaitCoins50 ? "50%" : "100%"})</span>
                    <span className="discount-text">− ₹{formatINR(cartSummary.kaitCoinsUsed)}</span>
                  </div>
                </>
              )} */}

              <hr className="price-divider" />

              <div className="price-total">
                <span className="price-row-label">
                  <CreditCard size={18} />
                  {hasVoucherEligibleItems && (useKaitCoins50 || useKaitCoins100) ? "Amount Payable" : "Total Amount"}
                </span>
                <span>₹{formatINR(cartSummary.cashPayment)}</span>
              </div>

              {cartSummary.totalSavings > 0 && (
                <div className="savings-info">
                  <Tag size={14} />
                  You will save ₹{formatINR(cartSummary.totalSavings)} on this order
                </div>
              )}
            </div>
          </div>

          {currentStep === 2 && (
            <button className="checkout-primary-btn" onClick={handleContinueToPayment}>
              Proceed to Payment
            </button>
          )}

          {currentStep === 3 && (
            <button
              className="checkout-primary-btn"
              onClick={handlePlaceOrder}
              disabled={isProcessing || !selectedPayment}
            >
              {isProcessing ? "PROCESSING..." : `PAY ₹${formatINR(cartSummary.cashPayment)}`}
            </button>
          )}
          <div className="summary-secure1">
            <ShieldCheck size={18} color="#878787" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Safe and Secure Payments. Easy returns. 100% Authentic products.</span>
          </div>
        </div>
      </div>

      {/* STICKY MOBILE FOOTER */}
      <div className="mobile-checkout-footer">
        <div className="mobile-footer-price">
          <span className="price-label">Total Amount</span>
          <span className="price-value">₹{formatINR(cartSummary.cashPayment)}</span>
        </div>
        {currentStep === 2 && (
          <button className="mobile-primary-btn" onClick={handleContinueToPayment}>
            PROCEED <ChevronRight size={18} />
          </button>
        )}
        {currentStep === 3 && (
          <button
            className="mobile-primary-btn"
            onClick={handlePlaceOrder}
            disabled={isProcessing || !selectedPayment}
          >
            {isProcessing ? "PROCESSING..." : `PAY NOW`} <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
