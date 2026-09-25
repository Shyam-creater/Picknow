import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectCoverflow } from "swiper/modules";
import { motion, AnimatePresence } from "framer-motion";
import "./latestSlider.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/autoplay";
import "swiper/css/effect-coverflow";
import { CategoryShimmer } from "../ShimmerEffect/ShimmerEffect";
import { productApi } from "../../APi/productApi";
import { cartApi } from "../../APi/cartApi";
import { useSnackbar } from "notistack";

const CategoryCarousel = () => {
  const [loading, setLoading] = useState(true);
  const [latestProducts, setLatestProducts] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [addingToCart, setAddingToCart] = useState({});
  const [addedToCart, setAddedToCart] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        const response = await productApi.getLatestProduct();
        if (response.success) {
          const activeProducts = response.products.filter(
            (product) => product.pStatus === "active" || product.pStatus === "Active"
          );

          const productsWithVariants = await Promise.all(
            activeProducts.map(async (product) => {
              try {
                const variantResponse = await productApi.getProductVariants(product._id);
                if (variantResponse.success && variantResponse.variants) {
                  const activeVariants = variantResponse.variants.filter(
                    (v) => v.status === "active" || v.status === "Active"
                  );
                  if (activeVariants.length > 0) {
                    setSelectedVariants((prev) => ({
                      ...prev,
                      [product._id]: activeVariants[0]._id,
                    }));
                    return { ...product, variants: activeVariants };
                  }
                  return null;
                }
                return null;
              } catch (error) {
                console.error("Error fetching variants:", error);
                return null;
              }
            })
          );

          const validProducts = productsWithVariants.filter((product) => product !== null);
          const uniqueProductsMap = new Map();

          validProducts.forEach((product) => {
            if (!uniqueProductsMap.has(product.pName)) {
              uniqueProductsMap.set(product.pName, product);
            }
          });

          setLatestProducts(Array.from(uniqueProductsMap.values()));
        }
      } catch (error) {
        console.error("Error fetching latest products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestProducts();
    fetchCartItems();

    const handleCartUpdate = () => {
      fetchCartItems();
    };
    window.addEventListener("cartUpdated", handleCartUpdate);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, []);

  const fetchCartItems = async () => {
    try {
      const response = await cartApi.getCart();
      if (response.success) {
        setCartItems(response.cart?.items || []);
      }
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  };

  const isProductInCart = (productId, variantId = null) => {
    if (!cartItems || !Array.isArray(cartItems)) return false;

    return cartItems.some((item) => {
      if (!item || !item.product) return false;
      if (variantId) {
        return item.product._id === productId && item.variantId === variantId;
      }
      return item.product._id === productId;
    });
  };

  const handleVariantChange = (productId, variantId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: variantId,
    }));
    setAddedToCart((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (key.startsWith(`${productId}-`) || key === productId) {
          delete newState[key];
        }
      });
      return newState;
    });
  };

  const handleAddToCart = async (e, product, selectedVariant) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setAddingToCart((prev) => ({ ...prev, [product._id]: true }));
      await new Promise((resolve) => setTimeout(resolve, 500));

      const cartData = {
        productId: product._id,
        quantity: 1,
        variantId: selectedVariant?._id,
        variantType: selectedVariant?.attributes?.size
          ? "size"
          : selectedVariant?.attributes?.color
            ? "color"
            : selectedVariant?.type || "size",
        variantValue: selectedVariant?.attributes?.size ||
          selectedVariant?.attributes?.color ||
          selectedVariant?.size ||
          selectedVariant?.color ||
          "",
        variantAttributes: selectedVariant?.attributes || {},
        price: selectedVariant ? selectedVariant.price : product.pPrice,
      };

      const response = await cartApi.addToCart(cartData);

      if (response.success) {
        const cartStateKey = selectedVariant ? `${product._id}-${selectedVariant._id}` : product._id;
        setAddedToCart((prev) => ({ ...prev, [cartStateKey]: true }));
        setCartItems(response.cart?.items || []);
        enqueueSnackbar("Product added to cart successfully", { variant: "success" });

        const totalItems = response.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { count: totalItems } }));

        setTimeout(() => {
          setAddedToCart((prev) => ({ ...prev, [cartStateKey]: false }));
        }, 2000);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error.message === "Unauthorized access. Please login.") {
        enqueueSnackbar("Please login to add items to cart", { variant: "warning" });
      } else {
        enqueueSnackbar(error.message || "Failed to add product to cart", { variant: "error" });
      }
    } finally {
      setAddingToCart((prev) => ({ ...prev, [product._id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="py-5 bg-light">
        <CategoryShimmer />
      </div>
    );
  }

  if (latestProducts.length === 0) {
    return null;
  }

  return (
    <div className="latest-products-section">
      <div className="container-fluid px-4 px-md-5">
        <div className="nc-header mb-5 text-center">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="nc-title"
          >
            Latest <span>Arrivals</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="nc-subtitle"
          >
            Discover freshness picked just for you
          </motion.p>
        </div>

        <div className="position-relative">
          <Swiper
            modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
            grabCursor={true}
            loop={latestProducts.length > 5}
            spaceBetween={20}
            slidesPerView={"auto"}
            autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
            speed={800}
            navigation={{
              nextEl: ".swiper-button-next",
              prevEl: ".swiper-button-prev",
            }}
            pagination={{
              clickable: true,
              el: ".latest-pagination",
              dynamicBullets: true
            }}
            breakpoints={{
              320: { spaceBetween: 0 },
              768: { spaceBetween: 20 },
              1024: { spaceBetween: 24 },
            }}
            className="latest-products-slider pb-5"
          >
            {latestProducts.map((product) => {
              const selectedVariantId = selectedVariants[product._id];
              const selectedVariant = product.variants?.find((v) => v._id === selectedVariantId);
              const hasVariants = product.variants && product.variants.length > 0;
              const displayVariant = selectedVariant || (hasVariants ? product.variants[0] : null);
              const isOutOfStock = displayVariant ? displayVariant.stock <= 0 : !product.pStock || product.pStock <= 0;
              const isInCart = displayVariant ? isProductInCart(product._id, displayVariant._id) : isProductInCart(product._id);
              const cartStateKey = displayVariant ? `${product._id}-${displayVariant._id}` : product._id;

              return (
                <SwiperSlide key={product._id} className="h-auto">
                  <div className="hd-card h-100 w-100">
                    <Link to={`/product/${product._id}`} className="text-decoration-none text-dark d-flex flex-column flex-grow-1">
                      <div className="hd-card-head">
                        {((displayVariant && displayVariant.offer > 0) || (!displayVariant && product.pOffer > 0)) && (
                          <div className="hd-badge">
                            -{displayVariant ? displayVariant.offer : product.pOffer}% OFF
                          </div>
                        )}

                        <div className="hd-thumb">
                          <motion.img
                            whileHover={{ scale: 1.08 }}
                            transition={{ duration: 0.5 }}
                            src={product.pImage[0]}
                            alt={product.pName}
                            loading="lazy"
                            className="hd-image"
                          />
                        </div>
                      </div>

                      <div className="hd-card-body pb-0">
                        <h3 className="hd-name">
                          {product.pName}
                        </h3>

                        <div className="hd-price-row mb-3">
                          <span className="hd-price">
                            ₹{(displayVariant ? displayVariant.price : product.pPrice)?.toLocaleString()}
                          </span>
                          {((displayVariant && displayVariant.previousPrice > 0) || (!displayVariant && product.pPreviousPrice > 0)) && (
                            <span className="hd-price-strike">
                              ₹{(displayVariant ? displayVariant.previousPrice : product.pPreviousPrice)?.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    {/* Actions & Variants */}
                    {hasVariants && (
                      <div className="px-3 pb-3 mt-auto">
                        <select
                          value={selectedVariantId || ""}
                          onChange={(e) => handleVariantChange(product._id, e.target.value, e)}
                          className="form-select mb-3 rounded-pill bg-light border-0 shadow-sm"
                          style={{ fontSize: '0.9rem', cursor: 'pointer' }}
                        >
                          {product.variants.map((variant) => {
                            let displayText = "";
                            if (variant.attributes) {
                              if (variant.attributes.size) displayText = variant.attributes.size;
                              else if (variant.attributes.color) displayText = variant.attributes.color;
                            }
                            if (!displayText) displayText = variant.size || variant.color || "N/A";

                            return (
                              <option key={variant._id} value={variant._id} disabled={variant.stock <= 0}>
                                {displayText} {variant.stock <= 0 ? " (Out of Stock)" : ""}
                              </option>
                            );
                          })}
                        </select>

                        <motion.button
                          whileHover={!(isOutOfStock || addingToCart[product._id] || isInCart || addedToCart[cartStateKey]) ? { scale: 1.02 } : {}}
                          whileTap={!(isOutOfStock || addingToCart[product._id] || isInCart || addedToCart[cartStateKey]) ? { scale: 0.98 } : {}}
                          onClick={(e) => handleAddToCart(e, product, displayVariant)}
                          disabled={isOutOfStock || addingToCart[product._id] || isInCart || addedToCart[cartStateKey]}
                          className="btn w-100 rounded-pill fw-bold border-0 d-flex justify-content-center align-items-center gap-2"
                          style={{
                            padding: '0.75rem',
                            fontSize: '0.95rem',
                            cursor: (isOutOfStock || addingToCart[product._id] || isInCart || addedToCart[cartStateKey]) ? 'not-allowed' : 'pointer',
                            background: isInCart || addedToCart[cartStateKey]
                              ? '#f0fdf4'
                              : isOutOfStock
                                ? '#f3f4f6'
                                : 'linear-gradient(135deg, var(--primary-orange), var(--secondary-orange))',
                            color: isInCart || addedToCart[cartStateKey]
                              ? 'var(--primary-orange)'
                              : isOutOfStock
                                ? '#9ca3af'
                                : 'white',
                            boxShadow: isInCart || addedToCart[cartStateKey] || isOutOfStock
                              ? 'none'
                              : '0 4px 12px rgba(255, 94, 0, 0.3)'
                          }}
                        >
                          <AnimatePresence mode="wait">
                            {addingToCart[product._id] ? (
                              <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                Adding...
                              </motion.span>
                            ) : isInCart || addedToCart[cartStateKey] ? (
                              <motion.span key="added" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="d-flex align-items-center gap-1">
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Added
                              </motion.span>
                            ) : isOutOfStock ? (
                              <motion.span key="stock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                Out of Stock
                              </motion.span>
                            ) : (
                              <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                Add to Cart
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Navigation buttons */}
          {/* <div className="swiper-button-prev"></div> */}
          {/* <div className="swiper-button-next"></div> */}
        </div>

        {/* <div className="latest-pagination mt-4"></div> */}
      </div>
    </div>
  );
};

export default CategoryCarousel;