import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronRight, Filter } from "lucide-react";
import CartPage from "../CartPage/CartPage";
import ProductDetail from "./ProductDetail";
import "./ProductPage.css";
import Nuts from "../../assets/Nuts.jpg";
import honey from "../../assets/honey.jpg";
import {
  FaHeart,
  FaShoppingCart,
  FaStar,
  FaFilter,
  FaTimes,
} from "react-icons/fa";
import { productApi } from "../../APi/productApi";
import { cartApi } from "../../APi/cartApi";
import { useSnackbar } from "notistack";
import { transformImageUrl } from "../../APi/utils";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { categoryApi } from "../../APi/categoryApi";
import CategoryNav from "../Navbar/CategoryNav";
// import Footer from "../Footer/Footer"; // Removed to prevent duplication
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from "../../APi/userApi";

import Heading from "../Heading";
import ModernLoader from "../Loading/ModernLoader";
import ProductCard from "./ProductCard";

const BASE_URL = "https://www.picknow.in";

// Add Rating component
const Rating = ({ selectedRating, handleRatingSelect }) => {
  return (
    <div className="rating">
      {[5, 4, 3, 2, 1].map((rating) => (
        <React.Fragment key={rating}>
          <input
            type="radio"
            id={`star-${rating}`}
            name="star-radio"
            value={`star-${rating}`}
            checked={selectedRating === rating}
            onChange={() => handleRatingSelect(rating)}
          />
          <label htmlFor={`star-${rating}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                pathLength="360"
                d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"
              />
            </svg>
          </label>
        </React.Fragment>
      ))}
    </div>
  );
};

const ProductPage = () => {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState("listing");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ratingCounts, setRatingCounts] = useState({});
  const [wishlistItems, setWishlistItems] = useState([]);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  // Add state for selected variants
  const [selectedVariants, setSelectedVariants] = useState({});
  // Add pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 20;

  // Add sorting functionality
  const [sortOption, setSortOption] = useState("featured");

  const [pageLoading, setPageLoading] = useState(false);
  const [brandLoading, setBrandLoading] = useState(false);

  const handleSort = (option) => {
    setSortOption(option);
    let sortedProducts = [...products];
    console.log("Sub category products", sortedProducts);

    switch (option) {
      case "price-low":
        sortedProducts.sort((a, b) => a.pPrice - b.pPrice);
        break;
      case "price-high":
        sortedProducts.sort((a, b) => b.pPrice - a.pPrice);
        break;
      case "rating":
        sortedProducts.sort((a, b) => (b.pRating || 0) - (a.pRating || 0));
        break;
      default:
        // Featured sorting (by popularity/sold count)
        sortedProducts.sort((a, b) => (b.pSold || 0) - (a.pSold || 0));
    }

    setProducts(sortedProducts);
  };

  const fetchProducts = async () => {
    try {
      setPageLoading(true);
      setLoading(true);

      const searchParams = new URLSearchParams(location.search);
      const hasQueryParams = ['q', 'category', 'subcategory', 'categoryId', 'subcategoryId', 'brand', 'type'].some(param => searchParams.has(param));

      console.log("=========124====", location.state?.products);
      // Check if products were passed through navigation state
      if (location.state?.products) {
        console.log("Products from navigation state:", {
          count: location.state.products.length,
          products: location.state.products,
          title: location.state.title,
        });

        // Filter out products without variants or without active variants
        const filteredProducts = location.state.products.filter((product) => {
          if (!product.variants || product.variants.length === 0) return false;
          const activeVariants = product.variants.filter(
            (v) => v.status === "active" || v.status === "Active"
          );
          return activeVariants.length > 0;
        });

        setProducts(filteredProducts);
        setAllProducts(filteredProducts);
        setFilteredProducts(filteredProducts);

        // Extract unique categories
        const uniqueCategories = [
          ...new Set(filteredProducts.map((p) => p.pCategory)),
        ];
        setCategories(["all", ...uniqueCategories]);
      } else if (hasQueryParams) {
        // Skip fetching all products if we have query parameters, 
        // as handleQueryParams will fetch the filtered products.
        console.log("Skipping fetchProducts because query params are present");
        return;
      } else {
        console.log("Fetching products from API for page:", page);
        // If no products in state and no query params, fetch all products with pagination
        const response = await productApi.getAllProducts(page, productsPerPage);
        console.log("Get the products from productpage", response);

        if (!response.success) {
          throw new Error("Failed to fetch products from API");
        }

        console.log("Products from API:", {
          count: response.products?.length,
          products: response.products,
          total: response.total,
          totalPages: response.totalPages,
        });

        const productsData = response.products || [];
        // Filter out products without variants or without active variants
        const filteredProducts = productsData.filter((product) => {
          if (!product.variants || product.variants.length === 0) return false;
          const activeVariants = product.variants.filter(
            (v) => v.status === "active" || v.status === "Active"
          );
          return activeVariants.length > 0;
        });

        if (filteredProducts.length === 0) {
          console.log("No active products found after filtering");
          // If no products found, try fetching first page
          if (page !== 1) {
            console.log("Attempting to fetch first page");
            setPage(1);
            return;
          }
        }

        setProducts(filteredProducts);
        setAllProducts(filteredProducts);
        setFilteredProducts(filteredProducts);

        // Update pagination state with API response data
        setTotalPages(response.totalPages || 1);
        setHasNextPage(page < (response.totalPages || 1));
        setHasPrevPage(page > 1);
        setTotalProducts(response.total || 0);

        // Extract unique categories
        const uniqueCategories = [
          ...new Set(filteredProducts.map((p) => p.pCategory)),
        ];
        setCategories(["all", ...uniqueCategories]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to fetch products");
      enqueueSnackbar("Failed to fetch products", { variant: "error" });

      // If error occurs and we're not on page 1, try fetching first page
      if (page !== 1) {
        console.log("Error occurred, attempting to fetch first page");
        setPage(1);
      }
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  // Update the useEffect for initial load
  useEffect(() => {
    const initializeData = async () => {
      await fetchProducts();
      await fetchCartItems();
      await fetchWishlist();
    };

    initializeData();
  }, []); // Empty dependency array for initial load only

  // listen to brand filter loading events from Sidebar
  useEffect(() => {
    const handleBrandLoading = () => setBrandLoading(true);
    const handleBrandLoaded = () => setBrandLoading(false);
    const handleCloseSidebar = () => setIsFilterOpen(false);

    window.addEventListener('brandFilterLoading', handleBrandLoading);
    window.addEventListener('brandFilterLoaded', handleBrandLoaded);
    window.addEventListener('closeSidebar', handleCloseSidebar);

    return () => {
      window.removeEventListener('brandFilterLoading', handleBrandLoading);
      window.removeEventListener('brandFilterLoaded', handleBrandLoaded);
      window.removeEventListener('closeSidebar', handleCloseSidebar);
    };
  }, []);

  // Update the useEffect for page changes
  useEffect(() => {
    if (!location.state?.products) {
      fetchProducts();
    } else {
      console.log("=========236====");

      // For client-side pagination with state products
      const startIndex = (page - 1) * productsPerPage;
      const paginatedProducts = filteredProducts.slice(
        startIndex,
        startIndex + productsPerPage
      );
      setProducts(paginatedProducts);
    }
  }, [page]); // Refetch when page changes

  // Second useEffect to handle location state changes
  useEffect(() => {
    if (location.state?.products) {
      console.log("Location state products:", {
        count: location.state.products.length,
        products: location.state.products,
        title: location.state.title,
      });

      // Filter out products without variants or without active variants
      const filteredProducts = location.state.products.filter((product) => {
        // Check if product has variants
        if (!product.variants || product.variants.length === 0) {
          return false;
        }
        // Check if product has active variants
        const activeVariants = product.variants.filter(
          (v) => v.status === "active" || v.status === "Active"
        );
        return activeVariants.length > 0;
      });

      // Update all products and current products
      setAllProducts(filteredProducts);
      setProducts(filteredProducts);
      setFilteredProducts(filteredProducts);

      // If navigation came from brand filter, preserve applied brands
      if (location.state?.fromBrandFilter) {
        const applied = Array.isArray(location.state?.appliedBrands)
          ? location.state.appliedBrands
          : [];
        setSelectedBrands(applied);
      } else {
        // Reset filters when new category products are loaded
        setSelectedCategory("all");
        setSelectedBrands([]);
        setPriceRange([0, 100000]);
        setSelectedRating(null);
      }

      // Update pagination state
      const totalFiltered = filteredProducts.length;
      const totalPages = Math.ceil(totalFiltered / productsPerPage);
      setTotalPages(totalPages);
      setHasNextPage(1 < totalPages);
      setHasPrevPage(false);
      setTotalProducts(totalFiltered);
      setPage(1); // Reset to first page
    }
  }, [location.state]);

  // Add this to monitor products state changes
  useEffect(() => {
    console.log("Products state updated:", {
      count: products.length,
      products: products,
    });
  }, [products]);

  // Handle URL query parameters for filtering
  useEffect(() => {
    const handleQueryParams = async () => {
      const searchParams = new URLSearchParams(location.search);
      const query = searchParams.get('q');
      const category = searchParams.get('category');
      const subcategory = searchParams.get('subcategory');
      const categoryId = searchParams.get('categoryId');
      const subcategoryId = searchParams.get('subcategoryId');
      const brand = searchParams.get('brand');
      const type = searchParams.get('type');

      if (query || category || subcategory || categoryId || subcategoryId || brand || type) {
        try {
          setPageLoading(true);

          // Update page title based on query parameters
          if (query) {
            document.title = `Search Results for "${query}" - Picknow Shop`;
          } else if (subcategoryId) {
            // If we have subcategoryId, we'll fetch products for it
            const subcategoryName = searchParams.get('subcategoryName') || 'Products';
            document.title = `${subcategoryName} - Picknow Shop`;
          } else if (categoryId) {
            const categoryName = searchParams.get('categoryName') || 'Products';
            document.title = `${categoryName} - Picknow Shop`;
          } else if (category && subcategory) {
            document.title = `${subcategory} in ${category} - Picknow Shop`;
          } else if (category) {
            document.title = `${category} - Picknow Shop`;
          } else if (brand) {
            document.title = `Products by ${brand} - Picknow Shop`;
          } else if (type === 'combo') {
            document.title = `Combo Offers - Picknow Shop`;
          }

          // If we have query parameters, try to fetch products based on them
          if (query) {
            // Search for products by query term
            const response = await productApi.searchProducts(query);
            if (response.success && Array.isArray(response.products)) {
              const activeProducts = response.products.filter(
                (product) => product.pStatus === "active"
              );

              if (activeProducts.length > 0) {
                // Fetch variants for each active product
                const productsWithVariants = await Promise.all(
                  activeProducts.map(async (product) => {
                    try {
                      const variantResponse = await productApi.getProductVariants(
                        product._id
                      );
                      if (variantResponse.success && variantResponse.variants) {
                        const activeVariants = variantResponse.variants.filter(
                          (variant) => variant.status === "active"
                        );
                        return {
                          ...product,
                          variants: activeVariants,
                        };
                      }
                      return product;
                    } catch (error) {
                      console.error("Error fetching variants:", error);
                      return product;
                    }
                  })
                );

                setProducts(productsWithVariants);
                setAllProducts(productsWithVariants);
                setFilteredProducts(productsWithVariants);

                // Update pagination
                const totalFiltered = productsWithVariants.length;
                const totalPages = Math.ceil(totalFiltered / productsPerPage);
                setTotalPages(totalPages);
                setHasNextPage(1 < totalPages);
                setHasPrevPage(false);
                setTotalProducts(totalFiltered);
                setPage(1);
              } else {
                // No products found
                setProducts([]);
                setAllProducts([]);
                setFilteredProducts([]);
                setTotalProducts(0);
                setTotalPages(1);
                setHasNextPage(false);
                setHasPrevPage(false);
                setPage(1);
              }
            }
          } else if (subcategoryId || categoryId) {
            // Fetch products by subcategory or category ID
            let response;
            if (subcategoryId) {
              response = await productApi.getProductsBySubCategory(subcategoryId);
            } else {
              response = await productApi.getProductsByCategory(categoryId);
            }

            if (response.success && Array.isArray(response.products)) {
              // Filter out products without variants or without active variants
              const filteredProductsResult = response.products.filter((product) => {
                // pStatus check
                if (product.pStatus && product.pStatus.toLowerCase() !== "active") return false;
                return true;
              });

              if (filteredProductsResult.length > 0) {
                // Fetch variants for each product if they are not included or if we want to be sure
                const productsWithVariants = await Promise.all(
                  filteredProductsResult.map(async (product) => {
                    if (product.variants && product.variants.length > 0) return product;
                    try {
                      const variantResponse = await productApi.getProductVariants(product._id);
                      if (variantResponse.success && variantResponse.variants) {
                        const activeVariants = variantResponse.variants.filter(
                          (v) => v.status === "active" || v.status === "Active"
                        );
                        return { ...product, variants: activeVariants };
                      }
                      return { ...product, variants: [] };
                    } catch (error) {
                      console.error("Error fetching variants:", error);
                      return { ...product, variants: [] };
                    }
                  })
                );

                const finalProducts = productsWithVariants.filter(p => p.variants && p.variants.length > 0);

                setProducts(finalProducts);
                setAllProducts(finalProducts);
                setFilteredProducts(finalProducts);

                // Update pagination
                const totalFiltered = finalProducts.length;
                const totalPages = Math.ceil(totalFiltered / productsPerPage);
                setTotalPages(totalPages);
                setHasNextPage(1 < totalPages);
                setHasPrevPage(false);
                setTotalProducts(totalFiltered);
                setPage(1);
              } else {
                setProducts([]);
                setAllProducts([]);
                setFilteredProducts([]);
                setTotalProducts(0);
              }
            }
          } else if (brand) {
            // Fetch products by brand
            try {
              const response = await productApi.getProductByBrand(brand);
              if (response.success && Array.isArray(response.products)) {
                const activeProducts = response.products.filter(
                  (product) => product.pStatus === "active"
                );

                if (activeProducts.length > 0) {
                  // Fetch variants for each active product
                  const productsWithVariants = await Promise.all(
                    activeProducts.map(async (product) => {
                      try {
                        const variantResponse = await productApi.getProductVariants(
                          product._id
                        );
                        if (variantResponse.success && variantResponse.variants) {
                          const activeVariants = variantResponse.variants.filter(
                            (variant) => variant.status === "active"
                          );
                          return {
                            ...product,
                            variants: activeVariants,
                            pImage: product.pImage?.map(transformImageUrl) || [],
                          };
                        }
                        return {
                          ...product,
                          variants: [],
                          pImage: product.pImage?.map(transformImageUrl) || [],
                        };
                      } catch (variantError) {
                        console.error(
                          `Error fetching variants for product ${product._id}:`,
                          variantError
                        );
                        return {
                          ...product,
                          variants: [],
                          pImage: product.pImage?.map(transformImageUrl) || [],
                        };
                      }
                    })
                  );

                  setProducts(productsWithVariants);
                  setAllProducts(productsWithVariants);
                  setFilteredProducts(productsWithVariants);
                  setTotalProducts(productsWithVariants.length);
                  setTotalPages(1);
                  setHasNextPage(false);
                  setHasPrevPage(false);
                  setPage(1);
                } else {
                  setProducts([]);
                  setAllProducts([]);
                  setFilteredProducts([]);
                  setTotalProducts(0);
                  setTotalPages(1);
                  setHasNextPage(false);
                  setHasPrevPage(false);
                  setPage(1);
                }
              } else {
                setProducts([]);
                setAllProducts([]);
                setFilteredProducts([]);
                setTotalProducts(0);
                setTotalPages(1);
                setHasNextPage(false);
                setHasPrevPage(false);
                setPage(1);
              }
            } catch (brandError) {
              console.error("Error fetching products by brand:", brandError);
              setProducts([]);
              setAllProducts([]);
              setFilteredProducts([]);
              setTotalProducts(0);
              setTotalPages(1);
              setHasNextPage(false);
              setHasPrevPage(false);
              setPage(1);
            }
          } else if (type === 'combo') {
            try {
              const response = await productApi.getProductByType('combo');
              if (response.success && Array.isArray(response.products)) {
                setProducts(response.products);
                setAllProducts(response.products);
                setFilteredProducts(response.products);
                setTotalProducts(response.products.length);
                setPage(1);
              }
            } catch (comboErr) {
              console.error("Error fetching combos:", comboErr);
            }
          }
        } catch (error) {
          console.error("Error handling query parameters:", error);
          // Reset products on error
          setProducts([]);
          setAllProducts([]);
          setFilteredProducts([]);
          setTotalProducts(0);
          setTotalPages(1);
          setHasNextPage(false);
          setHasPrevPage(false);
          setPage(1);
        } finally {
          setPageLoading(false);
        }
      } else {
        // No query parameters, reset title
        document.title = "All Products - Picknow Shop";
      }
    };

    // Only run if we don't have products from location.state
    if (!location.state?.products) {
      handleQueryParams();
    }
  }, [location.search, location.state]);

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

  // Add fetchWishlist function
  const fetchWishlist = async () => {
    try {
      const response = await getWishlist();
      setWishlistItems(response.wishlist || []);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
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

  const addToCart = async (
    e,
    product,
    quantity = 1,
    selectedVariant = null
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if product with specific variant is already in cart
    const isInCart = isProductInCart(product._id, selectedVariant?._id);
    if (isInCart) {
      enqueueSnackbar("Product is already in cart", {
        variant: "info",
      });
      return;
    }

    // Check stock based on whether a variant is selected
    if (selectedVariant) {
      if (!selectedVariant.stock || selectedVariant.stock < quantity) {
        enqueueSnackbar("Not enough stock available for selected variant", {
          variant: "error",
        });
        return;
      }
    } else if (!product.pStock || product.pStock < quantity) {
      enqueueSnackbar("Not enough stock available", {
        variant: "error",
      });
      return;
    }

    try {
      setAddingToCart(true);

      // Extract variant type and value from attributes or fallback to direct properties
      let variantType = "";
      let variantValue = "";

      if (selectedVariant) {
        if (selectedVariant.attributes) {
          // New schema structure with attributes
          if (selectedVariant.attributes.size) {
            variantType = "size";
            variantValue = selectedVariant.attributes.size;
          } else if (selectedVariant.attributes.color) {
            variantType = "color";
            variantValue = selectedVariant.attributes.color;
          } else if (selectedVariant.attributes.weight) {
            variantType = "weight";
            variantValue = selectedVariant.attributes.weight;
          }
        } else {
          // Old schema structure - fallback
          variantType = selectedVariant.type || "";
          variantValue = selectedVariant.size || "";
        }
      }

      const cartData = {
        productId: product._id,
        quantity,
        variantId: selectedVariant?._id,
        variantType: variantType,
        variantValue: variantValue,
        price: selectedVariant ? selectedVariant.price : product.pPrice,
      };

      const response = await cartApi.addToCart(cartData);

      if (response.success) {
        // Update local cart items
        setCartItems(response.cart?.items || []);

        enqueueSnackbar("Product added to cart successfully", {
          variant: "success",
        });

        // Update cart count
        const totalItems =
          response.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ||
          0;

        window.dispatchEvent(
          new CustomEvent("cartUpdated", {
            detail: { count: totalItems },
          })
        );
      }
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
    } finally {
      setAddingToCart(false);
    }
  };

  const handleProductClick = (e, productId) => {
    // Prevent navigation if clicking on variant dropdown or its children
    if (
      e.target.closest(".variant-dropdown") ||
      e.target.closest(".variant-selector")
    ) {
      return;
    }
    navigate(`/product/${productId}`);
  };

  const handlePriceChange = (type, value) => {
    const newValue = parseInt(value) || 0;
    if (type === "min") {
      setPriceRange([Math.min(newValue, priceRange[1]), priceRange[1]]);
    } else {
      setPriceRange([priceRange[0], Math.max(newValue, priceRange[0])]);
    }
  };

  const handleRatingSelect = (rating) => {
    setSelectedRating(rating === selectedRating ? null : rating);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const navigateBack = () => {
    setCurrentPage("listing");
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
    // Toggle body scroll
    document.body.style.overflow = !isFilterOpen ? "hidden" : "auto";
  };

  const closeFilter = () => {
    setIsFilterOpen(false);
    document.body.style.overflow = "auto";
  };

  const resetFilters = async () => {
    try {
      // Reset all filter-related state variables
      setSelectedCategory("all");
      setSelectedBrands([]);
      setPriceRange([0, 100000]);
      setSelectedRating(null);
      setSortOption("featured");
      setPage(1);
      setCurrentPage("listing");

      // Reset pagination state
      setTotalPages(1);
      setHasNextPage(false);
      setHasPrevPage(false);
      setTotalProducts(0);

      // Reset filter UI state
      setIsFilterOpen(false);
      document.body.style.overflow = "auto";

      // Reset selected variants
      setSelectedVariants({});

      // Reset error state
      setError(null);

      // Clear URL query parameters
      navigate('/products', { replace: true });

      // Reset page title
      document.title = "All Products - Picknow Shop";

      // Fetch all products without filters
      const response = await productApi.getAllProducts();
      if (response.success) {
        // Update products state
        setAllProducts(response.products || []);
        setFilteredProducts(response.products || []);
        setProducts(response.products || []);

        // Recalculate rating counts for the unfiltered products
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        (response.products || []).forEach((product) => {
          product.pRatingsReviews?.forEach((review) => {
            const rating = Math.floor(Number(review.rating));
            if (rating >= 1 && rating <= 5) {
              counts[rating]++;
            }
          });
        });
        setRatingCounts(counts);

        // Show success message
        enqueueSnackbar("All filters have been reset successfully", { variant: "success" });
      } else {
        console.error("Failed to fetch products for reset");
        enqueueSnackbar("Failed to reset filters. Please try again.", { variant: "error" });
      }
    } catch (error) {
      console.error("Error in resetFilters:", error);
      enqueueSnackbar("Error resetting filters. Please try again.", { variant: "error" });
    }
  };

  useEffect(() => {
    window.addEventListener("resetProductsPage", resetFilters);
    return () => window.removeEventListener("resetProductsPage", resetFilters);
  }, [resetFilters]);

  // Update the getImageUrl function
  const getImageUrl = (imageUrl) => {
    // Handle null, undefined, or empty values
    if (!imageUrl) return "/placeholder.jpg";

    // If imageUrl is an array, take the first image
    const url = Array.isArray(imageUrl) ? imageUrl[0] : imageUrl;

    // Handle null, undefined, or empty values after array check
    if (!url) return "/placeholder.jpg";

    try {
      // If it's a Cloudinary URL
      if (typeof url === "string" && url.includes("cloudinary.com")) {
        // If it has incorrect prefix, remove it
        if (url.includes("/uploads/https://res.cloudinary.com")) {
          return url.split("/uploads/")[1];
        }
        return url;
      }

      // If it's already a full URL
      if (typeof url === "string" && url.startsWith("http")) {
        return url;
      }

      // For local files
      return `${import.meta.env.VITE_SERVER_URL}/uploads/${url}`;
    } catch (error) {
      console.error("Error processing image URL:", error);
      return "/placeholder.jpg";
    }
  };

  // Update the handleWishlist function
  const handleWishlist = async (productId, variantId, isAdding) => {
    if (addingToWishlist) return;

    try {
      setAddingToWishlist(true);

      // Check if user is logged in by attempting to get wishlist
      try {
        await getWishlist();
      } catch (error) {
        if (error.message === "Unauthorized access. Please login.") {
          enqueueSnackbar("Please login to manage wishlist", {
            variant: "warning",
          });
          window.dispatchEvent(new Event("openLogin"));
          return;
        }
      }

      if (isAdding) {
        const response = await addToWishlist(productId, variantId);
        if (response.success) {
          setWishlistItems((prev) => [...prev, { productId, variantId }]);
          enqueueSnackbar("Product added to wishlist", { variant: "success" });
        }
      } else {
        const response = await removeFromWishlist(productId, variantId);
        if (response.success) {
          setWishlistItems((prev) =>
            prev.filter(
              (item) =>
                !(item.productId === productId && item.variantId === variantId)
            )
          );
          enqueueSnackbar("Product removed from wishlist", {
            variant: "success",
          });
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
      setAddingToWishlist(false);
    }
  };

  // Update the handleVariantChange function
  const handleVariantChange = (productId, variantId) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: variantId,
    }));
  };

  // renderProductCard has been replaced by the unified ProductCard component.





  // Add filter handling functions
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);

    filterProducts(category, selectedBrands, priceRange, selectedRating);
  };

  const handleBrandChange = (brand, isChecked) => {
    const newBrands = isChecked
      ? [...selectedBrands, brand]
      : selectedBrands.filter((b) => b !== brand);
    setSelectedBrands(newBrands);
    filterProducts(selectedCategory, newBrands, priceRange, selectedRating);
  };

  const handlePriceRangeChange = (newRange) => {
    setPriceRange(newRange);
    filterProducts(selectedCategory, selectedBrands, newRange, selectedRating);
  };

  const handleRatingChange = (rating) => {
    setSelectedRating(rating);
    filterProducts(selectedCategory, selectedBrands, priceRange, rating);
  };

  // Helper function to deduplicate products by pName
  const deduplicateProductsByName = (arr) => {
    if (!Array.isArray(arr)) return [];
    const seen = new Set();
    return arr.filter((product) => {
      if (!product || !product.pName) return false;
      const name = String(product.pName).toLowerCase().trim();
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  };

  const filterProducts = (category, brands, price, rating) => {
    let filtered = [...allProducts];

    // Deduplicate products by pName first
    filtered = deduplicateProductsByName(filtered);

    // Only show active products
    filtered = filtered.filter((product) => product.pStatus === "Active");

    // Only show products with variants and at least one active variant
    filtered = filtered.filter((product) => {
      if (!product.variants || product.variants.length === 0) {
        return false;
      }
      const activeVariants = product.variants.filter(
        (v) => v.status === "active" || v.status === "Active"
      );
      return activeVariants.length > 0;
    });

    // Apply category filter - handle both exact matches and nested categories
    if (category !== "all") {
      filtered = filtered.filter((product) => {
        // Check if product category matches exactly or is a subcategory
        const productCategory = product.pCategory?.toLowerCase() || "";
        const selectedCategoryLower = category.toLowerCase();

        return (
          productCategory === selectedCategoryLower ||
          productCategory.startsWith(`${selectedCategoryLower}/`) ||
          productCategory.includes(`/${selectedCategoryLower}/`) ||
          productCategory.endsWith(`/${selectedCategoryLower}`)
        );
      });
    }

    // Apply brand filter
    if (brands.length > 0) {
      filtered = filtered.filter((product) => brands.includes(product.pBrand));
    }

    // Apply price filter - consider variant prices if available
    filtered = filtered.filter((product) => {
      const productPrice = product.pPrice;
      const variantPrices =
        product.variants
          ?.filter((v) => v.status === "active" || v.status === "Active")
          .map((v) => v.price) || [];

      const minPrice = Math.min(productPrice, ...variantPrices);
      const maxPrice = Math.max(productPrice, ...variantPrices);

      return minPrice >= price[0] && maxPrice <= price[1];
    });

    // Apply rating filter
    if (rating) {
      filtered = filtered.filter((product) => {
        const totalRatings = product.pRatingsReviews?.length || 0;
        const avgRating =
          totalRatings > 0
            ? product.pRatingsReviews.reduce(
              (sum, item) => sum + Number(item.rating),
              0
            ) / totalRatings
            : 0;
        return avgRating >= rating;
      });
    }

    // Update pagination state
    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / productsPerPage);

    setTotalPages(totalPages);
    setHasNextPage(page < totalPages);
    setHasPrevPage(page > 1);
    setTotalProducts(totalFiltered);

    // Apply pagination
    const startIndex = (page - 1) * productsPerPage;
    const paginatedProducts = filtered.slice(
      startIndex,
      startIndex + productsPerPage
    );

    setFilteredProducts(filtered);
    setProducts(paginatedProducts);
  };

  useEffect(() => {
    const calculateRatingCounts = () => {
      const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      allProducts.forEach((product) => {
        product.pRatingsReviews?.forEach((review) => {
          const rating = Math.floor(Number(review.rating));
          if (rating >= 1 && rating <= 5) {
            counts[rating]++;
          }
        });
      });
      setRatingCounts(counts);
    };

    if (allProducts.length > 0) {
      calculateRatingCounts();
    }
  }, [allProducts]);

  // Add pagination controls component
  const PaginationControls = () => {
    const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });

        // If we're using server-side pagination, fetch new data
        if (!location.state?.products) {
          fetchProducts();
        } else {
          // If we're using client-side pagination, update the displayed products
          const startIndex = (newPage - 1) * productsPerPage;
          const paginatedProducts = filteredProducts.slice(
            startIndex,
            startIndex + productsPerPage
          );
          setProducts(paginatedProducts);
        }
      }
    };

    const handleKeyDown = (e, pageNum) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handlePageChange(pageNum);
      }
    };

    // Calculate visible page numbers
    const getVisiblePages = () => {
      const delta = 2; // Number of pages to show on each side of current page
      const range = [];
      const rangeWithDots = [];
      let l;

      // Handle edge case when there's only one page
      if (totalPages <= 1) return [1];

      range.push(1);
      for (let i = page - delta; i <= page + delta; i++) {
        if (i > 1 && i < totalPages) {
          range.push(i);
        }
      }
      if (totalPages > 1) {
        range.push(totalPages);
      }

      // Remove duplicates
      const uniqueRange = [...new Set(range)].sort((a, b) => a - b);

      for (let i of uniqueRange) {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1);
          } else if (i - l !== 1) {
            rangeWithDots.push("...");
          }
        }
        rangeWithDots.push(i);
        l = i;
      }

      return rangeWithDots;
    };

    // Don't render pagination if there's only one page or no products
    if (totalPages <= 1 || products.length === 0) return null;

    return (
      <div className="pagination-controls">
        <button
          onClick={() => handlePageChange(1)}
          disabled={page === 1}
          className={`pagination-button first-page ${page === 1 ? "disabled" : ""
            }`}
          aria-label="First page"
          title="First page"
        >
          ⟪
        </button>
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={!hasPrevPage}
          className={`pagination-button prev-page ${!hasPrevPage ? "disabled" : ""
            }`}
          aria-label="Previous page"
          title="Previous page"
        >
          ⟨
        </button>

        <div className="pagination-numbers">
          {getVisiblePages().map((pageNum, index) =>
            pageNum === "..." ? (
              <span key={`dots-${index}`} className="pagination-dots">
                ...
              </span>
            ) : (
              <button
                key={`page-${pageNum}`}
                onClick={() => handlePageChange(pageNum)}
                onKeyDown={(e) => handleKeyDown(e, pageNum)}
                className={`pagination-number ${pageNum === page ? "active" : ""
                  }`}
                aria-label={`Page ${pageNum}`}
                aria-current={pageNum === page ? "page" : undefined}
              >
                {pageNum}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={!hasNextPage}
          className={`pagination-button next-page ${!hasNextPage ? "disabled" : ""
            }`}
          aria-label="Next page"
          title="Next page"
        >
          ⟩
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={page === totalPages || totalPages === 0}
          className={`pagination-button last-page ${page === totalPages ? "disabled" : ""
            }`}
          aria-label="Last page"
          title="Last page"
        >
          ⟫
        </button>
      </div>
    );
  };

  if (currentPage === "cart") {
    return (
      <CartPage
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        navigateBack={navigateBack}
      />
    );
  }

  // Generate canonical URL based on current location and query parameters
  const getCanonicalUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const brand = searchParams.get('brand');

    if (query) {
      return `${BASE_URL}/products?q=${encodeURIComponent(query)}`;
    }
    if (category && subcategory) {
      return `${BASE_URL}/products?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`;
    }
    if (category) {
      return `${BASE_URL}/products?category=${encodeURIComponent(category)}`;
    }
    if (brand) {
      return `${BASE_URL}/products?brand=${encodeURIComponent(brand)}`;
    }

    return `${BASE_URL}/products`;
  };

  return (
    <>
      <Heading
        title="PickNow | Organic Products Online – Dry Fruits | Spices & Snacks"
        description="Browse a wide range of organic dry fruits, natural spices, millet mixes, herbal items, and healthy snacks at PickNow. Chemical-free, nutrient-rich products."
        keywords="organic products online India, herbs and spices organic, healthy snacks India, millet products, organic groceries, PickNow catalog"
        url={getCanonicalUrl()}
        canonical={getCanonicalUrl()}
      />
      <div className="best-selling">
        {/* Background Animation */}
        <div className="background-animation">
  
          <div className="floating-circle circle-1" />
          <div className="floating-circle circle-2" />
          <div className="floating-circle circle-3" />
        </div>

        <div className="product-layout">
          {/* Filter Overlay */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overlay open"
                onClick={closeFilter}
              />
            )}
          </AnimatePresence>

          {/* Sidebar Component */}
          <div className={`filter-sidebar ${isFilterOpen ? "open" : ""}`}>
            <Sidebar
              selectedCategory={selectedCategory}
              categories={categories}
              priceRange={priceRange}
              selectedRating={selectedRating}
              selectedBrands={selectedBrands}
              onCategoryChange={handleCategoryChange}
              onPriceChange={handlePriceRangeChange}
              onRatingSelect={handleRatingChange}
              onBrandChange={handleBrandChange}
              onResetFilters={resetFilters}
              ratingCounts={ratingCounts}
            />
          </div>

          {/* Products Container */}
          <div className="products-container">
            <div className="products-header">
              <div className="header-left-actions">
                <button className="mobile-toggle" onClick={toggleFilter}>
                  <FaFilter className="filter-icon" />
                  <span>Filters</span>
                </button>
                <span className="products-count">
                  {loading
                    ? "Loading..."
                    : `${products.length} products`}
                </span>
              </div>
              <div className="header-right-actions">
                {/* Sort dropdown could go here */}
              </div>
            </div>
            <div
              className={`products-grid ${pageLoading ? "loading" : ""}`}
              style={{
                marginLeft: 0,
                marginRight: 0,
                paddingLeft: 0,
                paddingRight: 0,
              }}
            >
              {pageLoading || brandLoading ? (
                <div className="loading-overlay">
                  <ModernLoader
                    showTiming={false}
                    animationType="wave"
                    size={0.6}
                    customMessage="Loading products..."
                    showProgress={false}
                  />
                </div>
              ) : products.length > 0 ? (
                products.map((product) => {
                  const isWishlisted = wishlistItems.some(
                    (item) => (item?._id || item?.productId || item?.product?._id) === product?._id
                  );
                  return (
                    <ProductCard 
                      key={product._id} 
                      product={product} 
                      isInitialWishlisted={isWishlisted} 
                    />
                  );
                })
              ) : (
                brandLoading ? (
                  <div className="loading-overlay">
                    <ModernLoader
                      showTiming={false}
                      animationType="pulse"
                      size={0.6}
                      customMessage="Loading products..."
                      showProgress={false}
                    />
                  </div>
                ) : (
                  <div className="empty-state">
                    <h3>No products found</h3>
                    <p>Try adjusting your filters or search criteria</p>
                  </div>
                )
              )}
            </div>
            <PaginationControls />
          </div>
        </div>
        {/* Footer removed to prevent duplication */}
      </div>
    </>
  );
};

export default ProductPage;
