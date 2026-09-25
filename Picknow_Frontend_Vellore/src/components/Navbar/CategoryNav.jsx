import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { categoryApi } from "../../APi/categoryApi";
import "./CategoryNav.css";
import { ChevronRight, ChevronLeft } from "lucide-react";

const CategoryNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showArrows, setShowArrows] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    const fetchCategories = async () => {
      try {
        const response = await categoryApi.getAllCategories();
        const data = Array.isArray(response) ? response : (response.categories || []);
        setCategories(data);
        if (data.length > 8) setShowArrows(true);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCategoryClick = (category) => {
    navigate(`/category/${category._id}?name=${encodeURIComponent(category.cName)}`);
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 300 : scrollLeft + 300;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className={`category-nav-wrapper-sleek ${isScrolled ? 'scrolled-minimal' : ''}`}>
      <div className="category-nav-container-sleek">
        {showArrows && (
          <>
            <button className="scroll-arrow left" onClick={() => scroll('left')}>
              <ChevronLeft size={20} />
            </button>
            <button className="scroll-arrow right" onClick={() => scroll('right')}>
              <ChevronRight size={20} />
            </button>
          </>
        )}
        <div className="category-scroll-area" ref={scrollRef}>
          {loading ? (
            <div className="cat-skeleton-loader">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="cat-skeleton-item" />)}
            </div>
          ) : (
            <>
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className={`cat-item-sleek ${(location.pathname.includes(cat._id) || location.search.includes(cat._id)) ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(cat)}
                >
                  <div className="cat-icon-container">
                    <img src={cat.cImage || "https://cdn-icons-png.flaticon.com/512/3061/3061730.png"} alt={cat.cName} />
                  </div>
                  <span className="cat-name-sleek">{cat.cName}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryNav;