import React from 'react';
import './ShimmerEffect.css';

export const CategoryShimmer = () => {
  return (
    <div className="category-shimmer-container">
      <div className="shimmer-title"></div>
      <div className="category-cards">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="category-card-shimmer">
            <div className="shimmer-img"></div>
            <div className="shimmer-title-small"></div>
            <div className="shimmer-text"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const BannerShimmer = () => {
  return (
    <div className="banner-shimmer-container">
      {[1, 2, 3].map((item) => (
        <div key={item} className="banner-card-shimmer">
          <div className="shimmer-overlay"></div>
        </div>
      ))}
    </div>
  );
};

export const BestSellingShimmer = () => {
  return (
    <div className="best-selling-shimmer-container">
      <div className="shimmer-header">
        <div className="shimmer-title"></div>
        <div className="shimmer-link"></div>
      </div>
      <div className="best-selling-cards">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="product-card-shimmer">
            <div className="shimmer-img-large"></div>
            <div className="shimmer-content">
              <div className="shimmer-category"></div>
              <div className="shimmer-title-medium"></div>
              <div className="shimmer-price"></div>
              <div className="shimmer-button"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CarouselShimmer = () => {
  return (
    <div className="carousel-shimmer-container">
      <div className="carousel-shimmer">
        <div className="shimmer-overlay"></div>
      </div>
    </div>
  );
};

export const WelcomeShimmer = () => {
  return (
    <div className="welcome-shimmer-container">
      <div className="shimmer-title-large"></div>
      <div className="shimmer-subtitle"></div>
    </div>
  );
};

export const ProductDetailsShimmer = () => {
  return (
    <div className="product-details-shimmer-container">
      <div className="product-details-grid">
        <div className="product-image-shimmer">
          <div className="shimmer-overlay"></div>
        </div>
        <div className="product-info-shimmer">
          <div className="shimmer-title-large"></div>
          <div className="shimmer-price-large"></div>
          <div className="shimmer-description"></div>
          <div className="shimmer-button-large"></div>
        </div>
      </div>
    </div>
  );
};

export const CartShimmer = () => {
  return (
    <div className="cart-shimmer-container">
      <div className="shimmer-title-large"></div>
      <div className="cart-items-shimmer">
        {[1, 2, 3].map((item) => (
          <div key={item} className="cart-item-shimmer">
            <div className="shimmer-img-small"></div>
            <div className="shimmer-content">
              <div className="shimmer-title-small"></div>
              <div className="shimmer-price-small"></div>
            </div>
            <div className="shimmer-quantity"></div>
          </div>
        ))}
      </div>
      <div className="cart-summary-shimmer">
        <div className="shimmer-total"></div>
        <div className="shimmer-button"></div>
      </div>
    </div>
  );
};

export const CheckoutShimmer = () => {
  return (
    <div className="checkout-shimmer-container">
      <div className="shimmer-title-large"></div>
      <div className="checkout-grid">
        <div className="address-form-shimmer">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="shimmer-input"></div>
          ))}
        </div>
        <div className="order-summary-shimmer">
          <div className="shimmer-title-medium"></div>
          <div className="shimmer-items"></div>
          <div className="shimmer-total"></div>
          <div className="shimmer-button-large"></div>
        </div>
      </div>
    </div>
  );
};

export const ProfileShimmer = () => {
  return (
    <div className="profile-shimmer-container">
      <div className="profile-header-shimmer">
        <div className="shimmer-avatar"></div>
        <div className="shimmer-name"></div>
      </div>
      <div className="profile-details-shimmer">
        {[1, 2, 3].map((item) => (
          <div key={item} className="shimmer-detail-row"></div>
        ))}
      </div>
    </div>
  );
};