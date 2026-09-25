import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  Button,
  Grid,
  Chip,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Heart,
  Star,
  Truck,
  Shield,
  RefreshCw,
  Check,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { useNavigate } from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const ProductRecommendations = ({
  products,
  loading,
  onAddToCart,
  onWishlist,
  title = "You Might Also Like",
  subtitle = "Handpicked organic products tailored for you"
}) => {
  const navigate = useNavigate();
  const [addedProducts, setAddedProducts] = useState(new Set());
  const [addingProduct, setAddingProduct] = useState(null);

  const getPricingData = (product) => {
    if (!product) return { price: 0, originalPrice: 0, offer: 0 };

    // Surgical sanitizer for price strings (handles "₹ 500", "500.00", etc.)
    const sanitize = (val) => {
      if (val === undefined || val === null || val === "") return 0;
      if (typeof val === 'number') return val;
      if (Array.isArray(val)) return sanitize(val[0]);
      if (typeof val === 'object') return sanitize(val.price || val.value || val.amount || 0);
      if (typeof val === 'string') {
        const cleaned = val.replace(/[^\d.]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    // Helper to extract a number from various property names
    const getVal = (props) => {
      for (const prop of props) {
        // Check top level
        const val = sanitize(product[prop]);
        if (val > 0) return val;

        // Check in sub-objects if they exist
        if (product.pricing && typeof product.pricing === 'object') {
          const pVal = sanitize(product.pricing[prop]);
          if (pVal > 0) return pVal;
        }
        if (product.price_info && typeof product.price_info === 'object') {
          const piVal = sanitize(product.price_info[prop]);
          if (piVal > 0) return piVal;
        }
      }
      return 0;
    };

    // 1. Try to find the current/selling price (extremely broad search)
    let price = getVal([
      "pPrice", "price", "pSellingPrice", "sellingPrice",
      "currentPrice", "discountedPrice", "salePrice",
      "pOfferPrice", "offerPrice", "price_curr"
    ]);

    // 2. Try to find the original/mrp price
    let originalPrice = getVal([
      "pPreviousPrice", "previousPrice", "pMrp", "mrp",
      "originalPrice", "basePrice", "pBasePrice", "price_mrp"
    ]);

    // 3. Last ditch: Scan ALL keys for anything numeric if still 0
    if (price === 0) {
      const keys = Object.keys(product);
      for (const key of keys) {
        if (key.toLowerCase().includes("price") || key.toLowerCase().includes("cost")) {
          const val = sanitize(product[key]);
          if (val > 0) {
            price = val;
            break;
          }
        }
      }
    }

    // 4. Try to find the offer/discount percentage
    let offer = sanitize(product.pOffer || product.offer || 0);

    // 5. Deep fallback to variants
    if (price === 0 && product.variants && product.variants.length > 0) {
      const v = product.variants[0];
      const getVVal = (props) => {
        for (const prop of props) {
          const val = sanitize(v[prop]);
          if (val > 0) return val;
        }
        const vKeys = Object.keys(v);
        for (const k of vKeys) {
          if (k.toLowerCase().includes("price")) {
            const val = sanitize(v[k]);
            if (val > 0) return val;
          }
        }
        return 0;
      };
      price = getVVal(["price", "pPrice", "sellingPrice", "salePrice"]);
      originalPrice = getVVal(["previousPrice", "pPreviousPrice", "originalPrice", "mrp", "pMrp", "basePrice"]);
      if (offer === 0) offer = sanitize(v.offer || 0);
    }

    // 6. Emergency fallback: sync prices if one is missing
    if (price === 0 && originalPrice > 0) price = originalPrice;
    if (originalPrice === 0 && price > 0) originalPrice = price;

    // 7. Calculate discount if missing but we have prices
    if ((offer === 0 || isNaN(offer)) && originalPrice > price && price > 0) {
      offer = Math.round(((originalPrice - price) / originalPrice) * 100);
    }

    return {
      price: price || 0,
      originalPrice: originalPrice || 0,
      offer: offer || 0
    };
  };

  // Calculate average rating from pRatingsReviews array
  const getProductRating = (product) => {
    if (!product) return 0;
    
    // First check if product has a direct pRating field
    if (product.pRating && Number(product.pRating) > 0) {
      return Number(product.pRating);
    }
    
    // Calculate from pRatingsReviews array
    const reviews = product.pRatingsReviews;
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) return 0;
    
    const totalRating = reviews.reduce((sum, review) => {
      return sum + (Number(review.rating) || 0);
    }, 0);
    
    return totalRating / reviews.length;
  };

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    if (addedProducts.has(product._id)) {
      // If already added, navigate to cart
      navigate('/cart');
      return;
    }
    
    setAddingProduct(product._id);
    try {
      if (onAddToCart) {
        await onAddToCart(e, product);
        // Mark as added
        setAddedProducts(prev => new Set([...prev, product._id]));
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setAddingProduct(null);
    }
  };

  const handleWishlist = (e, product) => {
    e.stopPropagation();
    if (onWishlist) onWishlist(e, product);
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4, textAlign: "center" }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
              px: 3,
              py: 2,
              background: "rgba(255, 94, 0, 0.05)",
              borderRadius: 4,
            }}
          >
            <RefreshCw size={20} className="refresh-spin-icon" style={{ color: "#ff5e00" }} />
            <Typography variant="h6" sx={{ color: "#4b5563", fontWeight: 600 }}>
              Discovering amazing products...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (!products || products.length === 0) {
    return false
  }

  return (
    <Box
      sx={{
        py: { xs: 3, md: 5 },
        position: "relative",
        background: "#fafbfc",
        borderRadius: { xs: 0, md: 4 },
        mx: 0,
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Section Header */}
      <Box sx={{ px: { xs: 2, md: 4 }, mb: { xs: 2, md: 3 } }}>
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 900,
            fontSize: { xs: "1.2rem", md: "1.6rem" },
            color: "#1f2937",
            letterSpacing: "-0.3px",
            mb: 0.5,
            lineHeight: 1.3,
          }}
        >
          {title.split(" ").map((word, index, arr) => {
            const isLastWord = index === arr.length - 1;
            return (
              <span key={index} style={isLastWord ? { color: "#ff5e00" } : {}}>
                {word}{index < arr.length - 1 ? " " : ""}
              </span>
            );
          })}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#9ca3af",
            fontSize: { xs: "0.8rem", md: "0.85rem" },
            fontWeight: 500,
          }}
        >
          {subtitle}
        </Typography>
      </Box>

      {/* Products Grid */}
      <Box sx={{ px: { xs: 2, md: 4 } }}>
        <Grid container spacing={2}>
          {products.map((product, index) => {
            const rating = getProductRating(product);
            const reviewCount = product.pRatingsReviews?.length || 0;
            const isAdded = addedProducts.has(product._id);
            const isAdding = addingProduct === product._id;

            return (
              <Grid
                item
                xs={6}
                sm={6}
                md={4}
                lg={3}
                key={product._id || index}
                sx={{ display: "flex" }}
              >
                <Card
                  sx={{
                    cursor: "pointer",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 2.5,
                    width: "100%",
                    overflow: "hidden",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    boxShadow: "none",
                    transition: "all 0.25s ease",
                    position: "relative",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 24px -8px rgba(0,0,0,0.1)",
                      borderColor: "#d1d5db",
                    },
                  }}
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  {/* Product Image */}
                  <Box
                    sx={{
                      position: "relative",
                      height: { xs: 140, sm: 180, md: 200 },
                      background: "#f9fafb",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={product.pImage?.[0] || "uploads/placeholder.jpg"}
                      alt={product.pName}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        p: 1.5,
                      }}
                      onError={(e) => {
                        e.target.src = "uploads/placeholder.jpg";
                      }}
                    />

                    {/* Discount Badge */}
                    {(() => {
                      const { offer } = getPricingData(product);
                      return offer > 0 ? (
                        <Chip
                          label={`${offer}% OFF`}
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            background: "linear-gradient(45deg, #ff5e00, #ff8c00)",
                            color: "white",
                            fontWeight: 700,
                            fontSize: "0.65rem",
                            height: 20,
                            borderRadius: 1,
                            boxShadow: "0 2px 6px rgba(255,94,0,0.3)",
                            zIndex: 1,
                          }}
                        />
                      ) : null;
                    })()}
                  </Box>

                  {/* Product Content */}
                  <CardContent
                    sx={{
                      p: { xs: 1.5, md: 2 },
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                      "&:last-child": { pb: { xs: 1.5, md: 2 } },
                    }}
                  >
                    {/* Product Name */}
                    <Typography
                      component="h3"
                      sx={{
                        fontSize: { xs: "0.8rem", md: "0.9rem" },
                        fontWeight: 700,
                        color: "#1f2937",
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        height: "2.8em",
                        mb: 0.75,
                      }}
                    >
                      {product.pName}
                    </Typography>

                    {/* Rating */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        mb: 1,
                      }}
                    >
                      <Box sx={{ display: "flex", gap: "2px" }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < Math.round(rating) ? "#fbbf24" : "none"}
                            stroke={i < Math.round(rating) ? "#fbbf24" : "#e5e7eb"}
                            strokeWidth={2}
                          />
                        ))}
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#9ca3af",
                          fontSize: "0.65rem",
                          fontWeight: 600,
                        }}
                      >
                        ({reviewCount})
                      </Typography>
                    </Box>

                    {/* Price Row - always at bottom */}
                    {(() => {
                      const { price, originalPrice, offer } = getPricingData(product);
                      return (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mt: "auto",
                            pt: 1,
                            borderTop: "1px solid #f1f5f9",
                          }}
                        >
                          <Box>
                            {offer > 0 && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#94a3b8",
                                  textDecoration: "line-through",
                                  fontWeight: 500,
                                  fontSize: "0.7rem",
                                  display: "block",
                                  lineHeight: 1,
                                }}
                              >
                                ₹{Math.round(originalPrice)}
                              </Typography>
                            )}
                            <Typography
                              sx={{
                                color: "#0f172a",
                                fontWeight: 900,
                                fontSize: { xs: "0.95rem", md: "1.05rem" },
                                lineHeight: 1.2,
                              }}
                            >
                              ₹{Math.round(price)}
                            </Typography>
                          </Box>

                          <IconButton
                            size="small"
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={isAdding}
                            sx={{
                              width: 32,
                              height: 32,
                              background: isAdded ? "#10b981" : "#0f172a",
                              color: "#ffffff",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                background: isAdded ? "#059669" : "#3b82f6",
                              },
                              "&:disabled": {
                                background: "#94a3b8",
                                color: "#ffffff",
                              },
                            }}
                          >
                            {isAdding ? (
                              <Box
                                sx={{
                                  width: 14,
                                  height: 14,
                                  border: "2px solid rgba(255,255,255,0.3)",
                                  borderTopColor: "#fff",
                                  borderRadius: "50%",
                                  animation: "spin 0.8s linear infinite",
                                  "@keyframes spin": {
                                    "0%": { transform: "rotate(0deg)" },
                                    "100%": { transform: "rotate(360deg)" },
                                  },
                                }}
                              />
                            ) : isAdded ? (
                              <Check size={15} />
                            ) : (
                              <ShoppingCart size={15} />
                            )}
                          </IconButton>
                        </Box>
                      );
                    })()}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
};

export default ProductRecommendations;
