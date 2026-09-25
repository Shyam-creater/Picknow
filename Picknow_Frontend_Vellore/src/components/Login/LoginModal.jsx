import React, { useState, useEffect } from "react";
import {
  Dialog,
  IconButton,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  Divider,
  Zoom,
  styled
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { useSnackbar } from "notistack";
import axiosinstance from "../../APi/axiosInstance";
import { userApi } from "../../APi/userApi";
import picknowLogo from "../../assets/PicknowLogo.png";
import headerBg from "./login_modal_header_bg.png";

// Premium Styled Components
const GlassDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiBackdrop-root': {
    backdropFilter: 'blur(3px)',
    backgroundColor: 'rgba(3, 5, 8, 0.4)',
  },
  '& .MuiPaper-root': {
    borderRadius: '24px',
    width: '380px',
    maxWidth: '95vw',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    position: 'relative',
  }
}));

const ModalHeaderHero = styled(Box)({
  height: '100px',
  width: '100%',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  '& .hero-bg': {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'brightness(0.85) saturate(1.2)',
    zIndex: 0,
  },
  '& .hero-overlay': {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(255,255,255,1))',
    zIndex: 1,
  },
  '& .hero-content': {
    position: 'relative',
    zIndex: 2,
    textAlign: 'center',
  }
});

const ActionButton = styled(Button)(({ theme }) => ({
  height: '46px',
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 700,
  fontSize: '0.9rem',
  background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
  color: '#fff',
  boxShadow: '0 8px 16px rgba(15, 23, 42, 0.15)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 24px rgba(15, 23, 42, 0.2)',
  },
  '&:disabled': {
    background: '#e2e8f0',
    color: '#94a3b8'
  }
}));

const PremiumInput = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    transition: 'all 0.2s ease',
    fontSize: '0.875rem',
    '&:hover': {
      backgroundColor: '#f1f5f9',
    },
    '&.Mui-focused': {
      backgroundColor: '#fff',
      '& .MuiOutlinedInput-notchedOutline': {
        borderWidth: '2px',
        borderColor: '#3b82f6',
      }
    }
  },
  '& .MuiFormHelperText-root': {
    fontSize: '0.7rem',
    marginLeft: 4,
  }
});

const LoginModal = ({ open, onClose, onLoginSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [activeForm, setActiveForm] = useState("login");
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
    otp: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [resetStep, setResetStep] = useState(1);
  const [resendTimer, setResendTimer] = useState(0);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: "" });
    }
  };

  const showSnackbar = (message, variant = "info") => {
    enqueueSnackbar(message, { variant, autoHideDuration: 3000 });
  };

  useEffect(() => {
    if (!open || !GOOGLE_CLIENT_ID) return;
    const scriptId = "google-identity-script";
    const handleInit = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          const credential = response?.credential;
          if (!credential) return;
          setLoading(true);
          try {
            const result = await userApi.googleLogin(credential);
            localStorage.setItem("token", result.token);
            localStorage.setItem("user", JSON.stringify(result.user));
            showSnackbar("Login Successful", "success");
            onLoginSuccess(true);
            onClose();
          } catch (error) {
            showSnackbar(error.response?.data?.message || "Auth failed", "error");
          } finally {
            setLoading(false);
          }
        },
      });
      setGoogleReady(true);
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = handleInit;
      document.body.appendChild(script);
    } else {
      handleInit();
    }
  }, [open, GOOGLE_CLIENT_ID]);

  useEffect(() => {
    if (!googleReady || !open) return;
    if (activeForm !== "login") return;
    const renderBtn = () => {
      const el = document.getElementById("modal-google-btn");
      if (el && window.google?.accounts?.id) {
        el.innerHTML = "";
        window.google.accounts.id.renderButton(el, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: 300,
        });
      }
    };
    // Increased timeout to ensure the DOM is ready after framer-motion transitions
    const timer = setTimeout(renderBtn, 250);
    return () => clearTimeout(timer);
  }, [googleReady, activeForm, open]);

  useEffect(() => {
    if (!open) {
      setFormData({ name: "", email: "", password: "", contact: "", otp: "" });
      setFormErrors({});
      setActiveForm("login");
      setShowPassword(false);
      setResetStep(1);
      setResendTimer(0);
    }
  }, [open]);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      showSnackbar("Missing credentials", "warning");
      return;
    }
    setLoading(true);
    try {
      const response = await axiosinstance.post("/user/login", {
        email: formData.email,
        password: formData.password,
      });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      showSnackbar("Logged in successfully", "success");
      onLoginSuccess(true);
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || "Login failed";
      showSnackbar(msg, "error");
      if (msg.toLowerCase().includes("email")) setFormErrors(prev => ({ ...prev, email: msg }));
      else if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("credentials")) setFormErrors(prev => ({ ...prev, password: msg }));
      if (msg === "Please verify your account first") {
        localStorage.setItem("userEmail", formData.email);
        setActiveForm("verify-otp");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { name, email, password, contact } = formData;
    if (!name || !email || !password || !contact) {
      showSnackbar("All fields required", "warning");
      return;
    }
    setLoading(true);
    try {
      const response = await axiosinstance.post("/user/register", { name, email, password, contact });
      showSnackbar(response.data.message, "success");
      localStorage.setItem("activationToken", response.data.activationToken);
      localStorage.setItem("userEmail", email);
      setActiveForm("verify-otp");
    } catch (error) {
      const msg = error.response?.data?.message || "Registration failed";
      showSnackbar(msg, "error");
      if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("exist")) setFormErrors(prev => ({ ...prev, email: msg }));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("activationToken");
      const response = await axiosinstance.post("/user/verify", { otp: formData.otp }, { headers: { Authorization: `Bearer ${token}` } });
      showSnackbar(response.data.message, "success");
      localStorage.removeItem("activationToken");
      setActiveForm("login");
    } catch (error) {
      showSnackbar(error.response?.data?.message || "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      showSnackbar("Email is required", "warning");
      return;
    }
    setLoading(true);
    try {
      const response = await axiosinstance.post("/user/forgot-password", { email: formData.email });
      showSnackbar(response.data.message, "success");
      setResetStep(2);
      setResendTimer(60);
    } catch (error) {
      showSnackbar(error.response?.data?.message || "Failed to send reset code", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const { email, otp, password } = formData;
    if (!otp || !password) {
      showSnackbar("All fields are required", "warning");
      return;
    }
    setLoading(true);
    try {
      const response = await axiosinstance.post("/user/reset-password", {
        email,
        resetToken: otp,
        newPassword: password
      });
      showSnackbar(response.data.message, "success");
      setActiveForm("login");
      setResetStep(1);
    } catch (error) {
      showSnackbar(error.response?.data?.message || "Reset failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassDialog open={open} onClose={onClose} TransitionComponent={Zoom}>
      <ModalHeaderHero>
        <img 
          src={headerBg} 
          className="hero-bg" 
          alt="Hero Background" 
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.style.background = 'linear-gradient(135deg, #0f172a 0%, #3b82f6 100%)';
          }}
        />
        <div className="hero-overlay" />
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 12, color: '#fff', zIndex: 10 }}>
          <X size={20} />
        </IconButton>
        
        <Box className="hero-content">
          <img src={picknowLogo} alt="PickNow" style={{ height: '48px', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />
        </Box>
      </ModalHeaderHero>

      <Box sx={{ 
        px: { xs: 2.5, sm: 3.5 }, 
        pb: { xs: 3, sm: 4 },
        pt: 1,
        position: 'relative',
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeForm}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
                {activeForm === 'login' ? 'Welcome Back' : activeForm === 'register' ? 'Create Account' : activeForm === 'forgot-password' ? 'Reset Password' : 'Verify'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textAlign: 'center' }}>
                {activeForm === 'forgot-password' ? 'Follow steps to recover access' : 'Join our premium marketplace'}
              </Typography>
            </Box>

            {activeForm === 'login' && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5, '& > div': { transform: 'scale(0.9) !important' } }}>
                  <div id="modal-google-btn" />
                </Box>
                <Divider sx={{ mb: 2.5 }}>
                  <Typography variant="caption" sx={{ color: '#cbd5e1', px: 2, fontWeight: 800, fontSize: '0.6rem' }}>OR CONTINUE WITH EMAIL</Typography>
                </Divider>
              </>
            )}

            {activeForm === 'login' && (
              <form onSubmit={handleLogin}>
                <PremiumInput
                  fullWidth
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  size="medium"
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  sx={{ mb: 1.5 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Mail size={18} color="#94a3b8" /></InputAdornment>
                  }}
                />
                <PremiumInput
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  size="medium"
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock size={18} color="#94a3b8" /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} size="small" sx={{ mr: -0.5 }}>
                          {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <Box sx={{ mt: 1.5, textAlign: 'right' }}>
                  <Typography 
                    variant="caption" 
                    onClick={() => setActiveForm('forgot-password')}
                    sx={{ color: '#64748b', fontWeight: 700, cursor: 'pointer', transition: '0.2s', '&:hover': { color: '#3b82f6' } }}
                  >
                    Forgot Password?
                  </Typography>
                </Box>
                <ActionButton fullWidth type="submit" disabled={loading} sx={{ mt: 2.5, height: '48px' }}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
                </ActionButton>
                <Box sx={{ mt: 2.5, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.8rem' }}>
                    Don't have an account? <Typography component="span" onClick={() => setActiveForm('register')} sx={{ color: '#3b82f6', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem', ml: 0.5 }}>Sign Up</Typography>
                  </Typography>
                </Box>
              </form>
            )}

            {activeForm === 'register' && (
              <form onSubmit={handleRegister}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 1 }}>
                  <PremiumInput
                    fullWidth
                    name="name"
                    placeholder="Name"
                    value={formData.name}
                    onChange={handleChange}
                    size="medium"
                    error={!!formErrors.name}
                    InputProps={{ startAdornment: <InputAdornment position="start"><User size={16} color="#94a3b8" /></InputAdornment> }}
                  />
                  <PremiumInput
                    fullWidth
                    name="contact"
                    placeholder="Mobile"
                    value={formData.contact}
                    onChange={handleChange}
                    size="medium"
                    error={!!formErrors.contact}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Phone size={16} color="#94a3b8" /></InputAdornment> }}
                  />
                </Box>
                <PremiumInput
                  fullWidth
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  size="medium"
                  sx={{ mb: 1 }}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Mail size={18} color="#94a3b8" /></InputAdornment> }}
                />
                <PremiumInput
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  size="medium"
                  error={!!formErrors.password}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock size={18} color="#94a3b8" /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} size="small" sx={{ mr: -0.5 }}>
                          {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <ActionButton fullWidth type="submit" disabled={loading} sx={{ mt: 2.5, height: '48px' }}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Register Now'}
                </ActionButton>
                <Box sx={{ mt: 2.5, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.8rem' }}>
                    Joined already? <Typography component="span" onClick={() => setActiveForm('login')} sx={{ color: '#3b82f6', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem', ml: 0.5 }}>Log In</Typography>
                  </Typography>
                </Box>
              </form>
            )}

            {activeForm === 'verify-otp' && (
              <form onSubmit={handleVerifyOTP}>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 3, textAlign: 'center', fontSize: '0.85rem' }}>
                  Please enter the 6-digit code sent to your email.
                </Typography>
                <PremiumInput
                  fullWidth
                  name="otp"
                  placeholder="6-Digit Code"
                  value={formData.otp}
                  onChange={handleChange}
                  size="medium"
                  sx={{ mb: 2.5 }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><KeyRound size={18} color="#94a3b8" /></InputAdornment> }}
                />
                <ActionButton fullWidth type="submit" disabled={loading} sx={{ height: '48px' }}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Verify Account'}
                </ActionButton>
              </form>
            )}

            {activeForm === 'forgot-password' && (
              <Box>
                {resetStep === 1 ? (
                  <form onSubmit={handleRequestReset}>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2, textAlign: 'center', fontSize: '0.8rem' }}>
                      Enter your registered email to receive a password reset code.
                    </Typography>
                    <PremiumInput
                      fullWidth
                      name="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={handleChange}
                      size="medium"
                      sx={{ mb: 2.5 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Mail size={18} color="#94a3b8" /></InputAdornment>
                      }}
                    />
                    <ActionButton fullWidth type="submit" disabled={loading} sx={{ height: '48px' }}>
                      {loading ? <CircularProgress size={22} color="inherit" /> : 'Send Reset Code'}
                    </ActionButton>
                    <Box sx={{ mt: 2.5, textAlign: 'center' }}>
                      <Typography 
                        variant="body2" 
                        onClick={() => setActiveForm('login')} 
                        sx={{ color: '#3b82f6', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Back to Login
                      </Typography>
                    </Box>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword}>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2, textAlign: 'center', fontSize: '0.8rem' }}>
                      A reset code has been sent to your email.
                    </Typography>
                    <PremiumInput
                      fullWidth
                      name="otp"
                      placeholder="6-Digit Reset Code"
                      value={formData.otp}
                      onChange={handleChange}
                      size="medium"
                      sx={{ mb: 1.5 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><KeyRound size={18} color="#94a3b8" /></InputAdornment>
                      }}
                    />
                    <PremiumInput
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="New Password"
                      value={formData.password}
                      onChange={handleChange}
                      size="medium"
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Lock size={18} color="#94a3b8" /></InputAdornment>,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                              {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                    <ActionButton fullWidth type="submit" disabled={loading} sx={{ mt: 2.5, height: '48px' }}>
                      {loading ? <CircularProgress size={22} color="inherit" /> : 'Reset Password'}
                    </ActionButton>
                    <Box sx={{ mt: 2.5, textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.8rem' }}>
                        Didn't get code?{' '}
                        <Typography 
                          component="span" 
                          onClick={resendTimer === 0 ? handleRequestReset : undefined} 
                          sx={{ 
                            color: resendTimer === 0 ? '#3b82f6' : '#cbd5e1', 
                            fontWeight: 800, 
                            cursor: resendTimer === 0 ? 'pointer' : 'default',
                            fontSize: '0.8rem' 
                          }}
                        >
                          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Now'}
                        </Typography>
                      </Typography>
                    </Box>
                  </form>
                )}
              </Box>
            )}
          </motion.div>
        </AnimatePresence>
      </Box>
    </GlassDialog>
  );
};

export default LoginModal;
