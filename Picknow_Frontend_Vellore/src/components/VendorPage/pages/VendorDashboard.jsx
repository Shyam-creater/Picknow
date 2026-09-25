import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/VendorDashboard.css';
import DashboardCard from '../DashboardCard';
import '../styles/DashboardCard.css';
import { FiLogOut, FiAlertCircle } from 'react-icons/fi';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Chip,
  InputAdornment,
  TablePagination,
  CircularProgress,
  Grid,
  FormHelperText,
  Stack,
  Tooltip,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useSnackbar } from 'notistack';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import vendorApi from '../../../api/vendorApi';
import {
  addProduct,
  updateProduct,
  deleteProduct,
  getProductsByVendorId,
  getAllCategories,
  getCategoryById,
  getSubCategories,
  getNestedSubCategories,
  getProductVariants,
  createProductVariants,
  updateProductVariant,
  deleteProductVariant
} from '../api/vendorProductApi';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { 
  TrendingUp, 
  Package, 
  Clock, 
  LayoutGrid, 
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ShoppingCart,
  Layers,
  ChevronRight,
  Menu
} from 'lucide-react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';

const VendorDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [vendorInfo, setVendorInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [nestedSubCategories, setNestedSubCategories] = useState([]);
  const imageInputRefs = [React.useRef(null), React.useRef(null), React.useRef(null), React.useRef(null), React.useRef(null)];
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    description: '',
    category: '',
    status: 'active',
    brand: '',
    images: [],
    imagesToDelete: [],
    pSubCategory: '',
    pNestedSubCategory: '',
    tax: '5',
    return: 'no',
    returnDays: ''
  });

  const [errors, setErrors] = useState({});

  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);
  const [variants, setVariants] = useState([]);
  const [variantLoading, setVariantLoading] = useState(false);
  const [addVariantLoading, setAddVariantLoading] = useState(false);
  const [deleteVariantLoading, setDeleteVariantLoading] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState(null);
  const [deleteVariantConfirmOpen, setDeleteVariantConfirmOpen] = useState(false);
  const [editVariantDialog, setEditVariantDialog] = useState(false);
  const [editVariantData, setEditVariantData] = useState(null);
  const [variantStockDialog, setVariantStockDialog] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [stockToAdd, setStockToAdd] = useState('');
  const [stockError, setStockError] = useState('');
  const [productVariantType, setProductVariantType] = useState('');
  const [variantErrors, setVariantErrors] = useState({});

  const [variantFormData, setVariantFormData] = useState({
    type: '',
    size: '',
    stock: '',
    totalStock: '',
    price: '',
    previousPrice: '',
    offer: '',
    status: 'active'
  });

  const typeOptions = {
    size: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'],
    color: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Pink', 'Orange', 'Brown', 'Grey', 'Navy'],
    weight: ['50g', '100g', '180g', '200g', '250g', '300g', '500g', '700g', '1kg', '2kg', '3kg', '4kg', '5kg', '10kg', '50ml', '100ml', '150ml', '200ml', '250ml', '300ml', '400ml', '700ml', '500ml'],
    length: ['Free Size']
  };

  // Image Preview Dialog State
  const [imagePreviewDialog, setImagePreviewDialog] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Delete Confirmation Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Block back button and check authentication
  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    const userType = localStorage.getItem('userType');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const vendorData = localStorage.getItem('currentVendor');

    // If not logged in as vendor, redirect to login
    if (!token || !isLoggedIn || userType !== 'vendor' || !vendorData) {
      navigate('/vendor/login');
      return;
    }

    // Parse vendor data
    const vendor = JSON.parse(vendorData);

    // Check vendor status and approval
    if (!vendor.isVerified || vendor.adminApproval.status !== 'approved' || vendor.status !== 'active') {
      localStorage.clear(); // Clear all auth data
      navigate('/vendor/login');
      enqueueSnackbar('Your account is not active or pending approval', {
        variant: 'error'
      });
      return;
    }

    // Block back button
    const preventBackButton = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.history.forward();
    };

    // Add event listeners to block back navigation
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', preventBackButton);

    // If trying to navigate away from dashboard (except to login), prevent it
    if (!location.pathname.includes('/vendor/dashboard') && !location.pathname.includes('/vendor/login')) {
      navigate('/vendor/dashboard');
    }

    // Cleanup event listener
    return () => {
      window.removeEventListener('popstate', preventBackButton);
    };
  }, [navigate, location, enqueueSnackbar]);

  // Get vendor info from localStorage on component mount
  useEffect(() => {
    const vendorData = localStorage.getItem('currentVendor');
    if (vendorData) {
      setVendorInfo(JSON.parse(vendorData));
    }
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await vendorApi.getDashboard();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch dashboard data');
        enqueueSnackbar('Failed to fetch dashboard data', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [enqueueSnackbar]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    // Clear all vendor-related data
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('vendorId');
    localStorage.removeItem('currentVendor');

    // Call the onLogout prop if provided
    if (onLogout) {
      onLogout();
    }

    // Redirect to vendor landing page
    navigate('/vendor');
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProductsByVendorId();
      if (response.success) {
        setProducts(response.products);
      } else {
        enqueueSnackbar(response.message || 'Failed to fetch products', {
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      enqueueSnackbar(error.message || 'Failed to fetch products', {
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch products when products tab is active
  useEffect(() => {
    if (activeTab === 'products') {
      const token = localStorage.getItem('vendorToken');
      const vendorData = localStorage.getItem('currentVendor');

      if (!token || !vendorData) {
        enqueueSnackbar('Please login again to continue', {
          variant: 'error'
        });
        navigate('/vendor/login');
        return;
      }

      fetchProducts();
    }
  }, [activeTab, navigate, enqueueSnackbar]);

  const handleOpen = (product = null) => {
    if (product) {
      console.log('Editing product:', product); // Debug log
      setEditProduct(product);
      const formDataToSet = {
        name: product.pName || '',
        shortDescription: product.pShortDescription || '',
        description: product.pDescription || '',
        category: product.pCategory || '',
        pSubCategory: product.pSubCategory || '',
        pNestedSubCategory: product.pNestedSubCategory || '',
        brand: product.pBrand || '',
        tax: product.pTax?.toString() || '5',
        status: product.pStatus || 'active',
        return: product.pReturn || 'no',
        returnDays: product.pReturnDays?.toString() || '',
        images: product.pImage || [],
        imagesToDelete: []
      };
      console.log('Setting form data:', formDataToSet); // Debug log
      setFormData(formDataToSet);
      setImagePreviews(product.pImage || []);

      // Fetch subcategories for the selected category
      if (product.pCategory) {
        const selectedCategory = categories.find(cat => cat.cName === product.pCategory);
        if (selectedCategory) {
          setSubCategories(selectedCategory.subCategories || []);
        }
      }

      // Fetch nested subcategories if subcategory exists
      if (product.pSubCategory) {
        const selectedCategory = categories.find(cat => cat.cName === product.pCategory);
        const selectedSubCategory = selectedCategory?.subCategories?.find(sub => sub.name === product.pSubCategory);
        if (selectedCategory && selectedSubCategory) {
          fetchNestedSubCategories(selectedCategory._id, selectedSubCategory._id);
        }
      }
    } else {
      setEditProduct(null);
      setFormData({
        name: '',
        shortDescription: '',
        description: '',
        category: '',
        pSubCategory: '',
        pNestedSubCategory: '',
        brand: '',
        tax: '5',
        status: 'active',
        return: 'no',
        returnDays: '',
        images: [],
        imagesToDelete: []
      });
      setImagePreviews([]);
    }
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditProduct(null);
    setFormData({
      name: '',
      shortDescription: '',
      description: '',
      category: '',
      pSubCategory: '',
      pNestedSubCategory: '',
      price: '',
      previousPrice: '',
      stock: '',
      offer: '0',
      tax: '5',
      status: 'active',
      brand: '',
      type: 'size',
      options: '',
      images: [],
      imagesToDelete: []
    });
    setImagePreviews([]);
    setErrors({});
  };

  const handleImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10000000) { // 10MB limit
        setErrors(prev => ({
          ...prev,
          images: 'Image size should be less than 10MB'
        }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressedImage = await compressImage(reader.result);

          // Store the old image filename if it exists
          const oldImage = formData.images[index];
          const isOldImageFromServer = oldImage &&
            (typeof oldImage === 'string' && !oldImage.startsWith('data:'));

          // Update image previews
          setImagePreviews(prev => {
            const newPreviews = [...prev];
            newPreviews[index] = compressedImage;
            return newPreviews;
          });

          // Update form data images and track deleted images
          setFormData(prev => {
            const newImages = [...prev.images];
            newImages[index] = compressedImage;

            // Track the old image for deletion if it exists
            const imagesToDelete = [...(prev.imagesToDelete || [])];
            if (isOldImageFromServer) {
              const filename = oldImage.startsWith('http') ?
                oldImage.split('/').pop() : oldImage;
              if (!imagesToDelete.includes(filename)) {
                imagesToDelete.push(filename);
              }
            }

            return {
              ...prev,
              images: newImages,
              imagesToDelete
            };
          });

          setErrors(prev => ({ ...prev, images: undefined }));
        } catch (error) {
          console.error('Error compressing image:', error);
          setErrors(prev => ({
            ...prev,
            images: 'Error processing image. Please try again.'
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = async (index) => {
    try {
      const imageToRemove = formData.images[index];

      if (editProduct && imageToRemove) {
        // If it's an existing image from server (has a URL), call delete API
        if (typeof imageToRemove === 'string' && !imageToRemove.startsWith('data:image')) {
          const response = await deleteProduct(editProduct._id, imageToRemove);
          if (response.success) {
            enqueueSnackbar('Image deleted successfully', { variant: 'success' });

            // Update form data with new image array
            setFormData(prev => ({
              ...prev,
              images: prev.images.filter((_, i) => i !== index)
            }));

            // Update image previews
            setImagePreviews(prev => prev.filter((_, i) => i !== index));
          }
        } else {
          // If it's a new image (base64), just remove it from state
          setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
          }));
          setImagePreviews(prev => prev.filter((_, i) => i !== index));
        }
      } else {
        // If not editing or no image, just remove from state
        setFormData(prev => ({
          ...prev,
          images: prev.images.filter((_, i) => i !== index)
        }));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
      }
    } catch (error) {
      console.error('Error removing image:', error);
      enqueueSnackbar(error.message || 'Failed to delete image', { variant: 'error' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.shortDescription.trim()) newErrors.shortDescription = 'Short description is required';
    if (!formData.description.trim()) newErrors.description = 'Full description is required';
    if (!formData.category) newErrors.category = 'Category is required';

    // Validate minimum 3 images requirement
    const validImages = formData.images.filter(img => img);
    if (!validImages || validImages.length < 3) {
      newErrors.images = 'At least 3 images are required';
      enqueueSnackbar('At least 3 images are required', { variant: 'warning' });
    }

    // Tax validation (optional field but must be valid if provided)
    if (formData.tax && (isNaN(formData.tax) || parseFloat(formData.tax) < 0 || parseFloat(formData.tax) > 100)) {
      newErrors.tax = 'Tax must be between 0 and 100';
    }

    // Return days validation
    if (formData.return === 'yes' && (!formData.returnDays || isNaN(formData.returnDays) || parseInt(formData.returnDays) < 1)) {
      newErrors.returnDays = 'Return days must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Create a new FormData object
      const formDataToSend = new FormData();

      // Add all product data to FormData
      formDataToSend.append('pName', formData.name);
      formDataToSend.append('pBrand', formData.brand);
      formDataToSend.append('pCategory', formData.category);
      formDataToSend.append('pShortDescription', formData.shortDescription);
      formDataToSend.append('pDescription', formData.description);
      formDataToSend.append('pPrice', '0'); // Base price is 0, actual price comes from variants
      formDataToSend.append('pPreviousPrice', '0');
      formDataToSend.append('pOffer', '0');
      formDataToSend.append('pTax', formData.tax || '5');
      formDataToSend.append('pStatus', formData.status || 'active');
      formDataToSend.append('pSubCategory', formData.pSubCategory || '');
      formDataToSend.append('pNestedSubCategory', formData.pNestedSubCategory || '');
      formDataToSend.append('pReturn', formData.return);
      formDataToSend.append('pReturnDays', formData.return === 'yes' ? formData.returnDays : '0');

      // Add images to FormData
      formData.images.forEach((image, index) => {
        if (image) {
          if (typeof image === 'string' && image.startsWith('data:image')) {
            // Convert base64 to blob
            const byteString = atob(image.split(',')[1]);
            const mimeString = image.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);

            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }

            const blob = new Blob([ab], { type: mimeString });
            formDataToSend.append('pImage', blob, `image${index}.jpg`);
          } else if (typeof image === 'string') {
            // If it's a URL, just append it
            formDataToSend.append('pImage', image);
          }
        }
      });

      // Add images to delete if any
      if (formData.imagesToDelete && formData.imagesToDelete.length > 0) {
        formDataToSend.append('imagesToDelete', JSON.stringify(formData.imagesToDelete));
      }

      let response;
      if (editProduct) {
        response = await updateProduct(editProduct._id, formDataToSend);
      } else {
        response = await addProduct(formDataToSend);
      }

      if (response.success) {
        enqueueSnackbar(
          editProduct ? 'Product updated successfully' : 'Product added successfully',
          { variant: 'success' }
        );
        handleClose();
        fetchProducts();

        // Open variant dialog after product creation
        if (!editProduct) {
          handleVariantDialogOpen(response.product);
        }
      } else {
        throw new Error(response.message || 'Failed to submit product');
      }
    } catch (error) {
      console.error('Error submitting product:', error);
      enqueueSnackbar(error.message || 'Failed to submit product', {
        variant: 'error',
        autoHideDuration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeleteLoading(true);
      const response = await deleteProduct(id);

      if (response.success) {
        enqueueSnackbar('Product deleted successfully', {
          variant: 'success',
          autoHideDuration: 3000
        });
        await fetchProducts();
        setDeleteConfirmOpen(false);
        setProductToDelete(null);
      } else {
        throw new Error(response.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      enqueueSnackbar(error.message || 'Failed to delete product', {
        variant: 'error',
        autoHideDuration: 5000
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredProducts = products
    .filter(product => {
      const searchLower = searchQuery.toLowerCase();
      return (
        product.pName?.toLowerCase().includes(searchLower) ||
        product.pDescription?.toLowerCase().includes(searchLower) ||
        product.pCategory?.toLowerCase().includes(searchLower) ||
        product.pBrand?.toLowerCase().includes(searchLower)
      );
    });

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await getAllCategories();
      console.log('Raw API Response:', response);
      // Since response is directly an array of categories
      setCategories(response || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      enqueueSnackbar(error.message || 'Failed to fetch categories', { variant: 'error' });
    }
  };

  // Fetch sub categories based on selected category
  const fetchSubCategories = async (categoryId) => {
    try {
      const response = await getSubCategories(categoryId);
      if (response.success) {
        setSubCategories(response.subCategories || []);
      } else {
        enqueueSnackbar(response.message || 'Failed to fetch sub categories', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching sub categories:', error);
      enqueueSnackbar(error.message || 'Failed to fetch sub categories', { variant: 'error' });
    }
  };

  // Fetch nested sub categories based on selected sub category
  const fetchNestedSubCategories = async (categoryId, subCategoryId) => {
    try {
      const response = await getNestedSubCategories(categoryId, subCategoryId);
      if (response.success) {
        setNestedSubCategories(response.subCategories || []);
      } else {
        enqueueSnackbar(response.message || 'Failed to fetch nested subcategories', {
          variant: 'error'
        });
        setNestedSubCategories([]);
      }
    } catch (error) {
      console.error('Error fetching nested subcategories:', error);
      enqueueSnackbar(error.message || 'Failed to fetch nested subcategories', {
        variant: 'error'
      });
      setNestedSubCategories([]);
    }
  };

  // Handle category change
  const handleCategoryChange = async (e) => {
    const { value } = e.target;

    if (value === 'add_new_category') {
      // Handle adding new category here
      return;
    }

    setFormData(prev => ({
      ...prev,
      category: value,
      pSubCategory: '',
      pNestedSubCategory: ''
    }));

    setSubCategories([]);
    setNestedSubCategories([]);

    if (value) {
      const selectedCategory = categories.find(cat =>
        cat.cName === value
      );

      if (selectedCategory) {
        setSubCategories(selectedCategory.subCategories || []);
      }
    }
  };

  // Handle subcategory change
  const handleSubCategoryChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      pSubCategory: value,
      pNestedSubCategory: '' // Reset nested subcategory when subcategory changes
    }));

    // Fetch nested subcategories when a subcategory is selected
    if (value) {
      const selectedCategory = categories.find(cat => cat.cName === formData.category);
      const selectedSubCategory = selectedCategory?.subCategories?.find(sub => sub.name === value);

      if (selectedCategory && selectedSubCategory) {
        fetchNestedSubCategories(selectedCategory._id, selectedSubCategory._id);
      }
    } else {
      setNestedSubCategories([]); // Clear nested subcategories if no subcategory selected
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchCategories();
  }, []);

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close sidebar when clicking outside
  const handleOverlayClick = () => {
    setIsSidebarOpen(false);
  };

  // Close sidebar on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add compressImage function
  const compressImage = (base64String) => {
    if (!base64String?.startsWith('data:image')) {
      return base64String;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64String;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  // Add calculateOfferPercentage function
  const calculateOfferPercentage = (price, previousPrice) => {
    if (!previousPrice || previousPrice <= 0 || !price || price <= 0 || previousPrice <= price) {
      return 0;
    }
    return Math.round(((previousPrice - price) / previousPrice) * 100);
  };

  // Update handleVariantDialogOpen
  const handleVariantDialogOpen = (product) => {
    setSelectedProductForVariant(product);
    setVariantDialogOpen(true);
    setVariantFormData({
      type: '',
      size: '',
      stock: '',
      totalStock: '',
      price: '',
      previousPrice: '',
      offer: '',
      status: 'active'
    });
    fetchProductVariants(product._id);
  };

  // Update fetchProductVariants
  const fetchProductVariants = async (productId) => {
    try {
      setVariantLoading(true);
      const response = await getProductVariants(productId);
      if (response.success) {
        setVariants(response.variants || []);
        // Set the product's variant type based on existing variants
        if (response.variants && response.variants.length > 0) {
          setProductVariantType(response.variants[0].type);
          setVariantFormData(prev => ({ ...prev, type: response.variants[0].type }));
        } else {
          setProductVariantType(null);
          setVariantFormData(prev => ({ ...prev, type: 'size' })); // Reset to default type
        }
      } else {
        setVariants([]);
        setProductVariantType(null);
        setVariantFormData(prev => ({ ...prev, type: 'size' })); // Reset to default type
        enqueueSnackbar(response.message || 'Failed to fetch variants', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
      setVariants([]);
      setProductVariantType(null);
      setVariantFormData(prev => ({ ...prev, type: 'size' })); // Reset to default type
      enqueueSnackbar(error.message || 'Failed to fetch variants', { variant: 'error' });
    } finally {
      setVariantLoading(false);
    }
  };

  // Update handleVariantSubmit
  const handleVariantSubmit = async (e) => {
    e.preventDefault();
    try {
      setAddVariantLoading(true);
      setVariantErrors({});

      // Validate variant form
      if (!variantFormData.type || !variantFormData.size || !variantFormData.stock ||
        !variantFormData.totalStock || !variantFormData.price) {
        setVariantErrors({
          general: 'Please fill in all required fields'
        });
        return;
      }

      // Validate previous price if provided
      if (variantFormData.previousPrice &&
        parseFloat(variantFormData.previousPrice) <= parseFloat(variantFormData.price)) {
        setVariantErrors({
          previousPrice: 'Previous price must be greater than current price'
        });
        return;
      }

      const variantData = {
        productId: selectedProductForVariant._id,
        type: variantFormData.type,
        size: variantFormData.size,
        stock: parseInt(variantFormData.stock),
        totalStock: parseInt(variantFormData.totalStock),
        price: parseFloat(variantFormData.price),
        previousPrice: variantFormData.previousPrice ? parseFloat(variantFormData.previousPrice) : null,
        offer: variantFormData.offer || 0,
        status: variantFormData.status
      };

      const response = await createProductVariants([variantData]);

      if (response.success) {
        enqueueSnackbar('Variant added successfully', { variant: 'success' });
        setVariantFormData({
          type: '',
          size: '',
          stock: '',
          totalStock: '',
          price: '',
          previousPrice: '',
          offer: '',
          status: 'active'
        });
        await fetchProductVariants(selectedProductForVariant._id);
      } else {
        enqueueSnackbar(response.message || 'Failed to add variant', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error adding variant:', error);
      enqueueSnackbar('Error adding variant', { variant: 'error' });
    } finally {
      setAddVariantLoading(false);
    }
  };

  // Add useEffect for offer calculation
  useEffect(() => {
    // Calculate offer when price or previousPrice changes for new variants
    if (!variantFormData.previousPrice || parseFloat(variantFormData.previousPrice) <= 0) {
      // If no previous price or invalid previous price, set offer to 0
      setVariantFormData(prev => ({
        ...prev,
        offer: "0"
      }));
    } else if (variantFormData.price && parseFloat(variantFormData.previousPrice) > parseFloat(variantFormData.price)) {
      // Calculate offer only when previous price is greater than current price
      const prevPrice = parseFloat(variantFormData.previousPrice);
      const currentPrice = parseFloat(variantFormData.price);
      const calculatedOffer = calculateOfferPercentage(currentPrice, prevPrice);
      setVariantFormData(prev => ({
        ...prev,
        offer: calculatedOffer.toString()
      }));
    } else {
      // If previous price exists but isn't greater than current price, set offer to 0
      setVariantFormData(prev => ({
        ...prev,
        offer: "0"
      }));
    }
  }, [variantFormData.price, variantFormData.previousPrice]);

  const handleVariantDeleteClick = (variant) => {
    setVariantToDelete(variant);
    setDeleteVariantConfirmOpen(true);
  };

  const handleCancelDeleteVariant = () => {
    setVariantToDelete(null);
    setDeleteVariantConfirmOpen(false);
  };

  const handleConfirmDeleteVariant = async () => {
    if (!variantToDelete) return;

    try {
      setDeleteVariantLoading(true);
      const response = await deleteProductVariant(variantToDelete._id);

      if (response.success) {
        enqueueSnackbar('Variant deleted successfully', { variant: 'success' });
        await fetchProductVariants(selectedProductForVariant._id);
      } else {
        enqueueSnackbar(response.message || 'Failed to delete variant', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error deleting variant:', error);
      enqueueSnackbar('Error deleting variant', { variant: 'error' });
    } finally {
      setDeleteVariantLoading(false);
      setDeleteVariantConfirmOpen(false);
      setVariantToDelete(null);
    }
  };

  const handleVariantStockSubmit = async () => {
    try {
      if (!stockToAdd || parseInt(stockToAdd) <= 0) {
        setStockError('Please enter a valid stock amount');
        return;
      }

      const newStock = parseInt(selectedVariant.stock) + parseInt(stockToAdd);
      const newTotalStock = parseInt(selectedVariant.totalStock) + parseInt(stockToAdd);

      const response = await updateProductVariant(selectedVariant._id, {
        stock: newStock,
        totalStock: newTotalStock
      });

      if (response.success) {
        enqueueSnackbar('Stock updated successfully', { variant: 'success' });
        setVariantStockDialog(false);
        setStockToAdd('');
        setStockError('');
        await fetchProductVariants(selectedProductForVariant._id);
      } else {
        enqueueSnackbar(response.message || 'Failed to update stock', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      enqueueSnackbar('Error updating stock', { variant: 'error' });
    }
  };

  // Image Preview Functions
  const handleImageClick = (images) => {
    setSelectedImages(images);
    setCurrentImageIndex(0);
    setImagePreviewDialog(true);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + selectedImages.length) % selectedImages.length);
  };

  // Delete Product Functions
  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setProductToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      setDeleteLoading(true);
      console.log('Starting product deletion for:', productToDelete._id);

      const response = await deleteProduct(productToDelete._id);
      console.log('Delete response:', response);

      if (response.success) {
        enqueueSnackbar('Product deleted successfully', {
          variant: 'success',
          autoHideDuration: 3000
        });
        await fetchProducts();
        setDeleteConfirmOpen(false);
        setProductToDelete(null);
      } else {
        throw new Error(response.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error in handleConfirmDelete:', {
        error: error.message,
        response: error.response,
        product: productToDelete
      });

      let errorMessage = 'Failed to delete product';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      enqueueSnackbar(errorMessage, {
        variant: 'error',
        autoHideDuration: 5000
      });
    } finally {
      setDeleteLoading(false);
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
    }
  };

  // Update handleEditVariantOpen
  const handleEditVariantOpen = (variant) => {
    setEditVariantData(variant);
    setVariantFormData({
      type: variant.type,
      size: variant.size,
      stock: variant.stock.toString(),
      totalStock: variant.totalStock.toString(),
      price: variant.price.toString(),
      previousPrice: variant.previousPrice ? variant.previousPrice.toString() : '',
      offer: variant.offer ? variant.offer.toString() : '',
      status: variant.status
    });
    setEditVariantDialog(true);
  };

  // Update handleEditVariantSubmit
  const handleEditVariantSubmit = async (e) => {
    e.preventDefault();
    try {
      setAddVariantLoading(true);
      setVariantErrors({});

      // Validate variant form
      if (!variantFormData.stock || !variantFormData.totalStock || !variantFormData.price) {
        setVariantErrors({
          general: 'Please fill in all required fields'
        });
        return;
      }

      // Validate previous price if provided
      if (variantFormData.previousPrice &&
        parseFloat(variantFormData.previousPrice) <= parseFloat(variantFormData.price)) {
        setVariantErrors({
          previousPrice: 'Previous price must be greater than current price'
        });
        return;
      }

      const variantData = {
        stock: parseInt(variantFormData.stock),
        totalStock: parseInt(variantFormData.totalStock),
        price: parseFloat(variantFormData.price),
        previousPrice: variantFormData.previousPrice ? parseFloat(variantFormData.previousPrice) : null,
        offer: variantFormData.offer || 0,
        status: variantFormData.status
      };

      const response = await updateProductVariant(editVariantData._id, variantData);

      if (response.success) {
        enqueueSnackbar('Variant updated successfully', { variant: 'success' });
        setEditVariantDialog(false);
        setEditVariantData(null);
        await fetchProductVariants(selectedProductForVariant._id);
      } else {
        enqueueSnackbar(response.message || 'Failed to update variant', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error updating variant:', error);
      enqueueSnackbar('Error updating variant', { variant: 'error' });
    } finally {
      setAddVariantLoading(false);
    }
  };

  // Add useEffect for edit variant offer calculation
  useEffect(() => {
    if (editVariantData) {
      if (!variantFormData.previousPrice || parseFloat(variantFormData.previousPrice) <= 0) {
        // If no previous price or invalid previous price, set offer to 0
        setVariantFormData(prev => ({
          ...prev,
          offer: "0"
        }));
      } else if (variantFormData.price && parseFloat(variantFormData.previousPrice) > parseFloat(variantFormData.price)) {
        // Calculate offer only when previous price is greater than current price
        const prevPrice = parseFloat(variantFormData.previousPrice);
        const currentPrice = parseFloat(variantFormData.price);
        const calculatedOffer = calculateOfferPercentage(currentPrice, prevPrice);
        setVariantFormData(prev => ({
          ...prev,
          offer: calculatedOffer.toString()
        }));
      } else {
        // If previous price exists but isn't greater than current price, set offer to 0
        setVariantFormData(prev => ({
          ...prev,
          offer: "0"
        }));
      }
    }
  }, [editVariantData, variantFormData.price, variantFormData.previousPrice]);

  return (
    <div className="vendor-dashboard-container">
      <header className="vendor-dashboard-header">
        <div className="header-left">
          <IconButton
            className="mobile-menu-button"
            onClick={toggleSidebar}
            sx={{ display: { sm: 'none' }, mr: 1 }}
          >
            {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            Vendor Dashboard
          </Typography>
        </div>
        <div className="header-right">
          <Button
            variant="outlined"
            color="error"
            startIcon={<FiLogOut />}
            onClick={handleLogoutClick}
            size="small"
            sx={{ ml: 2 }}
          >
            Logout
          </Button>
        </div>
      </header>
      {/* Hamburger Menu Button */}
      <button
        className="sidebar-toggle-btn"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <div className={`hamburger-icon ${isSidebarOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`}
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar */}
      <div className={`vendor-dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="vendor-info">
          {/* <div className="vendor-avatar">
            {vendorInfo?.vendorName?.charAt(0) || 'V'}
          </div> */}
          <div className="vendor-details">
            <h3>{vendorInfo?.vendorName || 'Vendor Name'}</h3>
            <p>{vendorInfo?.email || 'vendor@example.com'}</p>
          </div>
        </div>
        
<div className="nav-divider"></div>
        <nav className="vendor-dashboard-nav">
         
          <ul className="active-only-nav">
            <li className={activeTab === 'overview' ? 'active shown' : 'hidden'}>
              <a onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}>
                <Layers size={20} style={{ marginRight: '12px' }} />
                <span>Overview</span>
              </a>
            </li>
            <li className={activeTab === 'orders' ? 'active shown' : 'hidden'}>
              <a onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}>
                <ShoppingCart size={20} style={{ marginRight: '12px' }} />
                <span>Orders</span>
              </a>
            </li>
            <li className={activeTab === 'products' ? 'active shown' : 'hidden'}>
              <a onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }}>
                <Package size={20} style={{ marginRight: '12px' }} />
                <span>Products</span>
              </a>
            </li>
            <li className={activeTab === 'analytics' ? 'active shown' : 'hidden'}>
              <a onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }}>
                <TrendingUp size={20} style={{ marginRight: '12px' }} />
                <span>Analytics</span>
              </a>
            </li>
            <li className={activeTab === 'settings' ? 'active shown' : 'hidden'}>
              <a onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}>
                <SettingsIcon sx={{ mr: 1.5, fontSize: 20 }} />
                <span>Settings</span>
              </a>
            </li>
          </ul>

          

        

          {/* <div className="logout-container">
            <button 
              onClick={handleLogoutClick} 
              className="logout-button"
              title="Logout from dashboard"
            >
              <FiLogOut className="logout-icon" />
              <span>Logout</span>
            </button>
          </div> */}
        </nav>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <FiAlertCircle className="logout-alert-icon" />
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout from your vendor dashboard?</p>
            <div className="logout-modal-actions">
              <button
                onClick={handleLogoutConfirm}
                className="confirm-logout"
              >
                Yes, Logout
              </button>
              <button
                onClick={handleLogoutCancel}
                className="cancel-logout"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="vendor-dashboard-content">
        {/* <header className="vendor-dashboard-header">
          <h2>Vendor Dashboard</h2>
          <div className="vendor-dashboard-actions">
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />} 
              onClick={() => handleOpen()}
              className="btn"
            >
              Add New Product
            </Button>
          </div>
        </header> */}

        {activeTab === 'overview' && (
          <div className="vendor-dashboard-overview">
            <div className="stats-grid">
              <DashboardCard
                title="Total Sales"
                value={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        Total Sales
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        {dashboardData?.stats?.totalSales ? formatCurrency(dashboardData.stats.totalSales) : '0'}
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(0,0,0,0.2)' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        Revenue (-15%)
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                        {dashboardData?.stats?.revenue ? `${formatCurrency(dashboardData.stats.revenue)}` : '0'}
                      </Typography>
                    </Box>
                  </Box>
                }
                type="primary"
                icon={<TrendingUp size={28} color="#2563eb" />}
              />
              <DashboardCard
                title="Total Orders"
                value={dashboardData?.stats?.totalOrders || '0'}
                type="success"
                icon={<ShoppingCart size={28} color="#10b981" />}
              />
              <DashboardCard
                title="Pending Orders"
                value={dashboardData?.stats?.pendingOrders || '0'}
                type="warning"
                icon={<Clock size={28} color="#f59e0b" />}
              />
              <DashboardCard
                title="Products"
                value={dashboardData?.stats?.totalProducts || '0'}
                type="info"
                icon={<LayoutGrid size={28} color="#3b82f6" />}
              />
            </div>

            <div className="vendor-dashboard-sections">
              <div className="vendor-dashboard-section">
                <h3>Recent Orders</h3>
                <div className="table-container">
                  <table className="vendor-dashboard-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.recentOrders?.map((order) => (
                        <tr key={order.orderId}>
                          <td>{order.orderId}</td>
                          <td>{order.customer}</td>
                          <td>{formatCurrency(order.amount)}</td>
                          <td>
                            <Typography
                              sx={{
                                color:
                                  order.status === 'DELIVERED' ? 'success.main' :
                                    order.status === 'PROCESSING' ? 'warning.main' :
                                      order.status === 'PENDING' ? 'info.main' :
                                        'text.primary'
                              }}
                            >
                              {order.status}
                            </Typography>
                          </td>
                          <td>{formatDate(order.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="view-all">
                  <a onClick={() => setActiveTab('orders')}>View All Orders</a>
                </div>
              </div>

              <div className="vendor-dashboard-section">
                <h3>Top Selling Products</h3>
                <div className="table-container">
                  <table className="vendor-dashboard-table">
                    <thead>
                      <tr>
                        <th>Product ID</th>
                        <th>Name</th>
                        <th>Units Sold</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.topProducts?.map((product) => (
                        <tr key={product.productId}>
                          <td>{product.productId}</td>
                          <td>{product.name}</td>
                          <td>{product.unitsSold}</td>
                          <td>{formatCurrency(product.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="view-all">
                  <a onClick={() => setActiveTab('products')}>View All Products</a>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="vendor-dashboard-section">
            <h3>All Orders</h3>
            <p>This is the orders page. In a complete application, this would display a comprehensive list of all orders with filtering and sorting options.</p>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="vendor-dashboard-section">
            <Box className="products-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h2">Products Management</Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpen()}
              >
                Add New Product
              </Button>
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search products..."
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
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product Details</TableCell>
                    <TableCell>Images</TableCell>
                    <TableCell>Category Info</TableCell>
                    <TableCell>Price Details</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts
                      .slice()
                      .reverse()
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((product) => (
                        <TableRow key={product._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {product.pName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {product.pShortDescription}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Brand: {product.pBrand}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {(product.pImage || []).slice(0, 3).map((image, index) => (
                                <Box
                                  key={index}
                                  sx={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handleImageClick(product.pImage)}
                                >
                                  <img
                                    src={image}
                                    alt={`${product.pName} - ${index + 1}`}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover'
                                    }}
                                  />
                                </Box>
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Chip
                                label={product.pCategory}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              {product.pSubCategory && (
                                <Typography variant="caption" color="text.secondary">
                                  {product.pSubCategory}
                                </Typography>
                              )}
                              {product.pNestedSubCategory && (
                                <Typography variant="caption" color="text.secondary">
                                  {product.pNestedSubCategory}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {product.variants?.length > 0 ? (
                                <>
                                  <Typography variant="subtitle2">
                                    {/* ₹{Math.min(...product.variants.map(v => v.price))} - ₹{Math.max(...product.variants.map(v => v.price))} */}
                                    {`Tax: ${product.pTax}%`}
                                  </Typography>
                                  {product.variants.some(v => v.offer > 0) && (
                                    <Chip
                                      label={`Up to ${Math.max(...product.variants.map(v => v.offer))}% OFF`}
                                      color="error"
                                      size="small"
                                    />
                                  )}

                                </>
                              ) : (
                                <Typography variant="subtitle2">No variants</Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={product.pStatus}
                              color={product.pStatus === 'active' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="Manage Variants">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => handleVariantDialogOpen(product)}
                                >
                                  <InventoryIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Product">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => handleOpen(product)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Product">
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => handleDeleteClick(product)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filteredProducts.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
              />
            </TableContainer>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="vendor-dashboard-section">
            <h3>Sales Analytics</h3>
            <p>This is the analytics page. In a complete application, this would display charts and graphs showing sales trends, customer demographics, and other important metrics.</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="vendor-dashboard-section">
            <h3>Account Settings</h3>
            <p>This is the settings page. In a complete application, this would allow you to update your profile, change password, and manage notification preferences.</p>
          </div>
        )}
      </div>

      {/* Product Form Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle className="dialog-title">
            {editProduct ? 'Edit Product' : 'Add Product'}
          </DialogTitle>
          <DialogContent className="dialog-content">
            <Box className="form-grid">
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Product Images
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        width: 150,
                        height: 150,
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        '&:hover .delete-icon': {
                          opacity: 1
                        }
                      }}
                    >
                      {imagePreviews[index] ? (
                        <>
                          <img
                            src={imagePreviews[index].startsWith('http') ?
                              imagePreviews[index] :
                              imagePreviews[index]
                            }
                            alt={`Product ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onClick={() => handleImageClick(imagePreviews)}
                          />
                          <IconButton
                            className="delete-icon"
                            sx={{
                              position: 'absolute',
                              top: 5,
                              right: 5,
                              backgroundColor: 'rgba(0, 0, 0, 0.5)',
                              color: 'white',
                              opacity: 0,
                              transition: 'opacity 0.2s',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.7)'
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(index);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      ) : (
                        <Box
                          onClick={() => imageInputRefs[index].current.click()}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <AddCircleOutlineIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Add Image
                          </Typography>
                        </Box>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        ref={imageInputRefs[index]}
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageUpload(e, index)}
                      />
                    </Box>
                  ))}
                </Box>
                {errors.images && (
                  <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                    {errors.images}
                  </Typography>
                )}
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={12}>
                  <TextField
                    className="form-field"
                    fullWidth
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    error={!!errors.name}
                    helperText={errors.name}
                  />
                </Grid>
              </Grid>

              <TextField
                className="form-field"
                fullWidth
                label="Short Description"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                required
                error={!!errors.shortDescription}
                helperText={errors.shortDescription || 'Brief summary (max 100 characters)'}
                inputProps={{ maxLength: 100 }}
              />

              <TextField
                className="form-field"
                fullWidth
                label="Full Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                required
                error={!!errors.description}
                helperText={errors.description || 'Detailed product description'}
              />

              <TextField
                className="form-field"
                fullWidth
                label="Brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                error={!!errors.brand}
                helperText={errors.brand}
                inputProps={{ maxLength: 30 }}
              />

              <FormControl className="form-field" fullWidth required error={!!errors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category || ''}
                  onChange={handleCategoryChange}
                  label="Category"
                >
                  {categories.length === 0 ? (
                    <MenuItem value="" disabled>No categories available</MenuItem>
                  ) : (
                    categories
                      .filter(category => category.cStatus === 'active')
                      .map((category) => (
                        <MenuItem key={category._id} value={category.cName}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {category.cImage && (
                              <Avatar
                                src={`${category.cImage}`}
                                alt={category.cName}
                                sx={{ width: 24, height: 24 }}
                              />
                            )}
                            <Typography>{category.cName}</Typography>
                          </Box>
                        </MenuItem>
                      ))
                  )}
                  <MenuItem
                    value="add_new_category"
                    sx={{
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      color: 'primary.main',
                    }}
                  >
                    <AddCircleOutlineIcon sx={{ mr: 1 }} />
                    Add New Category
                  </MenuItem>
                </Select>
                {errors.category && (
                  <Typography className="error-text">
                    {errors.category}
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Subcategory</InputLabel>
                <Select
                  value={formData.pSubCategory || ''}
                  name="pSubCategory"
                  label="Subcategory"
                  onChange={handleSubCategoryChange}
                >
                  <MenuItem value="">None</MenuItem>
                  {subCategories.map((subcat) => (
                    <MenuItem key={subcat._id} value={subcat.name}>
                      {subcat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Nested Subcategory</InputLabel>
                <Select
                  value={formData.pNestedSubCategory || ''}
                  name="pNestedSubCategory"
                  label="Nested Subcategory"
                  onChange={handleChange}
                  disabled={!formData.pSubCategory}
                >
                  <MenuItem value="">None</MenuItem>
                  {nestedSubCategories.map((nestedSubcat) => (
                    <MenuItem key={nestedSubcat._id} value={nestedSubcat.name}>
                      {nestedSubcat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                className="form-field"
                fullWidth
                label="Tax (%)"
                name="tax"
                type="number"
                value={formData.tax}
                onChange={handleChange}
                required
                InputProps={{
                  inputProps: { min: 0, max: 100 }
                }}
              />

              <FormControl className="form-field" fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                </Select>
              </FormControl>

              <FormControl className="form-field" fullWidth required>
                <InputLabel>Return Policy</InputLabel>
                <Select
                  name="return"
                  value={formData.return}
                  onChange={handleChange}
                  label="Return Policy"
                >
                  <MenuItem value="no">No Return</MenuItem>
                  <MenuItem value="yes">Return Allowed</MenuItem>
                </Select>
              </FormControl>

              {formData.return === 'yes' && (
                <TextField
                  className="form-field"
                  fullWidth
                  label="Return Days"
                  name="returnDays"
                  type="number"
                  value={formData.returnDays}
                  onChange={handleChange}
                  required
                  InputProps={{
                    inputProps: { min: 1 }
                  }}
                  error={!!errors.returnDays}
                  helperText={errors.returnDays || 'Number of days for return'}
                />
              )}
            </Box>
          </DialogContent>
          <DialogActions className="dialog-actions">
            <Button
              className="dialog-button"
              onClick={handleClose}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              className="dialog-button"
              type="submit"
              variant="contained"
              disabled={categories.length === 0 || loading}
            >
              {loading ? <CircularProgress size={24} /> : (editProduct ? 'Update Product' : 'Add Product')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog
        open={imagePreviewDialog}
        onClose={() => setImagePreviewDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            minHeight: '60vh'
          }
        }}
      >
        <DialogTitle
          className="dialog-title"
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            pb: 2
          }}
        >
          <Typography variant="h6" component="span">
            Product Images
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ ml: 1 }}
          >
            {`${currentImageIndex + 1} of ${selectedImages.length}`}
          </Typography>
        </DialogTitle>
        <DialogContent
          className="dialog-content"
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 4
          }}
        >
          <Box
            className="image-preview-container"
            sx={{
              position: 'relative',
              marginTop: '10px',
              width: '100%',
              height: '300px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <IconButton
              sx={{
                position: 'absolute',
                left: 0,
                backgroundColor: 'rgba(0,0,0,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.2)'
                }
              }}
              onClick={handlePrevImage}
            >
              <NavigateBeforeIcon />
            </IconButton>
            <img
              src={selectedImages[currentImageIndex]}
              alt="Product"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 8
              }}
            />
            <IconButton
              sx={{
                position: 'absolute',
                right: 0,
                backgroundColor: 'rgba(0,0,0,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.2)'
                }
              }}
              onClick={handleNextImage}
            >
              <NavigateNextIcon />
            </IconButton>
          </Box>
        </DialogContent>
        <DialogActions
          className="dialog-actions"
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            p: 2,
            gap: 1
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setImagePreviewDialog(false)}
            startIcon={<CloseIcon />}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the product "{productToDelete?.pName}"? This will also delete all associated variants.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelDelete}
            color="primary"
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Product & Variants'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Variant Dialog */}
      <Dialog
        open={variantDialogOpen}
        onClose={() => setVariantDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Product Variants - {selectedProductForVariant?.pName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Total Available Stock: {variants.reduce((total, variant) => total + (parseInt(variant.stock) || 0), 0)}
            </Typography>
            <form onSubmit={handleVariantSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={variantFormData.type}
                      onChange={(e) => {
                        setVariantFormData(prev => ({ ...prev, type: e.target.value }));
                        setProductVariantType(e.target.value);
                      }}
                      label="Type"
                      disabled={variants.length > 0}
                    >
                      <MenuItem value="size">Size</MenuItem>
                      <MenuItem value="color">Color</MenuItem>
                      <MenuItem value="weight">Weight</MenuItem>
                    </Select>
                    {variants.length > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        Type is locked to {productVariantType} for this product
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label={`${variantFormData.type.charAt(0).toUpperCase() + variantFormData.type.slice(1)} Value`}
                    value={variantFormData.size}
                    onChange={(e) => setVariantFormData(prev => ({ ...prev, size: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Stock"
                    type="number"
                    value={variantFormData.stock}
                    onChange={(e) => setVariantFormData(prev => ({ ...prev, stock: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Total Stock"
                    type="number"
                    value={variantFormData.totalStock}
                    onChange={(e) => setVariantFormData(prev => ({ ...prev, totalStock: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Price"
                    type="number"
                    value={variantFormData.price}
                    onChange={(e) => setVariantFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Previous Price"
                    name="previousPrice"
                    value={variantFormData.previousPrice}
                    onChange={(e) => {
                      const newPrevPrice = e.target.value;
                      const currentPrice = parseFloat(variantFormData.price);

                      setVariantFormData(prev => ({
                        ...prev,
                        previousPrice: newPrevPrice
                      }));

                      if (newPrevPrice && currentPrice && parseFloat(newPrevPrice) <= currentPrice) {
                        setVariantErrors(prev => ({
                          ...prev,
                          previousPrice: 'Previous price must be greater than current price'
                        }));
                      } else {
                        setVariantErrors(prev => ({
                          ...prev,
                          previousPrice: undefined
                        }));
                      }
                    }}
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    error={!!variantErrors?.previousPrice}
                    helperText={variantErrors?.previousPrice || 'Must be greater than current price'}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Offer (%)"
                    name="offer"
                    value={variantFormData.offer}
                    disabled={true}
                    type="number"
                    InputProps={{
                      inputProps: { min: 0, max: 100 }
                    }}
                    helperText="Automatically calculated from prices"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={variantFormData.status}
                      onChange={(e) => setVariantFormData(prev => ({ ...prev, status: e.target.value }))}
                      label="Status"
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={addVariantLoading}
                    startIcon={addVariantLoading ? <CircularProgress size={20} /> : null}
                  >
                    {addVariantLoading ? 'Adding...' : 'Add Variant'}
                  </Button>
                </Grid>
              </Grid>
            </form>

            {/* Variants List */}
            <TableContainer component={Paper} sx={{ mt: 4 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Size</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Total Stock</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Previous Price</TableCell>
                    <TableCell>Offer (%)</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {variantLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : variants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        No variants found
                      </TableCell>
                    </TableRow>
                  ) : (
                    variants.map((variant) => (
                      <TableRow key={variant._id}>
                        <TableCell>{variant.size}</TableCell>
                        <TableCell>{variant.type}</TableCell>
                        <TableCell>{variant.stock}</TableCell>
                        <TableCell>{variant.totalStock}</TableCell>
                        <TableCell>₹{variant.price}</TableCell>
                        <TableCell>₹{variant.previousPrice}</TableCell>
                        <TableCell>{variant.offer}%</TableCell>
                        <TableCell>
                          <Chip
                            label={variant.status}
                            color={variant.status === 'active' ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Edit Variant">
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => handleEditVariantOpen(variant)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Variant">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleVariantDeleteClick(variant)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVariantDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Variant Stock Dialog */}
      <Dialog
        open={variantStockDialog}
        onClose={() => setVariantStockDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Stock to Variant</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Variant: {selectedVariant?.type} - {selectedVariant?.size}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Stock: {selectedVariant?.stock}
            </Typography>
            <TextField
              fullWidth
              label="Stock to Add"
              type="number"
              value={stockToAdd}
              onChange={(e) => setStockToAdd(e.target.value)}
              error={!!stockError}
              helperText={stockError}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVariantStockDialog(false)}>Cancel</Button>
          <Button
            onClick={handleVariantStockSubmit}
            variant="contained"
            color="primary"
          >
            Add Stock
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Variant Dialog */}
      <Dialog
        open={editVariantDialog}
        onClose={() => {
          setEditVariantDialog(false);
          setEditVariantData(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit Variant
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <form onSubmit={handleEditVariantSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label={`${editVariantData?.type.charAt(0).toUpperCase() + editVariantData?.type.slice(1)} Value`}
                    value={variantFormData.size}
                    onChange={(e) => setVariantFormData(prev => ({ ...prev, size: e.target.value }))}
                    required
                    disabled={true}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Stock"
                    type="number"
                    value={variantFormData.stock}
                    onChange={(e) => setVariantFormData(prev => ({ ...prev, stock: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Total Stock"
                    type="number"
                    value={variantFormData.totalStock}
                    onChange={(e) => setVariantFormData(prev => ({ ...prev, totalStock: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Price"
                    type="number"
                    value={variantFormData.price}
                    onChange={(e) => setVariantFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Previous Price"
                    name="previousPrice"
                    value={variantFormData.previousPrice}
                    onChange={(e) => {
                      const newPrevPrice = e.target.value;
                      const currentPrice = parseFloat(variantFormData.price);

                      setVariantFormData(prev => ({
                        ...prev,
                        previousPrice: newPrevPrice
                      }));

                      if (newPrevPrice && currentPrice && parseFloat(newPrevPrice) <= currentPrice) {
                        setVariantErrors(prev => ({
                          ...prev,
                          previousPrice: 'Previous price must be greater than current price'
                        }));
                      } else {
                        setVariantErrors(prev => ({
                          ...prev,
                          previousPrice: undefined
                        }));
                      }
                    }}
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    error={!!variantErrors?.previousPrice}
                    helperText={variantErrors?.previousPrice || 'Must be greater than current price'}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Offer (%)"
                    name="offer"
                    value={variantFormData.offer}
                    disabled={true}
                    type="number"
                    InputProps={{
                      inputProps: { min: 0, max: 100 }
                    }}
                    helperText="Automatically calculated from prices"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={variantFormData.status}
                      onChange={(e) => setVariantFormData(prev => ({ ...prev, status: e.target.value }))}
                      label="Status"
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setEditVariantDialog(false);
                        setEditVariantData(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained">
                      Update Variant
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Delete Variant Confirmation Dialog */}
      <Dialog open={deleteVariantConfirmOpen} onClose={handleCancelDeleteVariant}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the variant "{variantToDelete?.size}" ({variantToDelete?.type})?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelDeleteVariant}
            color="primary"
            disabled={deleteVariantLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeleteVariant}
            color="error"
            startIcon={deleteVariantLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
            disabled={deleteVariantLoading}
          >
            {deleteVariantLoading ? 'Deleting...' : 'Delete Variant'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default VendorDashboard;