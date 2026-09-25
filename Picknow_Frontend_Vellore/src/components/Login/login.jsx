import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosinstance from "../../APi/axiosInstance";
import { userApi } from "../../APi/userApi";
import "../Login/login.css";
import { useSnackbar } from 'notistack';
import { User, Mail, Lock, Phone, ArrowRight, KeyRound, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Box, IconButton } from '@mui/material';
import ModernLoader from "../Loading/ModernLoader";
import picknowLogo from "../../assets/PicknowLogo.png";

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
    otp: "",
    newPassword: "",
  });
  const [activeForm, setActiveForm] = useState("login");
  const [resetStep, setResetStep] = useState(1);
  const [activationToken, setActivationToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [googleReady, setGoogleReady] = useState(false);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }

    // Check for activation token when component mounts
    const storedToken = localStorage.getItem("activationToken");
    if (storedToken) {
      setActivationToken(storedToken);
      setActiveForm("verify-otp");
    }
  }, [navigate]);

  // Add countdown timer effect
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendTimer]);

  // Load Google Identity Services script once and initialize.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const scriptId = "google-identity-script";
    const handleInit = () => {
      if (!window.google?.accounts?.id) return;
      // Initialize once; renderButton can be called multiple times.
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
            if (onLogin) onLogin(true);
            navigate("/");
          } catch (error) {
            const errorMessage =
              (typeof error === "object" && error !== null && error.message) ||
              error?.response?.data?.message ||
              "Google authentication failed";
            showSnackbar(errorMessage, "error");
          } finally {
            setLoading(false);
          }
        },
      });

      setGoogleReady(true);
    };

    const existing = document.getElementById(scriptId);
    if (existing) {
      // Script tag already exists; try initializing immediately.
      handleInit();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = handleInit;
    document.body.appendChild(script);
  }, [GOOGLE_CLIENT_ID, navigate, onLogin]);

  // Render the Google button whenever the login/register form is active.
  useEffect(() => {
    if (!googleReady) return;
    if (activeForm !== "login") return;

    const renderBtn = () => {
      const el = document.getElementById("google-signin-button");
      if (!el || !window.google?.accounts?.id) return;

      // Clear previous rendering when switching forms.
      el.innerHTML = "";
      window.google.accounts.id.renderButton(el, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 260,
      });
    };

    // Use a small timeout to ensure the DOM element is rendered before GSI tries to use it.
    // This is especially important when switching between login/register forms.
    const timer = setTimeout(renderBtn, 150);
    return () => clearTimeout(timer);
  }, [googleReady, activeForm]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showSnackbar = (message, variant = 'info') => {
    enqueueSnackbar(message, {
      variant,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
      autoHideDuration: 3000
    });
  };

  // Registration Handler
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { name, email, password, contact } = formData;
      if (!name || !email || !password || !contact) {
        showSnackbar("All fields are required", "error");
        return;
      }

      const response = await axiosinstance.post("/user/register", {
        name,
        email,
        password,
        contact,
      });

      showSnackbar(response.data.message, "success");
      localStorage.setItem("activationToken", response.data.activationToken);
      localStorage.setItem("userEmail", email);
      setActivationToken(response.data.activationToken);
      setActiveForm("verify-otp");
      setResendTimer(60); // Start countdown after initial OTP is sent
    } catch (error) {
      showSnackbar(error.response?.data?.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosinstance.post("/user/login", {
        email: formData.email,
        password: formData.password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      
      if (onLogin) {
        onLogin(true);
      }

      navigate("/");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed";
      showSnackbar(errorMessage, "error");

      if (errorMessage === "Please verify your account first") {
        const email = formData.email;
        localStorage.setItem("userEmail", email);
        setActiveForm("verify-otp");
      }
    } finally {
      setLoading(false);
    }
  };

  // OTP Verification Handler
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.otp || formData.otp.length !== 6 || isNaN(formData.otp)) {
        showSnackbar("Please enter a valid 6-digit OTP", "error");
        return;
      }

      const token = localStorage.getItem("activationToken");
      if (!token) {
        showSnackbar("Verification token not found. Please register again.", "error");
        setTimeout(() => setActiveForm("register"), 2000);
        return;
      }

      const response = await axiosinstance.post(
        "/user/verify",
        { otp: formData.otp },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showSnackbar(response.data.message, "success");
      localStorage.removeItem("activationToken");
      localStorage.removeItem("userEmail");

      setTimeout(() => {
        setActiveForm("login");
        setFormData({
          ...formData,
          otp: "",
        });
      }, 2000);
    } catch (error) {
      if (error.response?.status === 401) {
        showSnackbar("OTP has expired. Please request a new one.", "error");
      } else {
        showSnackbar(error.response?.data?.message || "Verification failed", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Modified Resend OTP Handler
  const handleResendOTP = async () => {
    if (resendTimer > 0) {
      showSnackbar(`Please wait ${resendTimer} seconds before requesting a new OTP`, "warning");
      return;
    }

    try {
      const email = localStorage.getItem("userEmail");
      if (!email) {
        showSnackbar("Email not found. Please register again.", "error");
        setTimeout(() => setActiveForm("register"), 2000);
        return;
      }

      const response = await axiosinstance.post("/user/resend-otp", { email });
      localStorage.setItem("activationToken", response.data.activationToken);
      setActivationToken(response.data.activationToken);
      showSnackbar("New OTP sent successfully! Please check your email.", "success");
      setFormData({ ...formData, otp: "" });
      setResendTimer(60); // Start 60 second countdown
    } catch (error) {
      showSnackbar(error.response?.data?.message || "Failed to resend OTP", "error");
    }
  };

  // Request Password Reset Handler
  const handleRequestReset = async (e) => {
    e.preventDefault();
    try {
      if (!formData.email) {
        showSnackbar("Please enter your email address", "error");
        return;
      }

      const response = await axiosinstance.post("/user/forgot-password", {
        email: formData.email,
      });

      showSnackbar(response.data.message, "success");
      setResetStep(2);
    } catch (error) {
      showSnackbar(error.response?.data?.message || "Failed to request password reset", "error");
    }
  };

  // Reset Password Handler
  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      if (!formData.email || !formData.otp || !formData.newPassword) {
        showSnackbar("Please fill in all fields", "error");
        return;
      }

      if (formData.otp.length !== 6 || isNaN(formData.otp)) {
        showSnackbar("Please enter a valid 6-digit reset code", "error");
        return;
      }

      const response = await axiosinstance.post("/user/reset-password", {
        email: formData.email,
        resetToken: formData.otp,
        newPassword: formData.newPassword,
      });

      showSnackbar(response.data.message, "success");
      setTimeout(() => {
        setActiveForm("login");
        setResetStep(1);
        setFormData({
          name: "",
          email: "",
          password: "",
          contact: "",
          otp: "",
          newPassword: "",
        });
      }, 2000);
    } catch (error) {
      showSnackbar(error.response?.data?.message || "Failed to reset password", "error");
    }
  };

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="auth-form login">
      <div className="form-logo-container">
        <img src={picknowLogo} alt="PickNow" className="form-logo" />
      </div>
      <h2>Welcome Back</h2>
      <p className="instructions">Sign in to continue to your account</p>
      
      <div className="input-group">
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <Mail className="input-icon" size={20} />
      </div>
      
      <div className="input-group">
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <Lock className="input-icon" size={20} />
      </div>

      <button type="submit">
        Sign In
        <ArrowRight size={20} className="button-icon" />
      </button>

      <div className="google-divider">or</div>
      <div className="google-button-wrap">
        <div id="google-signin-button" />
      </div>

      <div className="auth-links">
        <button type="button" onClick={() => setActiveForm("forgot-password")}>
          Forgot Password?
        </button>
        <button type="button" onClick={() => setActiveForm("register")}>
          New user? Create an account
        </button>
      </div>
    </form>
  );

  const renderRegisterForm = () => (
    <form onSubmit={handleRegister} className="auth-form register">
      <div className="form-logo-container">
        <img src={picknowLogo} alt="PickNow" className="form-logo" />
      </div>
      <h2>Create Account</h2>
      <p className="instructions">Join us to start shopping</p>

      <div className="input-group">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <User className="input-icon" size={20} />
      </div>

      <div className="input-group">
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <Mail className="input-icon" size={20} />
      </div>

      <div className="input-group">
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <Lock className="input-icon" size={20} />
      </div>

      <div className="input-group">
        <input
          type="text"
          name="contact"
          placeholder="Contact Number"
          value={formData.contact}
          onChange={handleChange}
          required
        />
        <Phone className="input-icon" size={20} />
      </div>

      <button type="submit">
        Create Account
        <ArrowRight size={20} className="button-icon" />
      </button>



      <div className="auth-links">
        <button type="button" onClick={() => setActiveForm("login")}>
          Already have an account? Sign in
        </button>
      </div>
    </form>
  );

  const renderVerifyOTPForm = () => (
    <form onSubmit={handleVerifyOTP} className="auth-form verify-otp">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <IconButton
          onClick={() => {
            setActiveForm('login');
            localStorage.removeItem('activationToken');
            localStorage.removeItem('userEmail');
          }}
          sx={{
            color: '#4a5568',
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.04)'
            }
          }}
        >
          <ArrowLeft size={24} />
        </IconButton>
        <h2>Verify Account</h2>
      </Box>
      <p className="instructions">
        Please enter the 6-digit OTP sent to your email address
      </p>

      <div className="otp-input-container">
        <div className="input-group">
          <KeyRound size={20} className="input-icon" />
          <input
            type="text"
            name="otp"
            placeholder="Enter 6-digit OTP"
            value={formData.otp}
            onChange={handleChange}
            maxLength={6}
            pattern="[0-9]*"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />
        </div>
      </div>

      <button type="submit">
        Verify OTP
        <ShieldCheck size={20} className="button-icon" />
      </button>

      <div className="resend-container">
        <p>Didn't receive the OTP?</p>
        <button 
          type="button" 
          onClick={handleResendOTP} 
          className={`resend-btn ${resendTimer > 0 ? 'disabled' : ''}`}
          disabled={resendTimer > 0}
        >
          {resendTimer > 0 
            ? `Resend OTP in ${resendTimer}s` 
            : 'Resend OTP'}
        </button>
      </div>
    </form>
  );

  const renderForgotPasswordForm = () => {
    if (resetStep === 1) {
      return (
        <form onSubmit={handleRequestReset} className="auth-form forgot-password">
          <h2>Forgot Password</h2>
          <p className="instructions">Enter your email to receive a reset code</p>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <button type="submit">Request Reset Code</button>
          <div className="auth-links">
            <button type="button" onClick={() => setActiveForm("login")}>
              Back to Login
            </button>
          </div>
        </form>
      );
    }

    return (
      <form onSubmit={handleResetPassword} className="auth-form forgot-password">
        <h2>Reset Password</h2>
        <p className="instructions">Enter the reset code sent to your email</p>
        <input
          type="text"
          name="otp"
          placeholder="6-digit Reset Code"
          value={formData.otp}
          onChange={handleChange}
          maxLength={6}
          pattern="[0-9]*"
          required
        />
        <input
          type="password"
          name="newPassword"
          placeholder="New Password"
          value={formData.newPassword}
          onChange={handleChange}
          required
        />
        <button type="submit">Reset Password</button>
        <div className="auth-links">
          <button
            type="button"
            onClick={() => {
              setResetStep(1);
              setFormData({ ...formData, otp: "", newPassword: "" });
            }}
          >
            Request New Code
          </button>
          <button type="button" onClick={() => setActiveForm("login")}>
            Back to Login
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="auth-wrapper full-page">
      {loading && (
        <div className="loader-container">
          <ModernLoader 
            showTiming={false} 
            animationType="pulse" 
            size={0.7} 
            customMessage="Authenticating..."
            showProgress={false}
            backgroundColor="rgba(255, 255, 255, 0.95)"
          />
        </div>
      )}
      {activeForm === "login" && renderLoginForm()}
      {activeForm === "register" && renderRegisterForm()}
      {activeForm === "verify-otp" && renderVerifyOTPForm()}
      {activeForm === "forgot-password" && renderForgotPasswordForm()}
    </div>
  );
};

export default Login;
