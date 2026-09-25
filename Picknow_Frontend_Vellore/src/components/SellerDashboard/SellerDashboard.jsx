import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './SellerDashboard.css';

const SellerDashboard = () => {
  const [sellerStats, setSellerStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: []
  });

  return (
    <div className="seller-dashboard">
      <div className="dashboard-header">
        <h1>Seller Dashboard</h1>
        <Link to="/add-product" className="add-product-btn">
          + Add New Product
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon products-icon">
            <i className="fas fa-box"></i>
          </div>
          <div className="stat-content">
            <h3>Total Products</h3>
            <p>{sellerStats.totalProducts}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orders-icon">
            <i className="fas fa-shopping-cart"></i>
          </div>
          <div className="stat-content">
            <h3>Total Orders</h3>
            <p>{sellerStats.totalOrders}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue-icon">
            <i className="fas fa-inr"></i>
          </div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p>₹{sellerStats.totalRevenue}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="product-management panel">
          <h2>Your Products</h2>
          <div className="product-list">
            {/* Product list will go here */}
          </div>
        </div>

        <div className="recent-orders panel">
          <h2>Recent Orders</h2>
          <div className="orders-list">
            {/* Orders list will go here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard; 