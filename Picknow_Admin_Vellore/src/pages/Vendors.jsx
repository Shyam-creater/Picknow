import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import {
  Box,
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
  IconButton,
  TextField,
  InputAdornment,
  TablePagination,
  CircularProgress,
  Chip,
  Button,
  Grid,
  DialogActions,
  Link,
  Divider,
  Avatar,
  useTheme,
  alpha,
  Card,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { fetchVendors, updateVendorStatus, deleteVendor } from '../redux/slices/vendorSlice';

const Vendors = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  
  // Redux state
  const { vendors, loading, error } = useSelector((state) => state.vendors);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [documentDialog, setDocumentDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentView, setDocumentView] = useState('preview'); // 'preview' or 'download'

  // Fetch vendors on component mount
  useEffect(() => {
    dispatch(fetchVendors());
  }, [dispatch]);

  // Show error notifications
  useEffect(() => {
    if (error) {
      enqueueSnackbar(error.message || 'An error occurred', { variant: 'error' });
    }
  }, [error, enqueueSnackbar]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredVendors = vendors.filter(vendor => 
    vendor.vendorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.businessInfo?.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (vendor) => {
    setSelectedVendor(vendor);
    setDetailsDialog(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialog(false);
    setSelectedVendor(null);
  };

  const handleUpdateStatus = async (vendorId, newStatus) => {
    try {
      await dispatch(updateVendorStatus({ 
        id: vendorId, 
        status: {
          adminApprovalStatus: newStatus,
          adminMessage: newStatus === 'approved' 
            ? 'Your registration has been approved. You can now start using your account.' 
            : 'Your registration has been rejected. Please contact support for more information.'
        }
      })).unwrap();
      
      enqueueSnackbar(
        newStatus === 'approved' 
          ? 'Vendor has been approved successfully' 
          : 'Vendor has been rejected',
        { variant: 'success' }
      );
      
      handleCloseDetails();
      dispatch(fetchVendors()); // Refresh the vendors list
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to update vendor status', { variant: 'error' });
    }
  };

  const handleUpdateVendorStatus = async (vendorId, isActive) => {
    try {
      await dispatch(updateVendorStatus({ 
        id: vendorId, 
        status: {
          vendorStatus: isActive ? 'active' : 'inactive'
        }
      })).unwrap();
      
      enqueueSnackbar(
        isActive ? 'Vendor has been activated' : 'Vendor has been deactivated',
        { variant: 'success' }
      );
      
      handleCloseDetails();
      dispatch(fetchVendors()); // Refresh the vendors list
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to update vendor status', { variant: 'error' });
    }
  };

  const getStatusChipColor = (status, adminApproval) => {
    if (adminApproval?.status === 'pending') return 'warning';
    if (adminApproval?.status === 'rejected') return 'error';
    if (status === 'active') return 'success';
    return 'default';
  };

  const getStatusLabel = (status, adminApproval) => {
    if (adminApproval?.status === 'pending') return 'Pending Approval';
    if (adminApproval?.status === 'rejected') return 'Rejected';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleViewDocument = (url, documentName) => {
    try {
      if (!url) {
        console.log('No URL provided for document:', documentName);
        enqueueSnackbar('Document URL not available', { variant: 'error' });
        return;
      }

      console.log('Original URL:', url);
      console.log('Document Name:', documentName);

      // Format the URL for viewing
      let viewUrl = url;
      if (url.includes('cloudinary')) {
        console.log('Processing Cloudinary URL');
        // Remove any existing transformations
        viewUrl = url.split('/upload/')[0] + '/upload/';
        console.log('Base URL:', viewUrl);
        
        // Add the document name as a parameter
        const formattedName = documentName.replace(/\s+/g, '_');
        viewUrl += `fl_attachment:${formattedName}/`;
        console.log('URL with attachment flag:', viewUrl);
        
        // Add the rest of the URL
        viewUrl += url.split('/upload/')[1];
        console.log('Final view URL:', viewUrl);
      }

      // Open in new tab
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error handling document view:', error);
      enqueueSnackbar('Error loading document. Please try downloading instead.', { variant: 'error' });
    }
  };

  const handleCloseDocumentDialog = () => {
    setDocumentDialog(false);
    setSelectedDocument(null);
    setDocumentView('preview');
  };

  const handleDownloadDocument = () => {
    try {
      if (selectedDocument?.originalUrl) {
        console.log('Downloading document:', selectedDocument.name);
        console.log('Original URL for download:', selectedDocument.originalUrl);
        
        // Create a temporary link element
        const link = document.createElement('a');
        let downloadUrl = selectedDocument.originalUrl;
        
        // Format the URL for download if it's from Cloudinary
        if (downloadUrl.includes('cloudinary')) {
          console.log('Processing Cloudinary download URL');
          downloadUrl = downloadUrl.split('/upload/')[0] + '/upload/';
          console.log('Base download URL:', downloadUrl);
          
          downloadUrl += `fl_attachment:${selectedDocument.name.replace(/\s+/g, '_')}/`;
          console.log('URL with attachment flag:', downloadUrl);
          
          downloadUrl += selectedDocument.originalUrl.split('/upload/')[1];
          console.log('Final download URL:', downloadUrl);
        }
        
        link.href = downloadUrl;
        link.download = `${selectedDocument.name}.pdf`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        console.log('Download link created:', {
          href: link.href,
          download: link.download
        });
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.log('No original URL available for download');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      enqueueSnackbar('Error downloading document. Please try again.', { variant: 'error' });
    }
  };

  const handleDeleteVendor = async () => {
    if (window.confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      try {
        await dispatch(deleteVendor(selectedVendor._id)).unwrap();
        enqueueSnackbar('Vendor deleted successfully', { variant: 'success' });
        handleCloseDetails();
        dispatch(fetchVendors()); // Refresh the vendors list
      } catch (error) {
        enqueueSnackbar(error.message || 'Failed to delete vendor', { variant: 'error' });
      }
    }
  };

  return (
    <Box sx={{ 
      p: { xs: 2, md: 3 },
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, #1a1c1e 0%, #2d3436 100%)'
        : 'linear-gradient(135deg, #f6f9fc 0%, #eef2f7 100%)',
      minHeight: '100vh'
    }}>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <Typography variant="h4" sx={{ 
              fontWeight: 700,
              color: theme.palette.text.primary,
              letterSpacing: '0.5px'
            }}>
              Vendors Management
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search vendors by name, business name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: theme.palette.primary.main }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 2,
                  backgroundColor: 'white',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
              gap: 2
            }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 2,
                borderRadius: 2,
                bgcolor: 'white',
                boxShadow: 1
              }}>
                <BusinessIcon color="primary" />
                <Box>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 600, lineHeight: 1 }}>
                    {filteredVendors.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Vendors
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Vendors Table Section */}
      <Paper sx={{ 
        borderRadius: 3, 
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        background: 'white',
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
              }}>
                <TableCell sx={{ fontWeight: 600, color: '#4f46e5', py: 2 }}>Vendor Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4f46e5', py: 2 }}>Business Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4f46e5', py: 2 }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4f46e5', py: 2 }}>Admin Approval</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4f46e5', py: 2 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4f46e5', py: 2 }}>Joined On</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4f46e5', py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <CircularProgress sx={{ color: '#6366f1' }} size={40} />
                  </TableCell>
                </TableRow>
              ) : filteredVendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <BusinessIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
                      <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>No vendors found</Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        Try adjusting your search to find what you're looking for.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVendors
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((vendor) => (
                    <TableRow 
                      key={vendor._id}
                      sx={{
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: '#f8fafc',
                          '& .action-button': {
                            opacity: 1,
                            transform: 'translateX(0)',
                          }
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ 
                            bgcolor: '#6366f1',
                            width: 36,
                            height: 36,
                            fontSize: '1rem',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)'
                          }}>
                            {vendor.vendorName?.charAt(0)}
                          </Avatar>
                          <Typography sx={{ fontWeight: 500, color: '#1e293b' }}>
                            {vendor.vendorName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: '#475569' }}>
                          {vendor.businessInfo?.businessName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2" sx={{ color: '#6366f1', fontWeight: 500 }}>
                            {vendor.email}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            {vendor.phoneNumber}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={vendor.adminApproval?.status === 'approved' ? 'Approved' : 
                                vendor.adminApproval?.status === 'rejected' ? 'Rejected' : 'Pending'}
                          color={vendor.adminApproval?.status === 'approved' ? 'success' : 
                                vendor.adminApproval?.status === 'rejected' ? 'error' : 'warning'}
                          size="small"
                          sx={{ 
                            borderRadius: '6px',
                            fontWeight: 600,
                            px: 1,
                            '& .MuiChip-label': { px: 2 },
                            boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={vendor.status === 'active' ? 'Active' : 'Inactive'}
                          color={vendor.status === 'active' ? 'success' : 'default'}
                          size="small"
                          sx={{ 
                            borderRadius: '6px',
                            fontWeight: 600,
                            px: 1,
                            '& .MuiChip-label': { px: 2 },
                            boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: '#475569' }}>
                          {vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString('en-GB') : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          className="action-button"
                          onClick={() => handleViewDetails(vendor)} 
                          size="small"
                          sx={{
                            bgcolor: '#f1f5f9',
                            color: '#6366f1',
                            transition: 'all 0.3s ease',
                            opacity: 0.9,
                            transform: 'translateX(-10px)',
                            '&:hover': {
                              bgcolor: '#6366f1',
                              color: 'white',
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredVendors.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid #e2e8f0',
            bgcolor: '#f8fafc',
            '.MuiTablePagination-select': {
              borderRadius: 1,
              '&:focus': {
                bgcolor: 'white'
              }
            },
            '.MuiTablePagination-selectIcon': {
              color: '#6366f1'
            }
          }}
        />
      </Paper>

      <Dialog 
        open={detailsDialog} 
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
            '& .MuiDialogTitle-root': {
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white',
              py: 3,
            }
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon />
          Vendor Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedVendor && (
            <Grid container spacing={3}>
              {/* Basic Information Section */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#1a237e', mr: 2 }}>
                      {selectedVendor.vendorName?.charAt(0)}
                    </Avatar>
                    <Typography variant="h6" color="primary">Basic Information</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PersonIcon color="primary" />
                        <Typography variant="subtitle2">Vendor Name</Typography>
                      </Box>
                      <Typography>{selectedVendor.vendorName}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <EmailIcon color="primary" />
                        <Typography variant="subtitle2">Email</Typography>
                      </Box>
                      <Typography>{selectedVendor.email}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PhoneIcon color="primary" />
                        <Typography variant="subtitle2">Phone Number</Typography>
                      </Box>
                      <Typography>{selectedVendor.phoneNumber}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <DescriptionIcon color="primary" />
                        <Typography variant="subtitle2">Status</Typography>
                      </Box>
                      <Chip
                        label={getStatusLabel(selectedVendor.status, selectedVendor.adminApproval)}
                        color={getStatusChipColor(selectedVendor.status, selectedVendor.adminApproval)}
                        sx={{ borderRadius: 1 }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Business Information Section */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BusinessIcon sx={{ color: '#1a237e', mr: 2 }} />
                    <Typography variant="h6" color="primary">Business Information</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Business Name
                      </Typography>
                      <Typography variant="body1">
                        {selectedVendor.businessInfo?.businessName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Business Type
                      </Typography>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {selectedVendor.businessInfo?.businessType}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Product Category
                      </Typography>
                      <Typography variant="body1">
                        {selectedVendor.businessInfo?.productCategory}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Documents Section */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DescriptionIcon sx={{ color: '#1a237e', mr: 2 }} />
                    <Typography variant="h6" color="primary">Documents</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Aadhar Card
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {selectedVendor.documents?.aadhar?.number}
                          </Typography>
                          {selectedVendor.documents?.aadhar?.document && (
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => handleViewDocument(selectedVendor.documents.aadhar.document, 'Aadhar Card')}
                            >
                              View
                            </Button>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          PAN Card
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {selectedVendor.documents?.pan?.number}
                          </Typography>
                          {selectedVendor.documents?.pan?.document && (
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => handleViewDocument(selectedVendor.documents.pan.document, 'PAN Card')}
                            >
                              View
                            </Button>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          GST Certificate
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {selectedVendor.documents?.gst?.number}
                          </Typography>
                          {selectedVendor.documents?.gst?.document && (
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => handleViewDocument(selectedVendor.documents.gst.document, 'GST Certificate')}
                            >
                              View
                            </Button>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                    {selectedVendor.documents?.fssai?.number && (
                      <Grid item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            FSSAI License
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">
                              {selectedVendor.documents?.fssai?.number}
                            </Typography>
                            {selectedVendor.documents?.fssai?.document && (
                              <Button 
                                size="small" 
                                variant="outlined"
                                onClick={() => handleViewDocument(selectedVendor.documents.fssai.document, 'FSSAI License')}
                              >
                                View
                              </Button>
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>

              {/* Bank Details Section */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AccountBalanceIcon sx={{ color: '#1a237e', mr: 2 }} />
                    <Typography variant="h6" color="primary">Bank Details</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Bank Name
                      </Typography>
                      <Typography variant="body1">
                        {selectedVendor.bankDetails?.bankName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Account Number
                      </Typography>
                      <Typography variant="body1">
                        {selectedVendor.bankDetails?.accountNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        IFSC Code
                      </Typography>
                      <Typography variant="body1">
                        {selectedVendor.bankDetails?.ifscCode}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Account Holder Name
                      </Typography>
                      <Typography variant="body1">
                        {selectedVendor.bankDetails?.accountHolderName}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Status Management Section */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BusinessIcon sx={{ color: '#1a237e', mr: 2 }} />
                    <Typography variant="h6" color="primary">Status Management</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 2, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 2,
                        backgroundColor: 'white'
                      }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Vendor Status
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Chip
                            label={selectedVendor?.status === 'active' ? 'Active' : 'Inactive'}
                            color={selectedVendor?.status === 'active' ? 'success' : 'default'}
                          />
                        </Box>
                        <Button
                          fullWidth
                          variant="contained"
                          color={selectedVendor?.status === 'active' ? 'error' : 'success'}
                          onClick={() => handleUpdateVendorStatus(selectedVendor?._id, selectedVendor?.status !== 'active')}
                          startIcon={selectedVendor?.status === 'active' ? 
                            <BlockIcon /> : 
                            <CheckCircleIcon />}
                        >
                          {selectedVendor?.status === 'active' ? 
                            'Deactivate Vendor Account' : 
                            'Activate Vendor Account'}
                        </Button>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 2, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 2,
                        backgroundColor: 'white'
                      }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Admin Approval
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Chip
                            label={selectedVendor?.adminApproval?.status === 'approved' ? 'Approved' : 
                                  selectedVendor?.adminApproval?.status === 'rejected' ? 'Rejected' : 'Pending'}
                            color={selectedVendor?.adminApproval?.status === 'approved' ? 'success' : 
                                  selectedVendor?.adminApproval?.status === 'rejected' ? 'error' : 'warning'}
                          />
                        </Box>
                        <Button
                          fullWidth
                          variant="contained"
                          color={selectedVendor?.adminApproval?.status === 'approved' ? 'error' : 'success'}
                          onClick={() => handleUpdateStatus(selectedVendor?._id, 
                            selectedVendor?.adminApproval?.status === 'approved' ? 'rejected' : 'approved')}
                          startIcon={selectedVendor?.adminApproval?.status === 'approved' ? 
                            <BlockIcon /> : 
                            <CheckCircleIcon />}
                        >
                          {selectedVendor?.adminApproval?.status === 'approved' ? 
                            'Reject Vendor Approval' : 
                            'Approve Vendor'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
          <Button 
            onClick={handleDeleteVendor}
            variant="contained"
            color="error"
            sx={{ 
              borderRadius: 2,
              px: 3,
              mr: 1,
              '&:hover': { transform: 'translateY(-2px)' },
              transition: 'transform 0.2s'
            }}
          >
            Delete Vendor
          </Button>
          <Button 
            onClick={handleCloseDetails}
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              px: 3,
              '&:hover': { transform: 'translateY(-2px)' },
              transition: 'transform 0.2s'
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Vendors;