import React, { useState, useEffect, memo, useMemo } from 'react';
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
  Chip,
  InputAdornment,
  TablePagination,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PersonIcon from '@mui/icons-material/Person';
// removed eye icon in favor of text button
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { PERMISSIONS, ACTIONS } from '../constants/permissions';
import usePermissions from '../hooks/usePermissions';
import { userApi } from '../api/userApi';
import { fetchOrders } from '../api/dashboardApi';
import { useSnackbar } from 'notistack';
import { UserAvatar } from '../components/UserAvatar';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [orders, setOrders] = useState([]);
  const [selectedUserOrders, setSelectedUserOrders] = useState(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [walletSummary, setWalletSummary] = useState(null);

  const { enqueueSnackbar } = useSnackbar();
  const { canRead, canWrite, canDelete, isSuperAdmin } = usePermissions();
  const navigate = useNavigate();

  // Memoize the permission check
  const hasPermission = useMemo(() => {
    return canRead(PERMISSIONS.USERS) || isSuperAdmin;
  }, [canRead, isSuperAdmin]);

  const fetchUsersAndOrders = async () => {
    try {
      setLoading(true);
      const [usersResponse, ordersResponse] = await Promise.all([
        userApi.getAllUsers(),
        fetchOrders()
      ]);

      if (usersResponse.success) {
        // Calculate delivered order count for each user
        const userOrderCount = {};
        ordersResponse.orders.forEach(order => {
          if (order.user && order.orderStatus === 'DELIVERED') {
            const userId = order.user._id || order.user;
            userOrderCount[userId] = (userOrderCount[userId] || 0) + 1;
          }
        });

        // Combine user data with their delivered order count
        const usersWithStats = usersResponse.users.map(user => ({
          ...user,
          orderCount: userOrderCount[user._id] || 0
        }));

        setUsers(usersWithStats);
        setOrders(ordersResponse.orders);
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to fetch data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission) {
      fetchUsersAndOrders();
    } else {
      setLoading(false);
    }
  }, [hasPermission]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (user) => {
    setEditUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      status: user.status || 'active'
    });
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditUser(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const phoneRegex = /^\+?[1-9]\d{9,11}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (editUser) {
        const response = await userApi.updateUser(editUser._id, formData);
        if (response.success) {
          enqueueSnackbar('User updated successfully', { variant: 'success' });
          fetchUsersAndOrders();
        }
      }
      handleClose();
    } catch (error) {
      enqueueSnackbar(error.message || 'Operation failed', { variant: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await userApi.deleteUser(id);
      if (response.success) {
        enqueueSnackbar('User deleted successfully', { variant: 'success' });
        fetchUsersAndOrders();
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to delete user', { variant: 'error' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({
      ...prev,
      [name]: undefined
    }));
  };

  const handleExportToExcel = () => {
    const exportData = users.map(user => ({
      'ID': user._id,
      'Name': user.name,
      'Email': user.email,
      'Phone': user.phone,
      'Status': user.status,
      'Created At': new Date(user.createdAt).toLocaleDateString(),
      'Orders Count': user.orderCount || 0,
      'Wallet Balance': user.walletBalance || 0
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, `users_list_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
  };

  const handleViewUserOrders = (user) => {
    // Navigate to dedicated page instead of popup
    navigate(`/users/${user._id}`);
  };

  const handleCloseOrderDialog = () => {
    setOrderDialogOpen(false);
    setSelectedUserOrders(null);
    setWalletTransactions([]);
    setWalletSummary(null);
  };

  const getOrderStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
        return 'success';
      case 'PENDING':
      case 'ORDER PLACED':
        return 'warning';
      case 'DISPATCHED':
        return 'info';
      case 'CANCELLED':
      case 'CANCELED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getWalletStatusColor = (status) => {
    switch ((status || '').toString().toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
      case 'CANCELLED':
      case 'CANCELED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {(canRead(PERMISSIONS.USERS) || isSuperAdmin) ? (
        <>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 3, 
              bgcolor: 'primary.main', 
              color: 'primary.contrastText',
              borderRadius: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <PersonIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  Users
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, opacity: 0.8 }}>
                  Manage customer accounts and view their activity
                </Typography>
                <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 500 }}>
                  Total Users: {users.length}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              gap: 2,
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <TextField
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  flex: 1,
                  minWidth: '200px',
                  maxWidth: '400px',
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: 'inherit',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                  },
                  '& .MuiInputAdornment-root': {
                    color: 'inherit',
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportToExcel}
                disabled={!canRead(PERMISSIONS.USERS)}
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                  },
                }}
              >
                Export to Excel
              </Button>
            </Box>
          </Paper>

          <Paper 
            elevation={0} 
            sx={{ 
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <TableContainer>
              {loading ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'background.default' }}>
                      <TableCell>User</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Orders</TableCell>
                      <TableCell>Wallet Balance</TableCell>
                      <TableCell>Joined On</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((user) => (
                        <TableRow 
                          key={user._id}
                          sx={{ 
                            '&:hover': { 
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <UserAvatar user={user} />
                              <Box>
                                <Typography 
                                  variant="subtitle2" 
                                  sx={{ 
                                    cursor: 'pointer',
                                    '&:hover': {
                                      color: 'primary.main',
                                      textDecoration: 'underline'
                                    }
                                  }}
                                  onClick={() => handleViewUserOrders(user)}
                                >
                                  {user.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {user.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{user.contact || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={`${user.orderCount || 0} Order`}
                              color={user.orderCount > 0 ? 'success' : 'default'}
                              size="small"
                              sx={{
                                fontWeight: 500,
                                '&.MuiChip-colorSuccess': {
                                  backgroundColor: '#e6f4ea',
                                  color: '#1e4620',
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            ₹{new Intl.NumberFormat('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            }).format(user.walletBalance || 0)}
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString('en-GB')}
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              onClick={() => handleViewUserOrders(user)}
                              variant="outlined"
                              size="small"
                              disabled={!canRead(PERMISSIONS.USERS)}
                              sx={{ mr: 1 }}
                            >
                              View details
                            </Button>
                            <IconButton 
                              onClick={() => handleEdit(user)} 
                              color="primary" 
                              size="small"
                              disabled={!canWrite(PERMISSIONS.USERS)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              onClick={() => handleDelete(user._id)} 
                              color="error" 
                              size="small"
                              disabled={!canDelete(PERMISSIONS.USERS)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            />
          </Paper>

          <Dialog 
            open={open} 
            onClose={handleClose} 
            maxWidth="sm" 
            fullWidth
            aria-labelledby="user-dialog-title"
          >
            <DialogTitle id="user-dialog-title">
              {editUser ? 'Edit User' : 'Add User'}
            </DialogTitle>
            <DialogContent>
              <Box component="form" sx={{ pt: 2 }}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  margin="normal"
                  required
                  error={!!errors.name}
                  helperText={errors.name}
                />

                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  margin="normal"
                  required
                  error={!!errors.email}
                  helperText={errors.email}
                />

                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  margin="normal"
                  error={!!errors.phone}
                  helperText={errors.phone}
                />

                <FormControl fullWidth margin="normal">
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
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSubmit} variant="contained">
                {editUser ? 'Update User' : 'Add User'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={orderDialogOpen}
            onClose={handleCloseOrderDialog}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <UserAvatar user={selectedUserOrders?.user} />
                <Box>
                  <Typography variant="h6">
                    {selectedUserOrders?.user?.name}'s Orders
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedUserOrders?.user?.email}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedUserOrders?.orders.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                  No orders found for this user
                  </Typography>
                  ) : (
                    <List>
                      {selectedUserOrders?.orders.map((order, index) => (
                        <React.Fragment key={order._id}>
                          {index > 0 && <Divider />}
                          <ListItem alignItems="flex-start">
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                  <Typography variant="subtitle1">
                                    Order #{order._id}
                                  </Typography>
                                  <Chip 
                                    label={order.orderStatus}
                                    color={getOrderStatusColor(order.orderStatus)}
                                    size="small"
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.primary">
                                    Amount: ₹{new Intl.NumberFormat('en-IN', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    }).format(order.finalAmount || 0)}
                                  </Typography>
                                  <Typography variant="body2">
                                    Date: {new Date(order.createdAt).toLocaleDateString()}
                                  </Typography>
                                  <Typography variant="body2">
                                    Items: {order.items?.length || 0}
                                  </Typography>
                                  {order.shippingAddress && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                      Shipping: {order.shippingAddress.address}, 
                                      {order.shippingAddress.city}, 
                                      {order.shippingAddress.state} - 
                                      {order.shippingAddress.pincode}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  )}
            </DialogContent>
            <Divider />
            <DialogTitle>
              Wallet Transactions
            </DialogTitle>
            <DialogContent>
              {walletLoading ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <CircularProgress size={24} />
                </Box>
              ) : walletTransactions.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                  No wallet transactions found for this user
                </Typography>
              ) : (
                <Box>
                  {walletSummary && (
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
                      <Chip label={`Total Credit: ₹${new Intl.NumberFormat('en-IN').format(walletSummary.totalCredit || 0)}`} color="success" variant="outlined" />
                      <Chip label={`Total Debit: ₹${new Intl.NumberFormat('en-IN').format(walletSummary.totalDebit || 0)}`} color="error" variant="outlined" />
                      <Chip label={`Net: ₹${new Intl.NumberFormat('en-IN').format(walletSummary.netAmount || 0)}`} color={(walletSummary.netAmount || 0) >= 0 ? 'success' : 'error'} />
                      <Chip label={`Completed: ${walletSummary.completedTransactions || 0}`} variant="outlined" />
                    </Box>
                  )}
                  <List>
                    {walletTransactions.map((tx, index) => {
                      const isCredit = (tx.type || '').toString().toLowerCase() === 'credit';
                      const amountLabel = `${isCredit ? '+' : '-'}₹${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(tx.amount || 0)}`;
                      return (
                        <React.Fragment key={tx._id || index}>
                          {index > 0 && <Divider />}
                          <ListItem alignItems="flex-start" sx={{ py: 1.5 }}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label={(tx.type || 'TRANSACTION').toString().toUpperCase()} size="small" variant="outlined" />
                                    <Chip label={(tx.status || 'UNKNOWN').toString().toUpperCase()} color={getWalletStatusColor(tx.status)} size="small" />
                                  </Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: isCredit ? 'success.main' : 'error.main' }}>
                                    {amountLabel}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                                  <Box>
                                    <Typography variant="body2" color="text.primary">
                                      {tx.description || tx.note || '—'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '-'}
                                    </Typography>
                                  </Box>
                                  {tx.balanceAfter != null && (
                                    <Typography variant="body2" color="text.secondary">
                                      Balance After: ₹{new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(tx.balanceAfter)}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        </React.Fragment>
                      );
                    })}
                  </List>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseOrderDialog}>Close</Button>
            </DialogActions>
          </Dialog>
        </>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            You don't have permission to view this page
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default memo(Users); 