import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import Navbar from "./components/Navbar/Navbar";
import AOS from "aos";
import CategoryNav from "./components/Navbar/CategoryNav";
import LandingPage from "./components/Landingpage/LandingPage";
import LoginModal from "./components/Login/LoginModal";
import ProductPage from "./components/ProductPage/ProductPage";
import CartPage from "./components/CartPage/CartPage";
import UserProfile from "./components/UserProfile/UserProfile";
import ProductDetail from "./components/ProductPage/ProductDetail";
import NewCombo from "./components/ComboOffer/NewCombo";
import ComboDetail from "./components/ComboOffer/ComboDetail";
import CategoryPage from "./components/CategoryPage/CategoryPage";
import DealsPage from "./components/DealsPage/DealsPage";
import PaymentPage from "./components/PaymentPage/PaymentPage";
import CategoryProducts from "./components/CategoryPage/CategoryProducts";
import TermsAndConditions from "./components/Footer/TermsAndConditions/TermsAndConditions";
import PrivacyPolicy from "./components/Footer/PrivacyPolicy/PrivacyPolicy";
import ShippingPolicy from "./components/Footer/ShippingPolicy/ShippingPolicy";
import ReturnRefundPolicy from "./components/Footer/Cancellation & Refund Policy/ReturnRefundPolicy";
import Refund from "./components/Footer/refund";
import SellerPage from "./components/SellerPage/SellerPage";
import SellerLogin from "./components/SellerPage/SellerLogin/SellerLogin";
import WhyChooseUs from "./components/WhyChooseUs/WhyChooseUs";
import SellerDashboard from "./components/SellerDashboard/SellerDashboard";
// import VendorRegistration from './components/VendorRegistration/VendorRegistration';

import VendorLandingPage from "./components/VendorPage/pages/LandingPage";
import NavbarVendor from "./components/VendorPage/NavbarVendor";
import RegisterForm from "./components/VendorPage/pages/RegisterForm";
import VendorDetailsForm from "./components/VendorPage/pages/VendorDetailsForm";
import PendingApproval from "./components/VendorPage/pages/PendingApproval";
import VendorDashboard from "./components/VendorPage/pages/VendorDashboard";
import LoginForm from "./components/VendorPage/pages/LoginForm";

import CheckoutPage from "./components/CartPage/CheckoutPage";
// import ComboOfferPage  from './components/ComboOfferPage/ComboOfferPage ';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import SearchResults from "./components/Search/SearchResults";
import BlogList from "./components/Blog/BlogList";
import BlogDetail from "./components/Blog/BlogDetail";
import BrandProducts from "./components/Brand/BrandProducts";
import WishlistPage from "./components/Wishlist/WishlistPage";
import Footer from "./components/Footer/Footer";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState("landing");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  useEffect(() => {
    const handleOpenLogin = () => setIsLoginModalOpen(true);
    window.addEventListener("openLogin", handleOpenLogin);
    return () => window.removeEventListener("openLogin", handleOpenLogin);
  }, []);

  const handleLogin = (status) => {
    setIsLoggedIn(status);
    if (!status) {
      localStorage.removeItem("currentUser");
      navigate("/");
    }
    // Dispatch event to notify other components
    window.dispatchEvent(new Event("loginStateChanged"));
  };

  // Function to check if navbar should be hidden
  const shouldHideNavbar = () => {
    return (
      location.pathname === "/SellerPage" ||
      location.pathname === "/SellerLogin" ||
      location.pathname.startsWith("/vendor") ||
      location.pathname === "/blog" ||
      location.pathname.startsWith("/blog/")
    );
  };

  // Function to check if CategoryNav should be shown
  const shouldShowCategoryNav = () => {
    return (location.pathname === "/" || location.pathname === "/products") &&
      !location.pathname.startsWith("/brand") &&
      location.pathname !== "/brands";
  };

  const handleVendorDetailsSubmit = (formData) => {
    // Handle the submission logic here
    console.log("Vendor details submitted", formData);
    // You can navigate to another page or perform other actions
  };

  // Function to check if footer should be hidden
  const shouldHideFooter = () => {
    return (
      location.pathname === "/SellerPage" ||
      location.pathname === "/SellerLogin" ||
      location.pathname.startsWith("/vendor")
    );
  };

  return (
    <SnackbarProvider maxSnack={3} autoHideDuration={2000} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <div className="app">
        {!shouldHideNavbar() && (
          <Navbar
            isLoggedIn={isLoggedIn}
            onLogout={() => handleLogin(false)}
            openLoginModal={() => setIsLoginModalOpen(true)}
          />
        )}
        <LoginModal
          open={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={(status) => handleLogin(status)}
        />
        {shouldShowCategoryNav() && <CategoryNav />}
        <div className="main-content">
          <Routes>
            <Route
              path="/"
              element={<LandingPage setCurrentPage={setCurrentPage} />}
            />
            <Route path="/products" element={<ProductPage />} />
            <Route path="/combo" element={<NewCombo />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/combo/:id" element={<ComboDetail />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/categories" element={<CategoryPage />} />
            <Route path="/category/:id" element={<CategoryProducts />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/refund" element={<Refund />} />
            <Route
              path="/terms-and-conditions"
              element={<TermsAndConditions />}
            />
            <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
            <Route path="/ShippingPolicy" element={<ShippingPolicy />} />
            <Route
              path="/ReturnRefundPolicy"
              element={<ReturnRefundPolicy />}
            />
            <Route path="/SellerLogin" element={<SellerLogin />} />
            <Route path="/SellerPage" element={<SellerPage />} />
            <Route path="/WhyChooseUs" element={<WhyChooseUs />} />
            <Route path="SellerDashboard" element={<SellerDashboard />} />
            <Route
              path="/vendor/register"
              element={<RegisterForm onRegister={handleLogin} />}
            />
            <Route path="/vendor" element={<VendorLandingPage />} />
            <Route path="/NavbarVendor" element={<VendorLandingPage />} />
            <Route
              path="/vendor/pending-approval"
              element={<PendingApproval />}
            />
            <Route
              path="/vendor/details"
              element={
                <VendorDetailsForm onSubmit={handleVendorDetailsSubmit} />
              }
            />
            <Route path="/vendor/dashboard" element={<VendorDashboard />} />
            <Route path="/vendor/login" element={<LoginForm />} />
            <Route path="/CheckoutPage" element={<CheckoutPage />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:canonicalUrl" element={<BlogDetail />} />
            <Route path="/brand/:brandId" element={<BrandProducts />} />
            <Route path="/brands" element={<BrandProducts />} />
            <Route path="/wishlist" element={<WishlistPage />} />
          </Routes>
        </div>
        {!shouldHideFooter() && <Footer />}
        <ToastContainer
          position="top-right"
          autoClose={800}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </SnackbarProvider>
  );
};

export default App;
