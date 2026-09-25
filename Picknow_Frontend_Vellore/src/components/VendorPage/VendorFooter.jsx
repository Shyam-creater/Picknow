import React from "react";
import { useNavigate } from "react-router-dom";
import "./styles/VendorFooter.css"; // Ensure you import your CSS file
import picknowlogo from "../../assets/Picknowlogo.png";

const Footer = () => {
  const navigate = useNavigate();

  const handleBecomeSeller = () => {
    navigate("/vendor");
  };

  return (
    <footer className="vendor-footer">
      <div className="vendor-footer-container">
        <div className="vendor-footer-section">
          <div className="vendor-footer-logo">
            <a href="https://www.picknow.in/">
              <img src={picknowlogo} />
            </a>
          </div>

          <p>
            Your trusted platform for vendor management and e-commerce
            solutions.
          </p>
          <button
            className="vendor-footer-seller-btn"
            onClick={handleBecomeSeller}
          >
            Be a Seller
          </button>
        </div>

        <div className="vendor-footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li>
              <a href="#">Home</a>
            </li>
            <li>
              <a href="#about">About Us</a>
            </li>
            {/* <li><a href="#services">Services</a></li> */}
            <li>
              <a href="#contact">Contact</a>
            </li>
          </ul>
        </div>

        <div className="vendor-footer-section">
          <h3>Contact Us</h3>
          <p>Email: support@picknow.in</p>
          <p>Phone: +91 7092770118</p>
          <p>
            Address: 34, T M Nagar 1st Cross St, opp. Saravana Store Road,
            Mattuthavani, Sambakulam, Madurai, Tamil Nadu - 625107.
          </p>
        </div>
      </div>

      <div className="vendor-footer-bottom">
        <p>&copy; {new Date().getFullYear()} VendorHub. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
