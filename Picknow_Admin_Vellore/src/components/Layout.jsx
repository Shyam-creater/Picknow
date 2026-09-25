import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Tabs,
  Tab,
  Button,
  useTheme,
  useMediaQuery,
  Container,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  IconButton,
  Tooltip,
  SwipeableDrawer,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton
} from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ArticleIcon from '@mui/icons-material/Article';
import usePermissions from '../hooks/usePermissions';
import { PERMISSIONS, ACTIONS } from '../constants/permissions';
import LogoutConfirmationPopup from './LogoutConfirmationPopup';
import { useOrderNotifications } from '../context/OrderNotificationContext';
import Badge from '@mui/material/Badge';

// Memoize the Tab component
const NavTab = memo(({ label, ...props }) => (
  <Tab
    label={label}
    {...props}
    sx={{
      ...props.sx,
      '&:focus': {
        outline: 'none',
      },
    }}
  />
));

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [value, setValue] = useState(0);
  const { canRead, isSuperAdmin } = usePermissions();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { newOrdersCount } = useOrderNotifications();
  
  // Create constant for drawer/sidebar width
  const drawerWidth = sidebarOpen ? (isMobile ? 240 : 240) : 60;
  
  // Get user data from localStorage
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    role: ''
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser')) || {};
    setUserData({
      name: user.name || 'User',
      email: user.email || '',
      role: user.role || ''
    });
  }, []);

  // Define menuItems with icons
  const menuItems = useMemo(() => {
    const items = [
      { text: 'Dashboard', path: '/', permission: PERMISSIONS.DASHBOARD, icon: <DashboardIcon /> },
      { text: 'Products', path: '/products', permission: PERMISSIONS.PRODUCTS, icon: <ShoppingCartIcon /> },
      { text: 'Categories', path: '/categories', permission: PERMISSIONS.CATEGORIES, icon: <CategoryIcon /> },
      { text: 'Vendors', path: '/vendors', permission: PERMISSIONS.VENDORS, icon: <StorefrontIcon /> },
      { text: 'Brands', path: '/brands', permission: PERMISSIONS.BRANDS, icon: <StorefrontIcon /> },
      { text: 'Blog', path: '/blog', permission: PERMISSIONS.BLOG, icon: <ArticleIcon /> },
      { text: 'Voucher-History', path: '/transaction-history', permission: PERMISSIONS.TRANSACTION_HISTORY, icon: <LocalOfferIcon /> },
      // { text: 'Combo Offers', path: '/combo-offers', permission: PERMISSIONS.COMBO_OFFERS, icon: <ViewModuleIcon /> },
      { text: 'Deals', path: '/deals', permission: PERMISSIONS.DEALS, icon: <FlashOnIcon /> },
      { text: 'Orders', path: '/orders', permission: PERMISSIONS.ORDERS, icon: <ShoppingCartIcon /> },
      { text: 'Shipping', path: '/shipping', permission: PERMISSIONS.SHIPPING, icon: <LocalOfferIcon /> },
      { text: 'Users', path: '/users', permission: PERMISSIONS.USERS, icon: <PeopleIcon /> },
      { text: 'Admin Users', path: '/admin-users', permission: PERMISSIONS.ADMIN_USERS, icon: <AdminPanelSettingsIcon /> }
    ];

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // If super admin, show all items
    if (currentUser?.role === 'super_admin') {
      return items;
    }

    // For regular admin, only show items they have READ permission for
    return items.filter(item => {
      // Check if user has READ permission for this module
      return currentUser?.permissions?.[item.permission]?.includes(ACTIONS.READ);
    });
  }, []);

  // Now use menuItems in useEffect
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const currentPath = location.pathname.substring(1); // Remove leading slash

    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    // If not super admin, check permissions for current path
    if (currentUser && currentUser.role !== 'super_admin') {
      // Check if the current path matches any menu item
      const currentMenuItem = menuItems.find(item => {
        const itemPath = item.path.substring(1); // Remove leading slash
        return itemPath === currentPath || (itemPath === '' && currentPath === '');
      });

      if (currentMenuItem) {
        // Check if user has permission for this menu item
        const hasPermission = currentUser.permissions?.[currentMenuItem.permission]?.includes(ACTIONS.READ);
        
        if (!hasPermission) {
          // If no permission, redirect to first accessible page
          const firstAccessiblePage = menuItems.find(item => 
            currentUser.permissions?.[item.permission]?.includes(ACTIONS.READ)
          );
          
          if (firstAccessiblePage) {
            navigate(firstAccessiblePage.path);
          } else {
            navigate('/login');
          }
        }
      } else if (currentPath !== 'login' && currentPath !== '') {
        // If current path doesn't match any menu item and it's not login, check if it's a valid path
        const permissionKey = Object.keys(PERMISSIONS).find(key => 
          PERMISSIONS[key] === currentPath
        );

        if (permissionKey) {
          // Check if user has permission for this path
          const hasPermission = currentUser.permissions?.[PERMISSIONS[permissionKey]]?.includes(ACTIONS.READ);
          
          if (!hasPermission) {
            // Redirect to first accessible page
            const firstAccessiblePage = menuItems.find(item => 
              currentUser.permissions?.[item.permission]?.includes(ACTIONS.READ)
            );
            
            if (firstAccessiblePage) {
              navigate(firstAccessiblePage.path);
            } else {
              navigate('/login');
            }
          }
        }
      }
    }
  }, [location.pathname, navigate, menuItems]);

  // Update value when location changes
  useEffect(() => {
    const currentPath = location.pathname;
    const index = menuItems.findIndex(item => item.path === currentPath);
    if (index !== -1) {
      setValue(index);
    }
  }, [location.pathname, menuItems]);

  const handleChange = useCallback((event, newValue) => {
    if (newValue >= 0 && newValue < menuItems.length) {
      setValue(newValue);
      navigate(menuItems[newValue].path);
    }
  }, [menuItems, navigate]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('userType');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    if (isMobile || isTablet) {
      setDrawerOpen(!drawerOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const handleNavigation = (path, index) => {
    navigate(path);
    setValue(index);
    if (isMobile || isTablet) {
      setDrawerOpen(false);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [navigate]);

  // Get user's initials for the avatar
  const getUserInitials = () => {
    if (!userData.name) return 'U';
    
    const nameParts = userData.name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Memoize styles with stable references
  const styles = useMemo(() => ({
    appBar: {
      backgroundColor: '#fff',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      width: '100%', // Always full width
      zIndex: theme.zIndex.drawer + 1, // Make sure AppBar is above the drawer
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
    },
    toolbar: {
      minHeight: '56px', // Reduced from 64px
      backgroundColor: theme.palette.primary.main,
      padding: isMobile ? '0 8px' : isTablet ? '0 12px' : '0 16px', // Reduced padding
    },
    title: {
      color: '#fff',
      fontWeight: 600,
      fontSize: isMobile ? '0.9rem' : isTablet ? '1rem' : '1.2rem', // Reduced font sizes
      letterSpacing: '0.3px', // Reduced letter spacing
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    logoutButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      margin: '0 8px',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
      },
      '&:focus': {
        outline: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
      },
    },
    menuButton: {
      color: '#fff',
      marginRight: isMobile ? 1 : 2,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      transition: 'all 0.3s ease',
      padding: '8px',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        transform: 'scale(1.05)',
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '5px',
        height: '5px',
        background: 'rgba(255, 255, 255, 0.5)',
        opacity: 0,
        borderRadius: '100%',
        transform: 'scale(1, 1) translate(-50%)',
        transformOrigin: '50% 50%',
      },
      '&:focus:not(:active)::after': {
        animation: 'ripple 1s ease-out',
      },
    },
    menuButtonLabel: {
      display: { xs: 'none', sm: 'none', md: 'flex' },
      marginLeft: '8px',
      fontSize: '0.75rem',
      alignItems: 'center',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      fontWeight: 500,
      color: '#fff',
      transition: 'opacity 0.3s ease',
    },
    menuIcon: {
      transition: 'transform 0.3s ease',
      transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)',
    },
    toggleIcon: {
      transition: 'transform 0.3s ease',
    },
    tabs: {
      backgroundColor: '#fff',
      minHeight: '48px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
      '& .MuiTab-root': {
        color: '#666',
        fontSize: isMobile ? '0.75rem' : isTablet ? '0.8rem' : '0.875rem',
        padding: isMobile ? '6px' : isTablet ? '8px 16px' : '12px 24px',
        fontWeight: 500,
        minHeight: '48px',
        transition: 'all 0.2s ease-in-out',
        '&.Mui-selected': {
          color: theme.palette.primary.main,
          fontWeight: 600,
        },
        '&:hover': {
          color: theme.palette.primary.main,
          backgroundColor: 'rgba(25, 118, 210, 0.04)',
        },
        '&:focus': {
          outline: 'none',
        },
        '&.Mui-focusVisible': {
          backgroundColor: 'transparent',
        },
      },
      '& .MuiTabs-indicator': {
        backgroundColor: theme.palette.primary.main,
        height: 3,
      },
      display: { xs: 'none', sm: 'none', md: 'none' }, // Hide tabs completely as we're using sidebar for all views
    },
    tab: {
      minWidth: isMobile ? 'auto' : isTablet ? 100 : 120,
      textTransform: 'none',
      '&:focus': {
        outline: 'none',
      },
    },
    main: {
      flexGrow: 1,
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      padding: theme.spacing(1, 0), // Reduced vertical padding
      paddingTop: { xs: '56px', sm: '56px', md: '56px' }, // Reduced top padding to match the new header height
      width: { sm: '100%', md: `calc(100% - ${drawerWidth}px)` },
      ml: { sm: '0', md: `${drawerWidth}px` },
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      className: 'content-transition',
      overflowX: 'hidden', // Prevent horizontal scrolling
    },
    container: {
      padding: isMobile ? '8px 0' : isTablet ? '12px 0' : '16px 0', // Reduced padding
      maxWidth: '100%',
    },
    avatar: {
      cursor: 'pointer',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      color: theme.palette.primary.main,
      fontWeight: 'bold',
      width: isMobile ? 28 : 32, // Reduced avatar size
      height: isMobile ? 28 : 32, // Reduced avatar size
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 1)',
      }
    },
    userMenuContainer: {
      display: 'flex',
      alignItems: 'center',
      marginLeft: 'auto',
    },
    userInfoContainer: {
      marginRight: '8px',
      display: isMobile ? 'none' : isTablet ? 'none' : 'block',
      textAlign: 'right',
    },
    userName: {
      color: '#fff',
      fontWeight: 500,
      fontSize: '0.8rem', // Reduced from 0.9rem
      lineHeight: 1.1, // Reduced line height
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '150px',
    },
    userEmail: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '0.7rem', // Reduced from 0.75rem
      lineHeight: 1.1, // Reduced line height
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '150px',
    },
    userRole: {
      fontSize: '0.7rem',
      color: 'rgba(0, 0, 0, 0.5)',
      textTransform: 'capitalize',
      fontWeight: 500,
    },
    menuDivider: {
      margin: '8px 0',
    },
    menuHeader: {
      padding: '8px 16px',
      color: 'rgba(0, 0, 0, 0.6)',
      fontSize: '0.8rem',
      fontWeight: 500,
    },
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
      '& .MuiDrawer-paper': {
        width: drawerWidth,
        boxSizing: 'border-box',
        whiteSpace: 'nowrap',
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
        paddingTop: '56px', // Reduced from 64px
        marginTop: 0, // Start right below the header
        height: '100%', // Changed to 100%
        position: 'fixed',
        display: 'flex', // Added flex display
        flexDirection: 'column', // Added column direction
      },
    },
    mobileDrawer: {
      width: isMobile ? '85%' : drawerWidth, // Restore original width (85%)
      '& .MuiDrawer-paper': {
        width: isMobile ? '85%' : drawerWidth,
        boxSizing: 'border-box',
        transition: theme.transitions.create(['width', 'transform'], {
          easing: theme.transitions.easing.easeInOut,
          duration: 250, // Faster animation for mobile
        }),
        paddingTop: 0, // No padding for mobile drawer
        height: '100%',
        boxShadow: '4px 0 10px rgba(0,0,0,0.12)', // Add shadow for better depth
      },
    },
    mobileDrawerHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing(0, 2), // Restore original padding
      backgroundColor: theme.palette.primary.main,
      color: '#fff',
      minHeight: '64px', // Restore original height
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    drawerCollapsed: {
      width: drawerWidth,
      flexShrink: 0,
      '& .MuiDrawer-paper': {
        width: drawerWidth,
        boxSizing: 'border-box',
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        paddingTop: '56px', // Reduced from 64px
        marginTop: 0, // Start right below the header
        height: 'calc(100% - 56px)', // Adjusted for smaller header
        position: 'fixed',
      },
    },
    drawerHeader: {
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(0, 1),
      ...theme.mixins.toolbar,
      justifyContent: 'space-between',
      backgroundColor: theme.palette.primary.main,
      color: '#fff',
      minHeight: '56px', // Reduced from 64px
    },
    drawerList: {
      padding: theme.spacing(1, 0), // Reduced padding
    },
    drawerItem: {
      padding: theme.spacing(0.75, sidebarOpen ? 1.5 : 1), // Further reduced padding
      justifyContent: sidebarOpen ? 'initial' : 'center',
      '&.Mui-selected': {
        backgroundColor: 'rgba(25, 118, 210, 0.08)',
        borderLeft: `3px solid ${theme.palette.primary.main}`, // Reduced from 4px
        paddingLeft: theme.spacing(sidebarOpen ? 1.8 : 1.2), // Reduced padding
        '& .MuiListItemText-primary': {
          fontWeight: 600,
          color: theme.palette.primary.main,
        },
        '& .MuiListItemIcon-root': {
          color: theme.palette.primary.main,
        },
      },
      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
      },
    },
    drawerItemIcon: {
      minWidth: sidebarOpen ? 32 : 0, // Reduced from 40
      color: '#666',
      marginRight: sidebarOpen ? theme.spacing(1.5) : 'auto', // Reduced margin
      justifyContent: 'center',
    },
    toggleButtonContainer: {
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
    },
    drawerItemMobile: {
      padding: theme.spacing(1.5, 3), // Restore original padding
      borderRadius: '0 24px 24px 0', // Restore original radius
      marginRight: theme.spacing(1), // Restore original margin
      marginLeft: theme.spacing(0.5),
      marginBottom: theme.spacing(0.5),
      transition: 'all 0.2s ease',
      '&.Mui-selected': {
        backgroundColor: 'rgba(25, 118, 210, 0.12)',
        borderLeft: `4px solid ${theme.palette.primary.main}`, // Restore original border width
        paddingLeft: theme.spacing(2.5), // Restore original padding
        '& .MuiListItemText-primary': {
          fontWeight: 600,
          color: theme.palette.primary.main,
        },
        '& .MuiListItemIcon-root': {
          color: theme.palette.primary.main,
          marginLeft: '-4px', // Restore original value
        },
      },
      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
        transform: 'translateX(4px)', // Restore original value
      },
    },
    closeButton: {
      color: '#fff',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
      },
    },
  }), [theme.palette.primary.main, isMobile, isTablet, theme.spacing, theme.mixins.toolbar, theme.transitions, sidebarOpen, drawerWidth, theme.zIndex.drawer]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={styles.appBar}>
        <Toolbar sx={styles.toolbar}>
          {/* Single toggle button for all device sizes */}
          <Box sx={styles.toggleButtonContainer}>
            <Tooltip title={sidebarOpen ? "Close Menu" : "Open Menu"}>
              <IconButton
                color="inherit"
                aria-label={sidebarOpen ? "close sidebar" : "open sidebar"}
                edge="start"
                onClick={handleDrawerToggle}
                sx={styles.menuButton}
                className="menu-toggle-btn"
              >
                {sidebarOpen ? 
                  <CloseIcon className="toggle-icon toggle-icon-enter MuiIcon-closeIcon" /> : 
                  <MenuIcon className="toggle-icon toggle-icon-exit" />
                }
              </IconButton>
            </Tooltip>
          </Box>
          
          <Typography variant="h6" component="div" sx={{ 
            ...styles.title, 
            flexGrow: { xs: 1, md: 0 }, 
            ml: 1,
          }}>
            PickNow Admin
          </Typography>
          
          <Box sx={styles.userMenuContainer}>
            <Box sx={styles.userInfoContainer}>
              <Typography variant="body2" sx={styles.userName}>
                {userData.name}
              </Typography>
              <Typography variant="body2" sx={styles.userEmail}>
                {userData.email}
              </Typography>
            </Box>
            
            <Tooltip title="Account menu">
              <IconButton
                onClick={handleUserMenuOpen}
                size="small"
                aria-controls={open ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
              >
                <Avatar sx={styles.avatar}>{getUserInitials()}</Avatar>
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={anchorEl}
              id="account-menu"
              open={open}
              onClose={handleUserMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 3,
                sx: {
                  overflow: 'visible',
                  mt: 1.5,
                  width: 220,
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
            >
              <Box sx={styles.menuHeader}>ACCOUNT</Box>
              <MenuItem dense>
                <Box>
                  <Typography variant="body2" fontWeight={500}>{userData.name}</Typography>
                  <Typography variant="caption">{userData.email}</Typography>
                  <Typography sx={styles.userRole}>{userData.role}</Typography>
                </Box>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Permanent sidebar for desktop and tablet */}
      {!isMobile && !isTablet && (
        <Drawer
          variant="permanent"
          sx={sidebarOpen ? styles.drawer : styles.drawerCollapsed}
          className={sidebarOpen ? 'sidebar-visible' : 'sidebar-mini'}
        >
          <List sx={{ ...styles.drawerList, flex: 1 }}>
            {menuItems.map((item, index) => (
              <ListItem key={item.text} disablePadding>
                <Tooltip title={!sidebarOpen ? item.text : ""} placement="right">
                  <ListItemButton 
                    onClick={() => handleNavigation(item.path, index)}
                    selected={value === index}
                    sx={styles.drawerItem}
                    className={value === index ? 'sidebar-item active' : 'sidebar-item'}
                  >
                    <ListItemIcon sx={styles.drawerItemIcon}>
                      {item.path === '/orders' && newOrdersCount > 0 ? (
                        <Badge badgeContent={newOrdersCount} color="error">
                          {item.icon}
                        </Badge>
                      ) : (
                        item.icon
                      )}
                    </ListItemIcon>
                    {(sidebarOpen || false) && (
                      <ListItemText 
                        primary={item.text} 
                        primaryTypographyProps={{ 
                          sx: { 
                            fontWeight: value === index ? 600 : 400,
                            color: value === index ? theme.palette.primary.main : 'inherit',
                            opacity: sidebarOpen ? 1 : 0,
                            transition: 'opacity 0.3s',
                            fontSize: '0.85rem'
                          },
                          noWrap: true
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
          <Box sx={{ mt: 'auto' }}>
            <Divider />
            <List>
              <ListItem disablePadding>
                <Tooltip title={!sidebarOpen ? "Logout" : ""} placement="right">
                  <ListItemButton onClick={handleLogoutClick} sx={styles.drawerItem}>
                    <ListItemIcon sx={styles.drawerItemIcon}>
                      <LogoutIcon />
                    </ListItemIcon>
                    {sidebarOpen && (
                      <ListItemText 
                        primary="Logout" 
                        primaryTypographyProps={{
                          sx: { 
                            opacity: sidebarOpen ? 1 : 0, 
                            transition: 'opacity 0.3s',
                            fontSize: '0.85rem'
                          },
                          noWrap: true
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            </List>
          </Box>
        </Drawer>
      )}

      {/* Mobile/Tablet drawer */}
      <SwipeableDrawer
        sx={styles.mobileDrawer}
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
        variant="temporary"
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        disableBackdropTransition={!isMobile}
        disableDiscovery={isMobile}
        swipeAreaWidth={30}
        hysteresis={0.3} // More responsive swipe
      >
        <Box sx={styles.mobileDrawerHeader}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            PickNow Admin
          </Typography>
          <IconButton
            onClick={() => setDrawerOpen(false)}
            sx={styles.closeButton}
            aria-label="close drawer"
            className="menu-toggle-btn"
          >
            <CloseIcon className="toggle-icon MuiIcon-closeIcon" />
          </IconButton>
        </Box>
        <Divider />
        <List sx={{ pt: 1.5 }}>
          {menuItems.map((item, index) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton 
                onClick={() => handleNavigation(item.path, index)}
                selected={value === index}
                sx={styles.drawerItemMobile}
                className={value === index ? 'mobile-sidebar-item active' : 'mobile-sidebar-item'}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.path === '/orders' && newOrdersCount > 0 ? (
                    <Badge badgeContent={newOrdersCount} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    sx: { 
                      fontWeight: value === index ? 600 : 500,
                      fontSize: '0.95rem',
                    }, 
                    noWrap: true
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={handleLogoutClick} 
              sx={{ 
                ...styles.drawerItemMobile,
                color: theme.palette.error.main
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: theme.palette.error.main }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Logout" 
                primaryTypographyProps={{ 
                  sx: { 
                    fontWeight: 500, 
                    fontSize: '0.95rem'
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </SwipeableDrawer>

      <Box component="main" sx={styles.main} className="content-transition">
        <Container maxWidth={false} sx={styles.container} disableGutters>
          <Outlet />
        </Container>
      </Box>

      {/* Add the logout confirmation popup */}
      {showLogoutConfirm && (
        <LogoutConfirmationPopup
          onConfirm={handleLogout}
          onCancel={handleLogoutCancel}
        />
      )}
    </Box>
  );
};

export default memo(Layout); 