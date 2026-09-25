import { Fragment, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./BlogHeader.css";
import picknowLogo from "../../assets/PicknowLogo.png";
import StorefrontIcon from "@mui/icons-material/Storefront";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

const BlogHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('.navbar')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <Fragment>
      <section className="blog-header-section">
        <nav className={`navbar-modern ${scrolled ? "scrolled" : ""}`}>
          <div className="navbar-container">
            {/* Logo */}
            <Link to="/" className="nav-brand" onClick={closeMobileMenu}>
              <img src={picknowLogo} alt="PickNow" className="logo-img" />
            </Link>

            {/* Desktop Navigation */}
            <div className="nav-menu desktop-only">
              <ul className="nav-list">
                <li className="nav-item">
                  <Link to="/vendor" target="_blank" className="seller-btn">
                    <StorefrontIcon className="seller-icon" />
                    <span className="seller-text">Be a Seller</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <CloseIcon className="toggle-icon" />
              ) : (
                <MenuIcon className="toggle-icon" />
              )}
            </button>

            {/* Mobile Navigation */}
            <div className={`mobile-nav ${mobileMenuOpen ? "open" : ""}`}>
              <div className="mobile-nav-content">
                <ul className="mobile-nav-list">
                  <li className="mobile-nav-item">
                    <Link
                      to="/vendor"
                      target="_blank"
                      className="seller-btn mobile"
                      onClick={closeMobileMenu}
                    >
                      <StorefrontIcon className="seller-icon" />
                      <span className="seller-text">Be a Seller</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
              <div className="mobile-overlay" onClick={closeMobileMenu}></div>
            )}
          </div>
        </nav>
      </section>
    </Fragment>
  );
};

export default BlogHeader;
