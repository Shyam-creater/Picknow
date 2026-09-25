import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, EffectCards } from 'swiper/modules';
import './CategorySlider.css';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
import 'swiper/css/effect-cards';
import { CategoryShimmer } from '../ShimmerEffect/ShimmerEffect';

// Import existing images from your assets folder
import dryFruit1 from '../../assets/dryfruits.jpg';
import Nuts from '../../assets/Nuts.jpg';
import beverage from '../../assets/Top_category_images/beverage.png';
import vegetable from '../../assets/Top_category_images/vegetable.png';
import honey from '../../assets/Top_category_images/honey.png';
import Oil from '../../assets/Top_category_images/Oil.png';

const CategoryCarousel = () => {
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000); // Increased loading time for smoother transition
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <CategoryShimmer />;
  }

  const categories = [
    { 
      id: 1, 
      image: beverage, 
      title: 'Staples', 
      items: '40 items', 
      link: '/collections/staples', 
      bgcolor: '#f2fce4',
      description: 'Essential food items for your daily needs'
    },
    { 
      id: 2, 
      image: Oil, 
      title: 'Oils', 
      items: '10 items', 
      link: '/collections/oils', 
      bgcolor: '#fffceb',
      description: 'High-quality cooking oils and essentials'
    },
    { 
      id: 3, 
      image: dryFruit1, 
      title: 'Seeds', 
      items: '11 items', 
      link: '/collections/seeds', 
      bgcolor: '#ecffec',
      description: 'Healthy seeds and nuts collection'
    },
    { 
      id: 4, 
      image: honey, 
      title: 'Honey', 
      items: '13 items', 
      link: '/collections/honey', 
      bgcolor: '#feefea',
      description: 'Pure and natural honey products'
    },
    { 
      id: 5, 
      image: vegetable, 
      title: 'Fruits & Vegetables', 
      items: '78 items', 
      link: '/collections/fruits-vegetables', 
      bgcolor: '#fff3eb',
      description: 'Fresh produce and organic options'
    },
    { 
      id: 6, 
      image: beverage, 
      title: 'Beverages', 
      items: '7 items', 
      link: '/collections/beverages', 
      bgcolor: '#fff3ff',
      description: 'Refreshing drinks and beverages'
    }
  ];

  return (
    <div className="category-carousel-container mt-1">
      <div className="category-carousel-wrapper">
        <div className="category-carousel-header">
          <h3 className="category-carousel-title">Top Categories</h3>
          <div className="category-carousel-controls">
            <div className="category-carousel-button-prev">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M15.281 6.176H3.281L7.658 1.799L6.244 0.385L1.095 5.534C0.665 5.964 0.424 6.712 0.424 7.176C0.424 7.64 0.665 8.388 1.095 8.818L6.244 13.967L7.658 12.553L3.281 8.176H15.281V6.176Z" />
              </svg>
            </div>
            <div className="category-carousel-button-next">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M14.188 5.924L9.039 0.775L7.625 2.189L11.002 5.566H0V7.566H11.002L7.625 10.943L9.039 12.357L14.188 7.208C14.618 6.778 14.859 6.03 14.859 5.566C14.859 5.102 14.618 4.354 14.188 5.924Z" />
              </svg>
            </div>
          </div>
        </div>
        <Swiper
          modules={[Navigation, Autoplay]}
          navigation={{
            prevEl: '.category-carousel-button-prev',
            nextEl: '.category-carousel-button-next'
          }}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          }}
          loop={true}
          spaceBetween={24}
          slidesPerView="auto"
          className="category-carousel-grid"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {categories.map((category) => (
            <SwiperSlide key={category.id}>
              <div 
                className="category-carousel-item" 
                style={{ '--item-bgcolor': category.bgcolor }}
              >
                <Link to={category.link} className="category-carousel-link">
                  <div className="category-carousel-image">
                    <img 
                      src={category.image} 
                      alt={category.title} 
                      loading="lazy" 
                      width="80" 
                      height="80"
                    />
                  </div>
                  <h3 className="category-carousel-heading">{category.title}</h3>
                  <span className="category-carousel-subtitle">{category.items}</span>
                  <p className="category-carousel-description">{category.description}</p>
                </Link>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default CategoryCarousel;
