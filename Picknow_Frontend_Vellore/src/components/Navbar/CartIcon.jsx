import React, { useState, useEffect } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './CartIcon.css';

const CartIcon = () => {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Initialize cart count from localStorage
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const count = cart.length;
      setCartCount(count);
    };

    // Initial count
    updateCartCount();

    // Listen for cart updates
    const handleCartUpdate = (event) => {
      setCartCount(event.detail.count);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    // Also update when storage changes (for cross-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === 'cart') {
        updateCartCount();
      window.location.reload();
      }
    });

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);

  return (
    <Link to="/cart" className="cart-icon-wrapper">
      <div className="cart-icon-container">
        <FaShoppingCart className="cart-icon" />
        {cartCount > 0 && (
          <span className="cart-count">{cartCount}</span>
        )}
      </div>
    </Link>
  );
};

export default CartIcon; 