import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import vendorApi from '../../../api/vendorApi';
import '../styles/VendorLogin.css';

const VendorLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await vendorApi.login({ email, password });

      if (response.incomplete) {
        localStorage.setItem('registrationToken', response.token);
        toast.info('Please complete your registration details.');
        navigate('/vendor/details');
        setLoading(false);
        return;
      }

      if (response.vendor.adminApproval.status === 'pending') {
        toast.warning('Your registration is still pending admin approval.');
        setLoading(false);
        return;
      }

      if (response.vendor.adminApproval?.status === 'rejected') {
        toast.error('Your registration has been rejected. Please contact support.');
        setLoading(false);
        return;
      }

      if (response.unverified) {
        toast.error('Account is not verified. Please contact admin.');
        setLoading(false);
        return;
      }

      if (response.inactive) {
        toast.error(response.message || 'Account is inactive. Please contact admin.');
        setLoading(false);
        return;
      }

      localStorage.setItem('vendorToken', response.token);
      localStorage.setItem('userType', 'vendor');
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('vendorId', response.vendor.id);
      localStorage.setItem('currentVendor', JSON.stringify(response.vendor));

      toast.success('Login successful! Welcome to Picknow.');
      navigate('/vendor/dashboard');
    } catch (error) {
      toast.error(error.message || 'An error occurred during login. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="vendor-login-page">
      <div className="login-card-modern">
        <div className="login-header-premium">
          <div className="store-icon-wrapper">
            <Store size={32} />
          </div>
          <h2>Vendor Portal</h2>
          <p>Secure access to your growth dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group-premium">
            <label htmlFor="email" className="label-premium">Business Email</label>
            <div className="input-premium-wrapper">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-premium"
                placeholder="name@business.com"
              />
            </div>
          </div>

          <div className="form-group-premium">
            <label htmlFor="password" className="label-premium">Password</label>
            <div className="input-premium-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-premium"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="password-toggle-premium"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-actions-premium">
            <div className="checkbox-group">
              <input id="remember-me" type="checkbox" />
              <label htmlFor="remember-me">Remember me</label>
            </div>
            <a href="#" className="forgot-link">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-login-premium"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer-premium">
          <div className="divider-premium">
            <span>New Partner?</span>
          </div>
          <button
            onClick={() => navigate('/vendor/register')}
            className="register-link-btn"
          >
            Apply to Become a Vendor
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorLogin;