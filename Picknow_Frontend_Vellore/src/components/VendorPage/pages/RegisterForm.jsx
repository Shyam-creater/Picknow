import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  InputAdornment,
  styled,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material';
import vendorApi from '../../../api/vendorApi';
import '../styles/Forms.css';   // ← updated CSS file
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Styled overrides kept minimal — CSS file handles most ─── */
const PageContainer = styled(Box)(() => ({
  className: 'page-container'           // fallback; CSS class is primary
}));

const stepVariants = {
  hidden:  { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, x: -24, transition: { duration: 0.25 } }
};

/* ── Logo SVG ─────────────────────────────────────────────── */
const StoreLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28, color: '#fff' }}>
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);

/* ── Email icon for OTP card ─────────────────────────────── */
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const RegisterForm = ({ onRegister }) => {
  const navigate  = useNavigate();
  const theme     = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState({
    name: '', email: '', phoneNumber: '',
    password: '', confirmPassword: '',
    businessName: '', businessType: '', category: ''
  });

  const [errors,              setErrors]              = useState({});
  const [step,                setStep]                = useState(1);
  const [otp,                 setOtp]                 = useState('');
  const [isLoading,           setIsLoading]           = useState(false);
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationToken,   setRegistrationToken]   = useState('');
  const [emailVerified,       setEmailVerified]       = useState(false);

  /* ── Check existing progress ─────────────────────────────── */
  useEffect(() => {
    const checkRegistrationProgress = async () => {
      const token = localStorage.getItem('registrationToken');
      if (!token) return;
      try {
        const response = await vendorApi.checkRegistrationProgress();
        if (response.success) {
          if (response.registrationStep === 4 || response.isFullyRegistered) {
            toast.error('This vendor account already exists. Please login instead.');
            localStorage.removeItem('registrationToken');
            setTimeout(() => navigate('/vendor/login'), 3000);
            return;
          }
          setStep(response.registrationStep);
          setEmailVerified(response.emailVerified);
          setRegistrationToken(response.token);
          if (response.emailVerified && response.vendor) {
            setFormData(prev => ({
              ...prev,
              name:        response.vendor.name        || '',
              email:       response.vendor.email       || '',
              phoneNumber: response.vendor.phoneNumber || ''
            }));
          }
        }
      } catch {
        localStorage.removeItem('registrationToken');
      }
    };
    checkRegistrationProgress();
  }, []);

  const categories = [
    'Electronics','Fashion','Home & Kitchen','Beauty & Personal Care',
    'Books','Toys & Games','Food & Grocery','Health & Wellness',
    'Sports & Outdoors','Automotive','Other'
  ];

  const businessTypes = [
    'Sole Proprietorship','Partnership','Limited Liability Company (LLC)',
    'Corporation','Franchise','Online Business','Other'
  ];

  /* ── Validation helpers ──────────────────────────────────── */
  const validateEmail       = e => /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(e);
  const validatePhoneNumber = p => /^\d{10}$/.test(p.replace(/[^0-9]/g, ''));
  const validatePassword    = p => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(p);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    let valid = true;
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
      toast.error('Please enter a valid full name'); valid = false;
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
      toast.error('Please enter a valid email address'); valid = false;
    }
    if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Must be 10 digits';
      toast.error('Phone number must be 10 digits'); valid = false;
    }
    if (!validatePassword(formData.password)) {
      toast.error('Password needs 8+ chars, uppercase, lowercase & number'); valid = false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match'); valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const validateStep2 = () => {
    if (!otp.trim() || otp.length !== 6) {
      setErrors({ otp: 'Enter the 6-digit code' });
      toast.error('Please enter the 6-digit OTP'); return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const newErrors = {};
    let valid = true;
    if (!formData.businessName?.trim()) { newErrors.businessName = 'Required'; toast.error('Enter your business name'); valid = false; }
    if (!formData.businessType?.trim()) { newErrors.businessType = 'Required'; toast.error('Select a business type'); valid = false; }
    if (!formData.category?.trim())     { newErrors.category = 'Required'; toast.error('Select a product category'); valid = false; }
    setErrors(newErrors);
    return valid;
  };

  /* ── Step handler ────────────────────────────────────────── */
  const handleNextStep = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (step === 1) {
        if (!validateStep1()) return;
        toast.info('Sending verification code…');
        const res = await vendorApi.registerStep1({
          name: formData.name, email: formData.email,
          phoneNumber: formData.phoneNumber, password: formData.password
        });
        if (res.success) {
          setRegistrationToken(res.token);
          setStep(2);
          toast.success('Verification code sent! Check your email.');
        } else { toast.error(res.message || 'Failed to send code'); }

      } else if (step === 2) {
        if (!validateStep2()) return;
        toast.info('Verifying…');
        try {
          const res = await vendorApi.verifyOTP({ email: formData.email, otp });
          if (res.success) {
            if (res.nextStep === 5) {
              toast.error('Account already exists. Please login.');
              localStorage.removeItem('registrationToken');
              setTimeout(() => navigate('/vendor/login'), 3000); return;
            }
            setEmailVerified(true);
            if (res.hasBusinessInfo) {
              toast.success('Email verified! Please login to continue.');
              navigate('/vendor/login');
            } else {
              setStep(3);
              toast.success('Email verified! Fill in your business details.');
            }
          } else { toast.error(res.message || 'Invalid code. Try again.'); }
        } catch (err) {
          if (err.response?.data?.isFullyRegistered) {
            toast.error('Email already registered. Please login.');
            localStorage.removeItem('registrationToken');
            setTimeout(() => navigate('/vendor/login'), 3000); return;
          }
          handleError(err);
        }

      } else if (step === 3) {
        if (!validateStep3()) return;
        toast.info('Saving business info…');
        const res = await vendorApi.registerStep3({
          businessName: formData.businessName,
          businessType: formData.businessType,
          category: formData.category
        });
        if (res.success) {
          toast.success('Registration successful! Please login to continue.');
          navigate('/vendor/login');
        } else { toast.error(res.message || 'Failed to save'); }
      }
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  };

  const handleError = (error) => {
    if (error.message?.includes('timeout'))       toast.error('Server timeout. Please try again.');
    else if (error.message === 'Network error')   toast.error('No connection. Check your internet.');
    else if (error.message === 'Vendor not found'){ toast.error('Session expired. Restarting…'); setStep(1); localStorage.removeItem('registrationToken'); }
    else toast.error(error.message || 'Something went wrong.');
  };

  const handleResendOTP = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await vendorApi.resendOTP({ email: formData.email });
      if (res.success) toast.success('New code sent! Check your email.');
      else toast.error(res.message || 'Failed to resend');
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  };

  /* ── Shared TextField props ──────────────────────────────── */
  const textFieldProps = {
    fullWidth: true,
    variant:   'outlined',
    margin:    'none',
    sx: {
      '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        background: '#f8fafc',
        fontFamily: "'DM Sans', sans-serif",
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        '&:hover': { background: '#fff', transform: 'translateY(-1px)', boxShadow: '0 2px 8px rgba(59,130,246,0.12)' },
        '&.Mui-focused': { background: '#fff', boxShadow: '0 0 0 3px rgba(29,78,216,0.12), 0 2px 8px rgba(59,130,246,0.12)' },
      },
      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0', borderWidth: '1.5px' },
      '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1d4ed8', borderWidth: '2px' },
      '& .MuiInputLabel-root': { fontFamily: "'DM Sans', sans-serif" },
      '& .MuiInputLabel-root.Mui-focused': { color: '#1d4ed8' },
      '& .MuiInputBase-input': { fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', padding: '14px 16px' },
    }
  };

  const submitBtnSx = {
    mt: 1,
    py: '14px',
    borderRadius: '12px',
    fontFamily: "'Sora', sans-serif",
    fontWeight: 700,
    fontSize: '1rem',
    textTransform: 'none',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
    letterSpacing: '0.01em',
    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
    '&:hover': {
      background: 'linear-gradient(135deg, #0d9e72 0%, #047857 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(16,185,129,0.45)',
    },
    '&:active': { transform: 'translateY(0)', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' },
    '&:disabled': { background: '#e2e8f0', color: '#94a3b8', boxShadow: 'none', transform: 'none' }
  };

  const stepperSx = {
    mb: 5,
    '& .MuiStepLabel-label': { fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.75rem', mt: 0.75 },
    '& .MuiStepLabel-label.Mui-active':    { color: '#1d4ed8' },
    '& .MuiStepLabel-label.Mui-completed': { color: '#10b981' },
    '& .MuiStepIcon-root': { width: 36, height: 36, color: '#e2e8f0', transition: 'all 0.25s ease' },
    '& .MuiStepIcon-root.Mui-active':    { color: '#1d4ed8', filter: 'drop-shadow(0 0 6px rgba(29,78,216,0.3))' },
    '& .MuiStepIcon-root.Mui-completed': { color: '#10b981' },
    '& .MuiStepIcon-text': { fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '0.75rem' },
    '& .MuiStepConnector-line': { borderColor: '#e2e8f0', borderTopWidth: 2 },
    '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line':    { borderColor: '#1d4ed8' },
    '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': { borderColor: '#10b981' },
  };

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <Box
      className="page-container"
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse 80% 60% at 20% -10%, rgba(16,185,129,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 90% 100%, rgba(29,78,216,0.07) 0%, transparent 60%), #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: { xs: 0, sm: '32px 16px' },
        fontFamily: "'DM Sans', sans-serif"
      }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      <Container
        maxWidth="sm"
        disableGutters={isMobile}
        sx={{ width: '100%' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: { xs: 0, sm: '28px' },
              boxShadow: { xs: 'none', sm: '0 4px 24px rgba(15,23,42,0.10), 0 1px 4px rgba(15,23,42,0.06)' },
              padding: { xs: '28px 20px 48px', sm: '48px 52px' },
              minHeight: { xs: '100vh', sm: 'auto' },
              position: 'relative',
              overflow: 'hidden',
              background: '#fff',
              transition: 'box-shadow 0.3s ease, transform 0.3s ease',
              '&:hover': {
                boxShadow: { sm: '0 16px 48px rgba(15,23,42,0.14), 0 4px 12px rgba(15,23,42,0.08)' },
                transform: { sm: 'translateY(-2px)' }
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
                borderRadius: { xs: 0, sm: '28px 28px 0 0' }
              }
            }}
          >
            {/* ── Header ─────────────────────────────────── */}
            <Box sx={{ textAlign: 'center', mb: { xs: 3.5, sm: 4.5 } }}>
              <Box
                sx={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 },
                  background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                  borderRadius: { xs: '14px', sm: '16px' },
                  mb: 2.5
                }}
              >
                <StoreLogo />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 800,
                  fontSize: { xs: '1.5rem', sm: '1.875rem' },
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  mb: 0.75
                }}
              >
                Vendor Registration
              </Typography>
              <Typography sx={{ fontSize: '0.9375rem', color: '#94a3b8', fontFamily: "'DM Sans', sans-serif" }}>
                Join our marketplace in 3 easy steps
              </Typography>
            </Box>

            {/* ── Stepper ────────────────────────────────── */}
            <Stepper activeStep={step - 1} alternativeLabel sx={stepperSx}>
              {['Personal Info', 'Verify Email', 'Business Details'].map(label => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* ── Step Content ───────────────────────────── */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                  <Typography
                    sx={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '1.0625rem',
                      color: '#1e293b', mb: 3,
                      display: 'flex', alignItems: 'center', gap: 1.25,
                      '&::before': { content: '""', display: 'block', width: 4, height: 18,
                        background: 'linear-gradient(180deg,#10b981,#3b82f6)', borderRadius: '2px' }
                    }}
                  >
                    Personal Information
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
                    <TextField {...textFieldProps} label="Full Name" name="name"
                      value={formData.name} onChange={handleChange}
                      error={!!errors.name} helperText={errors.name} />

                    <TextField {...textFieldProps} label="Email Address" name="email" type="email"
                      value={formData.email} onChange={handleChange} error={!!errors.email} />

                    <TextField {...textFieldProps} label="Phone Number" name="phoneNumber"
                      value={formData.phoneNumber} onChange={handleChange}
                      error={!!errors.phoneNumber} helperText={errors.phoneNumber}
                      inputProps={{ maxLength: 10 }} />

                    <TextField {...textFieldProps} label="Password" name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password} onChange={handleChange}
                      error={!!errors.password} helperText={errors.password}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(p => !p)} edge="end"
                              sx={{ color: '#94a3b8', '&:hover': { color: '#1d4ed8', background: '#eff6ff' } }}>
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }} />

                    <TextField {...textFieldProps} label="Confirm Password" name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword} onChange={handleChange}
                      error={!!errors.confirmPassword} helperText={errors.confirmPassword}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowConfirmPassword(p => !p)} edge="end"
                              sx={{ color: '#94a3b8', '&:hover': { color: '#1d4ed8', background: '#eff6ff' } }}>
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }} />
                  </Box>

                  <Button fullWidth variant="containeda" onClick={handleNextStep}
                    disabled={isLoading} sx={submitBtnSx}>
                    {isLoading ? 'Sending code…' : 'Continue →'}
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                  <Typography
                    sx={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '1.0625rem',
                      color: '#1e293b', mb: 3,
                      display: 'flex', alignItems: 'center', gap: 1.25,
                      '&::before': { content: '""', display: 'block', width: 4, height: 18,
                        background: 'linear-gradient(180deg,#10b981,#3b82f6)', borderRadius: '2px' }
                    }}
                  >
                    Verify Your Email
                  </Typography>

                  {/* Info card */}
                  <Box
                    sx={{
                      background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
                      border: '1.5px solid rgba(29,78,216,0.12)',
                      borderRadius: '12px',
                      p: '16px 20px',
                      mb: 2.5,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5
                    }}
                  >
                    <Box sx={{
                      width: 36, height: 36, background: '#1d4ed8', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: '2px'
                    }}>
                      <MailIcon />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                        We sent a 6-digit verification code to
                      </Typography>
                      <Typography sx={{ fontWeight: 700, color: '#1d4ed8', fontSize: '0.9375rem', mt: 0.25,
                        fontFamily: "'Sora', sans-serif" }}>
                        {formData.email}
                      </Typography>
                    </Box>
                  </Box>

                  <TextField {...textFieldProps} label="6-Digit OTP" value={otp}
                    onChange={e => setOtp(e.target.value)}
                    inputProps={{ maxLength: 6, style: { letterSpacing: '0.3em', fontSize: '1.25rem', textAlign: 'center' } }}
                    error={!!errors.otp} helperText={errors.otp}
                    placeholder="· · · · · ·" />

                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, mt: 1 }}>
                    <Button fullWidth variant="contained" onClick={handleNextStep}
                      disabled={isLoading} sx={submitBtnSx}>
                      {isLoading ? 'Verifying…' : 'Verify Code →'}
                    </Button>

                    <Button fullWidth variant="outlined" onClick={handleResendOTP}
                      disabled={isLoading}
                      sx={{
                        mt: 1, py: '14px', borderRadius: '12px',
                        fontFamily: "'Sora', sans-serif", fontWeight: 600,
                        fontSize: '0.9375rem', textTransform: 'none',
                        borderColor: '#10b981', color: '#059669', borderWidth: '1.5px',
                        transition: 'all 0.25s ease',
                        '&:hover': { background: '#d1fae5', borderColor: '#059669', transform: 'translateY(-1px)' },
                        '&:disabled': { borderColor: '#e2e8f0', color: '#94a3b8' }
                      }}>
                      {isLoading ? 'Sending…' : 'Resend Code'}
                    </Button>
                  </Box>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                  <Typography
                    sx={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '1.0625rem',
                      color: '#1e293b', mb: 3,
                      display: 'flex', alignItems: 'center', gap: 1.25,
                      '&::before': { content: '""', display: 'block', width: 4, height: 18,
                        background: 'linear-gradient(180deg,#10b981,#3b82f6)', borderRadius: '2px' }
                    }}
                  >
                    Business Details
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
                    <TextField {...textFieldProps} label="Business Name" name="businessName"
                      value={formData.businessName} onChange={handleChange}
                      error={!!errors.businessName} helperText={errors.businessName} />

                    <FormControl fullWidth sx={textFieldProps.sx}>
                      <InputLabel sx={{ fontFamily: "'DM Sans', sans-serif",
                        '&.Mui-focused': { color: '#1d4ed8' } }}>
                        Business Type
                      </InputLabel>
                      <Select name="businessType" value={formData.businessType} onChange={handleChange}
                        label="Business Type" error={!!errors.businessType}
                        sx={{ borderRadius: '12px', fontFamily: "'DM Sans', sans-serif",
                          '& .MuiSelect-select': { padding: '14px 16px', fontSize: '0.9375rem' } }}>
                        {businessTypes.map((t, i) => (
                          <MenuItem key={i} value={t}
                            sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem' }}>
                            {t}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={textFieldProps.sx}>
                      <InputLabel sx={{ fontFamily: "'DM Sans', sans-serif",
                        '&.Mui-focused': { color: '#1d4ed8' } }}>
                        Product Category
                      </InputLabel>
                      <Select name="category" value={formData.category} onChange={handleChange}
                        label="Product Category" error={!!errors.category}
                        sx={{ borderRadius: '12px', fontFamily: "'DM Sans', sans-serif",
                          '& .MuiSelect-select': { padding: '14px 16px', fontSize: '0.9375rem' } }}>
                        {categories.map((c, i) => (
                          <MenuItem key={i} value={c}
                            sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem' }}>
                            {c}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Button fullWidth variant="containeda" onClick={handleNextStep}
                    disabled={isLoading} sx={submitBtnSx}>
                    {isLoading ? 'Saving…' : 'Complete Registration →'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Footer ─────────────────────────────────── */}
            <Box
              sx={{
                textAlign: 'center', mt: 4, pt: 3,
                borderTop: '1.5px solid #f1f5f9'
              }}
            >
              <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8', fontFamily: "'DM Sans', sans-serif" }}>
                Already have an account?
                <Button
                  onClick={() => navigate('/vendor/login')}
                  sx={{
                    fontFamily: "'Sora', sans-serif", fontWeight: 700,
                    fontSize: '0.875rem', color: '#1d4ed8',
                    textTransform: 'none', ml: 0.5, px: 1,
                    borderRadius: '8px', minWidth: 0,
                    transition: 'all 0.2s ease',
                    '&:hover': { color: '#10b981', background: '#d1fae5' }
                  }}
                >
                  Log in
                </Button>
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>

      <ToastContainer
        position="top-right" autoClose={3500} hideProgressBar={false}
        newestOnTop closeOnClick pauseOnHover draggable theme="colored"
        toastStyle={{ fontFamily: "'DM Sans', sans-serif", borderRadius: 12, fontSize: '0.9rem' }}
      />
    </Box>
  );
};

export default RegisterForm;
