import React, { useState } from 'react';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Slider, 
  FormControlLabel, 
  Checkbox, 
  Button 
} from '@mui/material';

const Rating = ({ selectedRating, handleRatingSelect }) => {
  return (
    <div className="rating">
      {[5, 4, 3, 2, 1].map((rating) => (
        <React.Fragment key={rating}>
          <input
            type="radio"
            id={`star-${rating}`}
            name="star-radio"
            value={`star-${rating}`}
            checked={selectedRating === rating}
            onChange={() => handleRatingSelect(rating)}
          />
          <label htmlFor={`star-${rating}`}>  
            <Star size={16} fill={rating <= selectedRating ? "#ffc107" : "none"} stroke={rating <= selectedRating ? "#ffc107" : "#6c757d"} />
          </label>
        </React.Fragment>
      ))}
    </div>
  );
};

const Sidebar = () => {
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedRating, setSelectedRating] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    brands: true,
    rating: true
  });

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
  };

  const handlePriceChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  const handleRatingSelect = (rating) => {
    setSelectedRating(rating === selectedRating ? null : rating);
  };

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const renderStars = (count) => {
    return Array(5).fill(0).map((_, index) => (
      <Star 
        key={index} 
        size={16} 
        fill={index < count ? "#ffc107" : "none"} 
        stroke={index < count ? "#ffc107" : "#6c757d"} 
      />
    ));
  };

  return (
    <div className="sidebar">
      <h4>Filters</h4>
      {/* Categories Section */}
      <div className="sidebar-section">
        <div className="filter-header">
          <div className="filter-title">Categories</div>
          <div onClick={() => toggleSection('categories')} style={{ cursor: 'pointer' }}>
            {expandedSections.categories ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        {expandedSections.categories && (
          <FormControl variant="outlined" size="small" className="category-dropdown">
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              onChange={handleCategoryChange}
              label="Category"
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="electronics">Electronics</MenuItem>
              <MenuItem value="clothing">Clothing</MenuItem>
              <MenuItem value="home">Home & Kitchen</MenuItem>
              <MenuItem value="books">Books</MenuItem>
              <MenuItem value="beauty">Beauty & Personal Care</MenuItem>
            </Select>
          </FormControl>
        )}
      </div>
      {/* Price Range Section */}
      <div className="sidebar-section">
        <div className="filter-header">
          <div className="filter-title">Price Range</div>
          <div onClick={() => toggleSection('price')} style={{ cursor: 'pointer' }}>
            {expandedSections.price ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        {expandedSections.price && (
          <div className="price-slider">
            <Slider
              value={priceRange}
              onChange={handlePriceChange}
              valueLabelDisplay="auto"
              min={0}
              max={1000}
            />
            <div className="d-flex justify-content-between mt-2">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>
        )}
      </div>
      {/* Brands Section */}
      <div className="sidebar-section">
        <div className="filter-header">
          <div className="filter-title">Brands</div>
          <div onClick={() => toggleSection('brands')} style={{ cursor: 'pointer' }}>
            {expandedSections.brands ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        {expandedSections.brands && (
          <div>
            <FormControlLabel
              control={<Checkbox size="small" />}
              label="Apple"
              className="brand-checkbox"
            />
            <FormControlLabel
              control={<Checkbox size="small" />}
              label="Samsung"
              className="brand-checkbox"
            />
            <FormControlLabel
              control={<Checkbox size="small" />}
              label="Sony"
              className="brand-checkbox"
            />
            <FormControlLabel
              control={<Checkbox size="small" />}
              label="Nike"
              className="brand-checkbox"
            />
            <FormControlLabel
              control={<Checkbox size="small" />}
              label="Adidas"
              className="brand-checkbox"
            />
          </div>
        )}
      </div>
      {/* Rating Section */}
      <div className="sidebar-section">
        <div className="filter-header">
          <div className="filter-title">Rating</div>
          <div onClick={() => toggleSection('rating')} style={{ cursor: 'pointer' }}>
            {expandedSections.rating ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        {expandedSections.rating && (
          <div>
            <div className="rating-filter">
              {renderStars(5)}
              <span className="rating-count">(124)</span>
            </div>
            <div className="rating-filter">
              {renderStars(4)}
              <span className="rating-count">(305)</span>
            </div>
            <div className="rating-filter">
              {renderStars(3)}
              <span className="rating-count">(251)</span>
            </div>
            <div className="rating-filter">
              {renderStars(2)}
              <span className="rating-count">(78)</span>
            </div>
            <div className="rating-filter">
              {renderStars(1)}
              <span className="rating-count">(42)</span>
            </div>
          </div>
        )}
      </div>
      <Button 
        variant="contained" 
        color="primary" 
        fullWidth
        style={{ marginBottom: '10px' }}
      >
        Apply Filters
      </Button>
      <a href="#" className="clear-filters">Clear all filters</a>
    </div>
  );
};

export default Sidebar; 