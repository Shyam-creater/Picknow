import React, { useState } from 'react';
import '../styles/Forms.css';

const RegisterForm = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessType: '',
    category: '',
  });
  
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  
  const categories = [
    'Electronics',
    'Fashion',
    'Home & Kitchen',
    'Beauty & Personal Care',
    'Books',
    'Toys & Games',
    'Food & Grocery',
    'Health & Wellness',
    'Sports & Outdoors',
    'Automotive',
    'Other'
  ];
  
  const businessTypes = [
    'Sole Proprietorship',
    'Partnership',
    'Limited Liability Company (LLC)',
    'Corporation',
    'Franchise',
    'Online Business',
    'Other'
  ];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber.replace(/[^0-9]/g, ''))) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    
    if (!formData.businessType) {
      newErrors.businessType = 'Business type is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const sendOtp = () => {
    // In a real app, this would make an API call to send OTP
    setOtpSent(true);
    alert('OTP sent to your email and phone number. For demo purposes, use "123456"');
  };
  
  const verifyOtp = () => {
    // In a real app, this would verify the OTP with the backend
    if (otp === '123456') {
      return true;
    } else {
      setErrors({
        ...errors,
        otp: 'Invalid OTP. For demo purposes, use "123456"'
      });
      return false;
    }
  };
  
  const renderProgressBar = () => {
    return (
      <div className="progress-bar">
        <div className="progress-line"></div>
        <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>1</div>
        <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>2</div>
        <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
      </div>
    );
  };
  
  const handleNextStep = async () => {
    setIsLoading(true);
    try {
      if (step === 1 && validateStep1()) {
        await sendOtp();
        setStep(2);
      } else if (step === 2 && otpSent && verifyOtp()) {
        setStep(3);
      } else if (step === 3 && validateStep2()) {
        await handleSubmit();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = () => {
    // In a real app, this would make an API call to register the vendor
    onRegister(formData);
  };
  
  return (
    <div className="vendor-form-page">
      <div className="vendor-form-container">
        <h2 className="vendor-form-title">Register as a Vendor</h2>
        {renderProgressBar()}
        
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="vendor-form-group">
              <label className="vendor-form-label">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="vendor-form-input"
              />
              {errors.name && <div className="vendor-form-error">{errors.name}</div>}
            </div>
          )}
          
          {step === 1 && (
            <div className="vendor-form-group">
              <label className="vendor-form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="vendor-form-input"
              />
              {errors.email && <div className="vendor-form-error">{errors.email}</div>}
            </div>
          )}
          
          {step === 1 && (
            <div className="vendor-form-group">
              <label className="vendor-form-label">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="vendor-form-input"
              />
              {errors.phoneNumber && <div className="vendor-form-error">{errors.phoneNumber}</div>}
            </div>
          )}
          
          {step === 1 && (
            <div className="vendor-form-group">
              <label className="vendor-form-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="vendor-form-input"
              />
              {errors.password && <div className="vendor-form-error">{errors.password}</div>}
            </div>
          )}
          
          {step === 1 && (
            <div className="vendor-form-group">
              <label className="vendor-form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="vendor-form-input"
              />
              {errors.confirmPassword && <div className="vendor-form-error">{errors.confirmPassword}</div>}
            </div>
          )}
          
          {step === 2 && (
            <div className="vendor-form-group">
              <label className="vendor-form-label">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="vendor-form-input"
                placeholder="Enter 6-digit code"
              />
              {errors.otp && <div className="vendor-form-error">{errors.otp}</div>}
            </div>
          )}
          
          {step === 3 && (
            <div className="vendor-form-group">
              <label className="vendor-form-label">Business/Company Name</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className="vendor-form-input"
              />
              {errors.businessName && <div className="vendor-form-error">{errors.businessName}</div>}
            </div>
          )}
          
          {step === 3 && (
            <div className="vendor-form-group">
              <label className="vendor-form-label">Business Type</label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                className="vendor-form-select"
              >
                <option value="">Select Business Type</option>
                {businessTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
              {errors.businessType && <div className="vendor-form-error">{errors.businessType}</div>}
            </div>
          )}
          
          {step === 3 && (
            <div className="vendor-form-group">
              <label className="vendor-form-label">Product Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="vendor-form-select"
              >
                <option value="">Select Category</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && <div className="vendor-form-error">{errors.category}</div>}
            </div>
          )}
          
          <button type="submit" className="vendor-btn vendor-form-btn" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;