import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Paper, Typography, Chip, CircularProgress, List, ListItem, ListItemText, Divider, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { userApi } from '../api/userApi';
import { fetchOrders } from '../api/dashboardApi';
import { useSnackbar } from 'notistack';
import { UserAvatar } from '../components/UserAvatar';

const getOrderStatusColor = (status) => {
  switch ((status || '').toString().toUpperCase()) {
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

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [walletSummary, setWalletSummary] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [{ success: userOk, user: userData }, ordersData] = await Promise.all([
          userApi.getUserById(id),
          fetchOrders()
        ]);
        if (userOk && userData) {
          setUser(userData);
        }
        setOrders(ordersData.orders || []);
      } catch (error) {
        enqueueSnackbar(error.message || 'Failed to load user details', { variant: 'error' });
      } finally {
        setLoading(false);
      }
      try {
        setWalletLoading(true);
        const txResponse = await userApi.getAllUsersTransactions({ userId: id, page: 1, limit: 50 });
        const txs = txResponse?.data?.transactions || txResponse?.transactions || [];
        const summary = txResponse?.data?.summary || txResponse?.summary || null;
        setWalletTransactions(txs);
        setWalletSummary(summary);
      } catch (error) {
        enqueueSnackbar(error.message || 'Failed to fetch wallet transactions', { variant: 'error' });
      } finally {
        setWalletLoading(false);
      }
    };
    load();
  }, [id]);

  const userOrders = useMemo(() => {
    return orders.filter(order => {
      const userId = order.user?._id || order.user;
      return userId === id;
    });
  }, [orders, id]);

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <UserAvatar user={user} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>{user?.name}</Typography>
            <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
            <Typography variant="body2" color="text.secondary">User ID: {user?._id}</Typography>
          </Box>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/users')}
        >
          Back to Users
        </Button>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Orders</Typography>
        {userOrders.length === 0 ? (
          <Typography color="text.secondary">No orders found for this user</Typography>
        ) : (
          <List>
            {userOrders.map((order, index) => (
              <React.Fragment key={order._id}>
                {index > 0 && <Divider />}
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1">Order #{order._id}</Typography>
                        <Chip label={order.orderStatus} color={getOrderStatusColor(order.orderStatus)} size="small" />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.primary">
                          Amount: ₹{new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(order.finalAmount || 0)}
                        </Typography>
                        <Typography>
                          {order.shippingAddress.name} | ph: {order.shippingAddress.contact} 
                        </Typography>
                        <Typography variant="body2">Date: {new Date(order.createdAt).toLocaleDateString()}</Typography>
                        <Typography variant="body2">Items: {order.items?.length || 0}</Typography>
                        {order.shippingAddress && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Shipping: {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
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
      </Paper>

      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Wallet Transactions</Typography>
        {walletLoading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            {walletSummary && (
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
                <Chip label={`Total Credit: ₹${new Intl.NumberFormat('en-IN').format(walletSummary.totalCredit || 0)}`} color="success" variant="outlined" />
                <Chip label={`Total Debit: ₹${new Intl.NumberFormat('en-IN').format(walletSummary.totalDebit || 0)}`} color="error" variant="outlined" />
                <Chip label={`Net: ₹${new Intl.NumberFormat('en-IN').format(walletSummary.netAmount || 0)}`} color={(walletSummary.netAmount || 0) >= 0 ? 'success' : 'error'} />
                <Chip label={`Completed: ${walletSummary.completedTransactions || 0}`} variant="outlined" />
              </Box>
            )}
            {walletTransactions.length === 0 ? (
              <Typography color="text.secondary">No wallet transactions found for this user</Typography>
            ) : (
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
                                <Typography variant="body2" color="text.primary">{tx.description || tx.note || '—'}</Typography>
                                <Typography variant="body2" color="text.secondary">{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '-'}</Typography>
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
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default UserDetails;