import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ComboOffer.css';
import { getAllCombos } from '../../APi/comboApi';
import { cartApi } from '../../APi/cartApi';

const ComboOffer = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [comboOffers, setComboOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [cartError, setCartError] = useState(null);
  const containerRef = useRef(null);

  const formatImageUrl = (imagePath) => {
    if (!imagePath) {
      console.log('No image path provided');
      return 'default-image-path.jpg';
    }

    // Handle array of images
    if (Array.isArray(imagePath) && imagePath.length > 0) {
      imagePath = imagePath[0];
    }

    // Handle relative paths
    if (typeof imagePath === 'string') {
      if (imagePath.startsWith('http')) {
        return imagePath;
      } else if (imagePath.startsWith('/')) {
        return `https://backmern.picknow.in${imagePath}`;
      } else {
        return `https://backmern.picknow.in/${imagePath}`;
      }
    }

    console.log('Invalid image path:', imagePath);
    return 'default-image-path.jpg';
  };

  const handleImageError = (e) => {
    console.log('Image failed to load:', e.target.src);
    e.target.src = 'default-image-path.jpg';
    e.target.onerror = null; // Prevent infinite loop
  };

  useEffect(() => {
    const fetchComboOffers = async () => {
      try {
        // setLoading(true);
        const response = await getAllCombos();
        console.log('Raw API Response:', response);

        let allCombos = [];

        // Extract combos from different possible response formats
        if (Array.isArray(response)) {
          allCombos = response;
        } else if (response.data && Array.isArray(response.data)) {
          allCombos = response.data;
        } else if (response.combos && Array.isArray(response.combos)) {
          allCombos = response.combos;
        } else {
          console.error('Unexpected response format:', response);
          throw new Error('Invalid response format');
        }

        // Filter only active combos
        const activeCombos = allCombos.filter(combo => {
          // Check if combo has an active status field
          // Assuming the field might be named 'status', 'isActive', 'active', etc.
          const isActive =
            combo.status === 'active' ||
            combo.isActive === true ||
            combo.active === true ||
            (combo.ccStatus !== undefined ? combo.ccStatus === 'active' : true); // Default to true if status field doesn't exist

          console.log(`Combo ${combo.ccName || combo._id} active status:`, isActive);
          return isActive;
        });

        console.log('Active combos count:', activeCombos.length);

        const formattedCombos = activeCombos.map(combo => {
          console.log('Processing combo image:', combo.ccImage);
          // Calculate total items count based on product quantities
          const totalItems = (combo.ccProducts || []).reduce((total, product) => {
            return total + (product.quantity || 1);
          }, 0);

          return {
            id: combo._id,
            title: combo.ccName,
            description: combo.ccDescription,
            price: combo.ccPrice,
            off: combo.ccOffer,
            items: combo.ccProducts || [],
            image: formatImageUrl(combo.ccImage),
            totalItems: totalItems,
            // Store the original active status for reference
            isActive: combo.status === 'active' || combo.isActive === true || combo.active === true || (combo.ccStatus !== undefined ? combo.ccStatus === 'active' : true)
          };
        });

        console.log('Formatted active combos:', formattedCombos);
        setComboOffers(formattedCombos);
      } catch (err) {
        console.error('Error fetching combo offers:', err);
        setError(err.message || 'Failed to load combo offers');
      } finally {
        setLoading(false);
      }
    };

    fetchComboOffers();
  }, []);

  const openPopup = async (combo) => {
    try {
      setError(null);
      setSelectedCombo(null);

      const existingCombo = comboOffers.find(c => c.id === combo.id);
      if (!existingCombo) {
        setError('This combo is no longer available');
        return;
      }

      // Double-check if the combo is still active
      if (!existingCombo.isActive) {
        setError('This combo is no longer available');
        return;
      }

      const formattedCombo = {
        id: existingCombo.id,
        title: existingCombo.title,
        description: existingCombo.description,
        price: existingCombo.price,
        off: existingCombo.off,
        items: existingCombo.items.map(item => ({
          ...item,
          pImage: formatImageUrl(item.pImage),
          pOptions: item.pOptions || [],
          variant: item.variant ? {
            size: item.variant.size,
            type: item.variant.type,
          } : null
        })),
        image: formatImageUrl(existingCombo.image),
        isActive: existingCombo.isActive
      };

      console.log('Formatted combo for popup:', formattedCombo);
      setSelectedCombo(formattedCombo);
    } catch (err) {
      console.error('Error in openPopup:', err);
      setError('This combo is no longer available');
      setSelectedCombo(null);
    }
  };

  const closePopup = () => {
    setSelectedCombo(null);
    setError(null);
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollPosition = containerRef.current.scrollLeft;
      const cardWidth = containerRef.current.offsetWidth * 0.6; // Adjusted for better mobile experience
      const newIndex = Math.round(scrollPosition / cardWidth);
      setActiveIndex(Math.max(0, Math.min(newIndex, comboOffers.length - 1)));
    }
  };

  const scrollToIndex = (index) => {
    if (containerRef.current) {
      const cardWidth = containerRef.current.offsetWidth * 0.6; // Adjusted for better mobile experience
      const targetScroll = cardWidth * index;
      containerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  const handlePrevious = () => {
    if (activeIndex > 0) {
      const newIndex = activeIndex - 1;
      setActiveIndex(newIndex);
      scrollToIndex(newIndex);
    }
  };

  const handleNext = () => {
    if (activeIndex < comboOffers.length - 1) {
      const newIndex = activeIndex + 1;
      setActiveIndex(newIndex);
      scrollToIndex(newIndex);
    }
  };

  // Add touch/swipe support for mobile
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      let startX = 0;
      let endX = 0;
      let isDragging = false;

      const handleTouchStart = (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
      };

      const handleTouchMove = (e) => {
        if (!isDragging) return;
        e.preventDefault(); // Prevent default scrolling while swiping
      };

      const handleTouchEnd = (e) => {
        if (!isDragging) return;

        endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        const threshold = 30; // Reduced threshold for easier swiping

        if (Math.abs(diff) > threshold) {
          if (diff > 0 && activeIndex < comboOffers.length - 1) {
            // Swipe left - go to next
            const newIndex = activeIndex + 1;
            setActiveIndex(newIndex);
            scrollToIndex(newIndex);
          } else if (diff < 0 && activeIndex > 0) {
            // Swipe right - go to previous
            const newIndex = activeIndex - 1;
            setActiveIndex(newIndex);
            scrollToIndex(newIndex);
          }
        }

        isDragging = false;
      };

      const handleScroll = () => {
        if (containerRef.current) {
          const scrollPosition = containerRef.current.scrollLeft;
          const cardWidth = containerRef.current.offsetWidth * 0.6;
          const newIndex = Math.round(scrollPosition / cardWidth);
          setActiveIndex(Math.max(0, Math.min(newIndex, comboOffers.length - 1)));
        }
      };

      container.addEventListener('scroll', handleScroll);
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);

      return () => {
        container.removeEventListener('scroll', handleScroll);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [activeIndex, comboOffers.length]);

  const handleAddToCart = async () => {
    if (!selectedCombo) return;

    try {
      setCartError(null);

      // Double-check if the combo is still active before adding to cart
      if (!selectedCombo.isActive) {
        setCartError('This combo is no longer available');
        return;
      }

      // Log the selected combo data
      console.log('Selected Combo Data:', {
        id: selectedCombo.id,
        title: selectedCombo.title,
        image: selectedCombo.image,
        price: selectedCombo.price
      });

      // Format the image URL
      const formattedImageUrl = formatImageUrl(selectedCombo.image);
      console.log('Formatted Image URL:', formattedImageUrl);

      // Add the entire combo as a single item
      const cartData = {
        productId: selectedCombo.id,
        quantity: 1,
        price: selectedCombo.price,
        variantType: 'combo',
        variantValue: selectedCombo.title,
        variantId: `combo-${selectedCombo.id}`,
        comboName: selectedCombo.title || selectedCombo.ccName,
        comboImage: formattedImageUrl // Use the formatted image URL
      };

      console.log('Cart data being sent:', cartData);

      const response = await cartApi.addToCart(cartData);
      console.log('Cart API response:', response);

      // Show success message
      // alert('Combo added to cart successfully!');
      closePopup();
    } catch (error) {
      console.error('Error adding combo to cart:', error);
      setCartError(error.message || 'Failed to add combo to cart');
    }
  };

  if (loading) {
    return (
      <section className="combo-offer-section">
        <h2>Special Combo Offers</h2>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          color: '#666'
        }}>
          Loading combo offers...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="combo-offer-section">
        <h2>Special Combo Offers</h2>
        <div className="error-message">
          {error}
        </div>
      </section>
    );
  }

  if (!comboOffers || comboOffers.length === 0) {
    return (
      <section className="combo-offer-section">
        <h2>Special Combo Offers</h2>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          color: '#666'
        }}>
          No combo offers available at the moment.
        </div>
      </section>
    );
  }

  return (
    <section className="combo-offer-section">
      <h2 className="combo-offer-title">
        Special <span className="combotext-highlight">Combo</span> Offers
      </h2>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="combo-container" ref={containerRef}>
        {comboOffers.map((combo, index) => (
          <div
            key={combo.id}
            className={`combo-card ${index === activeIndex ? 'active' : ''}`}
          >
            <img
              src={combo.image}
              alt={combo.title}
              onError={handleImageError}
              loading="lazy"
            />
            <h3>{combo.title}</h3>
            <p>{combo.description}</p>
            <p className="price">Rs:₹{combo.price} ({combo.off}% off)</p>
            <span className="combo-items-count">
              {combo.totalItems} items
            </span>
            <button onClick={() => navigate(`/combo/${combo.id}`)}>View Details</button>
          </div>
        ))}
      </div>

      {selectedCombo && !error && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button className="close-btn" onClick={closePopup} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <h2>{selectedCombo.title}</h2>
            <div className="combo-products">
              {selectedCombo.items.map((product, index) => (
                <div key={index} className="combo-product-item">
                  <img
                    src={product.pImage}
                    alt={product.pName}
                    onError={handleImageError}
                    loading="lazy"
                  />
                  <div className="product-details">
                    <h4>{product.pName}</h4>
                    <div className="product-quantity-info">
                      <span className="quantity-badge">Qty: {product.quantity || 1}</span>
                      <span className="product-qty">Pack of: <b>{product.quantity || 1}</b></span>
                    </div>
                    {product.variant && (
                      <div className="variant-details">
                        <span className="variant-type">{product.variant.type}</span>
                        <span className="variant-size">{product.variant.size}</span>
                      </div>
                    )}
                    {product.pOptions && (
                      Array.isArray(product.pOptions) && product.pOptions.length > 0 && (
                        <div className="product-options">
                          {product.pOptions.map((option, optIndex) => (
                            <span key={optIndex} className="option-tag">{option}</span>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="popup-buttons">
              <button className="view-details-btn" onClick={() => navigate(`/combo/${selectedCombo.id}`)}>
                VIEW FULL DETAILS
              </button>
              <button className="order-btn" onClick={handleAddToCart}>ADD TO CART</button>
            </div>
            {cartError && (
              <div className="error-message">
                {cartError}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ComboOffer;