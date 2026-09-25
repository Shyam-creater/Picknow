import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Tooltip,
  Checkbox,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import * as XLSX from 'xlsx';
import { PERMISSIONS, ACTIONS } from '../constants/permissions';
import usePermissions from '../hooks/usePermissions';
import { adminApi } from '../api/adminApi';
import { useSnackbar } from 'notistack';
import { getInitials } from '../utils/stringUtils';
import { getAvatarColor } from '../utils/colorUtils';
import { UserAvatar } from '../components/UserAvatar';

const AdminUsers = () => {
  const [adminUsers, setAdminUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);

  const { canRead, canWrite, canDelete, isSuperAdmin } = usePermissions();

  // Memoize permission check to prevent unnecessary re-renders
  const hasPermission = useMemo(() => {
    return canRead(PERMISSIONS.ADMIN_USERS) || isSuperAdmin;
  }, [canRead, isSuperAdmin]);

  // Memoize fetchAdminUsers function to prevent unnecessary re-renders
  const fetchAdminUsers = useCallback(async () => {
    if (!hasPermission) {
      enqueueSnackbar('You do not have permission to view admin users', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      const response = await adminApi.getAllAdmins();
      if (response.success) {
        setAdminUsers(response.admins);
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to fetch admin users', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [hasPermission, enqueueSnackbar]);

  // Only fetch admin users when permission changes
  useEffect(() => {
    if (hasPermission) {
      fetchAdminUsers();
    } else {
      setLoading(false);
    }
  }, [hasPermission, fetchAdminUsers]);

  // Memoize filtered users to prevent unnecessary recalculations
  const filteredUsers = useMemo(() => {
    return adminUsers.filter(user => 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [adminUsers, searchQuery]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleAdd = useCallback(() => {
    if (!canWrite(PERMISSIONS.ADMIN_USERS) && !isSuperAdmin) {
      enqueueSnackbar('You do not have permission to add admin users', { variant: 'error' });
      return;
    }

    setEditUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'admin',
      status: 'active'
    });
    setErrors({});
    setOpen(true);
  }, [canWrite, isSuperAdmin, enqueueSnackbar]);

  const handleEdit = useCallback((user) => {
    if (!canWrite(PERMISSIONS.ADMIN_USERS) && !isSuperAdmin) {
      enqueueSnackbar('You do not have permission to edit admin users', { variant: 'error' });
      return;
    }

    setEditUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      confirmPassword: '',
      role: user.role || 'admin',
      status: user.status || 'active'
    });
    setErrors({});
    setOpen(true);
  }, [canWrite, isSuperAdmin, enqueueSnackbar]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setEditUser(null);
    setErrors({});
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (!editUser && adminUsers.some(user => user.email === formData.email)) {
      newErrors.email = 'Email already exists';
    }

    if (!editUser) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, editUser, adminUsers]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!canWrite(PERMISSIONS.ADMIN_USERS) && !isSuperAdmin) {
      enqueueSnackbar('You do not have permission to perform this action', { variant: 'error' });
      return;
    }

    const { confirmPassword, ...userData } = formData;

    try {
      if (editUser) {
        const response = await adminApi.updateAdmin(editUser._id, userData);
        if (response.success) {
          enqueueSnackbar('Admin updated successfully', { variant: 'success' });
          fetchAdminUsers();
        }
      } else {
        const response = await adminApi.createAdmin(userData);
        if (response.success) {
          enqueueSnackbar('Admin created successfully', { variant: 'success' });
          fetchAdminUsers();
        }
      }
      handleClose();
    } catch (error) {
      enqueueSnackbar(error.message || 'Operation failed', { variant: 'error' });
    }
  }, [validateForm, canWrite, isSuperAdmin, formData, editUser, enqueueSnackbar, fetchAdminUsers, handleClose]);

  const handleDelete = useCallback(async (id) => {
    if (!canDelete(PERMISSIONS.ADMIN_USERS) && !isSuperAdmin) {
      enqueueSnackbar('You do not have permission to delete admin users', { variant: 'error' });
      return;
    }

    try {
      const user = adminUsers.find(u => u._id === id);
      const superAdmins = adminUsers.filter(u => u.role === 'super_admin');
      if (user.role === 'super_admin' && superAdmins.length === 1) {
        enqueueSnackbar('Cannot delete the last super admin', { variant: 'error' });
        return;
      }

      const response = await adminApi.deleteAdmin(id);
      if (response.success) {
        enqueueSnackbar('Admin deleted successfully', { variant: 'success' });
        fetchAdminUsers();
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to delete admin', { variant: 'error' });
    }
  }, [canDelete, isSuperAdmin, adminUsers, enqueueSnackbar, fetchAdminUsers]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({
      ...prev,
      [name]: undefined
    }));
  }, []);

  // Memoize role color function
  const getRoleColor = useCallback((role) => {
    switch (role) {
      case 'super_admin':
        return 'error';
      case 'admin':
        return 'primary';
      default:
        return 'default';
    }
  }, []);

  const handleSavePermissions = useCallback(async (permissions) => {
    if (!selectedUser || selectedUser.role === 'super_admin') return;
    
    if (!canWrite(PERMISSIONS.ADMIN_USERS) && !isSuperAdmin) {
      enqueueSnackbar('You do not have permission to update permissions', { variant: 'error' });
      return;
    }

    try {
      // Format permissions as a plain object
      const formattedPermissions = {};
      Object.entries(permissions).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          formattedPermissions[key] = value;
        }
      });

      const response = await adminApi.updateAdmin(selectedUser._id, {
        ...selectedUser,
        permissions: formattedPermissions
      });

      if (response.success) {
        enqueueSnackbar('Permissions updated successfully', { variant: 'success' });
        fetchAdminUsers(); // Refresh the list
        
        // Update currentUser if needed
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser && currentUser._id === selectedUser._id) {
          localStorage.setItem('currentUser', JSON.stringify({
            ...currentUser,
            permissions: formattedPermissions
          }));
        }
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to update permissions', { variant: 'error' });
    }
    
    setPermissionDialogOpen(false);
  }, [selectedUser, canWrite, isSuperAdmin, enqueueSnackbar, fetchAdminUsers]);

  // Memoize export function
  const handleExportToExcel = useCallback(() => {
    if (!canRead(PERMISSIONS.ADMIN_USERS) && !isSuperAdmin) {
      enqueueSnackbar('You do not have permission to export admin users', { variant: 'error' });
      return;
    }

    // Prepare the data for export
    const exportData = adminUsers.map(user => ({
      'ID': user._id,
      'Name': user.name,
      'Email': user.email,
      'Role': user.role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      'Status': user.status,
      'Created At': new Date(user.createdAt).toLocaleDateString(),
      'Permissions': Object.entries(user.permissions || {})
        .map(([module, actions]) => `${module}: ${actions.join(', ')}`)
        .join(' | ')
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Admin Users');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `admin_users_list_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
  }, [adminUsers, canRead, isSuperAdmin, enqueueSnackbar]);

  // Early return if no permission
  if (!hasPermission) {
    return (
      <Box>
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
            <SecurityIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                Admin Users
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5, opacity: 0.8 }}>
                Manage administrator accounts and permissions
              </Typography>
            </Box>
          </Box>
        </Paper>
        <Alert severity="error" sx={{ mb: 2 }}>
          You do not have permission to view admin users.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
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
          <SecurityIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Admin Users
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5, opacity: 0.8 }}>
              Manage administrator accounts and permissions
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
            placeholder="Search admin users..."
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
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportToExcel}
              disabled={!canRead(PERMISSIONS.ADMIN_USERS)}
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
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              disabled={!canWrite(PERMISSIONS.ADMIN_USERS)}
              sx={{ 
                bgcolor: 'white', 
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              Add Admin User
            </Button>
          </Box>
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
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Permissions</TableCell>
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
                            <Typography variant="subtitle2">
                              {user.name}
                              {user.role === 'super_admin' && (
                                <Tooltip title="Super Admin has full access to all features">
                                  <LockIcon 
                                    sx={{ 
                                      ml: 1, 
                                      fontSize: 16, 
                                      color: 'error.main',
                                      verticalAlign: 'middle'
                                    }} 
                                  />
                                </Tooltip>
                              )}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.role.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                          color={getRoleColor(user.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          color={user.status === 'active' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setSelectedUser(user);
                            setPermissionDialogOpen(true);
                          }}
                          disabled={!canWrite(PERMISSIONS.ADMIN_USERS)}
                        >
                          Manage Permissions
                        </Button>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          onClick={() => handleEdit(user)} 
                          color="primary" 
                          size="small"
                          disabled={!canWrite(PERMISSIONS.ADMIN_USERS)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDelete(user._id)} 
                          color="error" 
                          size="small"
                          disabled={
                            (user.role === 'super_admin' && 
                             adminUsers.filter(u => u.role === 'super_admin').length === 1) ||
                            !canDelete(PERMISSIONS.ADMIN_USERS)
                          }
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
        aria-labelledby="admin-dialog-title"
        disablePortal
      >
        <DialogTitle id="admin-dialog-title">
          {loading ? <CircularProgress size={24} /> : (editUser ? 'Edit Admin User' : 'Add Admin User')}
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
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required={!editUser}
              error={!!errors.password}
              helperText={editUser ? 'Leave blank to keep current password' : errors.password}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              margin="normal"
              required={!editUser}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                label="Role"
              >
                <MenuItem value="super_admin">Super Admin</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>

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

      <PermissionDialog
        open={permissionDialogOpen}
        onClose={() => setPermissionDialogOpen(false)}
        user={selectedUser}
        onSave={handleSavePermissions}
      />
    </Box>
  );
};

const PermissionDialog = ({ open, onClose, user, onSave }) => {
  const [permissions, setPermissions] = useState(() => {
    if (user?.role === 'super_admin') {
      return Object.values(PERMISSIONS).reduce((acc, key) => ({
        ...acc,
        [key]: [ACTIONS.READ, ACTIONS.WRITE, ACTIONS.DELETE]
      }), {});
    }
    // Convert permissions to plain object if needed
    return user?.permissions || {};
  });

  useEffect(() => {
    if (user) {
      if (user.role === 'super_admin') {
        setPermissions(Object.values(PERMISSIONS).reduce((acc, key) => ({
          ...acc,
          [key]: [ACTIONS.READ, ACTIONS.WRITE, ACTIONS.DELETE]
        }), {}));
      } else {
        setPermissions(user.permissions || {});
      }
    }
  }, [user]);

  const handlePermissionChange = (module, action) => {
    if (user?.role === 'super_admin') return;

    setPermissions(prev => {
      const newPermissions = { ...prev };
      
      if (!Array.isArray(newPermissions[module])) {
        newPermissions[module] = [];
      }

      if (action === ACTIONS.READ) {
        if (newPermissions[module].includes(ACTIONS.READ)) {
          newPermissions[module] = [];
        } else {
          newPermissions[module] = [ACTIONS.READ];
        }
      } else {
        if (newPermissions[module].includes(action)) {
          newPermissions[module] = newPermissions[module].filter(a => a !== action);
        } else {
          if (!newPermissions[module].includes(ACTIONS.READ)) {
            newPermissions[module] = [ACTIONS.READ, action];
          } else {
            newPermissions[module] = [...newPermissions[module], action];
          }
        }
      }

      return newPermissions;
    });
  };

  const handleSave = () => {
    // Convert permissions to the correct format before saving
    const formattedPermissions = Object.entries(permissions).reduce((acc, [key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    onSave(formattedPermissions);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      aria-labelledby="permissions-dialog-title"
      keepMounted // Add this to help with focus management
    >
      <DialogTitle id="permissions-dialog-title" sx={{ 
        pb: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}>
        <SecurityIcon color="primary" />
        <Box>
          Manage Permissions - {user?.name}
          {user?.role === 'super_admin' && (
            <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
              Super Admin has full access to all features and cannot be modified
            </Typography>
          )}
          {user?.role !== 'super_admin' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Configure access rights for different modules
            </Typography>
          )}
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Module</TableCell>
                <TableCell align="center">Read</TableCell>
                <TableCell align="center">Write</TableCell>
                <TableCell align="center">Delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.values(PERMISSIONS).map((module) => (
                <TableRow key={module}>
                  <TableCell>{module}</TableCell>
                  {Object.values(ACTIONS).map((action) => (
                    <TableCell key={action} align="center">
                      <Checkbox
                        checked={
                          user?.role === 'super_admin' || 
                          permissions[module]?.includes(action) || 
                          false
                        }
                        onChange={() => handlePermissionChange(module, action)}
                        disabled={
                          user?.role === 'super_admin' || 
                          (action !== ACTIONS.READ && !permissions[module]?.includes(ACTIONS.READ))
                        }
                        color={user?.role === 'super_admin' ? 'error' : 'primary'}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          disabled={user?.role === 'super_admin'}
        >
          Save Permissions
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminUsers; 