import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HotDeals.css';
import { FaHeart, FaShoppingBasket, FaCheck } from 'react-icons/fa';
import herbals2 from '../../assets/herbals2.jpg';
import { productApi } from '../../APi/productApi';
import { cartApi } from '../../APi/cartApi';
import { addToWishlist, removeFromWishlist, getWishlist } from '../../APi/userApi';
import { useSnackbar } from 'notistack';
import { motion } from 'framer-motion';

const HotDeals = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [cartItems, setCartItems] = useState(new Set());
  const [wishlistItems, setWishlistItems] = useState(new Set());
  const [cartCount, setCartCount] = useState(0);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [loadingCart, setLoadingCart] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  /* ================= FETCH HOT DEAL PRODUCTS ================= */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productApi.getAllProductByOffer();

        if (response && response.data && Array.isArray(response.data)) {
          const groupedProducts = {};

          response.data.forEach(item => {
            const key = item.pName;

            if (!groupedProducts[key]) {
              groupedProducts[key] = {
                id: item.productId,
                name: item.pName,
                image: item.pImage && item.pImage.length > 0 ? item.pImage[0] : herbals2,
                price: item.price,
                originalPrice: item.previousPrice > 0 ? item.previousPrice : undefined,
                offer: item.offer,
                variants: []
              };
            }

            groupedProducts[key].variants.push({
              variantId: item.variantId,
              size: item.size,
              type: item.type,
              stock: item.stock,
              price: item.price
            });
          });

          setProducts(Object.values(groupedProducts));
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message || "Failed to load products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  /* ================= FETCH WISHLIST ================= */
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await getWishlist();
        if (response.success) {
          const wishlistIds = new Set(response.products.map(p => p._id));
          setWishlistItems(wishlistIds);
        }
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      }
    };

    fetchWishlist();
  }, []);

  /* ================= FETCH CART ================= */
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await cartApi.getCart();
        if (response.success) {
          const cartIds = new Set(
            response.cart?.items?.map(item => item.product?._id).filter(Boolean)
          );
          setCartItems(cartIds);

          const totalItems = response.cart?.items?.reduce(
            (sum, item) => sum + item.quantity, 0
          ) || 0;

          setCartCount(totalItems);
          updateCartCount(totalItems);
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
      }
    };

    fetchCartItems();
  }, []);

  /* ================= CART COUNT ================= */
  const updateCartCount = (count) => {
    localStorage.setItem('cartCount', count);
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count } }));
  };

  useEffect(() => {
    const storedCount = localStorage.getItem('cartCount');
    if (storedCount) setCartCount(parseInt(storedCount));
  }, []);

  /* ================= ADD TO CART ================= */
  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (loadingCart) return;

    if (cartItems.has(product.id)) {
      enqueueSnackbar('Product already in cart', { variant: 'info' });
      return;
    }

    const selectedVariant = product.variants.find(v => v.stock > 0);

    if (!selectedVariant) {
      enqueueSnackbar('Out of stock', { variant: 'error' });
      return;
    }

    try {
      setLoadingCart(true);

      const cartData = {
        productId: product.id,
        quantity: 1,
        variantId: selectedVariant.variantId,
        variantType: selectedVariant.type,
        variantValue: selectedVariant.size,
        price: selectedVariant.price
      };

      const response = await cartApi.addToCart(cartData);

      if (response.success) {
        setCartItems(prev => new Set(prev).add(product.id));

        const totalItems = response.cart?.items?.reduce(
          (sum, item) => sum + item.quantity, 0
        ) || 0;

        setCartCount(totalItems);
        updateCartCount(totalItems);

        enqueueSnackbar('Added to cart', { variant: 'success' });
      }
    } catch (error) {
      if (error.message === 'Unauthorized access. Please login.') {
        enqueueSnackbar('Please login first', { variant: 'warning' });
        window.dispatchEvent(new Event('openLogin'));
      } else {
        enqueueSnackbar(error.message || 'Failed to add cart', { variant: 'error' });
      }
    } finally {
      setLoadingCart(false);
    }
  };

  /* ================= WISHLIST ================= */
  const handleAddToWishlist = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (loadingWishlist) return;

    try {
      setLoadingWishlist(true);
      const isInWishlist = wishlistItems.has(product.id);

      if (isInWishlist) {
        await removeFromWishlist(product.id);
        setWishlistItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(product.id);
          return newSet;
        });
        enqueueSnackbar('Removed from wishlist', { variant: 'success' });
      } else {
        await addToWishlist(product.id);
        setWishlistItems(prev => new Set(prev).add(product.id));
        enqueueSnackbar('Added to wishlist', { variant: 'success' });
      }
    } catch (error) {
      enqueueSnackbar('Wishlist action failed', { variant: 'error' });
    } finally {
      setLoadingWishlist(false);
    }
  };

  /* ================= PRODUCT CLICK ================= */
  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`);
  };

  /* ================= RENDER ================= */
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <section className="hotdeals-section">
      <div className="container">

        <div className="hd-header text-center">
          <h2 className="hd-title">Hot <span>Deals</span></h2>
        </div>

        <div className="hd-content">
          {loading ? (
            <div className="hd-loading">Loading specific hot deals...</div>
          ) : error ? (
            <div className="hd-alert hd-alert-danger">{error}</div>
          ) : products.length === 0 ? (
            <div className="hd-alert hd-alert-info">No hot deals available</div>
          ) : (
            <motion.div
              className="row g-4 justify-content-center"
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
            >
              {products.map(product => (
                <motion.div
                  key={product.id}
                  className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex"
                  variants={itemVariants}
                >
                  <div className="hd-card w-100" onClick={() => handleProductClick(product)}>
                    <div className="hd-card-head">
                      {product.offer > 0 && (
                        <span className="hd-badge">-{product.offer}%</span>
                      )}

                      <div className="hd-thumb">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="hd-image"
                          onError={(e) => e.target.src = herbals2}
                        />
                      </div>

                      <div className="hd-actions">
                        <button
                          className={`hd-icon-btn ${wishlistItems.has(product.id) ? 'is-active' : ''}`}
                          onClick={(e) => handleAddToWishlist(e, product)}
                          title="Wishlist"
                        >
                          <FaHeart />
                        </button>

                        <button
                          className={`hd-icon-btn ${cartItems.has(product.id) ? 'is-active' : ''}`}
                          onClick={(e) => handleAddToCart(e, product)}
                          title="Add to Cart"
                        >
                          {cartItems.has(product.id) ? <FaCheck /> : <FaShoppingBasket />}
                        </button>
                      </div>
                    </div>

                    <div className="hd-card-body">
                      <h3 className="hd-name">{product.name}</h3>

                      <div className="hd-price-row mt-auto">
                        <span className="hd-price">₹{product.price}</span>
                        {product.originalPrice && (
                          <span className="hd-price-strike">₹{product.originalPrice}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

      </div>
    </section>
  );
};

export default HotDeals;
