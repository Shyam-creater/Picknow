import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Grid,
  Chip,
  Avatar,
  InputAdornment,
  TablePagination,
  Collapse,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import * as XLSX from 'xlsx';
import '../styles/Categories.css';
import { SAMPLE_IMAGES } from '../utils/sampleData';
import { useSnackbar } from 'notistack';
import { categoryApi } from '../api/categoryApi';
import { useNavigate } from 'react-router-dom';
import usePermissions from '../hooks/usePermissions';
import { PERMISSIONS, ACTIONS } from '../constants/permissions';

const compressImage = (base64String) => {
  if (typeof base64String !== 'string' || !base64String.startsWith('data:image')) {
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

const Categories = () => {
  const fileInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { canWrite, canDelete } = usePermissions();
  const [allCategories, setAllCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryApi.getAllCategories();
      if (response) {
        setAllCategories(response);
        setCategories(response);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      enqueueSnackbar(error.message || 'Failed to fetch categories', { 
        variant: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const [open, setOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    status: 'active'
  });
  const [previewImage, setPreviewImage] = useState('');
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [expandedCategory, setExpandedCategory] = useState(null);
  const [subCategoryOpen, setSubCategoryOpen] = useState(false);
  const [subCategories, setSubCategories] = useState([]);
  const [subCategoryFormData, setSubCategoryFormData] = useState({
    name: '',
    description: '',
    parentCategory: '',
    status: 'active',
    image: ''
  });
  const [subCategoryPreviewImage, setSubCategoryPreviewImage] = useState('');
  const subCategoryImageRef = useRef(null);

  const [editSubCategoryData, setEditSubCategoryData] = useState(null);

  const [nestedSubCategoryOpen, setNestedSubCategoryOpen] = useState(false);
  const [selectedParentSubCategory, setSelectedParentSubCategory] = useState(null);
  const [nestedSubCategories, setNestedSubCategories] = useState([]);

  const [expandedSubCategories, setExpandedSubCategories] = useState(new Set());

  const [editingNestedSubCategory, setEditingNestedSubCategory] = useState(null);

  const handleOpen = (category = null) => {
    if (category && !canWrite(PERMISSIONS.CATEGORIES)) {
      enqueueSnackbar('You do not have permission to edit categories', { variant: 'error' });
      return;
    }
    
    if (category) {
      setEditCategory(category);
      setFormData({
        name: category.cName,
        description: category.cDescription,
        image: category.cImage,
        status: category.cStatus
      });
      setPreviewImage(`${category.cImage}`);
    } else {
      setEditCategory(null);
      setFormData({
        name: '',
        description: '',
        image: '',
        status: 'active'
      });
      setPreviewImage('');
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditCategory(null);
    setPreviewImage('');
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    // if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.image) newErrors.image = 'Image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      if (editCategory) {
        const response = await categoryApi.updateCategory(editCategory._id, formData);
        if (response.success) {
          enqueueSnackbar('Category updated successfully', { variant: 'success' });
          fetchCategories();
        }
      } else {
        const response = await categoryApi.createCategory(formData);
        if (response.success) {
          enqueueSnackbar('Category created successfully', { variant: 'success' });
          fetchCategories();
        }
      }
      handleClose();
    } catch (error) {
      enqueueSnackbar(error.message || 'Operation failed', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete(PERMISSIONS.CATEGORIES)) {
      enqueueSnackbar('You do not have permission to delete categories', { variant: 'error' });
      return;
    }

    try {
      const response = await categoryApi.deleteCategory(id);
      if (response.success) {
        enqueueSnackbar('Category deleted successfully', { variant: 'success' });
        fetchCategories();
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to delete category', {
        variant: 'error'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) { // 5MB limit
        setErrors(prev => ({
          ...prev,
          image: 'Image size should be less than 5MB'
        }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result;
        setPreviewImage(imageUrl);
        setFormData(prev => ({
          ...prev,
          image: imageUrl
        }));
        setErrors(prev => ({ ...prev, image: undefined }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    setErrors(prev => ({
      ...prev,
      [name]: undefined
    }));
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExportToExcel = () => {
    // Prepare the data for export
    const exportData = categories.map(category => ({
      'Category Name': category.cName,
      'Description': category.cDescription,
      'Status': category.cStatus,
      'Number of Products': category.products || 0,
      'Created At': new Date(category.createdAt).toLocaleDateString()
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Categories');

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, 'categories_list.xlsx');
  };

  const handleExpandCategory = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleSubCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('name', subCategoryFormData.name);
      formData.append('description', subCategoryFormData.description);
      formData.append('status', subCategoryFormData.status);

      if (subCategoryFormData.image && subCategoryFormData.image.startsWith('data:image')) {
        const base64Response = await fetch(subCategoryFormData.image);
        const blob = await base64Response.blob();
        formData.append('image', blob, 'subcategory-image.jpg');
      }

      let response;
      if (editSubCategoryData) {
        // Update existing subcategory
        response = await categoryApi.updateSubCategory(
          editSubCategoryData.categoryId,
          editSubCategoryData.subCategory._id,
          formData
        );
      } else {
        // Create new subcategory
        response = await categoryApi.createSubCategory(
          expandedCategory,
          formData
        );
      }

      if (response.success) {
        setSubCategoryOpen(false);
        setEditSubCategoryData(null);
        setSubCategoryFormData({
          name: '',
          description: '',
          status: 'active',
          image: ''
        });
        setSubCategoryPreviewImage('');
        await fetchCategories();
        enqueueSnackbar(
          editSubCategoryData
            ? 'Subcategory updated successfully'
            : 'Subcategory created successfully',
          { variant: 'success' }
        );
      }
    } catch (error) {
      console.error('Subcategory operation error:', error);
      enqueueSnackbar(
        error.message || `Failed to ${editSubCategoryData ? 'update' : 'create'} subcategory`,
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubCategory = (categoryId, subCategory) => {
    if (!canWrite(PERMISSIONS.CATEGORIES)) {
      enqueueSnackbar('You do not have permission to edit subcategories', { variant: 'error' });
      return;
    }
    
    setEditSubCategoryData({
      categoryId,
      subCategory
    });
    setSubCategoryFormData({
      name: subCategory.name,
      description: subCategory.description,
      status: subCategory.status,
      image: subCategory.image
    });
    setSubCategoryPreviewImage(`${subCategory.image}`);
    setSubCategoryOpen(true);
  };

  const handleDeleteSubCategory = async (categoryId, subCategoryId) => {
    if (!canDelete(PERMISSIONS.CATEGORIES)) {
      enqueueSnackbar('You do not have permission to delete subcategories', { variant: 'error' });
      return;
    }

    try {
      await categoryApi.deleteSubCategory(categoryId, subCategoryId);
      fetchCategories();
      enqueueSnackbar('Subcategory deleted successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to delete subcategory', { variant: 'error' });
    }
  };

  const handleSubCategoryImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) { // 5MB limit
        enqueueSnackbar('Image size should be less than 5MB', { variant: 'error' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          // Use the existing compressImage function
          const compressedImage = await compressImage(reader.result);
          setSubCategoryPreviewImage(compressedImage);
          setSubCategoryFormData(prev => ({
            ...prev,
            image: compressedImage
          }));
        } catch (error) {
          console.error('Error compressing image:', error);
          enqueueSnackbar('Error processing image', { variant: 'error' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNestedSubCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('name', subCategoryFormData.name);
      formData.append('description', subCategoryFormData.description);
      formData.append('status', subCategoryFormData.status);

      if (subCategoryFormData.image && subCategoryFormData.image.startsWith('data:image')) {
        const base64Response = await fetch(subCategoryFormData.image);
        const blob = await base64Response.blob();
        formData.append('image', blob, 'subcategory-image.jpg');
      }

      if (editingNestedSubCategory) {
        // Update existing nested subcategory
        await categoryApi.updateNestedSubCategory(
          editingNestedSubCategory.categoryId,
          editingNestedSubCategory.parentSubCategoryId,
          editingNestedSubCategory.nestedSubCategory._id,
          formData
        );
        enqueueSnackbar('Nested subcategory updated successfully', { variant: 'success' });
      } else {
        // Create new nested subcategory
        await categoryApi.createNestedSubCategory(
          expandedCategory,
          selectedParentSubCategory._id,
          formData
        );
        enqueueSnackbar('Nested subcategory created successfully', { variant: 'success' });
      }

      setNestedSubCategoryOpen(false);
      setEditingNestedSubCategory(null);
      setSubCategoryFormData({
        name: '',
        description: '',
        status: 'active',
        image: ''
      });
      setSubCategoryPreviewImage('');
      fetchCategories();
    } catch (error) {
      console.error('Nested subcategory operation error:', error);
      enqueueSnackbar(error.message || 'Operation failed', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubCategoryExpand = async (categoryId, subCategoryId) => {
    try {
      const newExpanded = new Set(expandedSubCategories);
      const key = `${categoryId}-${subCategoryId}`;

      if (expandedSubCategories.has(key)) {
        newExpanded.delete(key);
      } else {
        const response = await categoryApi.getNestedSubCategories(categoryId, subCategoryId);
        if (response.success) {
          newExpanded.add(key);
        }
      }
      setExpandedSubCategories(newExpanded);
    } catch (error) {
      console.error('Error fetching nested subcategories:', error);
      enqueueSnackbar('Failed to fetch nested subcategories', { variant: 'error' });
    }
  };

  const handleDeleteNestedSubCategory = async (categoryId, parentSubCategoryId, nestedSubCategoryId) => {
    if (!canDelete(PERMISSIONS.CATEGORIES)) {
      enqueueSnackbar('You do not have permission to delete nested subcategories', { variant: 'error' });
      return;
    }

    try {
      if (!window.confirm('Are you sure you want to delete this nested subcategory?')) {
        return;
      }

      await categoryApi.deleteNestedSubCategory(
        categoryId,
        parentSubCategoryId,
        nestedSubCategoryId
      );

      await fetchCategories();
      enqueueSnackbar('Nested subcategory deleted successfully', { variant: 'success' });
    } catch (error) {
      console.error('Delete error:', error);
      enqueueSnackbar(error.message || 'Failed to delete nested subcategory', {
        variant: 'error'
      });
    }
  };

  const handleEditNestedSubCategory = (categoryId, parentSubCategoryId, nestedSubCategory) => {
    setEditingNestedSubCategory({
      categoryId,
      parentSubCategoryId,
      nestedSubCategory
    });
    // Set form data with current values
    setSubCategoryFormData({
      name: nestedSubCategory.name,
      description: nestedSubCategory.description,
      status: nestedSubCategory.status,
      image: nestedSubCategory.image
    });
    if (nestedSubCategory.image) {
      setSubCategoryPreviewImage(`${nestedSubCategory.image}`);
    }
    setNestedSubCategoryOpen(true);
  };

  const filteredCategories = useMemo(() => {
    return allCategories.filter(category => {
      const searchLower = searchQuery.toLowerCase();
      const name = (category.cName || '').toLowerCase();
      const description = (category.cDescription || '').toLowerCase();

      return name.includes(searchLower) || description.includes(searchLower);
    });
  }, [allCategories, searchQuery]);

  const handleSearch = (e) => {
    const newSearchQuery = e.target.value;
    setSearchQuery(newSearchQuery);
    setPage(0);
  };

  const paginatedCategories = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredCategories.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredCategories, page, rowsPerPage]);

  const renderCategoryList = (categories, level = 0) => {
    return categories.map((category) => (
      <div key={category._id}>
        <div style={{ marginLeft: `${level * 20}px` }}>
          {category.cName}
          <button onClick={() => handleEdit(category)}>Edit</button>
          <button onClick={() => handleDelete(category._id)}>Delete</button>
        </div>
        {category.subCategories && renderCategoryList(category.subCategories, level + 1)}
      </div>
    ));
  };

  const handleEdit = (category) => {
    // Implement the edit functionality
  };

  const handleRenderCategoryOptions = (categories, level = 0) => {
    return categories.map((category) => (
      <>
        <option key={category._id} value={category._id}>
          {'—'.repeat(level)} {category.cName}
        </option>
        {category.subCategories && handleRenderCategoryOptions(category.subCategories, level + 1)}
      </>
    ));
  };

  return (
    <div className="categories-container">
      <div className="categories-header">
        <div className="categories-title-btn">
          <Typography className="categories-title">
            Categories
          </Typography>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outlined"
              onClick={handleExportToExcel}
              startIcon={<FileDownloadIcon />}
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                },
              }}
            >
              Export to Excel
            </Button>
            <Button
              className="add-category-btn"
              variant="contained"
              onClick={() => {
                setEditCategory(null);
                handleOpen();
              }}
              startIcon={<AddIcon />}
            >
              Add Category
            </Button>
          </div>
        </div>
        <div className="search-add-container">
          <div className="search-container">
            <TextField
              className="search-field"
              placeholder="Search categories..."
              variant="outlined"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

        </div>
      </div>

      <TableContainer className="table-container">
        <Table>
          <TableHead className="table-header">
            <TableRow>
              <TableCell>Category</TableCell>
              {/* <TableCell>Description</TableCell> */}
              <TableCell>Status</TableCell>
              <TableCell>Products</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : paginatedCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body1" color="textSecondary">
                    No categories found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedCategories.map((category) => (
                <>
                  <TableRow
                    key={category._id}
                    className="category-row"
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <TableCell className="category-cell">
                      <div className="category-info" style={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent category click
                            handleExpandCategory(category._id);
                          }}
                        >
                          {expandedCategory === category._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                        <img
                          src={`${category.cImage}`}
                          alt={category.cName}
                          className="category-image"
                          onError={(e) => {
                            e.target.onerror = null;
                          }}
                        />
                        <div className="category-details">
                          <Typography className="category-name">
                            {category.cName}
                          </Typography>
                        </div>
                      </div>
                    </TableCell>
                    {/* <TableCell className="category-cell">
                      <Typography className="category-description">
                        {category.cDescription}
                      </Typography>
                    </TableCell> */}
                    <TableCell className="category-cell">
                      <div className={`status-chip ${category.cStatus === 'active' ? 'status-active' : 'status-inactive'}`}>
                        {category.cStatus === 'active' ? (
                          <CheckCircleIcon fontSize="small" />
                        ) : (
                          <CancelIcon fontSize="small" />
                        )}
                        {category.cStatus}
                      </div>
                    </TableCell>
                    <TableCell
                      className="category-cell"
                      onClick={() => navigate('/products', {
                        state: {
                          selectedCategory: category.cName,
                          fromCategories: true
                        }
                      })}
                      sx={{
                        cursor: 'pointer'
                      }}
                    >
                      <Typography className="category-products">
                        {category.products || 0} products
                      </Typography>
                    </TableCell>
                    <TableCell className="category-cell">
                      <div className="action-buttons">
                        <IconButton
                          className="action-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpen(category);
                          }}
                          color="primary"
                          size="small"
                          disabled={!canWrite(PERMISSIONS.CATEGORIES)}
                          sx={{
                            backgroundColor: 'rgba(25, 118, 210, 0.08)',
                            '&:hover': {
                              backgroundColor: 'rgba(25, 118, 210, 0.12)',
                            },
                            marginRight: 1
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          className="action-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(category._id);
                          }}
                          color="error"
                          size="small"
                          disabled={!canDelete(PERMISSIONS.CATEGORIES)}
                          sx={{
                            backgroundColor: 'rgba(211, 47, 47, 0.08)',
                            '&:hover': {
                              backgroundColor: 'rgba(211, 47, 47, 0.12)',
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                      <Collapse in={expandedCategory === category._id} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1, backgroundColor: '#f5f5f5', padding: 2, borderRadius: 1 }}>
                          <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 2
                          }}>
                            <Typography variant="h6" sx={{ color: 'primary.main' }}>
                              Subcategories
                            </Typography>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSubCategoryOpen(true);
                              }}
                              sx={{
                                backgroundColor: 'secondary.main',
                                '&:hover': { backgroundColor: 'secondary.dark' }
                              }}
                            >
                              Add Subcategory
                            </Button>
                          </Box>
                          <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: 'primary.light' }}>
                                  <TableCell>Name</TableCell>
                                  {/* <TableCell>Description</TableCell> */}
                                  <TableCell>Status</TableCell>
                                  <TableCell align="left">Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {category.subCategories?.length > 0 ? (
                                  category.subCategories.map((subCategory) => {
                                    const isSubCategoryExpanded = expandedSubCategories.has(`${category._id}-${subCategory._id}`);

                                    return (
                                      <React.Fragment key={subCategory._id}>
                                        <TableRow
                                          hover
                                          sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                                        >
                                          <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                              <IconButton
                                                size="small"
                                                onClick={() => handleSubCategoryExpand(category._id, subCategory._id)}
                                              >
                                                {isSubCategoryExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                              </IconButton>
                                              <Avatar
                                                src={subCategory.image ?
                                                  `${subCategory.image}` :
                                                  '/placeholder-image.png'
                                                }
                                                alt={subCategory.name}
                                                sx={{ width: 40, height: 40 }}
                                              />
                                              <Typography>{subCategory.name}</Typography>
                                            </Box>
                                          </TableCell>
                                          {/* <TableCell>{subCategory.description}</TableCell> */}
                                          <TableCell>
                                            <Chip
                                              label={subCategory.status}
                                              color={subCategory.status === 'active' ? 'success' : 'error'}
                                              size="small"
                                            />
                                          </TableCell>
                                          <TableCell align="right">
                                            <Box sx={{ display: 'center', gap: 1 }}>
                                              <IconButton
                                                size="small"
                                                onClick={() => handleEditSubCategory(category._id, subCategory)}
                                              >
                                                <EditIcon fontSize="small" />
                                              </IconButton>
                                              <IconButton
                                                size="small"
                                                onClick={() => {
                                                  setSelectedParentSubCategory(subCategory);
                                                  setNestedSubCategoryOpen(true);
                                                }}
                                              >
                                                <AddIcon fontSize="small" />
                                              </IconButton>
                                              <IconButton
                                                size="small"
                                                onClick={() => handleDeleteSubCategory(category._id, subCategory._id)}
                                              >
                                                <DeleteIcon fontSize="small" />
                                              </IconButton>
                                            </Box>
                                          </TableCell>
                                        </TableRow>

                                        {/* Nested Subcategories */}
                                        <TableRow>
                                          <TableCell colSpan={4} style={{ paddingBottom: 0, paddingTop: 0 }}>
                                            <Collapse in={isSubCategoryExpanded} timeout="auto" unmountOnExit>
                                              <Box sx={{ margin: 1 }}>
                                                <Table size="small">
                                                  <TableBody>
                                                    {subCategory.subCategories?.map((nestedSubCategory) => (
                                                      <TableRow key={nestedSubCategory._id}>
                                                        <TableCell>
                                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pl: 6 }}>
                                                            <Avatar
                                                              src={nestedSubCategory.image ?
                                                                `${nestedSubCategory.image}` :
                                                                '/placeholder-image.png'
                                                              }
                                                              alt={nestedSubCategory.name}
                                                              sx={{ width: 30, height: 30 }}
                                                            />
                                                            <Typography variant="body2">{nestedSubCategory.name}</Typography>
                                                          </Box>
                                                        </TableCell>
                                                        {/* <TableCell>
                                                          <Typography variant="body2">{nestedSubCategory.description}</Typography>
                                                        </TableCell> */}
                                                        <TableCell>
                                                          <Chip
                                                            label={nestedSubCategory.status}
                                                            color={nestedSubCategory.status === 'active' ? 'success' : 'error'}
                                                            size="small"
                                                          />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                          <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <IconButton
                                                              size="small"
                                                              onClick={() => handleEditNestedSubCategory(category._id, subCategory._id, nestedSubCategory)}
                                                            >
                                                              <EditIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton
                                                              size="small"
                                                              onClick={() => handleDeleteNestedSubCategory(category._id, subCategory._id, nestedSubCategory._id)}
                                                            >
                                                              <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                          </Box>
                                                        </TableCell>
                                                      </TableRow>
                                                    ))}
                                                  </TableBody>
                                                </Table>
                                              </Box>
                                            </Collapse>
                                          </TableCell>
                                        </TableRow>
                                      </React.Fragment>
                                    );
                                  })
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
                                      <Typography color="text.secondary">
                                        No subcategories found
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredCategories.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          className="pagination-container"
        />
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">
          {editCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent className="dialog-content">
          <div
            className="image-upload-container"
            onClick={() => fileInputRef.current.click()}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />
            {previewImage ? (
              <img
                src={previewImage}
                alt="Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <>
                <CloudUploadIcon className="image-upload-icon" />
                <Typography className="image-upload-text">
                  Click to upload image
                </Typography>
              </>
            )}
            {errors.image && (
              <Typography className="error-text">{errors.image}</Typography>
            )}
          </div>

          <div className="form-field">
            <TextField
              label="Name"
              name="name"
              fullWidth
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
            />
          </div>

          {/* <div className="form-field">
            <TextField
              label="Description"
              name="description"
              multiline
              rows={4}
              fullWidth
              value={formData.description}
              onChange={handleChange}
              error={!!errors.description}
              helperText={errors.description}
            />
          </div> */}

          <div className="form-field">
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </div>

          {errors.submit && (
            <Typography className="error-text" style={{ marginTop: '1rem' }}>
              {errors.submit}
            </Typography>
          )}
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button
            onClick={handleClose}
            className="dialog-button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            className="dialog-button"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (editCategory ? 'Update Category' : 'Add Category')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={subCategoryOpen}
        onClose={() => {
          setSubCategoryOpen(false);
          setEditSubCategoryData(null);
          setSubCategoryFormData({
            name: '',
            description: '',
            status: 'active',
            image: ''
          });
          setSubCategoryPreviewImage('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {loading ? <CircularProgress size={24} /> : (editSubCategoryData ? 'Edit Subcategory' : 'Add New Subcategory')}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubCategorySubmit} sx={{ mt: 2 }}>
            <Box
              onClick={() => subCategoryImageRef.current.click()}
              sx={{
                width: '100%',
                height: 200,
                border: '2px dashed #ccc',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                mb: 2,
                backgroundImage: subCategoryPreviewImage ? `url(${subCategoryPreviewImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <input
                type="file"
                accept="image/*"
                ref={subCategoryImageRef}
                style={{ display: 'none' }}
                onChange={handleSubCategoryImageUpload}
              />
              {!subCategoryPreviewImage && (
                <Box sx={{ textAlign: 'center' }}>
                  <AddPhotoAlternateIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Click to upload subcategory image
                  </Typography>
                </Box>
              )}
            </Box>

            <TextField
              fullWidth
              label="Name"
              name="name"
              value={subCategoryFormData.name}
              onChange={(e) => setSubCategoryFormData(prev => ({
                ...prev,
                name: e.target.value
              }))}
              required
              margin="normal"
            />
            {/* <TextField
              fullWidth
              label="Description"
              name="description"
              value={subCategoryFormData.description}
              onChange={(e) => setSubCategoryFormData(prev => ({
                ...prev,
                description: e.target.value
              }))}
              required
              margin="normal"
              multiline
              rows={3}
            /> */}
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={subCategoryFormData.status}
                label="Status"
                onChange={(e) => setSubCategoryFormData(prev => ({
                  ...prev,
                  status: e.target.value
                }))}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSubCategoryOpen(false);
            setEditSubCategoryData(null);
            setSubCategoryPreviewImage('');
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubCategorySubmit}
            variant="contained"
            disabled={loading || !subCategoryFormData.image}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              editSubCategoryData ? 'Update' : 'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={nestedSubCategoryOpen}
        onClose={() => {
          setNestedSubCategoryOpen(false);
          setEditingNestedSubCategory(null);
          setSubCategoryFormData({
            name: '',
            description: '',
            status: 'active',
            image: ''
          });
          setSubCategoryPreviewImage('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingNestedSubCategory ? 'Edit Nested Subcategory' : 'Add Nested Subcategory'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleNestedSubCategorySubmit} sx={{ mt: 2 }}>
            <Box
              onClick={() => subCategoryImageRef.current.click()}
              sx={{
                width: '100%',
                height: 200,
                border: '2px dashed #ccc',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                mb: 2,
                backgroundImage: subCategoryPreviewImage ? `url(${subCategoryPreviewImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <input
                type="file"
                accept="image/*"
                ref={subCategoryImageRef}
                style={{ display: 'none' }}
                onChange={handleSubCategoryImageUpload}
              />
              {!subCategoryPreviewImage && (
                <Box sx={{ textAlign: 'center' }}>
                  <AddPhotoAlternateIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Click to upload subcategory image
                  </Typography>
                </Box>
              )}
            </Box>

            <TextField
              fullWidth
              label="Name"
              name="name"
              value={subCategoryFormData.name}
              onChange={(e) => setSubCategoryFormData(prev => ({
                ...prev,
                name: e.target.value
              }))}
              required
              margin="normal"
            />
            {/* <TextField
              fullWidth
              label="Description"
              name="description"
              value={subCategoryFormData.description}
              onChange={(e) => setSubCategoryFormData(prev => ({
                ...prev,
                description: e.target.value
              }))}
              required
              margin="normal"
              multiline
              rows={3}
            /> */}
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={subCategoryFormData.status}
                label="Status"
                onChange={(e) => setSubCategoryFormData(prev => ({
                  ...prev,
                  status: e.target.value
                }))}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNestedSubCategoryOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleNestedSubCategorySubmit}
            variant="contained"
            disabled={loading || !subCategoryFormData.image}
          >
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Categories;