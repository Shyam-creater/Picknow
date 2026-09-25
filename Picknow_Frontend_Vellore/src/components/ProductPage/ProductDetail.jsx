import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  ShoppingCart,
  X,
  Heart,
  Star,
  Minus,
  Plus,
  Share2,
  Package,
  RefreshCw,
  Truck,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  ChevronLeft,
  ChevronRight,
  Search,
  Scale,
} from "lucide-react";
import ProductRecommendations from "./ProductRecommendations";
import { FaChevronUp, FaChevronDown } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./ProductDetail.css";
import dryFruit1 from "../../assets/dryfruits.jpg";
import Nuts from "../../assets/Nuts.jpg";
import api from "../../APi/api";
import { productApi } from "../../APi/productApi";
import { cartApi } from "../../APi/cartApi";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../../APi/userApi";
import { useSnackbar } from "notistack";
import { transformImageUrl } from "../../APi/utils";
import ModernLoader from "../Loading/ModernLoader";
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  IconButton,
  Rating,
  Chip,
  Tabs,
  Tab,
  Card,
  CardContent,
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
  styled,
  CardMedia,
  CircularProgress,
  TextField,
} from "@mui/material";
import {
  FavoriteBorder,
  Favorite,
  Share,
  LocalShipping,
  Security,
  Loop,
  Check,
  ExpandMore,
} from "@mui/icons-material";
// import Footer from "../Footer/Footer"; // Removed to prevent duplication
import Heading from "../Heading";
// Styled components
const ProductImage = styled("img")(({ theme }) => ({
  width: "100%",
  height: "400px",
  objectFit: "contain",
  cursor: "pointer",
  [theme.breakpoints.down("md")]: {
    height: "250px",
  },
  [theme.breakpoints.down("sm")]: {
    height: "200px",
  },
}));

const ImageContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  maxWidth: "500px",
  margin: "0 auto",
  boxShadow: "none",
}));

const ZoomHint = styled(Typography)(({ theme }) => ({
  position: "absolute",
  bottom: "10px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "rgba(0, 0, 0, 0.7)",
  color: "white",
  padding: "6px 12px",
  borderRadius: "20px",
  fontSize: "12px",
  opacity: 1,
  transition: "opacity 0.2s",
  zIndex: 2,
  pointerEvents: "none",
}));

const ThumbnailImage = styled("img")(({ theme, active }) => ({
  width: "80px",
  height: "80px",
  objectFit: "cover",
  borderRadius: theme.shape.borderRadius,
  cursor: "pointer",
  backgroundColor: "#fff",
  border: active
    ? `2px solid ${theme.palette.primary.main}`
    : "2px solid transparent",
  transition: theme.transitions.create(["transform", "border-color"]),
  "&:hover": {
    transform: "scale(1.05)",
  },
}));

const ProductDetail = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccessOpen, setCartSuccessOpen] = useState(false);
  const [cartSuccessMessage, setCartSuccessMessage] = useState("");
  const cartSuccessTimerRef = useRef(null);
  const [canreview, setcanreview] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsPerPage] = useState(5);
  const [visibleReviews, setVisibleReviews] = useState(5);
  const [selectedSize, setSelectedSize] = useState("M");
  const [activeTab, setActiveTab] = useState("description");
  const [selectedColor, setSelectedColor] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variants, setVariants] = useState([]);
  const [userReview, setUserReview] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [groupedProducts, setGroupedProducts] = useState([]);
  const [groupedProductData, setGroupedProductData] = useState(null);
  const [variantsResponse, setVariantsResponse] = useState(null);
  const [imagePopup, setImagePopup] = useState({
    show: false,
    x: 0,
    y: 0,
    image: null,
  });
  const [popupImageIndex, setPopupImageIndex] = useState(0);
  const [loadingGrouped, setLoadingGrouped] = useState(false);
  const [colorToProductMap, setColorToProductMap] = useState({});

  const handleColorChange = (color) => {
    setSelectedColor(color);
    
    // 1. Try to find color in current variants
    const colorVariants = variants.filter(
      (v) => (v.attributes?.color || v.color)?.toLowerCase() === color.toLowerCase()
    );
    
    if (colorVariants.length > 0) {
      setSelectedVariant(colorVariants[0]);
      setQuantity(colorVariants[0].min || 1);
      return;
    }

    // 2. If not in current variants, check mapping for navigation
    // Only navigate if the target product has the SAME product name (same group)
    const targetId = colorToProductMap[color.toLowerCase()];
    if (targetId && targetId.toString() !== id) {
      const targetProductName = colorToProductMap[`__name__${color.toLowerCase()}`];
      if (targetProductName && targetProductName === product?.pName) {
        navigate(`/product/${targetId}`);
      }
    }
  };

  const handleImagepopup = (index) => {
    const safeIndex =
      typeof index === "number" && index >= 0 && index < productImages.length
        ? index
        : 0;

    setPopupImageIndex(safeIndex);
    setImagePopup((prev) => ({
      ...prev,
      show: true,
      image: productImages[safeIndex]?.url || Nuts,
    }));
  };

  const closeImagePopup = () => {
    setImagePopup({ show: false, x: 0, y: 0, image: null });
  };

  const handlePopupPrev = (e) => {
    e.stopPropagation();
    if (!productImages || productImages.length === 0) return;

    if (popupImageIndex === 0) return; // 🚫 stop at first image

    const newIndex = popupImageIndex - 1;
    setPopupImageIndex(newIndex);
    setImagePopup((prev) => ({
      ...prev,
      image: productImages[newIndex]?.url || Nuts,
    }));
  };

  const handlePopupNext = (e) => {
    e.stopPropagation();
    if (!productImages || productImages.length === 0) return;

    if (popupImageIndex === productImages.length - 1) return; // 🚫 stop at last image

    const newIndex = popupImageIndex + 1;
    setPopupImageIndex(newIndex);
    setImagePopup((prev) => ({
      ...prev,
      image: productImages[newIndex]?.url || Nuts,
    }));
  };



  const trustBadges = [
    { title: "Secure Checkout", desc: "100% Safe Payments", icon: <Security /> },
    { title: "Easy Returns", desc: "7 Days Policy", icon: <RefreshCw /> },
    { title: "24/7 Support", desc: "Dedicated Team", icon: <Truck /> },
  ];

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [showSticky, setShowSticky] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Hide sticky bar only when reaching the absolute bottom of the page (near the copyright bar)
      // This ensures actions are visible through the entire footer content area as requested
      const distanceToBottom = scrollHeight - (scrollTop + windowHeight);
      
      if (distanceToBottom < 50) {
        setShowSticky(false);
      } else {
        setShowSticky(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchRelatedProducts = async (productId) => {
    try {
      setLoadingRelated(true);
      const response = await productApi.getRelatedProducts(productId);
      if (response.success && response.relatedProducts?.length > 0) {
        setRelatedProducts(response.relatedProducts);
      } else {
        // Fallback: Fetch any products from the same category or just all products
        const allRes = await productApi.getAllProducts(1, 10);
        if (allRes.success) {
          // Filter out current product
          const filtered = (allRes.products || []).filter(p => p._id !== productId);
          setRelatedProducts(filtered.slice(0, 4));
        }
      }
    } catch (error) {
      console.error("Error fetching related products:", error);
    } finally {
      setLoadingRelated(false);
    }
  };

  const fetchGroupedProducts = async () => {
    try {
      setLoadingGrouped(true);
      const response = await productApi.getProductsGroupedByName();

      if (response.success && response.data) {
        const currentProductName = product?.pName;
        const currentProductId = product?._id?.toString();
        const allGroupedProducts = [];
        const seenProductIds = new Set();
        let matchedGroup = null;

        // Process all groups to extract unique products
        response.data.forEach((group) => {
          // Only consider groups for this product name (if available)
          if (currentProductName && group.pName !== currentProductName) {
            return;
          }

          // Store the matched group for color data - only if it has real color values
          if (!matchedGroup && group.color && Array.isArray(group.color)) {
            // Filter out null, empty, and invalid color values
            const validColors = group.color.filter(c => 
              c && c !== 'null' && c !== 'undefined' && c.trim() !== ''
            );
            if (validColors.length > 0) {
              matchedGroup = { ...group, color: validColors };
            }
          }

          // If API provides totalProducts, only show when there's more than 1 option
          if (
            typeof group.totalProducts === "number" &&
            group.totalProducts <= 1
          ) {
            return;
          }

          if (
            group.variants &&
            Array.isArray(group.variants) &&
            group.variants.length > 0
          ) {
            // Extract unique products from variants
            group.variants.forEach((variant) => {
              // Handle both object and string productId
              const productId =
                variant.productId?._id ||
                variant.productId ||
                variant.productId?._id?.toString();

              if (productId) {
                const productIdStr = productId.toString();

                // Skip current product and duplicates
                if (currentProductId && productIdStr === currentProductId) {
                  return;
                }

                if (!seenProductIds.has(productIdStr)) {
                  seenProductIds.add(productIdStr);

                  // Find the index of this productId within the grouped productIds (if provided by API)
                  let productImage = null;
                  if (
                    Array.isArray(group.productIds) &&
                    Array.isArray(group.productImages)
                  ) {
                    const idx = group.productIds.findIndex((pid) =>
                      pid?.toString
                        ? pid.toString() === productIdStr
                        : String(pid) === productIdStr
                    );

                    if (
                      idx >= 0 &&
                      Array.isArray(group.productImages[idx]) &&
                      group.productImages[idx].length > 0
                    ) {
                      // Take the first image of the matched product
                      productImage = group.productImages[idx][0];
                    }
                  }

                  // Fallback: use the full nested pImage array if mapping not available
                  if (!productImage) {
                    const groupPImage =
                      group.product && group.product.pImage
                        ? group.product.pImage
                        : null;
                    if (Array.isArray(groupPImage) && groupPImage.length > 0) {
                      const first = groupPImage[0];
                      productImage = Array.isArray(first) && first.length > 0 ? first[0] : first;
                    } else {
                      productImage = groupPImage;
                    }
                  }

                  allGroupedProducts.push({
                    _id: productId,
                    pName: group.pName,
                    pImage: productImage,
                    pPrice: variant.price || 0,
                    pPreviousPrice: variant.previousPrice || 0,
                    pOffer: variant.offer || 0,
                    pStock: variant.stock || 0,
                    pRating: 0,
                    pRatingsReviews: [],
                  });
                }
              }
            });
          }
        });

        // Build color-to-product map - ONLY for groups matching current product name
        const colorMap = {};
        
        // Scan variants in matching groups for colors
        response.data.forEach(group => {
          // Only map colors for groups with the same product name
          if (currentProductName && group.pName !== currentProductName) {
            return;
          }
          if (group.variants) {
            group.variants.forEach(v => {
              const c = (v.attributes?.color || v.color);
              const pid = v.productId?._id || v.productId;
              // Validate that color is a real, meaningful value
              if (c && pid && c !== 'null' && c !== 'undefined' && c.trim() !== '') {
                colorMap[c.toLowerCase()] = pid;
                // Store the product name for this color to validate navigation
                colorMap[`__name__${c.toLowerCase()}`] = group.pName;
              }
            });
          }
        });

        setColorToProductMap(colorMap);
        setGroupedProducts(allGroupedProducts);
        setGroupedProductData(matchedGroup);
      }
    } catch (error) {
      console.error("Error fetching grouped products:", error);
      enqueueSnackbar("Failed to fetch grouped products", { variant: "error" });
    } finally {
      setLoadingGrouped(false);
    }
  };

  const fetchProductVariants = async (productId) => {
    try {
      setLoadingVariants(true);
      let allVariants = [];

      // Try to fetch variants from API
      try {
        const response = await productApi.getProductVariants(productId);

        if (response.success && response.variants) {
          allVariants = response.variants;
        }
      } catch (apiError) {
        console.log("API variant fetch failed, trying product object");
      }

      // Fallback: Check if variants are in the product object
      if (allVariants.length === 0 && product?.variants && Array.isArray(product.variants)) {
        allVariants = product.variants;
      }

      // Filter only active variants
      const activeVariants = allVariants.filter(
        (v) => String(v?.status).toLowerCase() === "active"
      );

      // Sort active variants in ascending order for display
      const sortVariantsAscending = (variantList = []) => {
        const getSortKey = (v) => {
          const attrs = v?.attributes || {};
          const size = (attrs.size || v.size || "").toString();
          const color = (attrs.color || v.color || "").toString();
          const weight = (attrs.weight || v.weight || "").toString();
          return `${size}||${color}||${weight}`;
        };

        return [...variantList].sort((a, b) => {
          const keyA = getSortKey(a).toLowerCase();
          const keyB = getSortKey(b).toLowerCase();
          if (keyA < keyB) return -1;
          if (keyA > keyB) return 1;
          return 0;
        });
      };

      const sortedActiveVariants = sortVariantsAscending(activeVariants);
      setVariants(sortedActiveVariants);

      // Initialize selectedColor only if variants have meaningful color values
      const variantColors = [...new Set(
        sortedActiveVariants
          .map(v => v.attributes?.color || v.color)
          .filter(c => c && c !== 'null' && c !== 'undefined' && String(c).trim() !== '')
      )];
      // Only set color if there are multiple valid colors to choose from
      if (variantColors.length > 1 && !selectedColor) {
        setSelectedColor(variantColors[0]);
      }

      // Set the first ACTIVE variant as selected by default if available
      if (sortedActiveVariants.length > 0) {
        // Prefer default variant if exists
        const defaultVariant =
          sortedActiveVariants.find((v) => v.isDefault) || sortedActiveVariants[0];
        setSelectedVariant(defaultVariant);
        setQuantity(defaultVariant.min || 1);
      } else {
        setSelectedVariant(null);
        setQuantity(1);
      }
    } catch (error) {
      console.error("Error fetching product variants:", error);
      enqueueSnackbar("Failed to fetch product variants", { variant: "error" });
    } finally {
      setLoadingVariants(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productApi.getProductById(id);
        if (response.success) {
          const productData = response.product;
          setProduct(productData);
          // Fetch reviews after getting product details
          const reviewsResponse = await productApi.getReviews(id);
          if (reviewsResponse.success) {
            setReviews(reviewsResponse.reviews);
          }
          // Fetch related products
          await fetchRelatedProducts(productData._id);
          // Fetch product variants (will check product object as fallback)
          await fetchProductVariants(productData._id);
          await fetchAuthReviews(productData._id);
          // Note: fetchGroupedProducts is called in useEffect when product is set
        } else {
          setError("Product not found");
          enqueueSnackbar("Product not found", { variant: "error" });
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product details");
        enqueueSnackbar(err.message || "Failed to load product details", {
          variant: "error",
        });
      }
      finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, enqueueSnackbar]);

  useEffect(() => {
    if (product?.variants && Array.isArray(product.variants) && variants.length === 0) {
      const activeVariants = product.variants.filter(
        (v) => String(v?.status).toLowerCase() === "active"
      );
      if (activeVariants.length > 0) {
        setVariants(activeVariants);
        const defaultVariant = activeVariants.find((v) => v.isDefault) || activeVariants[0];
        setSelectedVariant(defaultVariant);
        setQuantity(defaultVariant.min || 1);
        
        // Only set color if variants have multiple valid color values
        const validColors = [...new Set(
          activeVariants
            .map(v => v.attributes?.color || v.color)
            .filter(c => c && c !== 'null' && c !== 'undefined' && String(c).trim() !== '')
        )];
        if (validColors.length > 1) {
          setSelectedColor(validColors[0]);
        }
      }
    }
  }, [product]);

  useEffect(() => {
    if (product?._id) {
      fetchGroupedProducts();
    }
  }, [product?._id, product?.pName]);

  const addToCart = async (e, relatedProduct = null) => {
    e.preventDefault();

    // Use relatedProduct if provided, otherwise use current product
    const targetProduct = relatedProduct || product;
    if (!targetProduct) return;

    // For related products, use quantity 1 and try to find their default variant
    let targetQuantity = relatedProduct ? 1 : quantity;
    let targetVariant = relatedProduct ? null : selectedVariant;

    // If it's a related product with variants, pick its default or first active variant
    if (relatedProduct && relatedProduct.variants && Array.isArray(relatedProduct.variants)) {
      const activeVariants = relatedProduct.variants.filter(
        v => String(v?.status).toLowerCase() === "active"
      );
      if (activeVariants.length > 0) {
        targetVariant = activeVariants.find(v => v.isDefault) || activeVariants[0];
        targetQuantity = targetVariant.min || 1;
      }
    }

    // Check if this exact product/variant combination is already in cart
    const variantIdToCheck = targetVariant?._id || null;
    const isInCart = isProductInCart(targetProduct._id, variantIdToCheck);

    if (isInCart) {
      // Find the existing cart item to check its quantity
      const existingItem = cartItems.find((item) => {
        if (!item || !item.product) return false;
        if (variantIdToCheck) {
          return item.product._id === targetProduct._id &&
            item.variantId &&
            String(item.variantId) === String(variantIdToCheck);
        }
        return item.product._id === targetProduct._id && !item.variantId;
      });

      if (existingItem) {
        const currentQuantity = existingItem.quantity || 0;
        const availableStock = targetVariant
          ? (targetVariant.stock || 0)
          : (targetProduct.pStock || 0);

        if (currentQuantity >= availableStock) {
          enqueueSnackbar("Maximum stock limit reached for this variant", {
            variant: "warning",
          });
          return;
        }

        // If already in cart and not at max stock, suggest updating quantity instead
        enqueueSnackbar("Product variant is already in cart. Update quantity from cart page.", {
          variant: "info",
        });
        return;
      }
    }

    // Validate stock before making API call
    if (targetVariant) {
      const variantStock = targetVariant.stock || 0;
      if (variantStock < targetQuantity) {
        enqueueSnackbar("Not enough stock available for selected variant", {
          variant: "error",
        });
        return;
      }

      // Check if adding this quantity would exceed stock
      if (isInCart) {
        const existingItem = cartItems.find((item) => {
          if (!item || !item.product) return false;
          return item.product._id === targetProduct._id &&
            item.variantId &&
            String(item.variantId) === String(targetVariant._id);
        });

        if (existingItem) {
          const currentQuantity = existingItem.quantity || 0;
          if (currentQuantity + targetQuantity > variantStock) {
            enqueueSnackbar(`Only ${variantStock - currentQuantity} more items available for this variant`, {
              variant: "warning",
            });
            return;
          }
        }
      }
    } else {
      const productStock = targetProduct.pStock || 0;
      if (productStock < targetQuantity) {
        enqueueSnackbar("Not enough stock available", {
          variant: "error",
        });
        return;
      }

      // Check if adding this quantity would exceed stock
      if (isInCart) {
        const existingItem = cartItems.find((item) => {
          if (!item || !item.product) return false;
          return item.product._id === targetProduct._id && !item.variantId;
        });

        if (existingItem) {
          const currentQuantity = existingItem.quantity || 0;
          if (currentQuantity + targetQuantity > productStock) {
            enqueueSnackbar(`Only ${productStock - currentQuantity} more items available`, {
              variant: "warning",
            });
            return;
          }
        }
      }
    }

    try {
      setAddingToCart(true);
      const cartData = {
        productId: targetProduct._id,
        quantity: targetQuantity,
        variantId: targetVariant?._id,
        variantType: targetVariant?.attributes?.size
          ? "size"
          : targetVariant?.attributes?.color
            ? "color"
            : targetVariant?.attributes?.weight
              ? "weight"
              : targetVariant?.type || "size",
        variantValue:
          targetVariant?.attributes?.size ||
          targetVariant?.attributes?.color ||
          targetVariant?.attributes?.weight ||
          targetVariant?.size ||
          targetVariant?.color ||
          targetVariant?.weight ||
          "",
        variantAttributes: {
          ...targetVariant,
          size:
            targetVariant?.attributes?.size !== undefined
              ? targetVariant.attributes.size
              : targetVariant?.size,
          color:
            targetVariant?.attributes?.color !== undefined
              ? targetVariant.attributes.color
              : targetVariant?.color,
          weight:
            targetVariant?.attributes?.weight !== undefined
              ? targetVariant.attributes.weight
              : targetVariant?.weight,
        },
        price: targetVariant ? targetVariant.price : targetProduct.pPrice,
      };

      const response = await cartApi.addToCart(cartData);

      if (response.success) {
        // Update cart items state
        if (response.cart?.items) {
          setCartItems(response.cart.items);
        }

        // Visible in-page success message (in addition to snackbar)
        setCartSuccessMessage("Product added to cart successfully");
        setCartSuccessOpen(true);
        setShowCelebration(true);

        if (cartSuccessTimerRef.current) {
          clearTimeout(cartSuccessTimerRef.current);
        }
        cartSuccessTimerRef.current = setTimeout(() => {
          setCartSuccessOpen(false);
          setShowCelebration(false);
        }, 2600);

        enqueueSnackbar("Product added to cart successfully", {
          variant: "success",
        });

        // Update cart count in header
        if (response.cart?.items) {
          const totalItems = response.cart.items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          window.dispatchEvent(
            new CustomEvent("cartUpdated", {
              detail: { count: totalItems },
            })
          );
        }
      }
      return true;
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error.message === "Unauthorized access. Please login.") {
        enqueueSnackbar("Please login to add items to cart", {
          variant: "warning",
        });
        window.dispatchEvent(new Event("openLogin"));
      } else {
        enqueueSnackbar(error.message || "Failed to add product to cart", {
          variant: "error",
        });
      }
      return false;
    } finally {
      setAddingToCart(false);
      // Dispatch cart update event for Navbar
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    }
  };

  const handleBuyNow = async () => {
    try {
      // First try to add to cart and wait for it
      const success = await addToCart({ preventDefault: () => { } });
      if (!success) return; 

      // Build the cart item in the exact shape CheckoutPage expects
      const currentPrice = selectedVariant ? selectedVariant.price : product.pPrice;
      const previousPrice = selectedVariant ? (selectedVariant.previousPrice || 0) : (product.pPreviousPrice || 0);
      const offer = selectedVariant ? (selectedVariant.offer || 0) : (product.pOffer || 0);
      const stock = selectedVariant ? (selectedVariant.stock || 0) : (product.pStock || 0);

      // Determine variant type and value
      let variantType = "";
      let variantValue = "";
      if (selectedVariant) {
        if (selectedVariant.attributes?.size || selectedVariant.size) {
          variantType = "size";
          variantValue = selectedVariant.attributes?.size || selectedVariant.size;
        } else if (selectedVariant.attributes?.color || selectedVariant.color) {
          variantType = "color";
          variantValue = selectedVariant.attributes?.color || selectedVariant.color;
        } else if (selectedVariant.attributes?.weight || selectedVariant.weight) {
          variantType = "weight";
          variantValue = selectedVariant.attributes?.weight || selectedVariant.weight;
        }
      }

      const cartItem = {
        // Product object nested exactly as CheckoutPage expects
        product: {
          _id: product._id,
          pName: product.pName,
          pPrice: currentPrice,
          pPreviousPrice: previousPrice,
          pOffer: offer,
          pImage: product.pImage,
          pStock: stock,
          pBrand: product.pBrand || "",
          pQuantity: product.pQuantity,
          pDescription: product.pDescription,
          pType: product.pType || "product",
          freeshipping: product.freeshipping || false,
          pis_voucher_50: product.pis_voucher_50 || false,
          pis_voucher_100: product.pis_voucher_100 || false,
          // Include variants array so CheckoutPage can find variant details
          variants: selectedVariant ? [{
            _id: selectedVariant._id,
            price: selectedVariant.price,
            previousPrice: selectedVariant.previousPrice || 0,
            offer: selectedVariant.offer || 0,
            stock: selectedVariant.stock || 0,
            attributes: selectedVariant.attributes || {},
          }] : [],
        },
        quantity,
        price: currentPrice,
        variantId: selectedVariant?._id || null,
        variantType: variantType,
        variantValue: variantValue,
      };

      // Navigate to checkout with properly structured data
      navigate("/CheckoutPage", {
        state: {
          cart: [cartItem],
          totalAmount: currentPrice * quantity,
          isFromCart: false,
        },
      });
    } catch (error) {
      // Error handling is done in addToCart
      console.error("Error in buy now:", error);
    }
  };
  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!userRating) {
      enqueueSnackbar("Please select a rating", { variant: "warning" });
      return;
    }

    if (!userReview.trim()) {
      enqueueSnackbar("Please write a review", { variant: "warning" });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await productApi.addReview(
        id,
        userRating,
        userReview.trim()
      );

      if (response.success) {
        enqueueSnackbar("Review submitted successfully", {
          variant: "success",
        });
        setUserRating(0);
        setUserReview("");
        await fetchReviews();
        await fetchAuthReviews(id);
      }
    } catch (error) {
      enqueueSnackbar(error.message || "Failed to submit review", {
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleStarClick = (selectedRating) => {
    setUserRating(selectedRating);
  };
  const fetchAuthReviews = async (id) => {
    try {
      const response = await productApi.getAuthReviews(id);
      if (response.success) {
        setcanreview(response.canreview);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      enqueueSnackbar(error.message || "Failed to fetch reviews", {
        variant: "error",
      });
    }
  };
  const fetchReviews = async () => {
    try {
      const response = await productApi.getReviews(id);
      if (response.success) {
        setReviews(response.reviews);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      enqueueSnackbar(error.message || "Failed to fetch reviews", {
        variant: "error",
      });
    }
  };
  const renderStars = (rating, isClickable = false) => {

    return (
      <Rating
        value={Number(rating)}
        precision={0.5}
        readOnly={!isClickable}
        onChange={(event, newValue) => {
          if (isClickable) {
            handleStarClick(newValue);
          }
        }}
        size="medium"
        sx={{
          color: "#ffd700",
          "& .MuiRating-iconFilled": {
            color: "#ffd700",
          },
          "& .MuiRating-iconHover": {
            marginTop: "4px",
            color: "#ffd700",
          },
        }}
      />
    );
  };

  // Update the image URL construction
  const getImageUrl = (img) => {
    if (!img) return Nuts; // Return default image if no image provided

    // If it's a Cloudinary URL, remove any prefixes and return the clean URL
    if (img.includes("cloudinary.com")) {
      return img.split("/uploads/").pop();
    }

    // If it's already a full URL, return as is
    if (img.startsWith("http")) {
      return img;
    }

    // For local files, construct the full URL
    return `${import.meta.env.VITE_SERVER_URL}/uploads/${img}`;
  };

  const productImages = product?.pImage?.map((img, index) => ({
    id: index + 1,
    url: getImageUrl(img),
    alt: `${product.pName} view ${index + 1}`,
  })) || [
      {
        id: 1,
        url: Nuts,
        alt: "Default product image",
      },
    ];

  const handleThumbnailClick = (index) => {
    setSelectedImage(index);
  };

  const handleScrollThumbnails = (direction) => {
    const container = document.querySelector(".thumbnail-scroll-container");
    if (container) {
      const scrollAmount = 200; // Adjust scroll amount as needed
      const currentScroll = container.scrollLeft;

      if (direction === "left") {
        container.scrollTo({
          left: currentScroll - scrollAmount,
          behavior: "smooth",
        });
      } else {
        container.scrollTo({
          left: currentScroll + scrollAmount,
          behavior: "smooth",
        });
      }
    }
  };

  const checkScrollPosition = () => {
    const container = document.querySelector(".thumbnail-scroll-container");
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const container = document.querySelector(".thumbnail-scroll-container");
    if (container) {
      container.addEventListener("scroll", checkScrollPosition);
      // Initial check
      checkScrollPosition();

      return () => {
        container.removeEventListener("scroll", checkScrollPosition);
      };
    }
  }, [productImages]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleScrollThumbnails("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleScrollThumbnails("right");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleQuantityChange = (type) => {
    if (type === "decrease" && quantity > 1) {
      setQuantity(quantity - 1);
    } else if (type === "increase" && selectedVariant?.stock > quantity) {
      setQuantity(quantity + 1);
    }
  };

  // Cleanup success banner timer on unmount
  useEffect(() => {
    return () => {
      if (cartSuccessTimerRef.current) clearTimeout(cartSuccessTimerRef.current);
    };
  }, []);

  const isProductInCart = (productId, variantId = null) => {
    if (!cartItems || !Array.isArray(cartItems)) return false;

    return cartItems.some((item) => {
      if (!item || !item.product) return false;

      // If checking for a specific variant, match both product and variant
      if (variantId) {
        return item.product._id === productId &&
          item.variantId &&
          String(item.variantId) === String(variantId);
      }

      // Otherwise, just check if product is in cart (without variant)
      return item.product._id === productId && !item.variantId;
    });
  };

  useEffect(() => {
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

    fetchCartItems();
  }, []);

  // Add checkWishlistStatus function
  const checkWishlistStatus = async () => {
    try {
      const response = await getWishlist();
      if (response.success) {
        const isProductInWishlist = response.products.some(
          (item) => item._id === id
        );
        setIsInWishlist(isProductInWishlist);
      }
    } catch (error) {
      console.error("Error checking wishlist status:", error);
    }
  };

  // Add useEffect for wishlist status
  useEffect(() => {
    if (id) {
      checkWishlistStatus();
    }
  }, [id]);

  // Add handleWishlist function
  const handleWishlist = async () => {
    try {
      setLoadingWishlist(true);
      if (isInWishlist) {
        const response = await removeFromWishlist(id);
        if (response.success) {
          setIsInWishlist(false);
          enqueueSnackbar("Removed from wishlist", { variant: "success" });
          window.dispatchEvent(new CustomEvent("wishlistUpdated"));
        }
      } else {
        const response = await addToWishlist(id);
        if (response.success) {
          setIsInWishlist(true);
          enqueueSnackbar("Added to wishlist", { variant: "success" });
          window.dispatchEvent(new CustomEvent("wishlistUpdated"));
        }
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      if (error.message === "Unauthorized access. Please login.") {
        enqueueSnackbar("Please login to manage wishlist", {
          variant: "warning",
        });
        window.dispatchEvent(new Event("openLogin"));
      } else {
        enqueueSnackbar(error.message || "Failed to update wishlist", {
          variant: "error",
        });
      }
    } finally {
      setLoadingWishlist(false);
    }
  };

  const handleViewMore = () => {
    setVisibleReviews((prev) => prev + reviewsPerPage);
  };

  const getAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / reviews.length).toFixed(1);
  };

  const truncateDescription = (text, maxLength = 200) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getDescriptionText = () => {
    if (!product?.pDescription) return "";
    return isDescriptionExpanded
      ? product.pDescription
      : truncateDescription(product.pDescription);
  };
  if (loading) {
    return (
      <div className="loading-container">
        <ModernLoader
          showTiming={false}
          animationType="orbit"
          size={0.8}
          customMessage="Loading product details..."
          showProgress={true}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="error-container">
        <p>Product not found</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }


  return (
    <>
      {product && (
        <>
          <Helmet>
            {product.pCanonicalUrl && <link rel="canonical" href={product.pCanonicalUrl} />}
            {product.schemaMarkup && (
              <script type="application/ld+json">{JSON.stringify(JSON.parse(product.schemaMarkup))}</script>
            )}
          </Helmet>
          <Heading
            title={product.pMetaTitle || product.pName || "Product Detail"}
            description={product.pMetaDescription || product.pDescription?.substring(0, 160)}
            keywords={product.pMetaKeywords || `${product.pName}, ${product.pBrand}, ${product.pCategory}`}
            image={productImages[0]?.url}
          />
        </>
      )}

      <div className="ProductDetail-container">
        <div className="product-surgical-layout">
          {/* Left Column: Gallery */}
          <div className="gallery-column-surgical">
            <div className="gallery-main-row-surgical">
              {productImages && productImages.length > 1 && (
                <div className="thumbs-vertical-pillar">
                  {productImages.map((image, index) => (
                    <div
                      key={index}
                      className={`thumb-cell ${selectedImage === index ? "active" : ""}`}
                      onMouseEnter={() => setSelectedImage(index)}
                      onClick={() => handleImagepopup(selectedImage)}
                    >
                      <img src={transformImageUrl(image.url)} alt={image.alt} />
                    </div>
                  ))}
                </div>
              )}

              <div className={`main-stage-surgical ${(!productImages || productImages.length <= 1) ? 'single-image' : ''}`} onClick={() => handleImagepopup(selectedImage)}>
                <span className="aesthetic-zoom-label">Premium Focus</span>
                <img src={transformImageUrl(productImages[selectedImage]?.url)} alt={product?.pName} />
              </div>
            </div>
          </div>

          {/* Info Pillar (Moved Up for Mobile Hierarchy) */}
          <div className="info-pillar-surgical">
            {product?.pBrand && (
              <div className="brand-micro-tag">{product.pBrand}</div>
            )}

            <h1 className="hero-title-surgical">{product?.pName}</h1>

            {(() => {
              const weight = selectedVariant?.attributes?.weight || selectedVariant?.weight || product?.pQuantity;
              const size = selectedVariant?.attributes?.size || selectedVariant?.size || product?.pSize;
              const unitValue = weight || size;
              const label = (selectedVariant?.attributes?.weight || selectedVariant?.weight || product?.pQuantity) ? "Weight" : "Size";

              if (unitValue) {
                return (
                  <div className="product-unit-badge">
                    <Scale size={14} className="unit-icon" />
                    <span className="unit-label">{label}:</span>
                    <span className="unit-text">{unitValue}</span>
                  </div>
                );
              }
              return null;
            })()}

            <div className="rating-summary">
              {renderStars(getAverageRating())}
              <span className="reviews-count">({reviews.length} Verified Reviews)</span>
            </div>

            <div className="pricing-island-surgical">
              <div className="price-row-main">
                <span className="surgical-now">₹{(selectedVariant ? selectedVariant.price : product.pPrice) * quantity}</span>
                {(selectedVariant?.previousPrice || product.pPreviousPrice) > (selectedVariant?.price || product.pPrice) && (
                  <>
                    <span className="surgical-was">₹{(selectedVariant ? selectedVariant.previousPrice : product.pPreviousPrice) * quantity}</span>
                    <div className="surgical-save">
                      {selectedVariant ? selectedVariant.offer : product.pOffer}% OFF
                    </div>
                  </>
                )}
              </div>

              {/* Delivery Info Badge */}
              <div className="delivery-info-tag">
                <Truck size={14} />
                {product.freeshipping ? (
                  <span className="free-tag">Free Shipping</span>
                ) : (
                  <span className="standard-tag">Free delivery on orders above ₹500</span>
                )}
              </div>
            </div>

            <div className="stock-status-surgical">
              {Number(selectedVariant ? selectedVariant.stock : product.pStock) > 0 ? (
                <div className={`stock-badge in-stock ${Number(selectedVariant ? selectedVariant.stock : product.pStock) <= 5 ? "low-stock" : ""}`}>
                  <Check size={14} />
                  <span>
                    {Number(selectedVariant ? selectedVariant.stock : product.pStock) <= 5
                      ? `Only ${selectedVariant ? selectedVariant.stock : product.pStock} units left!`
                      : "In Stock - Ready to Ship"}
                  </span>
                </div>
              ) : (
                <div className="stock-badge surgical-out-of-stock">
                  <X size={14} />
                  <span>Out of Stock</span>
                </div>
              )}
            </div>

            {/* Unified Color Selection - Only show when product has actual color variants */}
            {(() => {
              // Collect colors from variants and grouped data
              const variantColors = variants
                .map(v => v.attributes?.color || v.color)
                .filter(c => c && c !== 'null' && c !== 'undefined' && String(c).trim() !== '');
              const groupColors = (groupedProductData?.color || [])
                .filter(c => c && c !== 'null' && c !== 'undefined' && String(c).trim() !== '');
              const pColors = (product.pColors || [])
                .filter(c => c && c !== 'null' && c !== 'undefined' && String(c).trim() !== '');
              
              // Normalize and unique - only keep valid, meaningful color values
              const allColors = [...variantColors, ...groupColors, ...pColors];
              const rawUnique = [...new Set(allColors.map(c => String(c).trim().toLowerCase()))];
              const uniqueColors = rawUnique.map(c => {
                return allColors.find(oc => String(oc).toLowerCase() === c) || c;
              });

              // Only render if there are real, valid colors AND more than one option
              if (uniqueColors.length > 1) {
                return (
                  <div className="variant-section">
                    <div className="variant-header">
                      <span className="v-label">Select Color</span>
                      {selectedColor && (
                        <span className="v-selected">Selected: {selectedColor}</span>
                      )}
                    </div>
                    <div className="color-options-grid">
                      {uniqueColors.map((color, idx) => (
                        <div
                          key={idx}
                          className={`color-swatch-surgical ${selectedColor?.toLowerCase() === color.toLowerCase() ? 'active' : ''}`}
                          onClick={() => handleColorChange(color)}
                          style={{ backgroundColor: color.toLowerCase() }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Sizes / Options */}
            {variants.length > 0 && (
              <div className="variant-section">
                <div className="variant-header">
                  <span className="v-label">Select Size / Option</span>
                  {selectedVariant && (
                    <span className="v-selected">
                      {selectedVariant.attributes?.size || selectedVariant.attributes?.weight || selectedVariant.size || selectedVariant.weight || "Selected"}
                    </span>
                  )}
                </div>
                <div className="v-bubbles-row">
                  {variants
                    .filter(v => {
                      // Only filter by color if there are actual color variants
                      const hasColorVariants = variants.some(vr => {
                        const c = vr.attributes?.color || vr.color;
                        return c && c !== 'null' && c !== 'undefined' && String(c).trim() !== '';
                      });
                      if (!hasColorVariants || !selectedColor) return true;
                      const variantColor = v.attributes?.color || v.color;
                      return variantColor?.toLowerCase() === selectedColor?.toLowerCase();
                    })
                    .map((variant) => (
                      <div
                        key={variant._id}
                        className={`v-bubble ${selectedVariant?._id === variant._id ? "active" : ""} ${Number(variant.stock) <= 0 ? "surgical-out-of-stock" : ""}`}
                        onClick={() => {
                          if (Number(variant.stock) > 0) {
                            setSelectedVariant(variant);
                            setQuantity(variant.min || 1);
                          }
                        }}
                      >
                        <span className="v-name">
                          {variant.attributes?.size || variant.attributes?.weight || variant.size || variant.weight || "Option"}
                        </span>
                        <span className="v-price">₹{variant.price}</span>
                        <span className="v-stock">
                          {Number(variant.stock) <= 0 ? "Out of Stock" : `${variant.stock} in stock`}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {!isMobile && (
              <div className="action-console-surgical">
                <div className="action-row-upper">
                  <div className="surgical-stepper">
                    <button onClick={() => handleQuantityChange("decrease")} disabled={quantity <= 1}><Minus size={14} /></button>
                    <span className="qty-value">{quantity}</span>
                    <button onClick={() => handleQuantityChange("increase")} disabled={quantity >= (selectedVariant?.stock || product.pStock)}><Plus size={14} /></button>
                  </div>
                  <div className="action-buttons-group-surgical">
                    <div className={`wishlist-circle-btn ${isInWishlist ? "active" : ""}`} onClick={handleWishlist}>
                      <Heart size={20} fill={isInWishlist ? "#ef4444" : "none"} stroke={isInWishlist ? "#ef4444" : "currentColor"} />
                    </div>
                    <div className="share-circle-btn" onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: product?.pName,
                          text: product?.pDescription,
                          url: window.location.href,
                        }).catch(console.error);
                      } else {
                        enqueueSnackbar("Sharing not supported on this browser", { variant: "info" });
                      }
                    }}>
                      <Share2 size={20} />
                    </div>
                  </div>
                </div>

                <div className="action-row-lower">
                  <button
                    className={`atc-button-surgical ${addingToCart ? "atc-loading" : ""} ${(cartSuccessOpen || isProductInCart(product._id, selectedVariant?._id)) ? "added" : ""} ${(selectedVariant ? selectedVariant.stock : product.pStock) <= 0 ? "out-of-stock-btn" : ""}`}
                    onClick={(e) => {
                      if (isProductInCart(product._id, selectedVariant?._id)) {
                        navigate('/cart');
                      } else {
                        addToCart(e);
                      }
                    }}
                    disabled={addingToCart || ((selectedVariant ? selectedVariant.stock : product.pStock) <= 0 && !isProductInCart(product._id, selectedVariant?._id))}
                  >
                    <div className="btn-content-stabilizer">
                      {addingToCart ? (
                        <div className="sleek-spinner"></div>
                      ) : (
                        isProductInCart(product._id, selectedVariant?._id) ? "GO TO CART" : "ADD TO CART"
                      )}
                    </div>
                  </button>

                  <button
                    className="buy-now-button-surgical"
                    onClick={handleBuyNow}
                    disabled={addingToCart || (selectedVariant ? selectedVariant.stock : product.pStock) <= 0}
                  >
                    BUY NOW
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Relocated Sections (Moved Down for Mobile Hierarchy) */}
          <div className="left-side-redesign-surgical">

              {/* Trust Section */}
              <div className="premium-trust-row left-side-trust">
                {trustBadges.map((badge, idx) => (
                  <div key={idx} className="trust-badge-card">
                    <div className="badge-icon-wrap">{badge.icon}</div>
                    <div className="badge-content-surgical">
                      <div className="badge-primary-text">{badge.title}</div>
                      <div className="badge-secondary-text">{badge.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabs Section */}
              <div className="details-tabs left-side-tabs">
                <div className="tab-nav">
                  <span className={`tab-link ${activeTab === "description" ? "active" : ""}`} onClick={() => setActiveTab("description")}>Description</span>
                  <span className={`tab-link ${activeTab === "specs" ? "active" : ""}`} onClick={() => setActiveTab("specs")}>Details</span>
                  <span className={`tab-link ${activeTab === "reviews" ? "active" : ""}`} onClick={() => setActiveTab("reviews")}>Reviews</span>
                </div>

                <div className="tab-pane">
                  {activeTab === "description" && (
                    <div className="description-container">
                      <div className={`product-description-text ${!isDescriptionExpanded ? 'clamped' : ''}`}>
                        <p>{product.pDescription}</p>
                      </div>
                      {product.pDescription && product.pDescription.length > 200 && (
                        <button className="read-more-btn" onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                          {isDescriptionExpanded ? 'Read Less' : 'Read More'}
                        </button>
                      )}
                    </div>
                  )}

                  {activeTab === "specs" && (
                    <div className="specs-grid">
                      <div className="spec-item">
                        <span className="spec-label">Brand:</span>
                        <span className="spec-value">{product.pBrand || "Premium"}</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Category:</span>
                        <span className="spec-value">{product.pCategory?.cName || "General"}</span>
                      </div>
                    </div>
                  )}

                  {activeTab === "reviews" && (
                    <div className="reviews-mini-list">
                      <div className="list-header">
                        <h4>Feedback ({reviews.length})</h4>
                      </div>
                      {reviews.length > 0 ? (
                        reviews.slice(0, 3).map((r, i) => (
                          <div key={i} className="review-micro-item">
                            <div className="stars-align">{renderStars(r.rating)}</div>
                            <p className="review-text">{r.review}</p>
                          </div>
                        ))
                      ) : (
                        <p>No reviews yet.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>


        {/* Global Sections */}
        {relatedProducts.length > 0 && (
          <div className="related-section-wrapper">
            <ProductRecommendations
              products={relatedProducts}
              title="Frequently Bought Together"
              onAddToCart={addToCart}
            />
          </div>
        )}

        {isMobile && (
          <div className={`mobile-sticky-actions ${!showSticky ? 'hidden' : ''}`}>
            <div className={`mobile-action-pill-btn ${isInWishlist ? "active" : ""}`} onClick={handleWishlist}>
              <Heart size={20} fill={isInWishlist ? "#ef4444" : "none"} stroke={isInWishlist ? "#ef4444" : "currentColor"} />
            </div>
            <div className="mobile-action-pill-btn" onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: product?.pName,
                  text: product?.pDescription,
                  url: window.location.href,
                }).catch(console.error);
              }
            }}>
              <Share2 size={20} />
            </div>
            <button
              className={`atc-button-surgical ${addingToCart ? "atc-loading" : ""} ${(cartSuccessOpen || isProductInCart(product._id, selectedVariant?._id)) ? "added" : ""} ${(selectedVariant ? selectedVariant.stock : product.pStock) <= 0 ? "out-of-stock-btn" : ""}`}
              onClick={(e) => {
                if (isProductInCart(product._id, selectedVariant?._id)) {
                  navigate('/cart');
                } else {
                  addToCart(e);
                }
              }}
              disabled={addingToCart || ((selectedVariant ? selectedVariant.stock : product.pStock) <= 0 && !isProductInCart(product._id, selectedVariant?._id))}
            >
              {addingToCart ? <div className="sleek-spinner"></div> : (isProductInCart(product._id, selectedVariant?._id) ? "GO TO CART" : "ADD TO CART")}
            </button>
            <button
              className="buy-now-button-surgical"
              onClick={handleBuyNow}
              disabled={addingToCart || (selectedVariant ? selectedVariant.stock : product.pStock) <= 0}
            >
              BUY NOW
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductDetail;
