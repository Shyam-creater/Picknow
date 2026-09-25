import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaLeaf, FaCookie, FaCandyCane, FaCarrot, FaIceCream } from 'react-icons/fa';
import { GiFastNoodles } from 'react-icons/gi';
import Vegetables from '../../assets/Vegetables.jpg';
import Beverages from '../../assets/Beverages.jpg';
import herbals3 from '../../assets/herbals3.jpg';
import Millet_Cookies from '../../assets/Millet_Cookies.jpg';
import Millet_Noodles from '../../assets/Millet_Noodles.jpg';
import honey from '../../assets/honey.jpg';
import Dryfruit from '../../assets/Dryfruits.jpg';
import Traditional_Rice from '../../assets/Traditional_Rice.jpg';
import './CategoryPage.css';

const CategoryPage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const categories = [
    { id: 1, name: 'Herbals', icon: <FaLeaf />, image: herbals3 },
    { id: 2, name: 'Millet Cookies', icon: <FaCookie />, image: Millet_Cookies },
    { id: 3, name: 'Millet Noodles', icon: <GiFastNoodles />, image: Millet_Noodles },
    { id: 4, name: 'Honey', icon: <FaCandyCane />, image: honey },
    { id: 5, name: 'Dry Fruits', icon: <FaCarrot />, image: Dryfruit },
    { id: 6, name: 'Traditional Rice', icon: <FaIceCream />, image: Traditional_Rice }
  ];

  return (
    <div className="category-page">
      <div className="category-header">
        <h1>Shop by Category</h1>
        <p>Explore our wide range of categories</p>
      </div>
      
      <div className="categories-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card shimmer-effect"></div>
          ))
        ) : (
          categories.map(category => (
            <Link to={`/category/${category.id}`} key={category.id} className="card">
              <div className="content">
                <div className="front">
                  <img src={category.image} alt={category.name} className="card-image" />
                  <div className="front-content">
                    <small className="badge">{category.name}</small>
                    <div className="description">
                      <div className="title">
                        <strong>{category.name}</strong>
                      </div>
                      <p className="card-footer">Click to explore</p>
                    </div>
                  </div>
                </div>
                <div className="back">
                  <div className="back-content">
                    {category.icon}
                    <strong>{category.name}</strong>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="category-featured">
        <h2>Featured Categories</h2>
        <div className="featured-banners">
          <div className="featured-banner">
            <img src={Vegetables} alt="Vegetables" />
            <div className="banner-content">
              <h3>Fresh Vegetables</h3>
              <p>Up to 30% off</p>
              <Link to="/category/1" className="shop-now-btn">Shop Now</Link>
            </div>
          </div>
          <div className="featured-banner">
            <img src={Beverages} alt="Beverages" />
            <div className="banner-content">
              <h3>Beverages</h3>
              <p>Buy 2 Get 1 Free</p>
              <Link to="/category/2" className="shop-now-btn">Shop Now</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
