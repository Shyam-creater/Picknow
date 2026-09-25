import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Stack,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AccountBalance,
  Description,
  Restaurant,
  Receipt,
  FileUpload,
  CheckCircle,
  Info,
  Person,
  ArrowForward,
  AssignmentTurnedIn
} from '@mui/icons-material';
import vendorApi from '../../../api/vendorApi';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/VendorDetails.css';

/* ─── Premium TextField sx ─────────────────────────────────── */
const tfSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    background: '#f8fafc',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    '& fieldset': { borderColor: '#e2e8f0', borderWidth: '1.5px' },
    '&:hover': { 
      background: '#fff', 
      '& fieldset': { borderColor: '#1d4ed8' }
    },
    '&.Mui-focused': { 
      background: '#fff', 
      boxShadow: '0 0 0 4px rgba(29,78,216,.1)',
      '& fieldset': { borderColor: '#1d4ed8', borderWidth: '2px' }
    },
  },
  '& .MuiInputLabel-root': { 
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    color: '#64748b'
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#1d4ed8' },
  '& .MuiInputBase-input': { 
    fontFamily: "'Inter', sans-serif", 
    fontSize: '0.95rem', 
    padding: '16px' 
  },
};

/* ─── Shared Components ───────────────────────────────────── */

const SectionHeader = ({ icon: IconComponent, title }) => (
  <Box className="vd-section-header">
    <Box className="vd-section-icon">
      <IconComponent fontSize="small" />
    </Box>
    <Typography className="vd-section-title">{title}</Typography>
  </Box>
);

const CustomUploadZone = ({ name, label, value, onChange }) => {
  const inputId = `upload-${name}`;
  return (
    <label htmlFor={inputId} style={{ width: '100%' }}>
      <input 
        type="file" id={inputId} name={name} accept=".pdf"
        onChange={onChange} style={{ display: 'none' }} 
      />
      <Box className={`vd-upload-zone ${value ? 'active' : ''}`}>
        <Box className="vd-upload-icon-box">
          {value ? <CheckCircle sx={{ color: '#10b981' }} /> : <FileUpload sx={{ color: '#1d4ed8' }} />}
        </Box>
        <Typography variant="subtitle2" fontWeight="700" color="text.primary">
          {value ? value.name : `Upload ${label}`}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {value ? 'Tap to replace file' : 'PDF format · Max 5MB'}
        </Typography>
      </Box>
    </label>
  );
};

const ToggleCard = ({ checked, onChange, icon: IconComponent, title, desc }) => (
  <Box 
    className={`vd-toggle-card ${checked ? 'active' : ''}`}
    onClick={onChange}
  >
    <Box className="vd-toggle-check">
      {checked && <CheckCircle sx={{ fontSize: 18, color: 'white' }} />}
    </Box>
    <Box sx={{ flex: 1 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
        <IconComponent sx={{ fontSize: 20, color: checked ? '#10b981' : '#64748b' }} />
        <Typography fontWeight="700" variant="body2" color={checked ? '#065f46' : 'text.primary'}>
          {title}
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {desc}
      </Typography>
    </Box>
  </Box>
);

const VendorDetailsForm = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState({
    bankName: '', accountNumber: '', ifscCode: '', accountHolderName: '',
    panNumber: '', panDocument: null,
    aadharNumber: '', aadharDocument: null,
    gstNumber: '', gstDocument: null,
    fssaiNumber: '', fssaiDocument: null,
    isFoodBusiness: false,
    hasGST: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      if (file && file.type !== 'application/pdf') { 
        toast.error('Only PDF files are allowed'); 
        return; 
      }
      if (file && file.size > 5 * 1024 * 1024) { 
        toast.error('File size must be under 5 MB'); 
        return; 
      }
      setFormData(p => ({ ...p, [name]: file }));
      toast.success(`${name.replace(/([A-Z])/g, ' $1')} uploaded!`);
    } else {
      setFormData(p => ({ ...p, [name]: value }));
    }
  };

  const handleToggle = (name) => setFormData(p => ({ ...p, [name]: !p[name] }));

  const validate = () => {
    const { bankName, accountNumber, ifscCode, accountHolderName, panNumber, panDocument, aadharNumber, aadharDocument, hasGST, gstNumber, gstDocument, isFoodBusiness, fssaiNumber, fssaiDocument } = formData;
    
    if (!bankName || !accountNumber || !ifscCode || !accountHolderName) {
      toast.error('All bank details are required');
      return false;
    }
    if (!panNumber || !panDocument || !aadharNumber || !aadharDocument) {
      toast.error('Identity documents and numbers are required');
      return false;
    }
    if (hasGST && (!gstNumber || !gstDocument)) {
      toast.error('GST details are required if registered');
      return false;
    }
    if (isFoodBusiness && (!fssaiNumber || !fssaiDocument)) {
      toast.error('FSSAI details are required for food business');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const fd = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) fd.append(key, formData[key]);
      });
      await vendorApi.uploadDocuments(fd);
      toast.success('Documents submitted successfully!');
      localStorage.setItem('approvalStatus', 'pending');
      navigate('/vendor/pending-approval');
    } catch (error) {
      toast.error(error.message || 'Submission failed');
    } finally {
      setIsLoading(false);
    }
  };

  const filledFields = [
    formData.bankName, formData.accountNumber, formData.ifscCode, formData.accountHolderName,
    formData.panNumber, formData.panDocument, formData.aadharNumber, formData.aadharDocument
  ].filter(Boolean).length;
  const progress = Math.round((filledFields / 8) * 100);

  return (
    <Box className="vd-page">
      <Box className="vd-bg-blob blob-1" />
      <Box className="vd-bg-blob blob-2" />

      <Container maxWidth="md" className="vd-form-container" sx={{ py: { xs: 2, sm: 6 } }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Box className="vd-glass-card">
            {/* Header */}
            <Box textAlign="center" mb={5}>
              <Avatar 
                sx={{ 
                  width: 64, height: 64, 
                  background: 'linear-gradient(135deg, #1d4ed8, #10b981)',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 16px rgba(29, 78, 216, 0.2)'
                }}
              >
                <AssignmentTurnedIn sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant={isMobile ? "h5" : "h4"} fontWeight="800" fontFamily="'Plus Jakarta Sans'" gutterBottom>
                Professional Verification
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Securely submit your documents to activate your vendor dashboard.
              </Typography>
            </Box>

            {/* Progress */}
            <Box className="vd-progress-container">
              <Box className="vd-progress-text">
                <Typography variant="caption">Application Completion</Typography>
                <Typography variant="caption" color="primary">{progress}%</Typography>
              </Box>
              <Box className="vd-progress-track">
                <Box className="vd-progress-bar" style={{ width: `${progress}%` }} />
              </Box>
            </Box>

            <Stack spacing={5}>
              {/* Bank Details */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <SectionHeader icon={AccountBalance} title="Financial Information" />
                <Box className="vd-grid">
                  <TextField fullWidth label="Bank Name" name="bankName" value={formData.bankName} onChange={handleChange} sx={tfSx} />
                  <TextField fullWidth label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} sx={tfSx} />
                  <TextField fullWidth label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleChange} sx={tfSx} />
                  <TextField fullWidth label="Beneficiary Name" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} sx={tfSx} />
                </Box>
              </motion.div>

              {/* ID Documents */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <SectionHeader icon={Description} title="Identity & Tax Compliance" />
                <Stack spacing={3}>
                  <Box className="vd-grid">
                    <TextField fullWidth label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleChange} sx={tfSx} />
                    <CustomUploadZone name="panDocument" label="PAN Card" value={formData.panDocument} onChange={handleChange} />
                  </Box>
                  <Box className="vd-grid">
                    <TextField fullWidth label="Aadhar Number" name="aadharNumber" value={formData.aadharNumber} onChange={handleChange} sx={tfSx} />
                    <CustomUploadZone name="aadharDocument" label="Aadhar Card" value={formData.aadharDocument} onChange={handleChange} />
                  </Box>
                </Stack>
              </motion.div>

              {/* Toggles */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <SectionHeader icon={AssignmentTurnedIn} title="Additional Registrations" />
                <Box className="vd-grid">
                  <ToggleCard 
                    checked={formData.hasGST}
                    onChange={() => handleToggle('hasGST')}
                    icon={Receipt}
                    title="GST Registered"
                    desc="For turnover > ₹40 Lakhs"
                  />
                  <ToggleCard 
                    checked={formData.isFoodBusiness}
                    onChange={() => handleToggle('isFoodBusiness')}
                    icon={Restaurant}
                    title="Food Business"
                    desc="FSSAI license required"
                  />
                </Box>
              </motion.div>

              {/* Conditional Sections */}
              <AnimatePresence>
                {formData.hasGST && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <Box sx={{ p: 3, background: '#f8fafc', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
                      <Box className="vd-grid">
                        <TextField fullWidth label="GSTIN Number" name="gstNumber" value={formData.gstNumber} onChange={handleChange} sx={tfSx} />
                        <CustomUploadZone name="gstDocument" label="GST Certificate" value={formData.gstDocument} onChange={handleChange} />
                      </Box>
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {formData.isFoodBusiness && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <Box sx={{ p: 3, background: '#f8fafc', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
                      <Box className="vd-grid">
                        <TextField fullWidth label="FSSAI Number" name="fssaiNumber" value={formData.fssaiNumber} onChange={handleChange} sx={tfSx} />
                        <CustomUploadZone name="fssaiDocument" label="FSSAI License" value={formData.fssaiDocument} onChange={handleChange} />
                      </Box>
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Note */}
              <Box className="vd-note">
                <Box className="vd-note-icon"><Info fontSize="inherit" /></Box>
                <Typography variant="caption">
                  Documents are reviewed within 24–48 hours. Ensure all details match your bank and government IDs for faster approval.
                </Typography>
              </Box>

              {/* Submit */}
              <button 
                className="vd-submit-button"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                ) : (
                  <>
                    Submit Application <ArrowForward fontSize="small" />
                  </>
                )}
              </button>
            </Stack>
          </Box>
        </motion.div>
      </Container>
      <ToastContainer position="top-right" theme="colored" />
    </Box>
  );
};

export default VendorDetailsForm;
