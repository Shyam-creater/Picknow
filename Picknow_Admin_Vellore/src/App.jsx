import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import VendorDashboard from './pages/VendorDashboard';
import Layout from './components/Layout';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Vendors from './pages/Vendors';
import TransactionHistory from './pages/TransactionHistory';
import Deals from './pages/Deals';
import AdminUsers from './pages/AdminUsers';
import ComboOffers from './pages/ComboOffers';
import Orders from './pages/Orders';
import Brands from './pages/Brands';
import Blog from './pages/Blog';
import Users from './pages/Users';
import UserDetails from './pages/UserDetails';
import Shipping from './pages/Shipping';
// import Offers from './pages/Offers';
import { SnackbarProvider } from 'notistack';
import { OrderNotificationProvider } from './context/OrderNotificationContext';
import './index.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff4081',
      dark: '#c51162',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.08), 0px 1px 1px 0px rgba(0,0,0,0.05), 0px 1px 3px 0px rgba(0,0,0,0.04)',
    '0px 3px 1px -2px rgba(0,0,0,0.08), 0px 2px 2px 0px rgba(0,0,0,0.05), 0px 1px 5px 0px rgba(0,0,0,0.04)',
    '0px 3px 3px -2px rgba(0,0,0,0.08), 0px 3px 4px 0px rgba(0,0,0,0.05), 0px 1px 8px 0px rgba(0,0,0,0.04)',
    '0px 2px 4px -1px rgba(0,0,0,0.08), 0px 4px 5px 0px rgba(0,0,0,0.05), 0px 1px 10px 0px rgba(0,0,0,0.04)',
    '0px 3px 5px -1px rgba(0,0,0,0.08), 0px 5px 8px 0px rgba(0,0,0,0.05), 0px 1px 14px 0px rgba(0,0,0,0.04)',
    '0px 3px 5px -1px rgba(0,0,0,0.08), 0px 6px 10px 0px rgba(0,0,0,0.05), 0px 1px 18px 0px rgba(0,0,0,0.04)',
    '0px 4px 5px -2px rgba(0,0,0,0.08), 0px 7px 10px 1px rgba(0,0,0,0.05), 0px 2px 16px 1px rgba(0,0,0,0.04)',
    '0px 5px 5px -3px rgba(0,0,0,0.08), 0px 8px 10px 1px rgba(0,0,0,0.05), 0px 3px 14px 2px rgba(0,0,0,0.04)',
    '0px 5px 6px -3px rgba(0,0,0,0.08), 0px 9px 12px 1px rgba(0,0,0,0.05), 0px 3px 16px 2px rgba(0,0,0,0.04)',
    '0px 6px 6px -3px rgba(0,0,0,0.08), 0px 10px 14px 1px rgba(0,0,0,0.05), 0px 4px 18px 3px rgba(0,0,0,0.04)',
    '0px 6px 7px -4px rgba(0,0,0,0.08), 0px 11px 15px 1px rgba(0,0,0,0.05), 0px 4px 20px 3px rgba(0,0,0,0.04)',
    '0px 7px 8px -4px rgba(0,0,0,0.08), 0px 12px 17px 2px rgba(0,0,0,0.05), 0px 5px 22px 4px rgba(0,0,0,0.04)',
    '0px 7px 8px -4px rgba(0,0,0,0.08), 0px 13px 19px 2px rgba(0,0,0,0.05), 0px 5px 24px 4px rgba(0,0,0,0.04)',
    '0px 7px 9px -4px rgba(0,0,0,0.08), 0px 14px 21px 2px rgba(0,0,0,0.05), 0px 5px 26px 4px rgba(0,0,0,0.04)',
    '0px 8px 9px -5px rgba(0,0,0,0.08), 0px 15px 22px 2px rgba(0,0,0,0.05), 0px 6px 28px 5px rgba(0,0,0,0.04)',
    '0px 8px 10px -5px rgba(0,0,0,0.08), 0px 16px 24px 2px rgba(0,0,0,0.05), 0px 6px 30px 5px rgba(0,0,0,0.04)',
    '0px 8px 11px -5px rgba(0,0,0,0.08), 0px 17px 26px 2px rgba(0,0,0,0.05), 0px 6px 32px 5px rgba(0,0,0,0.04)',
    '0px 9px 11px -5px rgba(0,0,0,0.08), 0px 18px 28px 2px rgba(0,0,0,0.05), 0px 7px 34px 6px rgba(0,0,0,0.04)',
    '0px 9px 12px -6px rgba(0,0,0,0.08), 0px 19px 29px 2px rgba(0,0,0,0.05), 0px 7px 36px 6px rgba(0,0,0,0.04)',
    '0px 10px 13px -6px rgba(0,0,0,0.08), 0px 20px 31px 3px rgba(0,0,0,0.05), 0px 8px 38px 7px rgba(0,0,0,0.04)',
    '0px 10px 13px -6px rgba(0,0,0,0.08), 0px 21px 33px 3px rgba(0,0,0,0.05), 0px 8px 40px 7px rgba(0,0,0,0.04)',
    '0px 10px 14px -6px rgba(0,0,0,0.08), 0px 22px 35px 3px rgba(0,0,0,0.05), 0px 8px 42px 7px rgba(0,0,0,0.04)',
    '0px 11px 14px -7px rgba(0,0,0,0.08), 0px 23px 36px 3px rgba(0,0,0,0.05), 0px 9px 44px 8px rgba(0,0,0,0.04)',
    '0px 11px 15px -7px rgba(0,0,0,0.08), 0px 24px 38px 3px rgba(0,0,0,0.05), 0px 9px 46px 8px rgba(0,0,0,0.04)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
        },
        containedPrimary: {
          '&:hover': {
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
          },
        },
        containedSecondary: {
          '&:hover': {
            boxShadow: '0 4px 12px rgba(220, 0, 78, 0.3)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
          transition: 'transform 0.3s, box-shadow 0.3s',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 8,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#f8f9fa',
        },
      },
    },
  },
});

const PrivateRoute = ({ children, allowedUserType }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userType = localStorage.getItem('userType');

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedUserType && userType !== allowedUserType) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AuthRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userType = localStorage.getItem('userType');

  if (isLoggedIn) {
    if (userType === 'admin') {
      return <Navigate to="/" replace />;
    } else if (userType === 'vendor') {
      return <Navigate to="/vendor-dashboard" replace />;
    }
  }

  return children;
};

const App = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider 
          maxSnack={3} 
          autoHideDuration={3000}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <OrderNotificationProvider>
            <Router>
            <Routes>
              {/* Auth Routes */}
              <Route
                path="/login"
                element={
                  <AuthRoute>
                    <Login />
                  </AuthRoute>
                }
              />
              
              {/* Admin Routes */}
              <Route
                path="/"
                element={
                  <PrivateRoute allowedUserType="admin">
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="categories" element={<Categories />} />
                <Route path="vendors" element={<Vendors />} />
                <Route path="orders" element={<Orders />} />
                <Route path="transaction-history" element={<TransactionHistory />} />
                <Route path="combo-offers" element={<ComboOffers />} />
                <Route path="deals" element={<Deals />} />
                {/* <Route path="offers" element={<Offers />} /> */}
                <Route path="admin-users" element={<AdminUsers />} />
                <Route path="users" element={<Users />} />
                <Route path="users/:id" element={<UserDetails />} />
                <Route path="shipping" element={<Shipping />} />
                <Route path="brands" element={<Brands />} />
                <Route path="blog" element={<Blog />} />
              </Route>

              {/* Vendor Routes */}
              <Route
                path="/vendor-dashboard"
                element={
                  <PrivateRoute allowedUserType="vendor">
                    <VendorDashboard />
                  </PrivateRoute>
                }
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
          </OrderNotificationProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
