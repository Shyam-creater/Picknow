import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "./styles/NavbarVendor.css";
import picknowLogo from "../../assets/PicknowLogo.png";

const NavbarVendor = ({ isLoggedIn, onLogout, setCurrentPage }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  // Add this inside your NavbarVendor component
useEffect(() => {
  const handleScroll = () => {
    const navbar = document.querySelector('.vendor-navbar');
    if (window.scrollY > 50) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

  return (
    <nav className="vendor-navbar">
      <div className="vendor-navbar-container">
        <div
          className="vendor-navbar-logo"
          onClick={() => setCurrentPage("landing")}
        >
          {/* <h1>PICKNOW</h1> */}
          <a href="https://www.picknow.in/">
            <img src={picknowLogo} style={{ width: "10rem" }} alt="PickNow" />
          </a>
        </div>
        <div className="vendor-navbar-mobile-toggle" onClick={toggleMobileMenu}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-menu"
          >
            <line x1="4" x2="20" y1="12" y2="12"></line>
            <line x1="4" x2="20" y1="6" y2="6"></line>
            <line x1="4" x2="20" y1="18" y2="18"></line>
          </svg>
        </div>
        <ul className={`vendor-navbar-menu ${mobileMenuOpen ? "active" : ""}`}>
          <li className="vendor-navbar-item">
            <a onClick={() => setCurrentPage("landing")}>Home</a>
          </li>
          <li className="vendor-navbar-item">
            <a href="#about">About</a>
          </li>
          <li className="vendor-navbar-item">
            <a href="#contact">Contact</a>
          </li>
          {!isLoggedIn ? (
            <>
              <li className="vendor-navbar-item">
                <a onClick={() => navigate("/vendor/login")}>Login</a>{" "}
                {/* Navigate to LoginForm */}
              </li>
              <li className="vendor-navbar-item">
                <a href="/vendor/register" className="register-btn">
                  Register
                </a>
              </li>
            </>
          ) : (
            <li className="vendor-navbar-item">
              <a onClick={onLogout}>Logout</a>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default NavbarVendor;
