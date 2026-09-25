import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { productApi } from "../../APi/productApi";
import { categoryApi } from "../../APi/categoryApi";
import ProductCard from "../ProductPage/ProductCard";
import ModernLoader from "../Loading/ModernLoader";
import CategoryNav from "../Navbar/CategoryNav";
import "./CategoryProducts.css";
import { FiFilter, FiCheck, FiSearch, FiZap, FiTag } from "react-icons/fi";

const CategoryProducts = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const fallbackName = searchParams.get("name") || "Category";

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCats, setSelectedSubCats] = useState([]);
  const [hasCombos, setHasCombos] = useState(false); // New state to track if category has combos
  const [loading, setLoading] = useState(true);
  const [activeCategoryName, setActiveCategoryName] = useState(fallbackName);
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000); // Default high value
  const [priceRange, setPriceRange] = useState([0, 10000]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        setLoading(true);
        setSelectedSubCats([]);

        // 1. Fetch Category Details to get the precisely matching name
        const catDetails = await categoryApi.getCategoryById(id);
        const realName = catDetails.cName || fallbackName;
        setActiveCategoryName(realName);

        const [prodRes, subRes] = await Promise.all([
          productApi.getProductsByCategory(realName),
          categoryApi.getSubCategories(id)
        ]);

        const prodList = Array.isArray(prodRes.products) ? prodRes.products : (Array.isArray(prodRes) ? prodRes : []);
        setProducts(prodList);
        setFilteredProducts(prodList);
        setHasCombos(prodList.some(p => p.pType === "combo"));

        const subList = Array.isArray(subRes.subCategories) ? subRes.subCategories : (Array.isArray(subRes) ? subRes : []);
        setSubCategories(subList);

        if (prodList.length > 0) {
          const prices = prodList.map(p => Number(p.pPrice)).filter(p => !isNaN(p));
          if (prices.length > 0) {
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            setMinPrice(0);
            setMaxPrice(max + 100);
            setPriceRange([0, max + 100]);
          }
        }
      } catch (error) {
        console.error("Error fetching category data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, fallbackName]);

  useEffect(() => {
    let filtered = [...products];

    if (selectedSubCats.length > 0) {
      filtered = filtered.filter(p => {
        const subName = p.pSubCategory || p.subcategory;
        
        // Special handling for the virtual "Combo Offer" filter
        if (selectedSubCats.includes("Combo Offer")) {
          if (p.pType === "combo") return true;
        }

        // If we are in "All Combo Offers", we use smart matching for the virtual categories
        if (activeCategoryName === "All Combo Offers") {
          return selectedSubCats.some(selected => {
            const firstWord = selected.split(' ')[0].toLowerCase();
            const productSub = (subName || "").toLowerCase();
            const productCat = (p.pCategory || "").toLowerCase();
            
            return productSub.startsWith(firstWord) || productCat === selected.toLowerCase();
          });
        }
        return selectedSubCats.includes(subName);
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.pName?.toLowerCase().includes(query) ||
        p.pDescription?.toLowerCase().includes(query)
      );
    }

    filtered = filtered.filter(p => {
      const price = Number(p.pPrice);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    setFilteredProducts(filtered);
  }, [selectedSubCats, products, searchQuery, priceRange, activeCategoryName]);

  const toggleSubCat = (subName) => {
    setSelectedSubCats(prev =>
      prev.includes(subName) ? prev.filter(i => i !== subName) : [...prev, subName]
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="category-products-premium">
      <CategoryNav />
      <div className="category-main-layout">
        <aside className="category-sidebar-glass">
          <div className="sticky-filter-wrap">
            <div className="filter-header-modern">
              <div className="filter-header-main">
                <div className="filter-icon-box">
                  <FiFilter size={16} />
                </div>
                <span>Pick Your Needs</span>
              </div>
              {(selectedSubCats.length > 0 || searchQuery || priceRange[0] !== minPrice || priceRange[1] !== maxPrice) && (
                <button
                  className="clear-all-surgical"
                  onClick={() => {
                    setSelectedSubCats([]);
                    setSearchQuery("");
                    setPriceRange([minPrice, maxPrice]);
                  }}
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="filter-search-box-premium">
              <FiSearch className="search-icon-surgical" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-block-premium">
              <h3 className="filter-block-title">Price Range</h3>
              <div className="price-slider-container-surgical">
                <div className="price-inputs-row">
                  <div className="price-input-box">
                    <span>Min</span>
                    <input
                      type="number"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    />
                  </div>
                  <div className="price-input-box">
                    <span>Max</span>
                    <input
                      type="number"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={minPrice}
                  max={maxPrice}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="modern-range-slider"
                />
                <div className="price-labels">
                  <span>₹{priceRange[0]}</span>
                  <span>₹{priceRange[1]}</span>
                </div>
              </div>
            </div>
            <div className="filter-block-premium">
              <h3 className="filter-block-title">Collection Type</h3>
              <div className="modern-check-list">
                {subCategories.length > 0 || (hasCombos && activeCategoryName !== "All Combo Offers") ? (
                  <>
                    {hasCombos && activeCategoryName !== "All Combo Offers" && (
                      <label className={`modern-filter-item ${selectedSubCats.includes("Combo Offer") ? 'is-active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selectedSubCats.includes("Combo Offer")}
                          onChange={() => toggleSubCat("Combo Offer")}
                        />
                        <div className="simple-check-box">
                          {selectedSubCats.includes("Combo Offer") && <FiCheck size={12} strokeWidth={4} />}
                        </div>
                        <div className="item-visual-box-small">
                          <FiZap size={16} color="#ff5e00" fill="#ff5e00" />
                        </div>
                        <span className="item-label-text">Combo Offers</span>
                      </label>
                    )}
                    {subCategories.map(sub => (
                      <label key={sub._id} className={`modern-filter-item ${selectedSubCats.includes(sub.name) ? 'is-active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selectedSubCats.includes(sub.name)}
                          onChange={() => toggleSubCat(sub.name)}
                        />
                        <div className="simple-check-box">
                          {selectedSubCats.includes(sub.name) && <FiCheck size={12} />}
                        </div>
                        <div className="item-visual-box-small">
                          <img src={sub.image || "https://cdn-icons-png.flaticon.com/512/3061/3061730.png"} alt={sub.name} />
                        </div>
                        <span className="item-label-text">{sub.name}</span>
                      </label>
                    ))}
                  </>
                ) : (
                  <p className="no-filters-aesthetic">Browse all items</p>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* PRODUCT LISTING CONTENT */}
        <main className="product-listing-content">
          <div className="discovery-header-premium">
            <div className="breadcrumb-glass">Home / {activeCategoryName}</div>
            <div className="title-section-modern">
              <h1 className="modern-title">{activeCategoryName}</h1>
              <div className="discovery-status">
                <div className="pulse-dot"></div>
                <span className="results-count-premium">{filteredProducts.length} Premium Products</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loader-full-height-modern">
              <ModernLoader />
            </div>
          ) : filteredProducts.length > 0 ? (
            activeCategoryName === "All Combo Offers" ? (
              <div className="grouped-category-view">
                {Object.entries(
                  filteredProducts.reduce((acc, product) => {
                    // Use pSubCategory for grouping if the product's main category is "All Combo Offers"
                    const cat = (product.pCategory === "All Combo Offers") 
                      ? (product.pSubCategory || "Other Combos") 
                      : (product.pCategory || "Uncategorized");
                    
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(product);
                    return acc;
                  }, {})
                ).map(([category, products]) => (
                  <div key={category} className="category-group-section">
                    <h2 className="category-group-title">{category}</h2>
                    <div className="category-grid-5">
                      {products.map(product => (
                        <ProductCard key={product._id} product={product} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="category-grid-5">
                {filteredProducts.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )
          ) : (
            <div className="empty-state-aesthetic">
              <div className="empty-icon-container">
                <img src="https://cdn-icons-png.flaticon.com/512/7486/7486744.png" alt="Empty" />
              </div>
              <h3>Quiet in here...</h3>
              <p>We couldn't find items matching your selection.</p>
              <button onClick={() => setSelectedSubCats([])} className="btn-premium-action">Explore All Items</button>
            </div>
          )}
        </main>
      </div>
      {/* Footer removed to prevent duplication */}
    </div>
  );
};

export default CategoryProducts;