import React, { useState, useEffect } from 'react';
import { shippingApi } from '../api/shippApi';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Snackbar,
  Chip,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';
import usePermissions from '../hooks/usePermissions';
import { PERMISSIONS, ACTIONS } from '../constants/permissions';

const Shipping = () => {
  const [deliveryData, setDeliveryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingState, setEditingState] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Form state for new/edit delivery info
  const [formData, setFormData] = useState({
    state: '',
    productdeliveryfee: '',
    combodeliveryfee: '',
    above500_deliveryfee: ''
  });

  // Fetch delivery data on component mount
  useEffect(() => {
    fetchDeliveryData();
  }, []);

  const fetchDeliveryData = async () => {
    try {
      setLoading(true);
      const response = await shippingApi.getAllDeliveryInfo();
      if (response.success) {
        setDeliveryData(response.data);
      }
    } catch (error) {
      showSnackbar(error.message || 'Failed to fetch delivery data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (data = null) => {
    if (data) {
      // Edit mode
      setEditingState(data.state);
      setFormData({
        state: data.state,
        productdeliveryfee: data.productdeliveryfee.toString(),
        combodeliveryfee: data.combodeliveryfee.toString(),
        above500_deliveryfee: data.above500_deliveryfee.toString()
      });
    } else {
      // Add mode
      setEditingState(null);
      setFormData({
        state: '',
        productdeliveryfee: '',
        combodeliveryfee: '',
        above500_deliveryfee: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingState(null);
    setFormData({
      state: '',
      productdeliveryfee: '',
      combodeliveryfee: '',
      above500_deliveryfee: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Validate form data
      if (!formData.state || !formData.productdeliveryfee || 
          !formData.combodeliveryfee || !formData.above500_deliveryfee) {
        showSnackbar('All fields are required', 'error');
        return;
      }

      const submitData = {
        state: formData.state,
        productdeliveryfee: parseFloat(formData.productdeliveryfee),
        combodeliveryfee: parseFloat(formData.combodeliveryfee),
        above500_deliveryfee: parseFloat(formData.above500_deliveryfee)
      };

      if (editingState) {
        // Update existing
        await shippingApi.updateDeliveryInfo(editingState, submitData);
        showSnackbar('Delivery information updated successfully', 'success');
      } else {
        // Create new
        await shippingApi.createDeliveryInfo(submitData);
        showSnackbar('Delivery information created successfully', 'success');
      }

      handleCloseDialog();
      fetchDeliveryData();
    } catch (error) {
      showSnackbar(error.message || 'Operation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <ShippingIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Shipping & Delivery Management
        </Typography>
      </Box>

      {/* Add New Button */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Add New State
        </Button>
      </Box>

      {/* Delivery Data Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Delivery Fees by State
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography>Loading...</Typography>
            </Box>
          ) : deliveryData.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Typography color="textSecondary">
                No delivery information found. Add a new state to get started.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell><strong>State</strong></TableCell>
                    <TableCell align="right"><strong>Product Delivery Fee</strong></TableCell>
                    <TableCell align="right"><strong>Combo Delivery Fee</strong></TableCell>
                    {/* <TableCell align="right"><strong>Above ₹500 Delivery Fee</strong></TableCell> */}
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deliveryData.map((row) => (
                    <TableRow key={row.state} hover>
                      <TableCell>
                        <Chip 
                          label={row.state} 
                          color="primary" 
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="textSecondary">
                          {formatCurrency(row.productdeliveryfee)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="textSecondary">
                          {formatCurrency(row.combodeliveryfee)}
                        </Typography>
                      </TableCell>
                      {/* <TableCell align="right">
                        <Typography variant="body2" color="textSecondary">
                          {formatCurrency(row.above500_deliveryfee)}
                        </Typography>
                      </TableCell> */}
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(row)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingState ? `Edit Delivery Info - ${editingState}` : 'Add New State Delivery Info'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="State"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                disabled={!!editingState}
                placeholder="Enter state name"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Delivery Fee (₹)"
                name="productdeliveryfee"
                type="number"
                value={formData.productdeliveryfee}
                onChange={handleInputChange}
                placeholder="0.00"
                inputProps={{ min: 0, step: 0.01 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Combo Delivery Fee (₹)"
                name="combodeliveryfee"
                type="number"
                value={formData.combodeliveryfee}
                onChange={handleInputChange}
                placeholder="0.00"
                inputProps={{ min: 0, step: 0.01 }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Above ₹500 Delivery Fee (₹)"
                name="above500_deliveryfee"
                type="number"
                value={formData.above500_deliveryfee}
                onChange={handleInputChange}
                placeholder="0.00"
                inputProps={{ min: 0, step: 0.01 }}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            <CancelIcon sx={{ mr: 1 }} />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? null : <SaveIcon />}
          >
            {loading ? 'Saving...' : (editingState ? 'Update' : 'Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Shipping;
