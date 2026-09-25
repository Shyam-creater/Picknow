import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { categoryApi } from '../../APi/categoryApi';
import { productApi } from '../../APi/productApi';
import { FaTimes } from 'react-icons/fa';
import "./SideBar.css";
import { useSnackbar } from "notistack";

const Sidebar = ({
  selectedCategory,
  categories,
  priceRange,
  selectedRating,
  selectedBrands,
  onCategoryChange,
  onPriceChange,
  onRatingSelect,
  onBrandChange,
  onResetFilters,
  ratingCounts
}) => {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    brands: true,
    rating: true,
    nestedCategories: true
  });

  const [allNestedCategories, setAllNestedCategories] = useState([]);
  const [loadingNestedCategories, setLoadingNestedCategories] = useState(false);
  const [filteredNestedCategories, setFilteredNestedCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef(null);
  const { enqueueSnackbar } = useSnackbar()

  // Get query parameters from URL
  const getQueryParams = () => {
    const searchParams = new URLSearchParams(location.search);
    return {
      q: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      subcategory: searchParams.get('subcategory') || ''
    };
  };

  // Fetch all nested categories when component mounts
  useEffect(() => {
    const fetchAllNestedCategories = async () => {
      setLoadingNestedCategories(true);
      try {
        // First get all categories
        const categoriesResponse = await categoryApi.getAllCategories();
        const activeCategories = categoriesResponse.filter(
          (category) => category.cStatus === "active"
        );

        // Then get all subcategories and nested subcategories
        const allNested = [];

        for (const category of activeCategories) {
          try {
            const subCategoriesResponse = await categoryApi.getSubCategories(category._id);
            const activeSubCategories = subCategoriesResponse.subCategories.filter(
              (subCategory) => subCategory.status === "active"
            );

            for (const subCategory of activeSubCategories) {
              try {
                const nestedResponse = await categoryApi.getNestedSubCategories(
                  category._id,
                  subCategory._id
                );
                const activeNestedSubCategories = nestedResponse.subCategories.filter(
                  (nestedSubCategory) => nestedSubCategory.status === "active"
                );

                // Add category and subcategory info to each nested category
                const nestedWithContext = activeNestedSubCategories.map(nested => ({
                  ...nested,
                  categoryName: category.cName,
                  subCategoryName: subCategory.name,
                  categoryId: category._id,
                  subCategoryId: subCategory._id
                }));

                allNested.push(...nestedWithContext);
              } catch (error) {
                console.error(`Error fetching nested subcategories for ${subCategory.name}:`, error);
              }
            }
          } catch (error) {
            console.error(`Error fetching subcategories for ${category.cName}:`, error);
          }
        }

        setAllNestedCategories(allNested);
        setFilteredNestedCategories(allNested); // Initialize filtered categories
      } catch (error) {
        console.error("Error fetching all nested categories:", error);
      } finally {
        setLoadingNestedCategories(false);
      }
    };

    fetchAllNestedCategories();
  }, []);

  // Filter nested categories based on query parameters
  useEffect(() => {
    const queryParams = getQueryParams();
    const { q, category, subcategory } = queryParams;

    if (q || category || subcategory) {
      let filtered = allNestedCategories;

      // Filter by search query
      if (q) {
        filtered = filtered.filter(cat =>
          cat.name.toLowerCase().includes(q.toLowerCase()) ||
          cat.categoryName.toLowerCase().includes(q.toLowerCase()) ||
          cat.subCategoryName.toLowerCase().includes(q.toLowerCase())
        );
      }

      // Filter by category
      if (category) {
        filtered = filtered.filter(cat =>
          cat.categoryName.toLowerCase().includes(category.toLowerCase())
        );
      }

      // Filter by subcategory
      if (subcategory) {
        filtered = filtered.filter(cat =>
          cat.subCategoryName.toLowerCase().includes(subcategory.toLowerCase())
        );
      }

      setFilteredNestedCategories(filtered);
    } else {
      // If no query parameters, show all categories
      setFilteredNestedCategories(allNestedCategories);
    }
  }, [location.search, allNestedCategories]);

  // Fetch brands only when a search query is present in URL
  useEffect(() => {
    const queryParams = getQueryParams();
    const { q } = queryParams;

    const fetchBrands = async () => {
      setLoadingBrands(true);
      try {
        const response = await productApi.getBrands(q);
        let brandItems = [];
        // Normalize various possible response shapes
        const payload = response?.brands || response?.data || response;
        if (Array.isArray(payload)) {
          brandItems = payload.map((item) => {
            if (typeof item === 'string') return item;
            return item?.name || item?.brand || item?.pBrand || '';
          }).filter(Boolean);
        }

        // Deduplicate and sort
        const uniqueBrands = Array.from(new Set(brandItems)).sort((a, b) => a.localeCompare(b));
        setBrands(uniqueBrands);
      } catch (error) {
        console.error('Error fetching brands:', error);
        setBrands([]);
      } finally {
        setLoadingBrands(false);
      }
    };

    if (q) {
      fetchBrands();
    } else {
      setBrands([]);
    }
  }, [location.search]);

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  // Enhanced reset function that also resets sidebar internal state
  const handleResetFilters = () => {
    // Reset sidebar internal state
    setExpandedSections({
      categories: true,
      price: true,
      brands: true,
      rating: true,
      nestedCategories: true
    });

    // Reset filtered categories to show all
    setFilteredNestedCategories(allNestedCategories);

    // Clear search input if it exists
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }

    // Clear URL query parameters
    navigate('/products', { replace: true });

    // Call the parent reset function
    onResetFilters();
  };

  // Handle nested category click
  const handleNestedCategoryClick = async (nestedCategory) => {
    try {
      const response = await productApi.getProductsByNestedSubCategory(
        nestedCategory._id
      );

      if (response.success && Array.isArray(response.products)) {
        // Filter out inactive products using pStatus field
        const activeProducts = response.products.filter(
          (product) => product.pStatus === "active"
        );

        if (activeProducts.length === 0) {
          // You can add a snackbar notification here if you have one
          console.log(`No active products found in ${nestedCategory.name}`);
          enqueueSnackbar(
            `No products found in ${nestedCategory.name}`,
            { variant: "info" }
          );
        } else {
          // Fetch variants for each active product
          const productsWithVariants = await Promise.all(
            activeProducts.map(async (product) => {
              try {
                const variantResponse = await productApi.getProductVariants(
                  product._id
                );
                if (variantResponse.success && variantResponse.variants) {
                  // Filter out inactive variants
                  const activeVariants = variantResponse.variants.filter(
                    (variant) => variant.status === "active"
                  );
                  return {
                    ...product,
                    variants: activeVariants,
                  };
                }
                return product;
              } catch (error) {
                console.error("Error fetching variants:", error);
                return product;
              }
            })
          );

          // Update URL with nested subcategory information
          const queryParams = new URLSearchParams();
          queryParams.set('q', nestedCategory.name);
          // queryParams.set('category', nestedCategory.categoryName);
          // queryParams.set('subcategory', nestedCategory.subCategoryName);

          navigate(`/products?${queryParams.toString()}`, {
            state: {
              products: productsWithVariants,
              title: `Products in ${nestedCategory.name}`,
              selectedVariants: {},
            },
          });
          // Instant scroll for discovery focus
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        console.error("Error loading products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };
  // Handle nested category click
  const handleBrandCategoryClick = async (nestedCategory, brandsParam = selectedBrands) => {
    try {
      // Notify product page to show loading
      window.dispatchEvent(new CustomEvent('brandFilterLoading', { detail: true }));
      const response = await productApi.getProductsBrandSubCategory(
        nestedCategory._id,
        brandsParam
      );

      if (response.success && Array.isArray(response.products)) {
        // Filter out inactive products using pStatus field
        const activeProducts = response.products.filter(
          (product) => product.pStatus === "active"
        );

        if (activeProducts.length === 0) {
          // You can add a snackbar notification here if you have one
          console.log(`No active products found in ${nestedCategory.name}`);
          enqueueSnackbar(
            `No products found in ${nestedCategory.name}`,
            { variant: "info" }
          );
        } else {
          // Fetch variants for each active product
          const productsWithVariants = await Promise.all(
            activeProducts.map(async (product) => {
              try {
                const variantResponse = await productApi.getProductVariants(
                  product._id
                );
                if (variantResponse.success && variantResponse.variants) {
                  // Filter out inactive variants
                  const activeVariants = variantResponse.variants.filter(
                    (variant) => variant.status === "active"
                  );
                  return {
                    ...product,
                    variants: activeVariants,
                  };
                }
                return product;
              } catch (error) {
                console.error("Error fetching variants:", error);
                return product;
              }
            })
          );

          // Update URL with nested subcategory information
          const queryParams = new URLSearchParams();
          queryParams.set('q', nestedCategory.name);
          // queryParams.set('category', nestedCategory.categoryName);
          // queryParams.set('subcategory', nestedCategory.subCategoryName);

          navigate(`/products?${queryParams.toString()}`, {
            state: {
              products: productsWithVariants,
              title: `Products in ${nestedCategory.name}`,
              selectedVariants: {},
              fromBrandFilter: true,
              appliedBrands: brandsParam,
            },
          });
          // Instant scroll for discovery focus
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        console.error("Error loading products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
    finally {
      // Notify product page to hide loading
      window.dispatchEvent(new CustomEvent('brandFilterLoaded', { detail: false }));
    }
  };
  // Handle search input change with debouncing
  const handleSearchChange = (e) => {
    const searchTerm = e.target.value.toLowerCase();

    // Filter based on search term and existing query parameters
    const queryParams = getQueryParams();
    let filtered = allNestedCategories;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm) ||
        cat.categoryName.toLowerCase().includes(searchTerm) ||
        cat.subCategoryName.toLowerCase().includes(searchTerm)
      );
    }

    // Apply existing query parameter filters
    if (queryParams.category) {
      filtered = filtered.filter(cat =>
        cat.categoryName.toLowerCase().includes(queryParams.category.toLowerCase())
      );
    }

    if (queryParams.subcategory) {
      filtered = filtered.filter(cat =>
        cat.subCategoryName.toLowerCase().includes(queryParams.subcategory.toLowerCase())
      );
    }

    setFilteredNestedCategories(filtered);
  };

  // Handle search input submission (when user presses enter)
  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      const searchTerm = e.target.value.trim();
      if (searchTerm) {
        // Update URL with search query
        const queryParams = new URLSearchParams();
        queryParams.set('q', searchTerm);

        // Preserve existing category and subcategory filters if they exist
        const currentParams = getQueryParams();
        if (currentParams.category) {
          queryParams.set('category', currentParams.category);
        }
        if (currentParams.subcategory) {
          queryParams.set('subcategory', currentParams.subcategory);
        }

        navigate(`/products?${queryParams.toString()}`);
      }
    }
  };

  // Helper function to format category name
  const formatCategoryName = (category) => {
    if (category === 'all') return 'All Categories';
    return category.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Get current query parameters for display
  const currentQueryParams = getQueryParams();
  const hasActiveFilters = currentQueryParams.q || currentQueryParams.category || currentQueryParams.subcategory;
  return (
    <div className="sidebar">
      <div className="sidebar-header-premium">
        <h4>Filters</h4>
        <div className="sidebar-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handleResetFilters} className="reset-mini-link">
            Reset
          </button>
          <button 
            className="sidebar-close-mobile" 
            onClick={() => window.dispatchEvent(new Event('closeSidebar'))}
            aria-label="Close Filters"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="active-filters">
          {/* <div className="active-filters-title">Active Filters:</div> */}
          {/* {currentQueryParams.q && (
            <div className="active-filter-tag">
              Search: {currentQueryParams.q}
            </div>
          )} */}
          {/* {currentQueryParams.category && (
            <div className="active-filter-tag">
              Category: {currentQueryParams.category}
            </div>
          )} */}
          {currentQueryParams.q && (
            <div className="active-filter-tag">
              {currentQueryParams.q}
            </div>
          )}
        </div>
      )}

      {/* Nested Categories Section */}
      <div className="sidebar-section">
        <div className="filter-header">
          <div className="filter-title">All Categories</div>
          <div onClick={() => toggleSection('nestedCategories')} style={{ cursor: 'pointer' }}>
            {expandedSections.nestedCategories ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        {expandedSections.nestedCategories && (
          <div className="nested-categories-container">
            {loadingNestedCategories ? (
              <div className="loading-text">Loading categories...</div>
            ) : (
              <>
                <div className="category-search-container">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search categories... (Press Enter to search products)"
                    className="category-search-input"
                    onChange={handleSearchChange}
                    onKeyPress={handleSearchSubmit}
                  />
                  <div className="category-count">
                    Showing {filteredNestedCategories.length} of {allNestedCategories.length} categories
                  </div>
                </div>
                <div className="nested-categories-list">
                  {filteredNestedCategories.length > 0 ? (
                    filteredNestedCategories.map((nestedCategory) => (
                      <div
                        key={nestedCategory._id}
                        className="nested-category-item"
                        onClick={() => handleNestedCategoryClick(nestedCategory)}
                      >
                        <div className="nested-category-name">{nestedCategory.name}</div>
                        {/* <div className="nested-category-path">
                          {nestedCategory.categoryName} → {nestedCategory.subCategoryName}
                        </div> */}
                      </div>
                    ))
                  ) : (
                    <div className="no-categories-found">
                      No categories found matching your search.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Price Range Section */}
      {/* <div className="sidebar-section">
        <div className="filter-header">
          <div className="filter-title">Price Range</div>
          <div onClick={() => toggleSection('price')} style={{ cursor: 'pointer' }}>
            {expandedSections.price ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        {expandedSections.price && (
          <div className="price-range">
            <div className="price-range-text">
              Range: <strong>₹{priceRange[0]}</strong> - <strong>₹{priceRange[1]}</strong>
            </div>
            <Slider
              value={priceRange}
              onChange={(_, newValue) => onPriceChange(newValue)}
              valueLabelDisplay="auto"
              min={0}
              max={100000}
              step={1000}
              valueLabelFormat={(value) => `₹${value}`}
            />
            <div className="price-inputs">
              <div className="price-input-group">
                <label>Min Price</label>
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => {
                    const value = Math.max(0, Math.min(parseInt(e.target.value) || 0, priceRange[1]));
                    onPriceChange([value, priceRange[1]]);
                  }}
                  placeholder="Min"
                />
              </div>
              <div className="price-input-group">
                <label>Max Price</label>
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => {
                    const value = Math.max(priceRange[0], Math.min(parseInt(e.target.value) || 0, 100000));
                    onPriceChange([priceRange[0], value]);
                  }}
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
        )}
      </div> */}

      {/* Rating Section */}
      {/* <div className="sidebar-section">
        <div className="filter-header">
          <div className="filter-title">Rating</div>
          <div onClick={() => toggleSection('rating')} style={{ cursor: 'pointer' }}>
            {expandedSections.rating ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        {expandedSections.rating && (
          <div>
            <div className="rating-container">
              <div className="rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <React.Fragment key={star}>
                    <input 
                      value={star} 
                      name="rating" 
                      id={`star${star}`} 
                      type="radio" 
                      checked={selectedRating === star}
                      onChange={() => onRatingSelect(star)}
                    />
                    <label 
                      title={`${star} star${star > 1 ? 's' : ''}`} 
                      htmlFor={`star${star}`}
                      className={selectedRating === star ? 'selected' : ''}
                    >
                      <svg
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        strokeWidth="2"
                        stroke={star <= selectedRating ? "#ffc107" : "#ccc"}
                        fill={star <= selectedRating ? "#ffc107" : "none"}
                        viewBox="0 0 24 24"
                        height="35"
                        width="35"
                        xmlns="http://www.w3.org/2000/svg"
                        className="svgOne"
                      >
                        <polygon
                          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                        ></polygon>
                      </svg>
                      <div className="ombre"></div>
                    </label>
                  </React.Fragment>
                ))}
              </div>
              <div className="rating-info">
                <span className="rating-text">
                  {selectedRating ? `${selectedRating} star${selectedRating > 1 ? 's' : ''} and above` : 'Select rating'}
                </span>
                <span className="rating-count">
                  ({ratingCounts?.[selectedRating] || 0} products)
                </span>
              </div>
            </div>
          </div>
        )}
      </div> */}

      {/* Brands Section - visible only when query parameter exists */}
      {getQueryParams().q && (
        <div className="sidebar-section">
          <div className="filter-header">
            <div className="filter-title">Brands</div>
            <div onClick={() => toggleSection('brands')} style={{ cursor: 'pointer' }}>
              {expandedSections.brands ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </div>
          {expandedSections.brands && (
            <div>
              {loadingBrands ? (
                <div className="loading-text">Loading brands...</div>
              ) : brands.length > 0 ? (
                <div>
                  {brands.map((brand) => (
                    <div key={brand} className="brand-checkbox">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedBrands.includes(brand)}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              const newBrands = isChecked
                                ? [...selectedBrands, brand]
                                : selectedBrands.filter((b) => b !== brand);
                              // update parent state
                              onBrandChange(brand, isChecked);
                              // resolve current nested category from query
                              const { q } = getQueryParams();
                              const currentNested = allNestedCategories.find(
                                (cat) => cat.name?.toLowerCase() === q?.toLowerCase()
                              );
                              if (currentNested) {
                                handleBrandCategoryClick(currentNested, newBrands);
                              }
                            }}
                          />
                        }
                        label={brand}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-categories-found">No brands available</div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="sidebar-action-footer">
        <button
          onClick={handleResetFilters}
          className="luxury-reset-btn"
          title="Restore all items"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="reset-icon-svg"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
          RESET ALL FILTERS
        </button>
      </div>

      <div className="reset-info">
        <small style={{ color: '#6c757d', fontSize: '12px', textAlign: 'center', display: 'block', marginTop: '8px' }}>
          This will clear all applied filters and show all available products
        </small>
      </div>
    </div>
  );
};

export default Sidebar; 