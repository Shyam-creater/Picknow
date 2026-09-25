import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Heart, Star, Eye } from "lucide-react";
import { FiChevronDown } from "react-icons/fi";
import { addToWishlist, removeFromWishlist } from "../../APi/userApi";
import { cartApi } from "../../APi/cartApi";
import { productApi } from "../../APi/productApi";
import { useSnackbar } from "notistack";
import { transformImageUrl } from "../../APi/utils";
import "./ProductCard.css";

const ProductCard = ({ product, isInitialWishlisted = false, onAddToCartSuccess }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [isWishlisted, setIsWishlisted] = useState(isInitialWishlisted);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [localVariants, setLocalVariants] = useState([]);
  
  // Variant Selection State
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Hydrate cart data once on mount
  useEffect(() => {
    const hydrateCart = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      try {
        const res = await cartApi.getCart();
        if (res.success && res.cart?.items) {
          localStorage.setItem("activeCartItems", JSON.stringify(res.cart.items));
          // Trigger a sync for all cards with fresh data
          window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { items: res.cart.items } }));
        }
      } catch (error) {}
    };
    hydrateCart();
  }, []);

  // Sync state based on selection or global updates
  useEffect(() => {
    const syncState = () => {
      const items = JSON.parse(localStorage.getItem("activeCartItems") || "[]");
      const pId = resolveId(product);
      const v = selectedVariant || product.variants?.[0];
      
      const cartItem = items.find(item => (item.product?._id || item.product) === pId);
      if (cartItem) {
        const variantsList = product.variants || localVariants;
        if (cartItem.variantId && variantsList) {
          const matchingV = variantsList.find(varnt => varnt._id === cartItem.variantId);
          // Only auto-select on mount or if not already set by user
          if (matchingV && !selectedVariant) {
            setSelectedVariant(matchingV);
          }
          setIsAdded(cartItem.variantId === v?._id);
        } else {
          setIsAdded(true);
        }
      } else {
        setIsAdded(false);
      }
    };

    syncState();
    
    const handleCartUpdate = (e) => {
      if (e.detail?.items) {
        // Sync local cache
        localStorage.setItem("activeCartItems", JSON.stringify(e.detail.items));
        syncState();
      }
    };
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, [product, selectedVariant]);

  useEffect(() => {
    let isMounted = true;
    const fetchVariantsIfNeeded = async () => {
      const hasPopulatedVariants = product?.variants && product.variants.length > 0 && typeof product.variants[0] === 'object';
      
      if (hasPopulatedVariants) {
        setLocalVariants(product.variants);
        const defaultV = product.variants.find(v => v.isDefault) || product.variants[0];
        setSelectedVariant(defaultV);
        return;
      }
      
      const pId = resolveId(product);
      if (!pId) return;

      try {
        const res = await productApi.getProductVariants(pId);
        const fetchedVariants = res.data || res.variants || (Array.isArray(res) ? res : []);
        if (isMounted && fetchedVariants && fetchedVariants.length > 0) {
          // Filter out inactive variants if needed, or take all
          const activeVariants = fetchedVariants.filter(
            (v) => v && (v.status === "active" || v.status === "Active")
          );
          const variantsToUse = activeVariants.length > 0 ? activeVariants : fetchedVariants;
          setLocalVariants(variantsToUse);
          const defaultV = variantsToUse.find(v => v.isDefault) || variantsToUse[0];
          setSelectedVariant(defaultV);
        }
      } catch (error) {
        console.error("Error fetching variants for product card", error);
      }
    };
    
    fetchVariantsIfNeeded();
    return () => { isMounted = false; };
  }, [product]);

  useEffect(() => {
    const syncWishlistState = () => {
      const pId = resolveId(product);
      if (!pId) return;
      
      const savedWishlist = JSON.parse(localStorage.getItem("userWishlist") || "[]");
      const isPresent = savedWishlist.includes(pId);
      setIsWishlisted(isPresent);
    };

    // Initial check
    syncWishlistState();

    // Listen for both immediate toggle and full sync completion
    window.addEventListener("wishlistUpdated", syncWishlistState);
    window.addEventListener("wishlistSyncComplete", syncWishlistState);
    
    return () => {
      window.removeEventListener("wishlistUpdated", syncWishlistState);
      window.removeEventListener("wishlistSyncComplete", syncWishlistState);
    };
  }, [product, isInitialWishlisted]);

  const resolveId = (p) => p?._id || p?.id || p?.productId;

  const handleProductClick = () => {
    const pId = resolveId(product);
    if (!pId) return;
    navigate(`/product/${pId}`);
  };

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    const pId = resolveId(product);
    if (!pId) return;

    const token = localStorage.getItem("token");
    if (!token) {
      enqueueSnackbar("Sign in to save favorites", { variant: "info" });
      window.dispatchEvent(new Event("openLogin"));
      return;
    }

    try {
      if (isWishlisted) {
        const res = await removeFromWishlist(pId);
        if (res.success) {
          setIsWishlisted(false);
          enqueueSnackbar("Removed from wishlist", { variant: "success" });
          window.dispatchEvent(new CustomEvent("wishlistUpdated"));
        }
      } else {
        const res = await addToWishlist(pId);
        if (res.success) {
          setIsWishlisted(true);
          enqueueSnackbar("Added to wishlist", { variant: "success" });
          window.dispatchEvent(new CustomEvent("wishlistUpdated"));
        }
      }
    } catch (error) {
      enqueueSnackbar("Failed to update wishlist", { variant: "error" });
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    const pId = resolveId(product);
    const token = localStorage.getItem("token");
    if (!token) {
      window.dispatchEvent(new Event("openLogin"));
      return;
    }

    try {
      setIsAdding(true);
      const v = selectedVariant || localVariants?.[0] || product.variants?.[0];
      
      const cartData = {
        productId: pId,
        quantity: 1,
        variantId: v?._id,
        variantType: v?.attributes ? Object.keys(v.attributes).find(k => v.attributes[k]) : null,
        variantValue: v ? getVariantLabel(v) : null,
        price: v?.price || product.pPrice
      };

      const response = await cartApi.addToCart(cartData);
      if (response.success) {
        setIsAdded(true);
        enqueueSnackbar("Added to bag", { variant: "success" });
        window.dispatchEvent(new CustomEvent("cartUpdated", { 
          detail: { 
            count: response.cart?.items?.length,
            items: response.cart?.items 
          } 
        }));
        
        if (onAddToCartSuccess) {
          onAddToCartSuccess(pId);
        }

        // We don't reset isAdded anymore to keep the tick visible
      }
    } catch (error) {
      enqueueSnackbar(error.message || "Failed to add", { variant: "error" });
    } finally {
      setIsAdding(false);
    }
  };

  if (!product) return null;

  // Resolution logic for price and discount (matching ProductDetail/HotDeals patterns)
  const getPricingData = () => {
    // If a variant is selected, use its data
    if (selectedVariant) {
      return {
        price: selectedVariant.price || 0,
        originalPrice: selectedVariant.previousPrice || selectedVariant.originalPrice || 0,
        discount: selectedVariant.offer || 0
      };
    }

    // Fallback to top-level or first variant
    let price = product.pPrice || product.price || 0;
    let originalPrice = product.pPreviousPrice || product.previousPrice || 0;
    let offer = product.pOffer || product.offer || 0;

    const variantsToDisplay = localVariants && localVariants.length > 0 
      ? localVariants 
      : (product?.variants && product.variants.length > 0 && typeof product.variants[0] === 'object' ? product.variants : []);

    if (price === 0 && variantsToDisplay.length > 0) {
      const v = variantsToDisplay[0];
      price = v.price || 0;
      originalPrice = v.previousPrice || v.originalPrice || 0;
      offer = v.offer || 0;
    }

    if (offer === 0 && originalPrice > price) {
      offer = Math.round(((originalPrice - price) / originalPrice) * 100);
    }

    return { price, originalPrice, discount: offer };
  };

  const getVariantLabel = (v) => {
    let label = "Standard";
    if (v.attributes) {
      const { weight, size, color, belt, shoe } = v.attributes;
      label = weight || size || color || belt || shoe || "Standard";
    }
    
    if (v.stock !== undefined && v.stock !== null) {
      label += ` (${v.stock} in stock)`;
    }
    
    return label;
  };

  const { price, originalPrice, discount } = getPricingData();

  return (
    <motion.div
      className="premium-product-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover="hover"
      onClick={handleProductClick}
    >
      <div className="card-visual-container">
        <motion.img
          src={product.pImage && product.pImage[0] ? transformImageUrl(product.pImage[0]) : "uploads/placeholder.jpg"}
          alt={product.pName}
          className="product-main-image"
          onError={(e) => { e.target.src = "uploads/placeholder.jpg"; }}
          variants={{ hover: { scale: 1.08 } }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />

        {discount > 0 && (
          <span className="aesthetic-offer-number">
            {discount}% OFF
          </span>
        )}

        <div className="aesthetic-action-bar">
          <button
            className={`action-dot ${isWishlisted ? 'active' : ''}`}
            onClick={handleWishlistToggle}
            title="Wishlist"
          >
            <Heart size={18} fill={isWishlisted ? "#ff5e00" : "none"} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="card-details-aesthetic">
        <div className="top-details-group">
          <div className="cat-tag-row">
            <span className="aesthetic-category">{product.pCategory || "Organic"}</span>
            <div className="aesthetic-rating">
              <Star size={22} fill="#ffb800" color="#ffb800" />
              <span>{product.pRating || 4.8}</span>
            </div>
          </div>

          <h3 className="aesthetic-title">{product.pName}</h3>
        </div>

        <div className="aesthetic-price-row">
          <div className="price-group-inline">
            <span className="curr-price">₹{price}</span>
            {originalPrice > price && <span className="old-price">₹{originalPrice}</span>}
          </div>
          <div className="brand-minimal">{product.pBrand}</div>
        </div>

        {/* Variant & Cart Actions Row */}
        <div className="card-actions-row-premium" onClick={(e) => e.stopPropagation()}>
          {(() => {
            const variantsToDisplay = localVariants && localVariants.length > 0 
              ? localVariants 
              : (product?.variants && product.variants.length > 0 && typeof product.variants[0] === 'object' ? product.variants : []);
              
            return variantsToDisplay.length > 0 ? (
              <div className="variant-dropdown-wrapper">
                <select 
                  className="variant-select-premium"
                  value={selectedVariant?._id}
                  onChange={(e) => {
                    const v = variantsToDisplay.find(v => v._id === e.target.value);
                    setSelectedVariant(v);
                  }}
                >
                  {variantsToDisplay.map((v) => (
                    <option key={v._id} value={v._id}>
                      {getVariantLabel(v)}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="select-icon-premium" />
              </div>
            ) : (
               <div className="standard-unit-tag"></div>
            );
          })()}

          <button 
            className={`premium-cart-btn ${isAdded ? 'added' : ''}`}
            onClick={handleAddToCart}
            disabled={isAdding || isAdded}
          >
            {isAdding ? <div className="cart-loader"></div> : isAdded ? "✓" : <ShoppingBag size={18} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
