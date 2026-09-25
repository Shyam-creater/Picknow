import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { createBrand, getAllBrands, updateBrand, deleteBrand } from '../api/brandApi';

const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    logo: null
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Fetch brands on component mount
  useEffect(() => {
    fetchBrands();
  }, []);

  // Fetch all brands
  const fetchBrands = async () => {
    try {
      const data = await getAllBrands();
      setBrands(data);
    } catch (error) {
      toast.error(error.message || 'Error fetching brands');
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    if (e.target.name === 'logo') {
      const file = e.target.files[0];
      if (file) {
        setFormData({
          ...formData,
          logo: file
        });
        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  // Open modal for create/edit
  const handleOpen = (brand = null) => {
    if (brand) {
      setFormData({ name: brand.name, logo: null });
      setPreviewUrl(brand.logo);
      setSelectedBrand(brand);
    } else {
      setFormData({ name: '', logo: null });
      setPreviewUrl('');
      setSelectedBrand(null);
    }
    setOpen(true);
  };

  // Close modal
  const handleClose = () => {
    setOpen(false);
    setFormData({ name: '', logo: '' });
    setSelectedBrand(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsUploading(true);
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      if (formData.logo) {
        formDataToSend.append('logo', formData.logo);
      }

      if (selectedBrand) {
        await updateBrand(selectedBrand._id, formDataToSend);
        toast.success('Brand updated successfully');
      } else {
        await createBrand(formDataToSend);
        toast.success('Brand created successfully');
      }
      handleClose();
      fetchBrands();
    } catch (error) {
      toast.error(error.message || 'Error saving brand');
    } finally {
      setIsUploading(false);
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (brand) => {
    setSelectedBrand(brand);
    setDeleteDialogOpen(true);
  };

  // Handle brand deletion
  const handleDelete = async () => {
    try {
      await deleteBrand(selectedBrand._id);
      toast.success('Brand deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedBrand(null);
      fetchBrands();
    } catch (error) {
      toast.error(error.message || 'Error deleting brand');
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Brand Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Brand
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Logo</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {brands.map((brand) => (
              <TableRow key={brand._id}>
                <TableCell>
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                  />
                </TableCell>
                <TableCell>{brand.name}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpen(brand)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteClick(brand)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Modal */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="brand-modal-title"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography id="brand-modal-title" variant="h6" component="h2" mb={3}>
            {selectedBrand ? 'Edit Brand' : 'Create Brand'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Brand Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <Box mt={2}>
              <Input
                type="file"
                name="logo"
                onChange={handleInputChange}
                style={{ display: 'none' }}
                id="logo-upload"
                accept="image/*"
              />
              <label htmlFor="logo-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                >
                  {formData.logo ? 'Change Logo' : 'Upload Logo'}
                </Button>
              </label>
              {(previewUrl || formData.logo) && (
                <Box mt={2} display="flex" justifyContent="center">
                  <img
                    src={previewUrl || URL.createObjectURL(formData.logo)}
                    alt="Brand logo preview"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      objectFit: 'contain'
                    }}
                  />
                </Box>
              )}
            </Box>
            <Box mt={3} display="flex" justifyContent="flex-end" gap={1}>
              <Button onClick={handleClose}>Cancel</Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : (selectedBrand ? 'Update' : 'Create')}
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the brand "{selectedBrand?.name}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Brands;