import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./Navbar.css";
import {
  styled,
  Badge,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
} from "@mui/material";
import { useSnackbar } from "notistack";
import {
  Search,
  ShoppingCart,
  LogOut,
  Heart,
  PlusSquare,
  X,
  User,
  Menu,
} from "lucide-react";
import { cartApi } from "../../APi/cartApi";
import { getWishlist } from "../../APi/userApi";
import { productApi } from "../../APi/productApi";
import { transformImageUrl } from "../../APi/utils";
import { FaSignOutAlt } from "react-icons/fa";
import { createPortal } from "react-dom";
import picknowLogo from "../../assets/PicknowLogo.png";
import NotificationBell from "./NotificationBell";
import { categoryApi } from "../../APi/categoryApi";

const CategorySidebarList = ({ onClose }) => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryApi.getAllCategories();
        const data = Array.isArray(response) ? response : (response.categories || []);
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <>
      {categories.length > 0 ? (
        categories.map((cat, index) => (
          <motion.div
            key={cat._id}
            className="sidebar-category-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            onClick={() => {
              navigate(`/category/${cat._id}?name=${encodeURIComponent(cat.cName)}`);
              onClose();
            }}
          >
            <img src={cat.cImage || "https://cdn-icons-png.flaticon.com/512/3061/3061730.png"} alt={cat.cName} />
            <span>{cat.cName}</span>
          </motion.div>
        ))
      ) : (
        <div className="sidebar-loading">Loading categories...</div>
      )}
    </>
  );
};

const HumbleSidebar = ({ isOpen, onClose, isLoggedIn, setIsLogoutDialogOpen }) => {
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="humble-sidebar-overlay open"
        onClick={onClose}
        style={{ zIndex: 10000000 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="humble-sidebar open"
          onClick={(e) => e.stopPropagation()}
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          <div className="sidebar-header">
            <img src={picknowLogo} alt="PickNow" className="sidebar-logo" />
            <button className="sidebar-close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <div className="sidebar-content">
            <div className="sidebar-section">
              <h4 className="sidebar-section-title">Shop by Category</h4>
              <div className="sidebar-category-list">
                <CategorySidebarList onClose={onClose} />
              </div>
            </div>

            <div className="sidebar-section">
              <h4 className="sidebar-section-title">Discovery</h4>
              <div className="sidebar-links-list">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Link to="/brands" className="sidebar-link" onClick={onClose}>
                    Top Brands
                  </Link>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Link to="/search?type=deals" className="sidebar-link" onClick={onClose}>
                    Top Deals
                  </Link>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Link to="/vendor" className="sidebar-link highlight" onClick={onClose}>
                    Sell on PickNow
                  </Link>
                </motion.div>
              </div>
            </div>

            {isLoggedIn && (
              <div className="sidebar-footer">
                <button
                  className="sidebar-logout-btn"
                  onClick={() => {
                    onClose();
                    setIsLogoutDialogOpen(true);
                  }}
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

const StyledDialog = styled(Dialog)`
  & .MuiBackdrop-root {
    backdrop-filter: blur(8px);
    background-color: rgba(0, 0, 0, 0.3);
  }
  & .MuiDialog-paper {
    border-radius: 20px;
    padding: 10px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }
`;

const Navbar = ({ isLoggedIn: propIsLoggedIn, onLogout, openLoginModal }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const [isLoggedIn, setIsLoggedIn] = useState(propIsLoggedIn);
  const [username, setUsername] = useState("");
  const [text, setText] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchCounts = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setCartItemCount(0);
        setWishlistCount(0);
        localStorage.removeItem("userWishlist");
        return;
      }

      // Fetch Cart Count
      const cartRes = await cartApi.getCart();
      if (cartRes.success) {
        setCartItemCount(cartRes.cart?.items?.length || 0);
      }

      // Fetch Wishlist Count
      const wishRes = await getWishlist();
      const wishArray = wishRes.products ||
        wishRes.wishlist?.products ||
        (Array.isArray(wishRes.wishlist) ? wishRes.wishlist : []) ||
        (Array.isArray(wishRes) ? wishRes : []);

      setWishlistCount(wishArray.length || 0);
      
      // Store wishlist IDs for global sync across ProductCards
      const wishIds = wishArray.map(p => p._id || p.productId || p.product?._id || p);
      localStorage.setItem("userWishlist", JSON.stringify(wishIds));
      // Notify other components that the wishlist cache is updated
      window.dispatchEvent(new CustomEvent("wishlistSyncComplete"));
    } catch (error) {
      console.error("Navbar Count Fetch Error:", error);
    }
  }, []);

  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      if (token && user) {
        setIsLoggedIn(true);
        try {
          const parsedUser = JSON.parse(user);
          setUsername(parsedUser.name || "");
        } catch (e) {
          setUsername("");
        }
        fetchCounts();
      } else {
        setIsLoggedIn(false);
        setUsername("");
        setCartItemCount(0);
        setWishlistCount(0);
      }
    };
    checkLoginStatus();
    window.addEventListener("storage", checkLoginStatus);
    window.addEventListener("loginStateChanged", checkLoginStatus);
    return () => {
      window.removeEventListener("storage", checkLoginStatus);
      window.removeEventListener("loginStateChanged", checkLoginStatus);
    };
  }, [fetchCounts, propIsLoggedIn]);

  useEffect(() => {
    fetchCounts();
    const handleCartUpdate = () => fetchCounts();
    const handleWishUpdate = () => fetchCounts();
    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("wishlistUpdated", handleWishUpdate);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("wishlistUpdated", handleWishUpdate);
    };
  }, [fetchCounts, location.pathname]);

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, []);

  const clearRecentSearches = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
    enqueueSnackbar("Search history cleared", { variant: "info" });
  };

  const saveRecentSearch = (item) => {
    const newSearches = [item, ...recentSearches.filter(s => s.id !== item.id)].slice(0, 5);
    setRecentSearches(newSearches);
    localStorage.setItem("recentSearches", JSON.stringify(newSearches));
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (text.length >= 2) {
        setIsSearching(true);
        try {
          const response = await productApi.getSearchSuggestions(text);
          if (response.data && response.data.success) {
            const suggestions = response.data.suggestions || {};
            const combinedResults = [
              ...(suggestions.products || []),
              ...(suggestions.combo || [])
            ];
            setSearchResults(combinedResults.slice(0, 10));
          } else {
            setSearchResults([]);
          }
        } catch (error) {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 350);
    return () => clearTimeout(delayDebounceFn);
  }, [text]);

  const handleLogoutConfirm = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("authToken");
    localStorage.removeItem("activeTab");
    localStorage.removeItem("isVendor");

    setIsLoggedIn(false);
    setUsername("");
    setIsLogoutDialogOpen(false);

    window.dispatchEvent(new Event("loginStateChanged"));
    enqueueSnackbar("Successfully logged out", { variant: "success" });
    navigate("/");
  };

  const handleSearch = () => {
    if (!text.trim()) return;
    saveRecentSearch({ id: Date.now(), text: text.trim(), type: 'text' });
    navigate(`/search?query=${encodeURIComponent(text)}&type=all`);
    setText("");
    setIsSearchVisible(false);
  };

  const handleProductClick = (productOrId) => {
    const productId = typeof productOrId === 'string' ? productOrId : (productOrId.id || productOrId._id);
    const product = typeof productOrId === 'string' ? searchResults.find(p => (p.id || p._id) === productId) : productOrId;

    if (product) {
      const name = product.name || product.pName;
      const image = product.image || (Array.isArray(product.pImage) ? product.pImage[0] : product.pImage);
      saveRecentSearch({
        id: productId,
        text: name,
        image: transformImageUrl(image),
        type: 'product'
      });
    }

    navigate(`/product/${productId}`);
    setIsSearchVisible(false);
    setText("");
  };

  return (
    <nav className={`premium-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <div className="nav-row-main">
          <div className="nav-left">
            <button
              className="hamburger-menu-btn mobile-only"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open Menu"
            >
              <Menu size={24} />
            </button>
            <Link to="/" className="nav-logo">
              <img src={picknowLogo} alt="PickNow" className="nav-logo-img" />
            </Link>
          </div>

          <div className="nav-center desktop-only">
            <div className="premium-search-console">
              <div className="search-input-field-wrapper">
                <Search className="search-icon-active" size={18} />
                <input
                  type="text"
                  placeholder="Search for Products, Brands and More"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={() => setIsSearchVisible(true)}
                  onBlur={() => setTimeout(() => setIsSearchVisible(false), 200)}
                />
              </div>

              {isSearchVisible && text.length > 0 && (
                <div className="premium-trending-dropdown">
                  <div className="dropdown-header11">Suggestions</div>
                  <div className="trending-list">
                    {searchResults.length > 0 ?
                      searchResults.map((p) => {
                        const name = p.name || p.pName || "Unnamed Product";
                        const image = p.image || (Array.isArray(p.pImage) ? p.pImage[0] : p.pImage);
                        const price = p.price || p.pPrice;
                        const catName = p.category?.cName || p.category || p.pCategory?.cName || p.pCategory || "";
                        const productId = p.id || p._id;

                        return (
                          <div
                            key={productId}
                            className="search-item-result"
                            onClick={() => handleProductClick(p)}
                          >
                            <img src={transformImageUrl(image)} alt={name} className="search-res-thumb" />
                            <div className="search-res-info">
                              <span className="search-res-name">{name}</span>
                              <span className="search-res-category">{catName}</span>
                            </div>
                            <span className="search-res-price">₹{price}</span>
                          </div>
                        );
                      })
                      :
                      <div className="no-results-msg">{isSearching ? "Searching..." : "No items matching your search"}</div>
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="nav-right">
            <div className="action-icons-group">
              <Link to="/brands" className="nav-link-premium desktop-only">
                Top Brands
              </Link>

              <Link
                to="/vendor"
                target="_blank"
                rel="noopener noreferrer"
                className="be-a-seller-link desktop-only"
              >
                <PlusSquare size={16} />
                <span>Sell on PickNow</span>
              </Link>

              <NotificationBell />

              <Link to="/wishlist" className="nav-icon-circle" title="My Wishlist">
                <Badge
                  badgeContent={wishlistCount}
                  color="error"
                  overlap="rectangular"
                  showZero={false}
                  className="surgical-badge"
                >
                  <Heart size={22} />
                </Badge>
              </Link>

              <Link to="/cart" className="nav-icon-circle" title="My Cart">
                <Badge
                  badgeContent={cartItemCount}
                  color="error"
                  overlap="rectangular"
                  className="surgical-badge"
                >
                  <ShoppingCart size={22} />
                </Badge>
              </Link>
            </div>

            {isLoggedIn ? (
              <div className="user-profile-group">
                <div className="user-avatar-wrapper" onClick={() => navigate('/profile')}>
                  <Avatar
                    className="premium-avatar-sleek"
                    sx={{ width: 34, height: 34, bgcolor: '#ff8a00', fontSize: '0.8rem', fontWeight: 800 }}
                  >
                    {username.charAt(0).toUpperCase()}
                  </Avatar>
                </div>
                <IconButton onClick={() => setIsLogoutDialogOpen(true)} className="logout-icon-btn" title="Logout">
                  <LogOut size={18} />
                </IconButton>
              </div>
            ) : (
              <button
                onClick={openLoginModal}
                className="premium-login-button-surgical"
              >
                <User size={18} />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>

        {/* MOBILE SUB-NAV ROW 2: SEARCH & QUICK LINKS */}
        <div className="nav-row-mobile mobile-only">
          <div className="mobile-search-integrated-wrapper">
            <div className="mobile-search-bar-integrated">
              <Search size={18} className="mobile-search-icon" />
              <input
                type="text"
                placeholder="Search for products..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => setIsSearchVisible(true)}
                onBlur={() => setTimeout(() => setIsSearchVisible(false), 200)}
              />
              {text && (
                <X
                  size={16}
                  className="clear-search-mobile"
                  onClick={() => setText("")}
                />
              )}
            </div>

            {isSearchVisible && text.length > 0 && (
              <div className="mobile-search-dropdown-results">
                {searchResults.length > 0 ? (
                  searchResults.map((p) => {
                    const name = p.name || p.pName || "Unnamed Product";
                    const image = p.image || (Array.isArray(p.pImage) ? p.pImage[0] : p.pImage);
                    const productId = p.id || p._id;
                    return (
                      <div
                        key={productId}
                        className="mobile-search-item"
                        onClick={() => handleProductClick(p)}
                      >
                        <img src={transformImageUrl(image)} alt={name} />
                        <div className="mobile-search-item-info">
                          <span className="mobile-item-name">{name}</span>
                          <span className="mobile-item-price">₹{p.price || p.pPrice}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="mobile-no-results">
                    {isSearching ? "Searching..." : "No items found"}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* MOBILE SIDEBAR PORTAL */}
        <HumbleSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isLoggedIn={isLoggedIn}
          setIsLogoutDialogOpen={setIsLogoutDialogOpen}
        />
      </div>

      {/* Logout Confirmation Popup - MOVED TO BODY VIA PORTAL */}
      {isLogoutDialogOpen && createPortal(
        <div className="prime-modal-overlay logout-overlay-global">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="prime-modal logout-modal-v2"
          >
            <div className="prime-modal-body">
              <div className="logout-logo-container">
                <img src={picknowLogo} alt="Picknow" className="logout-brand-logo" />
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
                onClick={() => setIsLogoutDialogOpen(false)}
              >
                Stay Here
              </button>
              <button
                type="button"
                className="logout-btn-confirm"
                onClick={handleLogoutConfirm}
              >
                Yes, Log Out
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </nav>
  );
};

export default Navbar;