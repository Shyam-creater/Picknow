import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { productApi } from "../../APi/productApi";
import { brandApi } from "../../APi/brandApi";
import ProductCard from "../ProductPage/ProductCard";
import ModernLoader from "../Loading/ModernLoader";
import CategoryNav from "../Navbar/CategoryNav";
import "./BrandProducts.css";
import { FiFilter, FiCheck, FiSearch } from "react-icons/fi";

const BrandProducts = () => {
  const navigate = useNavigate();
  const { brandId } = useParams();
  const [searchParams] = useSearchParams();
  const brandName = searchParams.get("name") || "Brand";

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brandInfo, setBrandInfo] = useState(null);
  const [allBrands, setAllBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [priceRange, setPriceRange] = useState([0, 10000]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all brands for the sub-nav
        const brandsRes = await brandApi.getAllBrands();
        const brandList = Array.isArray(brandsRes) ? brandsRes : (brandsRes.brands || []);
        setAllBrands(brandList);

        // Find current brand info 
        const currentId = brandId || (brandList.length > 0 ? brandList[0]._id : null);
        const info = brandList.find(b => b._id === currentId || b.name === brandName);
        setBrandInfo(info);

        // Fetch products for current brand
        if (info) {
          const response = await productApi.getProductByBrand(info.name);
          const fetchedProducts = response.success ? (response.products || []) : (Array.isArray(response) ? response : []);
          setProducts(fetchedProducts);
          setFilteredProducts(fetchedProducts);

          // Extract unique categories
          const uniqueCats = ["All", ...new Set(fetchedProducts.map(p => p.pCategory?.cName || p.pCategory || p.category?.cName || p.category).filter(Boolean))];
          setCategories(uniqueCats);

          // Set initial price range
          if (fetchedProducts.length > 0) {
            const prices = fetchedProducts.map(p => Number(p.pPrice)).filter(p => !isNaN(p));
            if (prices.length > 0) {
              const max = Math.max(...prices);
              setMinPrice(0);
              setMaxPrice(max + 100);
              setPriceRange([0, max + 100]);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching brand data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [brandId, brandName]);

  // Handle Filtering
  useEffect(() => {
    let filtered = [...products];

    // Category Filter
    if (activeCategory !== "All") {
      filtered = filtered.filter(p => (p.pCategory?.cName || p.pCategory || p.category?.cName || p.category) === activeCategory);
    }

    // Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.pName?.toLowerCase().includes(query) || 
        p.pDescription?.toLowerCase().includes(query)
      );
    }

    // Price Filter
    filtered = filtered.filter(p => {
      const price = Number(p.pPrice);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    setFilteredProducts(filtered);
  }, [activeCategory, products, searchQuery, priceRange]);

  const handleSwitchBrand = (brand) => {
    navigate(`/brand/${brand._id}?name=${encodeURIComponent(brand.name)}`);
    setActiveCategory("All");
  };

  return (
    <div className="brand-discovery-premium">
      {/* RICH SUB-NAV TABS */}
      <div className="brand-tabs-aesthetic-wrapper">
        <div className="brand-tabs-container">
          <div className="brand-pill-scroll">
            {allBrands.length > 0 ? (
              allBrands.map((brand) => (
                <div
                  key={brand._id}
                  className={`brand-pill-item ${brand._id === (brandId || (allBrands[0]?._id)) ? 'active' : ''}`}
                  onClick={() => handleSwitchBrand(brand)}
                >
                  <div className="brand-pill-logo">
                    <img
                      src={brand.logo || brand.image || brand.cImage}
                      alt={brand.name}
                      onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3061/3061730.png"; }}
                    />
                  </div>
                  <span>{brand.name}</span>
                </div>
              ))
            ) : (
              <div className="brand-pills-loading">
                {loading ? "Discovering Brands..." : "No Brands Available"}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="brand-main-content">
        <div className="brand-main-layout">
           {/* SIDEBAR FILTER */}
           <aside className="brand-sidebar-glass">
             <div className="sticky-filter-wrap">
               <div className="filter-header-modern">
                 <div className="filter-header-main">
                   <div className="filter-icon-box">
                      <FiFilter size={16} />
                   </div>
                   <span>Pick Your Needs</span>
                 </div>
                 {(activeCategory !== "All" || searchQuery || priceRange[0] !== minPrice || priceRange[1] !== maxPrice) && (
                   <button 
                     className="clear-all-surgical" 
                     onClick={() => {
                       setActiveCategory("All");
                       setSearchQuery("");
                       setPriceRange([minPrice, maxPrice]);
                     }}
                   >
                     Clear All
                   </button>
                 )}
               </div>

               {/* Search Bar */}
               <div className="filter-search-box-premium">
                 <FiSearch className="search-icon-surgical" />
                 <input 
                   type="text" 
                   placeholder="Search in brand..." 
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
                 <h3 className="filter-block-title">Categories</h3>
                 <div className="category-filter-chips">
                    {categories.map(cat => (
                      <button 
                        key={cat} 
                        className={`cat-chip ${activeCategory === cat ? 'is-active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                 </div>
               </div>
             </div>
           </aside>

           <main className="brand-product-listing">
              {/* HEADER */}
              <div className="brand-header-refined">
                 <div className="brand-identity-box">
                    <h1 className="brand-main-title">{brandInfo?.name || brandName}</h1>
                    <p className="brand-product-stat">{filteredProducts.length} Premium Products</p>
                 </div>
              </div>

              {/* PRODUCT GRID */}
              {loading ? (
                <div className="loader-full-height-aesthetic">
                  <ModernLoader />
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="category-grid-5">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="brand-empty-state-aesthetic">
                  <div className="empty-box-graphic">🛍️</div>
                  <h3>New Collection Pending</h3>
                  <p>We couldn't find products matching your selection in {brandName}.</p>
                  <button className="btn-brand-action" onClick={() => {
                    setActiveCategory("All");
                    setSearchQuery("");
                    setPriceRange([minPrice, maxPrice]);
                  }}>Reset Filters</button>
                </div>
              )}
           </main>
        </div>
      </div>
    </div>
  );
};

export default BrandProducts;
