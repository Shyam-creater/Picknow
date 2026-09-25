import React, { useState, useEffect, Suspense } from "react";
import "./LandingPage.css";
import { Link, useNavigate } from "react-router-dom";
// import Footer from "../Footer/Footer"; // Removed to prevent duplication
import { productApi } from "../../APi/productApi";
import { brandApi } from "../../APi/brandApi";
import { categoryApi } from "../../APi/categoryApi";
import axiosInstance from "../../APi/axiosInstance";
import Heading from "../Heading";
import ModernLoader from "../Loading/ModernLoader";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "../ProductPage/ProductCard";

// Asset placeholders
import dryFruitsImg from "../../assets/dryfruits.jpg";
import honeyImg from "../../assets/honey.jpg";
import nutsImg from "../../assets/Nuts.jpg";

const LandingPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTopSlide, setCurrentTopSlide] = useState(1);
  const [currentBottomSlide, setCurrentBottomSlide] = useState(2);
  const [loading, setLoading] = useState(true);

  // Specialized Sections State
  const [offerProducts, setOfferProducts] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [combos, setCombos] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 60; // 15 rows * 4 columns

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, brandRes, catRes, dealsRes, latestRes, comboRes] = await Promise.all([
          productApi.getAllProducts(1, 100),
          brandApi.getAllBrands(),
          categoryApi.getAllCategories(),
          axiosInstance.get("/search", { params: { type: "deals", limit: 12, includeVariants: true } }),
          productApi.getLatestProduct(),
          productApi.getProductByType('combo')
        ]);

        const brandList = Array.isArray(brandRes) ? brandRes : (brandRes.brands || []);
        const catList = Array.isArray(catRes) ? catRes : (catRes.categories || []);

        setProducts(Array.isArray(prodRes.products) ? prodRes.products : (Array.isArray(prodRes) ? prodRes : []));
        setBrands(brandList);
        setCategories(catList);

        setOfferProducts(dealsRes?.data?.results?.products || dealsRes?.data?.products || []);
        setLatestProducts(latestRes || []);
        setCombos(comboRes || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-Slideshow Interval
  useEffect(() => {
    if (categories.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % categories.length);
      setCurrentTopSlide((prev) => (prev + 1) % categories.length);
      setCurrentBottomSlide((prev) => (prev + 1) % categories.length);
    }, 8000); // Increased time to 8 seconds
    return () => clearInterval(timer);
  }, [categories]);

  const handleBrandClick = (brand) => {
    navigate(`/brand/${brand._id}?name=${encodeURIComponent(brand.name)}`);
  };

  // Pagination Logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page-premium">
      <Suspense fallback={<ModernLoader />}>
        <Heading
          title="PickNow | Premium Organic Marketplace"
          description="Shop the finest organic products from top brands."
        />


        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="landing-loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="landing-global-loading-state"
              style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ModernLoader size={1.5} customMessage="Curating your premium organic collection..." />
            </motion.div>
          ) : (
            <motion.div
              key="landing-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <section className="hero-grid-modern">
                <div className="hero-grid-container">
                  <div className="hero-main-carousel-wrapper">
                    <AnimatePresence mode="wait">
                      {categories.length > 0 && (
                        <motion.div
                          key={`main-${currentSlide}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="hero-box hero-main-box carousel-slide-high"
                        >
                          <div className="box-content">
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 }}
                              className="badge-premium"
                            >
                              {categories[currentSlide]?.cName || "New Arrival"}
                            </motion.span>
                            <motion.h2
                              initial={{ opacity: 0, x: -15 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              {categories[currentSlide]?.cName || "Organic Essentials"}
                            </motion.h2>
                            <motion.p
                              initial={{ opacity: 0, x: -15 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 }}
                              className="hero-desc"
                            >
                              Discover the purest selection of {categories[currentSlide]?.cName?.toLowerCase() || 'organic products'}.
                            </motion.p>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.4 }}
                            >
                              <Link
                                to={`/category/${categories[currentSlide]?._id}?name=${encodeURIComponent(categories[currentSlide]?.cName)}`}
                                className="btn-glass"
                              >
                                Shop Collection
                              </Link>
                            </motion.div>
                          </div>
                          <img
                            src={categories[currentSlide]?.cImage || dryFruitsImg}
                            alt={categories[currentSlide]?.cName}
                            className="box-img slide-active"
                          />
                          <div className="carousel-indicators-dots">
                            {categories.map((_, idx) => (
                              <div
                                key={idx}
                                className={`indicator-dot ${idx === currentSlide ? 'active' : ''}`}
                                onClick={() => setCurrentSlide(idx)}
                              ></div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="hero-right-column">
                    <div className="hero-secondary-carousel-wrapper">
                      <AnimatePresence mode="wait">
                        {categories.length > 1 && (
                          <motion.div
                            key={`top-${currentTopSlide}`}
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            transition={{ duration: 0.4 }}
                            className="hero-box hero-secondary-box"
                          >
                            <div className="box-content">
                              <motion.h3
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                              >
                                {categories[currentTopSlide]?.cName}
                              </motion.h3>
                              <motion.p
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="hero-desc"
                              >
                                Explore {categories[currentTopSlide]?.cName}.
                              </motion.p>
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                              >
                                <Link to={`/category/${categories[currentTopSlide]?._id}`} className="btn-link-premium">Discover</Link>
                              </motion.div>
                            </div>
                            <img src={categories[currentTopSlide]?.cImage || honeyImg} alt="Category" className="box-img-small" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="hero-secondary-carousel-wrapper">
                      <AnimatePresence mode="wait">
                        {categories.length > 2 && (
                          <motion.div
                            key={`bottom-${currentBottomSlide}`}
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            transition={{ duration: 0.4 }}
                            className="hero-box hero-secondary-box"
                          >
                            <div className="box-content">
                              <motion.h3
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                              >
                                {categories[currentBottomSlide]?.cName}
                              </motion.h3>
                              <motion.p
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="hero-desc"
                              >
                                {categories[currentBottomSlide]?.cName} collection.
                              </motion.p>
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                              >
                                <Link to={`/category/${categories[currentBottomSlide]?._id}`} className="btn-link-premium">Shop Now</Link>
                              </motion.div>
                            </div>
                            <img src={categories[currentBottomSlide]?.cImage || nutsImg} alt="Category" className="box-img-small" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </section>

              <div className="landing-sections-flow">
                {/* Curated Product Rows */}
                {offerProducts.length > 0 && (
                  <ProductSection
                    title="Top Deals"
                    subtitle="Exclusive discounts on Picknow Products"
                    products={offerProducts}
                    badge="SALE"
                    autoSlide={true}
                    viewAllLink="/search?type=deals"
                  />
                )}

                {combos.length > 0 && (
                  <ProductSection
                    title="Value Combos"
                    subtitle="Perfectly curated hampers for healthy living"
                    products={combos}
                    badge="BEST SAVINGS"
                  />
                )}

                {latestProducts.length > 0 && (
                  <ProductSection
                    title="New Arrivals"
                    subtitle="Freshly harvested products for your table"
                    products={latestProducts}
                    badge="NEW"
                  />
                )}

                {/* Standard Grid Showcase */}
                <section id="products-section" className="all-products-showcase">
                  <div className="container">
                    <div className="section-title-premium">
                      <h2>Picknow <span>Products</span></h2>
                      <p className="brand-quote">Discover our wide range of premium quality products.</p>
                      <div className="title-underline"></div>
                    </div>

                    <div className="premium-products-grid-5">
                      {currentProducts.map((product) => (
                        <motion.div
                          key={product._id}
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                        >
                          <ProductCard product={product} />
                        </motion.div>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="pagination-landing">
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => paginate(i + 1)}
                            className={`page-item-btn ${currentPage === i + 1 ? 'active' : ''}`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer removed to prevent duplication */}
      </Suspense>
    </div>
  );
};

// Reusable Product Section Component
const ProductSection = ({ title, subtitle, products, badge, autoSlide = false, autoSlideInterval = 5000, viewAllLink = "/" }) => {
  const scrollRef = React.useRef(null);

  useEffect(() => {
    if (!autoSlide || !scrollRef.current || products.length === 0) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, clientWidth, scrollWidth } = scrollRef.current;
        // If we are near the end, scroll back to start
        if (scrollLeft + clientWidth >= scrollWidth - 100) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollTo({ left: scrollLeft + clientWidth * 0.8, behavior: 'smooth' });
        }
      }
    }, autoSlideInterval);

    return () => clearInterval(interval);
  }, [autoSlide, autoSlideInterval, products.length]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="product-row-section">
      <div className="container">
        <div className="section-header-row">
          <div className="section-title-left">
            <span className="badge-mini">{badge}</span>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          <div className="section-actions">
            <div className="scroll-controls">
              <button className="scroll-arrow-btn" onClick={() => scroll('left')}>
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button className="scroll-arrow-btn" onClick={() => scroll('right')}>
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
            <Link to={viewAllLink} className="view-all-premium">Explore All</Link>
          </div>
        </div>

        <div className="horizontal-scroll-container" ref={scrollRef}>
          {products.map((product) => (
            <div key={product._id} className="scroll-item">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingPage;
