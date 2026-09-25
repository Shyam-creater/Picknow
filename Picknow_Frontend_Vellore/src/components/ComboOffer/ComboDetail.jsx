import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ShoppingCart,
  Minus,
  Plus,
  Share2,
  Star,
  Package,
  Tag,
} from "lucide-react";
import "./ComboDetail.css";
import Nuts from "../../assets/Nuts.jpg";
import { getComboById } from "../../APi/comboApi";
import { cartApi } from "../../APi/cartApi";
import { useSnackbar } from "notistack";
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  IconButton,
  Chip,
  Card,
  CardContent,
  Stack,
  styled,
  CardMedia,
  Divider,
  Paper,
  Badge,
} from "@mui/material";
import {
  Share,
  LocalShipping,
  Security,
  Loop,
  FavoriteBorder,
} from "@mui/icons-material";
// import Footer from "../Footer/Footer"; // Removed to prevent duplication

// Styled components
const ComboImage = styled("img")(({ theme }) => ({
  width: "100%",
  height: "450px",
  objectFit: "cover",
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.18)",
    transform: "translateY(-2px)",
  },
  [theme.breakpoints.down("md")]: { height: "300px" },
  [theme.breakpoints.down("sm")]: { height: "250px" },
}));

const ProductCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  transition: "all 0.3s ease",
  borderRadius: "16px",
  overflow: "hidden",
  border: "1px solid #e8e8e8",
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.15)",
    borderColor: "#3498db",
  },
}));

const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: "24px",
  borderRadius: "16px",
  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
  border: "1px solid #e2e8f0",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 12px 32px rgba(0, 0, 0, 0.12)",
    borderColor: "#3498db",
  },
}));

const PriceDisplay = styled(Box)(({ theme }) => ({
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  borderRadius: "20px",
  padding: "16px 24px",
  color: "white",
  textAlign: "center",
  boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
}));

const ComboDetail = () => {
  const { id } = useParams();
  const [combo, setCombo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchCombo = async () => {
      try {
        setLoading(true);
        const comboData = await getComboById(id);
        if (comboData) {
          setCombo(comboData);
        } else {
          setError("Combo not found");
          enqueueSnackbar("Combo not found", { variant: "error" });
        }
      } catch (err) {
        console.error("Error fetching combo:", err);
        setError("Failed to load combo details");
        enqueueSnackbar(err.message || "Failed to load combo details", {
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCombo();
  }, [id, enqueueSnackbar]);

  const addToCart = async (e) => {
    e.preventDefault();
    if (!combo) return;

    try {
      setAddingToCart(true);
      const cartData = {
        productId: combo._id,
        quantity,
        variantId: `combo-${combo._id}`,
        variantType: "combo",
        variantValue: combo.ccName,
        price: combo.ccPrice,
        comboName: combo.ccName,
        comboImage: combo.ccImage,
      };

      const response = await cartApi.addToCart(cartData);

      if (response.success) {
        enqueueSnackbar("Combo added to cart successfully", {
          variant: "success",
        });
    window.location.reload();

        if (response.cart?.items) {
          const totalItems = response.cart.items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          window.dispatchEvent(
            new CustomEvent("cartUpdated", { detail: { count: totalItems } })
          );
        }
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error.message === "Unauthorized access. Please login.") {
        enqueueSnackbar("Please login to add items to cart", {
          variant: "warning",
        });
        window.dispatchEvent(new Event("openLogin"));
      } else {
        enqueueSnackbar(error.message || "Failed to add combo to cart", {
          variant: "error",
        });
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleQuantityChange = (type) => {
    if (type === "decrease" && quantity > 1) {
      setQuantity(quantity - 1);
    } else if (type === "increase" && combo?.ccQuantity > quantity) {
      setQuantity(quantity + 1);
    }
  };

  const isComboInCart = (comboId) => {
    if (!cartItems || !Array.isArray(cartItems)) return false;
    var filterd = cartItems.filter((e) => e.variantType == "combo");
    return filterd.some(
      (item) =>
        item.variantId.replace("combo-", "").toLowerCase() ===
          comboId.toLowerCase() && item.variantType === "combo"
    );
    
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

  const getImageUrl = (img) => {
    if (!img) return Nuts;
    if (img.includes("cloudinary.com")) return img.split("/uploads/").pop();
    if (img.startsWith("http")) return img;
    return `${import.meta.env.VITE_SERVER_URL}/uploads/${img}`;
  };

  const features = [
    {
      icon: <LocalShipping sx={{ fontSize: 32, color: "#3498db" }} />,
      title: "Free Shipping*",
      description: "On orders over ₹500",
      color: "#3498db",
    },
    {
      icon: <Security sx={{ fontSize: 32, color: "#27ae60" }} />,
      title: "Secure Payment",
      description: "100% secure payment",
      color: "#27ae60",
    },
    {
      icon: <Loop sx={{ fontSize: 32, color: "#f39c12" }} />,
      title: "Easy Returns",
      description: "7 day return policy",
      color: "#f39c12",
    },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading combo details...</p>
      </div>
    );
  }

  if (error || !combo) {
    return (
      <div className="error-container">
        <p>{error || "Combo not found"}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }} className="ComboDetail-container">
      {/* Header Section */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography
          variant="overline"
          sx={{
            color: "#3498db",
            fontWeight: 600,
            fontSize: "1rem",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          Special Combo Offer
        </Typography>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            background: "linear-gradient(135deg, #2c3e50 0%, #3498db 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 2,
            fontSize: { xs: "2rem", md: "3rem" },
          }}
        >
          {combo.ccName}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: "#7f8c8d",
            maxWidth: "600px",
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          {combo.ccDescription}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column - Combo Images */}
        <Grid item xs={12} md={6}>
          <Box sx={{ position: "relative" }}>
            <ComboImage src={getImageUrl(combo.ccImage)} alt={combo.ccName} />

            {/* Offer Badge */}
            {combo.ccOffer > 0 && (
              <Badge
                badgeContent={`${combo.ccOffer}% OFF`}
                sx={{
                  position: "absolute",
                  top: 20,
                  right: 40,
                  "& .MuiBadge-badge": {
                    background: "linear-gradient(45deg, #e74c3c, #c0392b)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    padding: "8px 12px",
                    borderRadius: "10px!important",
                  },
                }}
              />
            )}
          </Box>
        </Grid>

        {/* Right Column - Combo Info */}
        <Grid item xs={12} md={6}>
          <Stack spacing={4}>
            {/* Price Section */}
            <PriceDisplay>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                ₹{combo.ccPrice?.toLocaleString()}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Best Value Combo ({combo.ccProducts?.length} Products Included)
              </Typography>
            </PriceDisplay>

            {/* Quick Info Cards */}
            <Grid container spacing={1}>
              {/* <Grid item xs={6}>
                <FeatureCard>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Package sx={{ color: "#3498db", fontSize: 28 }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                        {combo.ccProducts?.length || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Products
                      </Typography>
                    </Box>
                  </Stack>
                </FeatureCard>
              </Grid> */}
              {/* <Grid item xs={6}>
                <FeatureCard>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Tag sx={{ color: "#e74c3c", fontSize: 28 }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                        {combo.ccQuantity || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        In Stock
                      </Typography>
                    </Box>
                  </Stack>
                </FeatureCard>
              </Grid> */}
            </Grid>

            {/* Quantity Selector */}
            {/* <Box sx={{ 
              p: 3, 
              borderRadius: "16px", 
              background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
              border: "1px solid #cbd5e0"
            }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "#2c3e50", mb: 2 }}>
                Select Quantity
              </Typography>
              <Stack direction="row" alignItems="center" spacing={3} justifyContent="center">
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => handleQuantityChange("decrease")}
                  disabled={quantity <= 1}
                  sx={{
                    borderColor: "#3498db",
                    color: "#3498db",
                    borderRadius: "12px",
                    minWidth: "48px",
                    height: "48px",
                    "&:hover": {
                      borderColor: "#2980b9",
                      backgroundColor: "rgba(52, 152, 219, 0.1)",
                    },
                    "&:disabled": {
                      borderColor: "#cbd5e0",
                      color: "#a0aec0",
                    },
                  }}
                >
                  <Minus size={20} />
                </Button>
                
                <Box sx={{ 
                  background: "white", 
                  px: 4, 
                  py: 2, 
                  borderRadius: "12px",
                  minWidth: "80px",
                  textAlign: "center",
                  border: "2px solid #3498db"
                }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#2c3e50" }}>
                    {quantity}
                  </Typography>
                </Box>
                
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => handleQuantityChange("increase")}
                  disabled={quantity >= (combo.ccQuantity || 1)}
                  sx={{
                    borderColor: "#3498db",
                    color: "#3498db",
                    borderRadius: "12px",
                    minWidth: "48px",
                    height: "48px",
                    "&:hover": {
                      borderColor: "#2980b9",
                      backgroundColor: "rgba(52, 152, 219, 0.1)",
                    },
                    "&:disabled": {
                      borderColor: "#cbd5e0",
                      color: "#a0aec0",
                    },
                  }}
                >
                  <Plus size={20} />
                </Button>
              </Stack>
              
              <Typography
                variant="body2"
                sx={{
                  color: combo.ccQuantity > 0 ? "#27ae60" : "#e74c3c",
                  fontWeight: 600,
                  textAlign: "center",
                  mt: 2,
                  p: 1,
                  borderRadius: "8px",
                  backgroundColor: combo.ccQuantity > 0 ? "rgba(39, 174, 96, 0.1)" : "rgba(231, 76, 60, 0.1)",
                }}
              >
                {combo.ccQuantity > 0
                  ? `✓ In Stock (${combo.ccQuantity} units available)`
                  : "✗ Out of Stock"}
              </Typography>
            </Box> */}

            {/* Action Buttons */}
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ShoppingCart size={24} />}
                onClick={addToCart}
                disabled={
                  addingToCart ||
                  !combo.ccQuantity ||
                  combo.ccQuantity === 0 ||
                  isComboInCart(combo._id)
                }
                sx={{
                  flex: 1,
                  background: "linear-gradient(135deg, #4CAF50, #45a049)",
                  color: "white",
                  borderRadius: "16px",
                  py: 2,
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "0 8px 24px rgba(76, 175, 80, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #45a049, #3d8b40)",
                    boxShadow: "0 12px 32px rgba(76, 175, 80, 0.4)",
                    transform: "translateY(-2px)",
                  },
                  "&:disabled": {
                    background: "#a0aec0",
                    boxShadow: "none",
                    transform: "none",
                  },
                }}
              >
                {addingToCart
                  ? "Adding to Cart..."
                  : isComboInCart(combo._id)
                  ? "✓ Added to Cart"
                  : "Add to Cart"}
              </Button>

              <IconButton
                sx={{
                  bgcolor: "rgba(52, 152, 219, 0.1)",
                  borderRadius: "16px",
                  width: "56px",
                  height: "56px",
                  "&:hover": {
                    bgcolor: "rgba(52, 152, 219, 0.2)",
                    transform: "scale(1.05)",
                  },
                }}
              >
                <Share sx={{ color: "#3498db", fontSize: 24 }} />
              </IconButton>

              <IconButton
                sx={{
                  bgcolor: "rgba(231, 76, 60, 0.1)",
                  borderRadius: "16px",
                  width: "56px",
                  height: "56px",
                  "&:hover": {
                    bgcolor: "rgba(231, 76, 60, 0.2)",
                    transform: "scale(1.05)",
                  },
                }}
              >
                <FavoriteBorder sx={{ color: "#e74c3c", fontSize: 24 }} />
              </IconButton>
            </Stack>

            {/* Features */}
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {features.map((feature, index) => (
                  <Grid item xs={12} sm={4} key={index}>
                    <FeatureCard>
                      <Stack direction="row" spacing={2} alignItems="center">
                        {feature.icon}
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, color: "#2c3e50" }}
                          >
                            {feature.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {feature.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </FeatureCard>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </Grid>
      </Grid>

      <Divider sx={{ my: 6, borderColor: "#e2e8f0", borderWidth: "2px" }} />

      {/* Combo Description and Products */}
      <Box sx={{ mt: 4 }}>
        {/* Description Section */}
        <Box sx={{ mb: 6, textAlign: "center" }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: "#2c3e50",
              mb: 3,
              background: "linear-gradient(135deg, #2c3e50 0%, #3498db 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            About This Combo
          </Typography>
          <Paper
            sx={{
              p: 4,
              borderRadius: "20px",
              background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              border: "1px solid #e2e8f0",
              maxWidth: "800px",
              margin: "0 auto",
            }}
          >
            <Typography
              component="div"
              sx={{
                fontSize: "1.1rem",
                lineHeight: 1.8,
                color: "#4a5568",
                textAlign: "left",
              }}
            >
              {combo.ccDescription?.split("\n").map((paragraph, index) => (
                <p key={index} style={{ marginBottom: "1rem" }}>
                  {paragraph}
                </p>
              ))}
            </Typography>
          </Paper>
        </Box>

        {/* Combo Products Section */}
        {combo.ccProducts && combo.ccProducts.length > 0 && (
          <Box>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: "#2c3e50",
                mb: 4,
                textAlign: "center",
                background: "linear-gradient(135deg, #2c3e50 0%, #3498db 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              What's Included in This Combo
            </Typography>

            <Grid container spacing={3}>
              {combo.ccProducts.map((comboProduct, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <ProductCard>
                    <Box sx={{ position: "relative" }}>
                      <CardMedia
                        component="img"
                        image={getImageUrl(comboProduct?.pImage)}
                        alt={comboProduct?.pName}
                        sx={{
                          height: 220,
                          objectFit: "cover",
                          background:
                            "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                        }}
                      />

                      {/* Quantity Badge */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          background: "rgba(52, 152, 219, 0.9)",
                          color: "white",
                          borderRadius: "20px",
                          px: 2,
                          py: 0.5,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                        }}
                      >
                        Qty: {comboProduct.quantity || 1}
                      </Box>
                    </Box>

                    <CardContent sx={{ p: 3, flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontWeight: 600,
                          color: "#2c3e50",
                          height: "3rem",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {comboProduct?.pName}
                      </Typography>

                      {comboProduct.variant && (
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            label={`${comboProduct.variant.type}: ${comboProduct.variant.size}`}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: "#3498db",
                              color: "#3498db",
                              fontWeight: 600,
                              borderRadius: "12px",
                            }}
                          />
                        </Box>
                      )}

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mt: "auto",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Star size={16} fill="#f39c12" color="#f39c12" />
                          <Star size={16} fill="#f39c12" color="#f39c12" />
                          <Star size={16} fill="#f39c12" color="#f39c12" />
                          <Star size={16} fill="#f39c12" color="#f39c12" />
                          <Star size={16} fill="#e2e8f0" color="#e2e8f0" />
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "0.8rem" }}
                        >
                          Premium Quality
                        </Typography>
                      </Box>
                    </CardContent>
                  </ProductCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>


      {/* Footer removed to prevent duplication */}
    </Container>
  );
};

export default ComboDetail;
