import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ShoppingBag, LogIn, ShieldCheck,
  Star, Bookmark, Trash2, Zap, MapPin, AlertTriangle
} from "lucide-react";
import { useSnackbar } from "notistack";
import "./CartPage.css";
import { cartApi } from "../../APi/cartApi";
import { userApi, addToWishlist, removeFromWishlist, getWishlist, addToSaveForLater, removeFromSaveForLater, getSaveForLater } from "../../APi/userApi";
import { transformImageUrl } from "../../APi/utils";
import { motion, AnimatePresence } from "framer-motion";
import ModernLoader from "../Loading/ModernLoader";
import { Tag } from "lucide-react";

/* ── Helpers ── */
const getDeliveryDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};
const formatINR = (n) => Number(n || 0).toLocaleString("en-IN");

/* ================================================================
   CartPage
   ================================================================ */
const CartPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [cart, setCart] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkoutProcessing, setCheckoutProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [updatingQuantityId, setUpdatingQuantityId] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [cartSummary, setCartSummary] = useState({
    subtotal: 0, discount: 0, platformFee: 0, shippingCharges: 0, finalAmount: 0,
  });
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [deliveryData, setDeliveryData] = useState([]);
  const [isDeliveryDataLoaded, setIsDeliveryDataLoaded] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchDeliveryFees();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      enqueueSnackbar("Please login to access your cart", {
        variant: "warning", autoHideDuration: 3000,
        anchorOrigin: { vertical: "top", horizontal: "right" },
      });
    } else {
      setIsAuthenticated(true);
      fetchCart();
      fetchDeliveryAddress();
    }
  };

  const fetchDeliveryAddress = async () => {
    try {
      const response = await userApi.myProfile();
      if (response?.user?.addresses) {
        const addresses = response.user.addresses;
        if (addresses.length === 0) {
          setDeliveryAddress(null);
          localStorage.removeItem("defaultAddress");
          return;
        }

        // Auto-select default/first address and sync with localStorage
        const def = addresses.find(a => a.isDefault) || addresses[0];
        if (def) {
          setDeliveryAddress(def);
          localStorage.setItem("defaultAddress", JSON.stringify(def));
        } else {
          setDeliveryAddress(null);
          localStorage.removeItem("defaultAddress");
        }
      } else {
        setDeliveryAddress(null);
        localStorage.removeItem("defaultAddress");
      }
    } catch (error) {
      console.error("Failed to fetch address:", error);
      setDeliveryAddress(null);
      localStorage.removeItem("defaultAddress");
    }
  };

  const fetchDeliveryFees = async () => {
    try {
      const response = await userApi.deliverydata();
      if (response && response.data) {
        setDeliveryData(response.data);
        setIsDeliveryDataLoaded(true);
        return response.data;
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch delivery data:", err);
      return [];
    }
  };

  const updateShippingFee = (fees, address) => {
    if (!address || !address.state || !fees || fees.length === 0) {
      setCartSummary(prev => ({
        ...prev,
        shippingCharges: 0,
        finalAmount: prev.subtotal + prev.platformFee - prev.discount
      }));
      return;
    }

    const allItemsFreeShipping = Array.isArray(cart) && cart.length > 0 && cart.every(i => i.product?.freeshipping === true);
    if (allItemsFreeShipping) {
      setCartSummary(prev => ({
        ...prev,
        shippingCharges: 0,
        finalAmount: prev.subtotal + prev.platformFee - prev.discount
      }));
      return;
    }

    const normalizedState = address.state.toLowerCase().trim().replace(/\s+/g, "");
    const feeInfo = fees.find(f => f.state && f.state.toLowerCase().trim().replace(/\s+/g, "") === normalizedState);

    if (!feeInfo) {
      setCartSummary(prev => ({
        ...prev,
        shippingCharges: 0,
        finalAmount: prev.subtotal + prev.platformFee - prev.discount
      }));
      return;
    }

    let fee = 0;
    const hasProducts = cart.some(i => (i.product?.pType || i.variantType) !== "combo");
    const hasCombos = cart.some(i => (i.product?.pType || i.variantType) === "combo");
    const productSubtotal = cart.reduce((sum, i) => {
      if ((i.product?.pType || i.variantType) !== "combo") {
        return sum + (i.price || i.product?.pPrice || 0) * i.quantity;
      }
      return sum;
    }, 0);

    if (hasProducts && productSubtotal >= 500) {
      fee = feeInfo.above500_deliveryfee || 0;
    } else if (hasProducts && hasCombos) {
      fee = feeInfo.above500_deliveryfee || 0;
    } else if (hasCombos) {
      fee = feeInfo.combodeliveryfee || 0;
    } else if (hasProducts) {
      fee = feeInfo.productdeliveryfee || 0;
    }

    setCartSummary(prev => ({
      ...prev,
      shippingCharges: fee,
      finalAmount: prev.subtotal + prev.platformFee + fee - prev.discount
    }));
  };

  useEffect(() => {
    if (isDeliveryDataLoaded) {
      updateShippingFee(deliveryData, deliveryAddress);
    }
  }, [deliveryAddress, cart, deliveryData, isDeliveryDataLoaded]);

  const fetchSavedItems = async () => {
    try {
      const response = await getSaveForLater();
      if (response.success) {
        const transformed = (response.products || []).map(p => ({
          ...p,
          pImage: Array.isArray(p.pImage) ? p.pImage.map(transformImageUrl) :
            p.pImage ? [transformImageUrl(p.pImage)] : [],
          // normalize price fields so they're always numbers
          pPrice: Number(p.pPrice || p.price || 0),
          pPreviousPrice: Number(p.pPreviousPrice || p.pMrp || p.pOriginalPrice || 0),
          pOffer: Number(p.pOffer || 0),
        }));
        setSavedItems(transformed);
      }
    } catch (error) { console.error("Failed to fetch saved items:", error); }
  };

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const cartRes = await cartApi.getCart();
      if (cartRes.success) {
        const cartItems = (cartRes.cart?.items || []);
        setCart(cartItems);
        // Sync with global cache for ProductCard persistence
        localStorage.setItem("activeCartItems", JSON.stringify(cartItems));
        
        setCartSummary({
          subtotal: cartRes.cart?.totalAmount || 0,
          discount: cartRes.cart?.totalDiscount || 0,
          platformFee: cartRes.cart?.platformFee || 0,
          shippingCharges: cartRes.cart?.shippingCharges || 0,
          finalAmount: cartRes.cart?.finalAmount || 0,
        });
        updateCartCount(cartItems);
      }
      await fetchSavedItems();
    } catch (error) {
      enqueueSnackbar(error.message || "Failed to fetch cart items", {
        variant: "error", autoHideDuration: 3000,
        anchorOrigin: { vertical: "top", horizontal: "right" },
      });
    } finally { setIsLoading(false); }
  };

  const updateCartCount = (items) => {
    const total = items.length;
    window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { count: total } }));
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

  const handleUpdateQuantity = async (item, newQuantity) => {
    try {
      const { id, isVariant } = getItemIdentifier(item);
      if (newQuantity < 1) { await handleRemoveItem(id, isVariant); return; }
      if (updatingQuantityId === id) return;
      setUpdatingQuantityId(id);
      const stock = getAvailableStock(item);
      if (stock <= 0) {
        enqueueSnackbar("Product is out of stock", { variant: "error", autoHideDuration: 3000, anchorOrigin: { vertical: "top", horizontal: "right" } });
        return;
      }
      if (newQuantity > stock) {
        enqueueSnackbar(`Only ${stock} items available`, { variant: "warning", autoHideDuration: 3000, anchorOrigin: { vertical: "top", horizontal: "right" } });
        newQuantity = stock;
      }
      const response = await cartApi.updateQuantity(id, newQuantity, isVariant, item);
      if (response.success) {
        setCartSummary({
          subtotal: response.cart?.totalAmount || 0,
          discount: response.cart?.totalDiscount || 0,
          platformFee: response.cart?.platformFee || 0,
          shippingCharges: response.cart?.shippingCharges || 0,
          finalAmount: response.cart?.finalAmount || 0,
        });
        setCart((prev) =>
          prev.map((ci) => {
            const ciId = getItemIdentifier(ci);
            const match = isVariant ? String(ciId.id) === String(id) : ci.product?._id === id;
            return match ? { ...ci, quantity: newQuantity } : ci;
          })
        );
        updateCartCount(cart);
        enqueueSnackbar("Quantity updated", { variant: "success", autoHideDuration: 1500, anchorOrigin: { vertical: "top", horizontal: "right" } });
      }
    } catch (error) {
      enqueueSnackbar(error.message || "Failed to update quantity", { variant: "error", autoHideDuration: 3000, anchorOrigin: { vertical: "top", horizontal: "right" } });
      await fetchCart();
    } finally { setUpdatingQuantityId(null); }
  };

  const handleRemoveItem = async (identifier, isVariant = false) => {
    try {
      const nId = isVariant
        ? typeof identifier === "object"
          ? identifier?._id || identifier?.id || String(identifier)
          : identifier
        : identifier;

      setRemovingItemId(nId);

      // optimistic UI remove
      setCart((prev) => prev.filter((item) => {
        const iId = getItemIdentifier(item);
        const currentId = String(typeof iId.id === "object" ? iId.id?._id || iId.id : iId.id);
        return currentId !== String(nId);
      }));

      const response = await cartApi.removeItem(nId, isVariant);

      if (response.success) {
        // ✅ always sync from server response, never trust optimistic state
        const updatedItems = response.cart?.items || [];
        setCart(updatedItems);
        setCartSummary({
          subtotal: response.cart?.totalAmount || 0,
          discount: response.cart?.totalDiscount || 0,
          platformFee: response.cart?.platformFee || 0,
          shippingCharges: response.cart?.shippingCharges || 0,
          finalAmount: response.cart?.finalAmount || 0,
        });
        updateCartCount(updatedItems);
        enqueueSnackbar("Item removed", {
          variant: "success", autoHideDuration: 2000,
          anchorOrigin: { vertical: "top", horizontal: "right" }
        });
      } else {
        await fetchCart(); // fallback full refetch
      }
    } catch (error) {
      enqueueSnackbar(error.message || "Failed to remove item", {
        variant: "error", autoHideDuration: 3000,
        anchorOrigin: { vertical: "top", horizontal: "right" }
      });
      await fetchCart(); // ✅ always refetch on error to reset stale state
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleSaveForLater = async (item) => {
    const { id, isVariant } = getItemIdentifier(item);
    try {
      const response = await addToSaveForLater(
        isVariant ? item.product?._id : id,
        isVariant ? id : null
      );
      if (response.success) {
        // ✅ store variant meta in localStorage before removing from cart
        if (item.variantType || item.variantValue) {
          localStorage.setItem(
            `variant_meta_${item.product?._id}_${id}`,
            JSON.stringify({
              variantType: item.variantType || null,
              variantValue: item.variantValue || null,
            })
          );
        }
        await handleRemoveItem(id, isVariant);
        enqueueSnackbar("Item moved to Save for Later", {
          variant: "success", autoHideDuration: 2000,
        });
        await fetchCart();
      }
    } catch (error) {
      enqueueSnackbar(error.message || "Failed to save for later", { variant: "error" });
    }
  };
  const handleMoveToCart = async (item) => {
    try {
      // ✅ read saved variant meta from localStorage
      const metaKey = `variant_meta_${item._id}_${item.variantId}`;
      const meta = JSON.parse(localStorage.getItem(metaKey) || "{}");

      const cartData = {
        productId: item._id,
        quantity: 1,
        variantId: item.variantId || item.variant?._id || undefined,
        variantType: meta.variantType || item.variant?.type || undefined,
        variantValue: meta.variantValue || item.variant?.value || undefined,
        price: item.pPrice || item.variant?.price || item.price || 0,
      };

      console.log("MOVE TO CART DATA:", cartData);

      const response = await cartApi.addToCart(cartData);
      if (response.success) {
        await removeFromSaveForLater(item._id, item.variantId);
        // ✅ clean up localStorage after successful move
        localStorage.removeItem(metaKey);
        enqueueSnackbar("Item moved to cart", { variant: "success" });
        await fetchCart();
        await fetchSavedItems(); // Refresh Saved for Later section
      }
    } catch (error) {
      enqueueSnackbar(error.message || "Failed to move to cart", { variant: "error" });
    }
  };


  const handleCheckout = () => {
    if (!deliveryAddress) {
      setShowAddressModal(true);
      return;
    }
    setCheckoutProcessing(true);
    navigate("/CheckoutPage", {
      state: { cart, totalAmount: cartSummary.finalAmount, isFromCart: true },
    });
  };

  const handleBuyNow = (item) => {
    if (!deliveryAddress) {
      setShowAddressModal(true);
      return;
    }
    // Navigate to checkout with ONLY this specific item
    const itemPrice = item.price || item.product?.pPrice || 0;
    navigate("/CheckoutPage", {
      state: {
        cart: [item],
        totalAmount: itemPrice * item.quantity,
        isFromCart: false
      },
    });
  };

  const getVariantData = (item) => {
    if (!item.variantId || !item.product?.variants) return null;
    return item.product.variants.find(
      v => v._id?.toString() === item.variantId?.toString()
    ) || null;
  };

  const getDiscountPercent = (item) => {
    const variant = getVariantData(item);
    if (variant?.offer) return Number(variant.offer);
    if (item.product?.pOffer > 0) return Number(item.product.pOffer);
    const price = item.price || item.product?.pPrice || 0;
    const prev = variant?.previousPrice || item.product?.pPreviousPrice || 0;
    if (prev > price && prev > 0) return Math.round(((prev - price) / prev) * 100);
    const mrp = item.product?.pMrp || item.product?.pOriginalPrice || 0;
    if (mrp > price && mrp > 0) return Math.round(((mrp - price) / mrp) * 100);
    return 0;
  };

  const getMrp = (item) => {
    const variant = getVariantData(item);
    if (variant?.previousPrice) return Number(variant.previousPrice);
    if (item.product?.pPreviousPrice) return Number(item.product.pPreviousPrice);
    if (item.product?.pMrp) return Number(item.product.pMrp);
    if (item.product?.pOriginalPrice) return Number(item.product.pOriginalPrice);
    const price = item.price || item.product?.pPrice || 0;
    const disc = getDiscountPercent(item);
    if (disc > 0) return Math.round(price * (100 / (100 - disc)));
    return 0;
  };
  const totalItems = cart.length;

  /* ── State screens ── */
  if (!isAuthenticated) {
    return (
      <div className="cart-page">
        <div className="state-container">
          <div className="state-icon"><LogIn size={36} /></div>
          <p className="state-title">Please Login</p>
          <p className="state-desc">Login to view your cart and place orders</p>
          <div className="state-btns">
            <button 
              onClick={() => window.dispatchEvent(new Event("openLogin"))} 
              className="primary-button"
            >
              <LogIn size={16} />
              <span>Login to Continue</span>
            </button>
            <Link to="/" className="secondary-button"><ArrowLeft size={16} /><span>Continue Shopping</span></Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="cart-page">
        <div className="loader-wrap">
          <ModernLoader showTiming={false} animationType="morph" size={0.7} customMessage="Loading your cart..." showProgress />
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="state-container">
          <div className="state-icon"><ShoppingBag size={36} /></div>
          <p className="state-title">Your cart is empty!</p>
          <p className="state-desc">Add items to it now</p>
          <div className="state-btns">
            <Link to="/" className="primary-button"><ArrowLeft size={16} /><span>Shop Now</span></Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate overall price details for the summary
  const totalMrp = cart.reduce((acc, item) => {
    const itemMrp = getMrp(item);
    // If MRP exists and is higher than price, use it; otherwise fallback to item price
    return acc + (itemMrp > 0 ? itemMrp : (item.price || item.product?.pPrice || 0)) * item.quantity;
  }, 0);

  const totalSellingPrice = cart.reduce((acc, item) => {
    return acc + (item.price || item.product?.pPrice || 0) * item.quantity;
  }, 0);

  const totalDiscount = totalMrp - totalSellingPrice;

  /* ── Main layout ── */
  return (
    <div className="cart-page">
      <div className="cart-wrapper">


        {/* ═══ LEFT COLUMN ═══ */}
        <div className="cart-left">

          {/* Header */}
          <div className="cart-card cart-header">
            <h2>My Cart ({totalItems})</h2>
          </div>

          {/* Delivery Address */}
          <div className="cart-card deliver-card">
            <div className="deliver-info">
              {deliveryAddress ? (
                <>
                  <div className="deliver-top-row">
                    <span className="deliver-label">Deliver to:</span>
                    <span className="deliver-name-pin">
                      {deliveryAddress.name}, {deliveryAddress.pincode}
                    </span>
                  </div>
                  <div className="deliver-address-line">
                    {deliveryAddress.street}, {deliveryAddress.city}, {deliveryAddress.state}
                  </div>
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
              {deliveryAddress ? "Change" : "Add Address"}
            </button>
          </div>

          {/* Cart Items */}
          <div className="cart-card">
            <AnimatePresence>
              {cart.map((item) => {

                const { id, isVariant } = getItemIdentifier(item);
                const isUpdating = String(updatingQuantityId) === String(id);
                const isRemoving = String(removingItemId) === String(id);
                const availableStock = getAvailableStock(item);
                const itemPrice = item.price || item.product?.pPrice || 0;
                const totalPrice = itemPrice * item.quantity;
                const discPct = item.product?.pOffer || getDiscountPercent(item);
                const mrp = getMrp(item);
                const rating = item.product?.pRating || 0;
                const ratingCount = item.product?.pRatingCount || item.product?.ratingCount || 0;
                const pName = item.variantType === "combo" ? item.comboName : (item.product?.pName || "Product");
                const rawImg = item.variantType === "combo"
                  ? item.comboImage
                  : (item.product?.pImage?.[0] || item.product?.pImage || "uploads/placeholder.jpg");
                const productImg = transformImageUrl(rawImg);

                const deliveryDate = getDeliveryDate();

                return (
                  <motion.div
                    key={String(id)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="cart-item"
                  >
                    {/* Top section: image + details */}
                    <div className="cart-item-top">

                      {/* Image + Qty */}
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
                            <span style={{ display: 'block', lineHeight: '1', marginTop: '-1px' }}>−</span>
                          </button>

                          <span className="qty-input">{item.quantity}</span>

                          <button
                            className="qty-btn"
                            disabled={isUpdating || item.quantity >= availableStock}
                            onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                          >
                            <span style={{ display: 'block', lineHeight: '1', marginTop: '-1px' }}>+</span>
                          </button>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="item-right-col">

                        <div className="item-title-container">
                          <Link to={`/product/${item.product?._id}`} className="item-title">
                            {pName}
                          </Link>

                        </div>

                        {item.product?.pBrand && (
                          <span className="item-brand-tag">{item.product.pBrand}</span>
                        )}

                        {item.variantType && item.variantValue && 
                         item.variantType !== "Unit" && 
                         item.variantValue !== "Standard" && 
                         item.variantValue !== "null" && (
                          <div className="item-variant">{item.variantType}: {item.variantValue}</div>
                        )}

                        {/* Rating + Assured */}
                        {/* <div className="item-rating-row">
                          {rating > 0 && (
                            <>
                              <span className="rating-stars">
                                {rating.toFixed(1)} <Star size={10} fill="white" stroke="none" />
                              </span>
                              {ratingCount > 0 && (
                                <span className="rating-count">({ratingCount.toLocaleString("en-IN")})</span>
                              )}
                            </>
                          )}

                        </div> */}



                        {/* Price Section — Standardized and Synced */}
                        <div className="item-price-section">
                          <span className="price-now">₹{formatINR(totalPrice)}</span>
                          {mrp > 0 && mrp > itemPrice && (
                            <span className="price-old">₹{formatINR(mrp * item.quantity)}</span>
                          )}
                          {discPct > 0 && (
                            <span className="price-disc-pct">{discPct}% off</span>
                          )}
                        </div>

                        {/* Delivery & Stock */}
                        <div className="item-delivery-info">
                          <div className="stock-info">
                            {availableStock > 0 ? (
                              <span className={availableStock <= 5 ? "stock-alert" : "stock-available"}>
                                {availableStock <= 5 ? `Only ${availableStock} left` : `${availableStock} in stock`}
                              </span>
                            ) : (
                              <span className="stock-alert">Out of stock</span>
                            )}
                          </div>
                          <span className="delivery-right">
                            Delivery by {deliveryDate}
                          </span>
                        </div>

                      </div>
                    </div>

                    {/* Action bar — Flipkart style full-width */}
                    <div className="item-actions-bar">
                      <button className="action-btn" onClick={() => handleSaveForLater(item)}>
                        <Bookmark size={14} /> Save later
                      </button>
                      <button className="action-btn" onClick={() => handleRemoveItem(id, isVariant)}>
                        <Trash2 size={14} /> {isRemoving ? "Removing..." : "Remove"}
                      </button>
                      <button className="action-btn buy-now-btn" onClick={() => handleBuyNow(item)}>
                        <Zap size={14} /> Buy now
                      </button>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Saved for Later */}
          {savedItems.length > 0 && (
            <div className="cart-card saved-section">
              <div className="saved-header">Saved for Later ({savedItems.length})</div>
              {savedItems.map((item, index) => (
                <div key={item._id || index} className="cart-item">
                  <div className="cart-item-top">
                    <div className="item-left-col">
                      <div className="item-img-container">
                        <img
                          className="item-img"
                          src={transformImageUrl(Array.isArray(item.pImage) ? item.pImage[0] : item.pImage) || "uploads/placeholder.jpg"}
                          alt={item.pName}
                        />
                      </div>
                    </div>
                    <div className="item-right-col">
                      <Link to={`/product/${item._id}`} className="item-title">{item.pName}</Link>
                      {item.pBrand && (
                        <div className="item-brand">{item.pBrand}</div>
                      )}

                      {(() => {
                        const meta = JSON.parse(
                          localStorage.getItem(`variant_meta_${item._id}_${item.variantId}`) || "{}"
                        );
                        return meta.variantType && meta.variantValue ? (
                          <div className="item-variant">
                            {meta.variantType}: {meta.variantValue}
                          </div>
                        ) : null;
                      })()}
                      <div className="item-price-section">
                        <span className="price-now">₹{formatINR(item.pPrice)}</span>
                        {item.pOffer > 0 && (
                          <>
                            <span className="price-old">₹{formatINR(item.pPreviousPrice)}</span>
                            <span className="price-disc-pct">{item.pOffer}%</span>
                          </>
                        )}
                      </div>
                      {item.inStock ? (
                        <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 500 }}>
                          In Stock
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: "#ff6161", fontWeight: 500 }}>
                          Out of Stock
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="item-actions-bar">
                    <button
                      className="action-btn"
                      onClick={() => handleMoveToCart(item)}
                      disabled={!item.inStock}
                      style={{ opacity: item.inStock ? 1 : 0.5, cursor: item.inStock ? 'pointer' : 'not-allowed' }}
                    >
                      <ShoppingBag size={16} /> {item.inStock ? "Move to Cart" : "Out of Stock"}
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => {
                        removeFromSaveForLater(item._id, item.variantId)
                          .then(() => {
                            enqueueSnackbar("Item removed from Save for Later", { variant: "success", autoHideDuration: 2000 });
                            fetchSavedItems();
                          })
                          .catch((err) => {
                            enqueueSnackbar(err.message || "Failed to remove item", { variant: "error" });
                          });
                      }}
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
        {/* ═══ END LEFT ═══ */}

        {/* ═══ RIGHT COLUMN — Price Details + Place Order ═══ */}
        <div className="cart-right">

          <div className="price-details11">
            <div className="price-details-title">Price Details</div>
            <div className="price-details-body">
              {/* Requirement 1: Original total price (MRP) */}
              <div className="price-row">
                <span>Total MRP ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
                <span>₹{formatINR(totalMrp)}</span>
              </div>

              {/* Requirement 2: Discount (-price) */}
              {totalDiscount > 0 && (
                <div className="price-row">
                  <span>Discount</span>
                  <span className="discount-text">− ₹{formatINR(totalDiscount)}</span>
                </div>
              )}

              <hr className="price-divider" />

              {/* Requirement 3: Total Amount */}
              <div className="price-total">
                <span>Total Amount</span>
                <span>₹{formatINR(totalSellingPrice)}</span>
              </div>

              {/* Requirement 3: Save price message */}
              {totalDiscount > 0 && (
                <div className="savings-info">
                  <Tag size={14} strokeWidth={2.2} style={{ marginRight: "6px" }} />
                  You will save ₹{formatINR(totalDiscount)} on this order
                </div>
              )}
            </div>
          </div>

          {/* ✅ Place Order button — right panel */}
          <button className="place-order-btn" onClick={handleCheckout} disabled={checkoutProcessing}>
            {checkoutProcessing ? "Processing..." : "Proceed to Checkout"}
          </button>

          <div className="summary-secure">
            <ShieldCheck size={18} color="#878787" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Safe and Secure Payments. Easy returns. 100% Authentic products.</span>
          </div>

        </div>
        {/* ═══ END RIGHT ═══ */}

      </div>

      {/* ═══ ADDRESS WARNING MODAL ═══ */}
      {showAddressModal && (
        <div className="prime-modal-overlay">
          <div className="prime-modal" style={{ maxWidth: '440px' }}>
            <div className="prime-modal-body" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div className="warning-icon-wrapper" style={{
                width: '80px',
                height: '80px',
                background: '#fff9e6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <MapPin size={40} color="#fb641b" strokeWidth={1.5} />
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#212121', margin: '0 0 12px' }}>
                Delivery Address Missing
              </h3>
              <p style={{ fontSize: '14px', color: '#878787', margin: '0 0 24px', lineHeight: '1.6' }}>
                You haven't selected a delivery address yet. Please add an address to proceed with your order.
              </p>
            </div>
            <div className="prime-modal-footer" style={{ background: '#f9f9f9' }}>
              <button
                type="button"
                className="prime-btn prime-btn-secondary"
                onClick={() => setShowAddressModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="prime-btn prime-btn-primary"
                onClick={() => {
                  setShowAddressModal(false);
                  navigate("/profile", { state: { activeTab: "addresses" } });
                }}
                style={{ flex: 1, background: '#2874f0' }}
              >
                Add Address
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CartPage;
