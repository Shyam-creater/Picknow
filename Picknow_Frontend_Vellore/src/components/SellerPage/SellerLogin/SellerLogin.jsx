import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SellerLogin.css';

const SellerLogin = () => {
	const navigate = useNavigate();
	const [isLogin, setIsLogin] = useState(true);
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		phone: '',
		businessName: '',
		gst: ''
	});
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
	};

	const handleLogin = (e) => {
		e.preventDefault();
		const sellers = JSON.parse(localStorage.getItem('sellers')) || [];
		const seller = sellers.find(s => s.email === formData.email);

		if (!seller) {
			setError('Seller not found');
			return;
		}

		if (seller.password !== formData.password) {
			setError('Invalid password');
			return;
		}

		localStorage.setItem('currentSeller', JSON.stringify(seller));
		setSuccess('Login successful!');
		setTimeout(() => {
			navigate('/sellerpage');
		}, 1000);
	};

	const handleRegister = (e) => {
		e.preventDefault();
		const sellers = JSON.parse(localStorage.getItem('sellers')) || [];

		// Validation
		if (!formData.name || !formData.email || !formData.password || !formData.phone || !formData.businessName || !formData.gst) {
			setError('All fields are required');
			return;
		}

		if (sellers.some(seller => seller.email === formData.email)) {
			setError('Email already registered');
			return;
		}

		if (formData.password.length < 6) {
			setError('Password must be at least 6 characters');
			return;
		}

		const newSeller = {
			...formData,
			id: Date.now(),
			createdAt: new Date().toISOString()
		};

		sellers.push(newSeller);
		localStorage.setItem('sellers', JSON.stringify(sellers));
		setSuccess('Registration successful! Please login.');
		setTimeout(() => {
			setIsLogin(true);
			setFormData({
				name: '',
				email: '',
				password: '',
				phone: '',
				businessName: '',
				gst: ''
			});
		}, 1500);
	};

	return (
		<div className="seller-auth-container">
			<div className="seller-auth-box">
				<div className="auth-header">
					<h2>{isLogin ? 'Seller Login' : 'Seller Registration'}</h2>
					<p>{isLogin ? 'Welcome back! Please login to your account' : 'Create your seller account'}</p>
				</div>

				{error && <div className="auth-message error">{error}</div>}
				{success && <div className="auth-message success">{success}</div>}

				{isLogin ? (
					<form onSubmit={handleLogin} className="auth-form">
						<div className="form-group">
							<label>Email</label>
							<input
								type="email"
								name="email"
								value={formData.email}
								onChange={handleChange}
								placeholder="Enter your email"
							/>
						</div>
						<div className="form-group">
							<label>Password</label>
							<input
								type="password"
								name="password"
								value={formData.password}
								onChange={handleChange}
								placeholder="Enter your password"
							/>
						</div>
						<button type="submit" className="auth-button">Login</button>
					</form>
				) : (
					<form onSubmit={handleRegister} className="auth-form">
						<div className="form-group">
							<label>Full Name</label>
							<input
								type="text"
								name="name"
								value={formData.name}
								onChange={handleChange}
								placeholder="Enter your full name"
							/>
						</div>
						<div className="form-group">
							<label>Email</label>
							<input
								type="email"
								name="email"
								value={formData.email}
								onChange={handleChange}
								placeholder="Enter your email"
							/>
						</div>
						<div className="form-group">
							<label>Password</label>
							<input
								type="password"
								name="password"
								value={formData.password}
								onChange={handleChange}
								placeholder="Create password"
							/>
						</div>
						<div className="form-group">
							<label>Phone Number</label>
							<input
								type="tel"
								name="phone"
								value={formData.phone}
								onChange={handleChange}
								placeholder="Enter phone number"
							/>
						</div>
						<div className="form-group">
							<label>Business Name</label>
							<input
								type="text"
								name="businessName"
								value={formData.businessName}
								onChange={handleChange}
								placeholder="Enter business name"
							/>
						</div>
						<div className="form-group">
							<label>GST Number</label>
							<input
								type="text"
								name="gst"
								value={formData.gst}
								onChange={handleChange}
								placeholder="Enter GST number"
							/>
						</div>
						<button type="submit" className="auth-button">Register</button>
					</form>
				)}

				<div className="auth-switch">
					{isLogin ? (
						<p>Don't have an account? <button onClick={() => setIsLogin(false)}>Register here</button></p>
					) : (
						<p>Already have an account? <button onClick={() => setIsLogin(true)}>Login here</button></p>
					)}
				</div>
			</div> 
		</div>
	);
};

export default SellerLogin;