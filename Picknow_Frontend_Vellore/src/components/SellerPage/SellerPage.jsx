import React from 'react';
import { Link } from 'react-router-dom';
import './SellerPage.css';
import GroceryStaples from '../../assets/GroceryStaples.jpg';
import FSSAI_Requirements from '../../assets/FSSAI_Requirements.jpg';
import P1 from '../../assets/P1.jpg';
import Beverages from '../../assets/Beverages.jpg';

// Import images
const groceryImg = GroceryStaples;
const packagingImg = P1;
const fssaiImg = FSSAI_Requirements;
const qualityImg = "https://img.freepik.com/premium-vector/quality-control-certificate-approved-check-mark-vector-stock-illustration_100456-11411.jpg";

// Updated image URLs
const images = {
	hero: "https://img.freepik.com/free-photo/young-woman-shopping-vegetables_23-2148573433.jpg",
	grocery: "https://img.freepik.com/free-photo/different-indian-spices-wooden-spoons-dark-background_123827-21990.jpg",
	packaged: "https://img.freepik.com/free-photo/assortment-packaged-snacks_23-2149941405.jpg",
	fssai: "https://www.fssai.gov.in/upload/media/FSSAI_News_FSSAI_Logo_FNB_12_01_2019.jpg",
	quality: "https://img.freepik.com/free-vector/gradient-good-better-best-infographic_23-2149337640.jpg",
	cta: "https://img.freepik.com/free-photo/indian-grocery-store-owner-working_23-2149511332.jpg",
	benefits: [
		"https://img.freepik.com/free-vector/fast-delivery-icon-express-delivery-icon_97458-1.jpg",
		"https://img.freepik.com/free-vector/money-bag-coin-cartoon-icon-illustration_138676-2523.jpg",
		"https://img.freepik.com/free-vector/delivery-service-illustrated_23-2148505081.jpg",
		"https://img.freepik.com/free-vector/payment-information-concept-illustration_114360-2886.jpg"
	]
};

const SellerPage = () => {
	return (
		<div className="seller-page">
			<header className="seller-header">
				<div className="container">
					<div className="auth-buttons">
						<Link to="/SellerLogin" className="btn btn-outline-primary">Login</Link>
						<Link to="/SellerRegister" className="btn btn-primary">Register</Link>
					</div>
				</div>
			</header>

			<div className="seller-hero" style={{backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${images.hero})`}}>
				<div className="container">
					<h1>Grow Your Business with Picknow</h1>
					<p className="hero-subtitle">Join thousands of successful sellers and reach millions of customers</p>
					<div className="hero-stats">
						<div className="stat-item">
							<span className="stat-number">10K+</span>
							<span className="stat-label">Active Sellers</span>
						</div>
						<div className="stat-item">
							<span className="stat-number">1M+</span>
							<span className="stat-label">Customers</span>
						</div>
						<div className="stat-item">
							<span className="stat-number">50K+</span>
							<span className="stat-label">Products</span>
						</div>
					</div>
				</div>
			</div>

			<section className="seller-benefits container">
				<h2>Why Sell on Picknow?</h2>
				<div className="benefits-grid">
					{[
						{ icon: images.benefits[0], title: "Quick Onboarding", desc: "Start selling in less than 24 hours" },
						{ icon: images.benefits[1], title: "Low Commission", desc: "Competitive rates to maximize your profits" },
						{ icon: images.benefits[2], title: "Easy Shipping", desc: "Integrated logistics support" },
						{ icon: images.benefits[3], title: "Quick Payments", desc: "Get paid within 7 days" }
					].map((benefit, index) => (
						<div className="benefit-card" key={index}>
							<img src={benefit.icon} alt={benefit.title} className="benefit-icon" />
							<h3>{benefit.title}</h3>
							<p>{benefit.desc}</p>
						</div>
					))}
				</div>
			</section>

			<section className="seller-categories container">
				<h2>Categories You Can Sell</h2>
				<div className="category-grid">
					<div className="category-card">
						<img src={groceryImg} alt="Grocery & Staples" className="category-image" />
						<div className="category-content">
							<h3>Grocery & Staples</h3>
							<ul>
								<li>Pulses & Grains</li>
								<li>Spices & Masalas</li>
								<li>Dry Fruits & Nuts</li>
								<li>Oils & Ghee</li>
							</ul>
						</div>
					</div>
					<div className="category-card">
						<img src={packagingImg} alt="Packaged Foods" className="category-image" />
						<div className="category-content">
							<h3>Packaged Foods</h3>
							<ul>
								<li>Snacks & Namkeen</li>
								<li>Ready to Eat</li>
								<li>Beverages</li>
								<li>Health Foods</li>
							</ul>
						</div>
					</div>
				</div>
			</section>

			<section className="seller-policies container">
				<h2>Seller Requirements & Policies</h2>
				<div className="policy-grid">
					<div className="policy-card">
						<img src={fssaiImg} alt="FSSAI" className="policy-image" />
						<div className="policy-content">
							<h3>FSSAI Requirements</h3>
							<p>All food sellers must have valid FSSAI registration/license</p>
							<ul>
								<li>Basic FSSAI registration for small businesses</li>
								<li>State/Central license for larger operations</li>
								<li>Regular food safety compliance</li>
							</ul>
						</div>
					</div>
					<div className="policy-card">
						<img src={qualityImg} alt="Quality Standards" className="policy-image" />
						<div className="policy-content">
							<h3>Quality Standards</h3>
							<p>Products must meet quality and packaging standards</p>
							<ul>
								<li>Proper packaging and labeling</li>
								<li>Expiry date clearly mentioned</li>
								<li>Ingredients list and nutritional info</li>
							</ul>
						</div>
					</div>
				</div>
			</section>

			<section className="cta-section" style={{backgroundImage: `linear-gradient(rgba(255,107,0,0.9), rgba(255,107,0,0.9)), url(${images.cta})`}}>
				<div className="container">
					<h2>Ready to Start Selling?</h2>
					<p>Join Picknow today and grow your business</p>
					<Link to="/SellerRegister" className="cta-button">Register Now</Link>
				</div>
			</section>
		</div>
	);
};

export default SellerPage;