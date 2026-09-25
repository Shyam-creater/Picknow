import React from 'react';
import { Link } from 'react-router-dom';
import './BannerSection.css';
import Beverages from '../../assets/honeycoming.png';
import Vegetables from '../../assets/Vegetables.jpg';
import Nuts from '../../assets/Nuts.jpg';

const BannerSection = () => {
  const banners = [
    {
      id: 1,
      image: Beverages,
      title: 'Natural, chemical-free cereals to start your day the organic way',
      // link: '/products/cereals'
    },
    {
      id: 2,
      image: Vegetables,
      title: 'Fuel your day with premium quality dry fruits and seeds',
      // link: '/products/dry-fruits'
    },
    {
      id: 3,
      image: Nuts,
      title: 'Organic, cold pressed cooking oils to nourish your health',
      // link: '/products/oils'
    }
  ];

  return (
    <section className="banner-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Upcoming Products</h2>
        </div>
        <div className="section-banner">
          {banners.map((banner) => (
            <div key={banner.id} className="grid-item">
              <div className="banner-item">
                <Link to={banner.link} className="nest-banner-link">
                  <div className="image-banner">
                    <img
                      className="lazy-image"
                      src={banner.image}
                      alt={banner.title}
                      loading="lazy"
                      width="768"
                      height="450"
                    />
                    <div className="content-banner">
                      <h4 className="nest-banner-title">{banner.title}</h4>
                      {/* <div className="button-name">
                        <span className="button-text">Coming Soon</span>
                        <span className="button-icon">
                          <svg viewBox="0 0 14 10" width="1em" height="1em" fill="none">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M8.537.808a.5.5 0 01.817-.162l4 4a.5.5 0 010 .708l-4 4a.5.5 0 11-.708-.708L11.793 5.5H1a.5.5 0 010-1h10.793L8.646 1.354a.5.5 0 01-.109-.546z"
                              fill="currentColor"
                            />
                          </svg>
                        </span>
                      </div> */}
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BannerSection; 