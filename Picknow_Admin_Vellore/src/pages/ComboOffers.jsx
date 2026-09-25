import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Autocomplete,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import * as XLSX from 'xlsx';
import '../styles/ComboOffers.css';
import { comboApi } from '../api/comboApi';
import { productApi } from '../api/productApi';
import { variantApi } from '../api/variantApi';
import { useSnackbar } from 'notistack';
import usePermissions from '../hooks/usePermissions';
import { PERMISSIONS, ACTIONS } from '../constants/permissions';

const compressImage = (base64String, maxWidth = 800) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64String;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

const safeSetLocalStorage = (key, value) => {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage: ${error.message}`);
    return false;
  }
};

const ComboOffers = () => {
  const fileInputRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [comboOffers, setComboOffers] = useState(() => {
    try {
      const savedCombos = localStorage.getItem('comboOffers');
      return savedCombos ? JSON.parse(savedCombos) : [];
    } catch (error) {
      console.error('Error loading combo offers:', error);
      return [];
    }
  });
  const { canWrite, canDelete } = usePermissions();

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [editCombo, setEditCombo] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount: '',
    status: 'active',
    image: ''
  });
  const [errors, setErrors] = useState({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [comboToDelete, setComboToDelete] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const formatImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/120';

    // Handle array of images
    if (Array.isArray(imagePath) && imagePath.length > 0) {
      imagePath = imagePath[0];
    }

    // Handle relative paths
    if (typeof imagePath === 'string') {
      if (imagePath.startsWith('http')) {
        return imagePath;
      } else if (imagePath.startsWith('/')) {
        return `https://backmern.picknow.in${imagePath}`;
      } else {
        return `https://backmern.picknow.in/${imagePath}`;
      }
    }

    return 'https://via.placeholder.com/120';
  };

  const handleImageError = (e) => {
    console.log('Image failed to load:', e.target.src);
    e.target.src = 'https://via.placeholder.com/120';
    e.target.onerror = null; // Prevent infinite loop
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all products with pagination handling
        let allProducts = [];
        let currentPage = 1;
        let hasMoreProducts = true;
        const pageSize = 1000; // Fetch 100 products at a time

        while (hasMoreProducts) {
          const productsResponse = await productApi.getAllProducts(currentPage, pageSize);
          if (productsResponse.success && productsResponse.products) {
            allProducts = [...allProducts, ...productsResponse.products];
            // If we got less than pageSize products, we've reached the end
            hasMoreProducts = productsResponse.products.length === pageSize;
            currentPage++;
          } else {
            hasMoreProducts = false;
            console.error('Failed to fetch products:', productsResponse);
          }
        }

        console.log('Total products fetched:', allProducts.length);

        // Fetch variants for each product
        const productsWithVariants = await Promise.all(
          allProducts.map(async (product) => {
            try {
              const variantsResponse = await variantApi.getProductVariants(product._id);
              return {
                ...product,
                variants: variantsResponse.success ? variantsResponse.variants : []
              };
            } catch (error) {
              console.error(`Error fetching variants for product ${product._id}:`, error);
              return {
                ...product,
                variants: []
              };
            }
          })
        );

        // Sort products by name for better organization
        const sortedProducts = productsWithVariants.sort((a, b) =>
          (a.pName || '').localeCompare(b.pName || '')
        );

        setProducts(sortedProducts);
        console.log('Products with variants:', sortedProducts.length);

        // Create flattened options array with product-variant combinations
        const options = sortedProducts.flatMap(product => {
          // Ensure product has a valid price
          const basePrice = product.pPrice || 0;

          // Create base product option
          const baseOption = {
            ...product,
            selectedVariant: null,
            optionLabel: `${product.pName} - Base Price (₹${basePrice})`
          };

          // If product has variants, create options for each variant
          if (product.variants && product.variants.length > 0) {
            const variantOptions = product.variants.map(variant => ({
              ...product,
              selectedVariant: variant,
              optionLabel: `${product.pName} - ${variant.size} (₹${variant.price || 0})`
            }));
            return variantOptions;
          }

          // If no variants, return just the base option
          return [baseOption];
        });

        setProductOptions(options);
        console.log('Total product options:', options.length);

        // Fetch combos
        await fetchCombos();
      } catch (error) {
        console.error('Error fetching data:', error);
        enqueueSnackbar(error.message || 'Failed to fetch data', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [enqueueSnackbar]);

  const handleOpen = (combo = null) => {
    if (combo && !canWrite(PERMISSIONS.COMBO_OFFERS)) {
      enqueueSnackbar('You do not have permission to edit combo offers', { variant: 'error' });
      return;
    }

    if (combo) {
      setEditCombo(combo);
      setFormData({
        name: combo.ccName,
        description: combo.ccDescription,
        price: combo.ccPrice?.toString() || '',
        discount: combo.ccOffer?.toString() || '',
        status: combo.ccStatus,
        image: combo.ccImage?.[0] || ''
      });
      setPreviewImage(combo.ccImage || '');

      // Set selected products with their variants from the combo
      const productsWithVariants = combo.ccProducts.map(product => ({
        _id: product._id,
        pName: product.pName,
        pPrice: product.pPrice,
        pImage: product.pImage,
        variants: product.variant ? [product.variant] : [], // Only include the variant that's in the combo
        quantity: product.quantity || 1 // Add quantity
      }));

      setSelectedProducts(productsWithVariants);

      // Set selected variants from the combo
      const variantsFromCombo = combo.ccProducts.reduce((acc, product) => {
        if (product.variant) {
          acc[product._id] = [product.variant];
        }
        return acc;
      }, {});

      setSelectedVariants(variantsFromCombo);
      setSelectedQuantities(combo.ccProducts.reduce((acc, product) => {
        acc[product._id] = product.quantity || 1;
        return acc;
      }, {}));
    } else {
      setEditCombo(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        discount: '',
        status: 'active',
        image: ''
      });
      setPreviewImage('');
      setSelectedProducts([]);
      setSelectedVariants({});
      setSelectedQuantities({});
    }
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditCombo(null);
    setSelectedProducts([]);
    setSelectedVariants({});
    setSelectedQuantities({});
    setPreviewImage('');
    setFormData({
      name: '',
      description: '',
      price: '',
      discount: '',
      status: 'active',
      image: ''
    });
    setErrors({});
  };

  const handleProductSelect = (event, newValue) => {
    if (newValue) {
      if (!selectedProducts.find(p => p._id === newValue._id)) {
        // Store the product with its selected variant and default quantity
        const productData = {
          _id: newValue._id,
          pName: newValue.pName,
          pPrice: newValue.pPrice,
          pImage: newValue.pImage,
          variants: newValue.variants || [],
          selectedVariant: newValue.selectedVariant,
          quantity: selectedQuantities[newValue._id] || 1 // Use existing quantity or default to 1
        };

        setSelectedProducts([...selectedProducts, productData]);
        setSelectedVariants(prev => ({
          ...prev,
          [newValue._id]: newValue.selectedVariant ? [newValue.selectedVariant] : []
        }));
        setSelectedQuantities(prev => ({
          ...prev,
          [newValue._id]: productData.quantity
        }));
      }
    }
  };

  const handleVariantSelect = (productId, variant) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: [variant] // Only store one variant per product
    }));
  };

  const handleRemoveVariant = (productId, variantId) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: prev[productId].filter(v => v._id !== variantId)
    }));
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p._id !== productId));
    setSelectedVariants(prev => {
      const newVariants = { ...prev };
      delete newVariants[productId];
      return newVariants;
    });
    setSelectedQuantities(prev => {
      const newQuantities = { ...prev };
      delete newQuantities[productId];
      return newQuantities;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (isNaN(formData.price) || parseFloat(formData.price) < 0) {
      newErrors.price = 'Price must be a positive number';
    }
    if (!formData.discount) {
      newErrors.discount = 'Discount is required';
    } else if (isNaN(formData.discount) || parseFloat(formData.discount) < 0 || parseFloat(formData.discount) > 100) {
      newErrors.discount = 'Discount must be between 0 and 100';
    }
    if (selectedProducts.length < 2) {
      newErrors.products = 'Select at least 2 products for combo';
    }

    const productsWithoutVariants = selectedProducts.filter(product => {
      const hasVariants = product.variants && product.variants.length > 0;
      return hasVariants && (!selectedVariants[product._id] || selectedVariants[product._id].length === 0);
    });

    if (productsWithoutVariants.length > 0) {
      newErrors.variants = 'Please select at least one variant for each product';
    }

    // Validate quantities
    const invalidQuantities = selectedProducts.filter(product => {
      const quantity = selectedQuantities[product._id] || 1;
      return quantity < 1 || !Number.isInteger(quantity);
    });

    if (invalidQuantities.length > 0) {
      newErrors.quantities = 'All quantities must be positive integers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        setErrors(prev => ({
          ...prev,
          image: 'Image size should be less than 5MB'
        }));
        return;
      }

      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const compressedImage = await compressImage(reader.result);
          setPreviewImage(compressedImage);
          setFormData(prev => ({
            ...prev,
            image: compressedImage
          }));
          setErrors(prev => ({ ...prev, image: undefined }));
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error processing image:', error);
        setErrors(prev => ({
          ...prev,
          image: 'Failed to process image. Please try again.'
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Prepare the combo data with proper null checks
      const comboData = {
        name: formData.name || '',
        description: formData.description || '',
        price: parseFloat(formData.price || 0),
        offer: parseFloat(formData.discount || 0),
        quantity: 1,
        status: formData.status || 'active',
        products: selectedProducts.map(p => {
          if (!p || !p._id) return null;

          return {
            product: p._id,
            variant: selectedVariants[p._id]?.[0] ? {
              _id: selectedVariants[p._id][0]._id,
              type: selectedVariants[p._id][0].type,
              size: selectedVariants[p._id][0].size,
              price: selectedVariants[p._id][0].price || 0
            } : null,
            quantity: selectedQuantities[p._id] || 1 // Include quantity
          };
        }).filter(Boolean), // Remove any null entries
        images: previewImage ? [previewImage] : []
      };

      console.log('Combo data being sent:', comboData);
      console.log('Selected quantities:', selectedQuantities);

      // Validate the data before sending
      if (!comboData.name || !comboData.description || !comboData.price || comboData.products.length === 0) {
        throw new Error('Please fill in all required fields and select at least one product');
      }

      let response;
      if (editCombo) {
        response = await comboApi.updateCombo(editCombo._id, {
          ccName: comboData.name,
          ccDescription: comboData.description,
          ccPrice: comboData.price,
          ccOffer: comboData.offer,
          ccQuantity: comboData.quantity,
          ccStatus: comboData.status,
          ccProducts: comboData.products,
          ccImage: comboData.images
        });
        if (response?.success) {
          await fetchCombos();
          handleClose();
          enqueueSnackbar('Combo updated successfully', { variant: 'success' });
        } else {
          throw new Error(response?.message || 'Failed to update combo');
        }
      } else {
        response = await comboApi.createCombo(comboData);
        if (response?.success) {
          await fetchCombos();
          handleClose();
          enqueueSnackbar('Combo created successfully', { variant: 'success' });
        } else {
          throw new Error(response?.message || 'Failed to create combo');
        }
      }
    } catch (error) {
      console.error('Error saving combo:', error);
      enqueueSnackbar(error.message || 'Failed to save combo', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (combo) => {
    if (!canDelete(PERMISSIONS.COMBO_OFFERS)) {
      enqueueSnackbar('You do not have permission to delete combo offers', { variant: 'error' });
      return;
    }
    setComboToDelete(combo);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (comboToDelete) {
      try {
        setLoading(true);
        const response = await comboApi.deleteCombo(comboToDelete._id);
        await fetchCombos();
        enqueueSnackbar(response.message || 'Combo deleted successfully', { variant: 'success' });
      } catch (error) {
        console.error('Error deleting combo:', error);
        enqueueSnackbar(error.message || 'Failed to delete combo', { variant: 'error' });
      } finally {
        setLoading(false);
        setDeleteConfirmOpen(false);
        setComboToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setComboToDelete(null);
  };

  const handleEditClick = (combo) => {
    if (!canWrite(PERMISSIONS.COMBO_OFFERS)) {
      enqueueSnackbar('You do not have permission to edit combo offers', { variant: 'error' });
      return;
    }
    handleOpen(combo);
  };

  const filteredComboOffers = comboOffers
    .filter(combo => {
      if (!searchQuery) return true; // Show all combos when no search query

      const searchLower = searchQuery.toLowerCase();
      return (
        (combo.ccName?.toLowerCase() || '').includes(searchLower) ||
        (combo.ccDescription?.toLowerCase() || '').includes(searchLower) ||
        (combo.ccProducts?.some(product =>
          (product.pName?.toLowerCase() || '').includes(searchLower) ||
          (product.variant?.size?.toLowerCase() || '').includes(searchLower)
        ))
      );
    });

  const fetchCombos = async () => {
    try {
      const response = await comboApi.getAllCombos();
      if (response) {
        // Sort combos by creation date (newest first)
        const sortedCombos = response.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setComboOffers(sortedCombos);
      }
    } catch (error) {
      console.error('Error fetching combos:', error);
      enqueueSnackbar(error.message || 'Failed to fetch combos', {
        variant: 'error'
      });
    }
  };

  const handleExportToExcel = () => {
    // Prepare the data for export
    const exportData = comboOffers.map(combo => ({
      'ID': combo._id,
      'Combo Name': combo.ccName,
      'Description': combo.ccDescription,
      'Price': combo.ccPrice,
      'Offer': combo.ccOffer + '%',
      'Products': combo.ccProducts?.map(p => `${p.pName} (Qty: ${p.quantity || 1})`).join(', '),
      'Status': combo.ccStatus,
      'Created At': new Date(combo.createdAt).toLocaleDateString()
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Combo Offers');

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `combo_offers_list_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
  };

  const renderProductCard = (product) => {
    return (
      <Paper
        key={product._id}
        elevation={2}
        sx={{
          p: 2,
          mt: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          border: errors.variants ? '1px solid #f44336' : 'none'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img
              src={formatImageUrl(product.pImage)}
              alt={product.pName}
              style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '4px' }}
              onError={handleImageError}
            />
            <Box>
              <Typography variant="subtitle1">{product.pName}</Typography>
              {/* <Typography variant="body2" color="textSecondary">
                ₹{product.pPrice}
              </Typography> */}
            </Box>
          </Box>
          <IconButton
            onClick={() => handleRemoveProduct(product._id)}
            color="error"
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>

        {product.variants && product.variants.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Select Variant:
            </Typography>
            <Box sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              p: 1,
              bgcolor: 'background.default',
              borderRadius: 1
            }}>
              {product.variants.map(variant => (
                <Chip
                  key={variant._id}
                  label={`${variant.size} - ₹${variant.price}`}
                  onClick={() => handleVariantSelect(product._id, variant)}
                  onDelete={selectedVariants[product._id]?.[0]?._id === variant._id
                    ? () => handleRemoveVariant(product._id, variant._id)
                    : undefined}
                  color={selectedVariants[product._id]?.[0]?._id === variant._id
                    ? 'primary'
                    : 'default'}
                  variant={selectedVariants[product._id]?.[0]?._id === variant._id
                    ? 'filled'
                    : 'outlined'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
            {errors.variants && (!selectedVariants[product._id] || selectedVariants[product._id].length === 0) && (
              <Typography
                color="error"
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 1,
                  fontWeight: 'bold'
                }}
              >
                Please select a variant for this product
              </Typography>
            )}
          </Box>
        )}

        <TextField
          fullWidth
          label="Quantity"
          type="number"
          min="1"
          value={selectedQuantities[product._id] || 1}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 1;
            const validValue = Math.max(1, value); // Ensure minimum value is 1
            console.log(`Setting quantity for product ${product._id}: ${validValue}`);
            setSelectedQuantities(prev => ({
              ...prev,
              [product._id]: validValue
            }));
          }}
          InputProps={{
            startAdornment: <InputAdornment position="start">Qty</InputAdornment>,
          }}
          size="small"
          sx={{ mt: 1 }}
          error={!!errors.quantities}
          helperText={errors.quantities}
        />
      </Paper>
    );
  };

  return (
    <Box className="combo-offers-container">
      <Box className="combo-offers-header">
        <Typography variant="h4">Combo Offers</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleExportToExcel}
            startIcon={<FileDownloadIcon />}
          >
            Export to Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Create Combo Offer
          </Button>
        </Box>
      </Box>

      <Box className="search-container">
        <TextField
          fullWidth
          placeholder="Search combo offers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width="80px">Image</TableCell>
              <TableCell>Combo Name</TableCell>
              <TableCell>Products</TableCell>
              <TableCell width="120px">Price</TableCell>
              <TableCell width="100px">Status</TableCell>
              <TableCell width="100px">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Loading combo offers...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredComboOffers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No combo offers found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredComboOffers.map((combo) => (
                <TableRow key={combo._id} hover>
                  <TableCell>
                    <Box sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '1px solid #eee'
                    }}>
                      <img
                        src={formatImageUrl(combo.ccImage)}
                        alt={combo.ccName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onError={handleImageError}
                        loading="lazy"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {combo.ccName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {combo.ccDescription?.length > 50 ? `${combo.ccDescription.substring(0, 50)}...` : combo.ccDescription}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      '&::-webkit-scrollbar': {
                        width: '4px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#f1f1f1',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#ddd',
                        borderRadius: '2px',
                      },
                    }}>
                      {combo.ccProducts?.map((product, index) => (
                        <Box
                          key={`${product._id}-${index}`}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            py: 0.5,
                            borderBottom: index < combo.ccProducts.length - 1 ? '1px solid #f0f0f0' : 'none'
                          }}
                        >
                          <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '4px',
                            overflow: 'hidden',
                            border: '1px solid #eee',
                            flexShrink: 0
                          }}>
                            <img
                              src={formatImageUrl(product.pImage)}
                              alt={product.pName}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                              onError={handleImageError}
                              loading="lazy"
                            />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="caption" sx={{
                              display: 'block',
                              fontWeight: 'medium',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {product.pName}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                              <Typography variant="caption" color="success.main" sx={{ fontWeight: 'medium' }}>
                                Qty: {product.quantity || 1}
                              </Typography>
                              {product.variant && (
                                <>
                                  <Typography variant="caption" color="text.secondary" sx={{ mx: 0.5 }}>•</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {product.variant.size}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ mx: 0.5 }}>•</Typography>
                                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 'medium' }}>
                                    ₹{product.variant.price || 0}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ mx: 0.5 }}>•</Typography>
                                  <Typography variant="caption" color={parseInt(product.variant.stock) > 0 ? 'success.main' : 'error.main'}>
                                    Stock: {product.variant.stock || 0}
                                  </Typography>
                                </>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        ₹{combo.ccPrice?.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="error.main">
                        -{combo.ccOffer}%
                      </Typography>
                      <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 'bold' }}>
                        ₹{((combo.ccPrice || 0) * (1 - (combo.ccOffer || 0) / 100)).toFixed(2)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={combo.ccStatus || 'inactive'}
                      color={combo.ccStatus === 'active' ? 'success' : 'error'}
                      size="small"
                      sx={{
                        height: '24px',
                        '& .MuiChip-label': {
                          px: 1,
                          fontSize: '0.75rem'
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit">
                        <IconButton
                          onClick={() => handleEditClick(combo)}
                          size="small"
                          color="primary"
                          disabled={!canWrite(PERMISSIONS.COMBO_OFFERS)}
                          sx={{ p: 0.5 }}
                        >
                          <EditIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => handleDeleteClick(combo)}
                          size="small"
                          color="error"
                          disabled={!canDelete(PERMISSIONS.COMBO_OFFERS)}
                          sx={{ p: 0.5 }}
                        >
                          <DeleteIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {loading ? <CircularProgress size={24} /> : (editCombo ? 'Edit Combo Offer' : 'Create Combo Offer')}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box
                  className="image-upload-container"
                  onClick={() => fileInputRef.current.click()}
                  sx={{
                    height: 200,
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backgroundImage: previewImage ? `url(${formatImageUrl(previewImage)})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!previewImage && (
                    <Box sx={{ textAlign: 'center' }}>
                      <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                      <Typography color="text.secondary">
                        Click to upload combo image
                      </Typography>
                    </Box>
                  )}
                </Box>
                {errors.image && (
                  <Typography color="error" variant="caption">
                    {errors.image}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Combo Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={!!errors.name}
                  helperText={errors.name}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  error={!!errors.description}
                  helperText={errors.description}
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  options={productOptions}
                  getOptionLabel={(option) => option.optionLabel || `${option.pName} - Base Price (₹0)`}
                  onChange={handleProductSelect}
                  value={null}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search and select products with variants"
                      variant="outlined"
                      error={!!errors.products || !!errors.variants}
                      helperText={errors.products || errors.variants}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <img
                          src={formatImageUrl(option.pImage)}
                          alt={option.pName}
                          style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '4px' }}
                          onError={handleImageError}
                        />
                        <Box>
                          <Typography variant="subtitle2">{option.pName}</Typography>
                          {option.selectedVariant ? (
                            <Typography variant="body2" color="text.secondary">
                              {option.selectedVariant.size} - ₹{option.selectedVariant.price || 0}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Base Price - ₹{option.pPrice || 0}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  )}
                  groupBy={(option) => option.pName}
                  filterOptions={(options, { inputValue }) => {
                    const searchTerm = inputValue.toLowerCase();
                    return options.filter(option =>
                      option.pName.toLowerCase().includes(searchTerm) ||
                      (option.selectedVariant?.size || '').toLowerCase().includes(searchTerm)
                    );
                  }}
                />
                {selectedProducts.map(product => renderProductCard(product))}
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Price (₹)"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  error={!!errors.price}
                  helperText={errors.price}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Discount (%)"
                  name="discount"
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  error={!!errors.discount}
                  helperText={errors.discount}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {editCombo ? 'Update Combo' : 'Create Combo'}
          </Button>
        </DialogActions>
      </Dialog>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />

      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" component="div">
            Confirm Delete
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography>
              Are you sure you want to delete the combo offer "{comboToDelete?.ccName}"?
            </Typography>
            {comboToDelete && (
              <Box sx={{ mt: 2, bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Combo Details:
                </Typography>
                <Typography variant="body2">
                  Products: {comboToDelete.ccProducts?.length || 0}
                </Typography>
                <Typography variant="body2">
                  Price: ₹{comboToDelete.ccPrice?.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  Discount: {comboToDelete.ccOffer}%
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCancelDelete}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComboOffers; 