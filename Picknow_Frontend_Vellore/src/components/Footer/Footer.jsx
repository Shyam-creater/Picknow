import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaFacebookF,
  FaSquareXTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaYoutube,
  FaPhone,
  FaLocationDot,
  FaEnvelope,
  FaGooglePlay,
  FaApple,
} from "react-icons/fa6";
import "./footer.css";
import picknowlogo from "../../assets/picknowlogo.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const handleNavigation = (path, isNewTab = false) => {
    if (isNewTab) {
      window.open(path, "_blank");
    } else {
      navigate(path);
    }
  };

  const socialLinks = [
    { href: "https://www.facebook.com/profile.php?id=61585492084300", icon: FaFacebookF, label: "Facebook" },
    { href: "https://x.com/Picknow123", icon: FaSquareXTwitter, label: "Twitter/X" },
    { href: "https://www.instagram.com/picknow_ecommerce/", icon: FaInstagram, label: "Instagram" },
    { href: "https://youtube.com/@picknow-123?si=ixlU7g3erpd4Msci", icon: FaYoutube, label: "YouTube" },
  ];

  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/brands", isNewTab: true },
    { name: "Be a Seller", path: "/vendor", isNewTab: true },
    { name: "Blog", path: "/blog", isNewTab: true },
  ];

  const importantLinks = [
    { name: "Privacy Policy", path: "/PrivacyPolicy" },
    { name: "Terms & Conditions", path: "/terms-and-conditions" },
    { name: "Shipping Policy", path: "/ShippingPolicy" },
    { name: "Cancellation & Refund Policy", path: "/ReturnRefundPolicy" },
  ];

  const contactInfo = [
    { icon: FaPhone, text: "+91 7092770118", label: "Phone number" },
    { icon: FaEnvelope, text: "support@picknow.in", label: "Email address" },
    { icon: FaLocationDot, text: "34, T M Nagar 1st Cross, opp. Saravana Stores, Mattuthavani, Madurai, Tamil Nadu - 625107.", label: "Office address" },
  ];

  return (
    <footer className="fk-footer" role="contentinfo">

      {/* ── Top Strip ── */}
      <div className="fk-footer-top-strip">
        <div className="fk-footer-inner">
          <div className="fk-footer-strip-left">
            <img src={picknowlogo} alt="Picknow" className="fk-footer-logo" />
            <span className="fk-footer-tagline">
              100% Organic • Trusted by thousands
            </span>
          </div>
          <div className="fk-footer-social-row">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                className="fk-social-btn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit Picknow on ${social.label}`}
              >
                <social.icon />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Footer Grid ── */}
      <div className="fk-footer-main">
        <div className="fk-footer-inner">
          <div className="fk-footer-grid">

            {/* About */}
            <section className="fk-footer-col">
              <h3 className="fk-footer-heading">ABOUT PICKNOW</h3>
              <p className="fk-footer-about-text">
                Your one-stop destination for 100% organic products.
                Shop natural, live healthy with the best quality guaranteed.
              </p>
            </section>

            {/* Quick Links */}
            <section className="fk-footer-col">
              <h3 className="fk-footer-heading">QUICK LINKS</h3>
              <ul className="fk-footer-links">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                   <Link to={link.path} className="fk-footer-link">
                   {link.name}
                   </Link>   
                    
                  </li>
                ))}
              </ul>
            </section>

            {/* Important Links */}
            <section className="fk-footer-col">
              <h3 className="fk-footer-heading">POLICY & LEGAL</h3>
              <ul className="fk-footer-links">
                {importantLinks.map((link, index) => (
                  <li key={index}>
                    <Link to={link.path} className="fk-footer-link">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {/* Contact */}
            <section className="fk-footer-col">
              <h3 className="fk-footer-heading">CONTACT US</h3>
              <div className="fk-footer-contact">
                {contactInfo.map((contact, index) => (
                  <div key={index} className="fk-contact-row">
                    <div className="fk-contact-icon">
                      <contact.icon />
                    </div>
                    <div className="fk-contact-text">
                      {contact.icon === FaPhone ? (
                        <a href={`tel:${contact.text.replace(/\s/g, "")}`} className="fk-contact-link">
                          {contact.text}
                        </a>
                      ) : contact.icon === FaEnvelope ? (
                        <a href={`mailto:${contact.text}`} className="fk-contact-link">
                          {contact.text}
                        </a>
                      ) : (
                        <address className="fk-contact-address">{contact.text}</address>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Download App */}
            <section className="fk-footer-col">
              <h3 className="fk-footer-heading">DOWNLOAD APP</h3>
              <p className="fk-footer-about-text" style={{ paddingBottom: '4px' }}>
                Get the Picknow app for a better shopping experience.
              </p>
              <a href="https://play.google.com/store/apps/details?id=com.picknowapp&pcampaignid=web_share" className="fk-app-btn" aria-label="Get it on Google Play">
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_Play_2022_icon.svg" className="fk-app-icon" style={{ width: "24px", height: "24px" }} alt="Google Play" />
                <div>
                  <span className="fk-app-text-sm">GET IT ON</span>
                  <span className="fk-app-text-lg">Google Play</span>
                </div>
              </a>
              <a href="#" className="fk-app-btn" aria-label="Download on the App Store">
                <FaApple className="fk-app-icon" style={{ fontSize: "28px", marginTop: "-3px", marginLeft: "-2px" }} />
                <div>
                  <span className="fk-app-text-sm">Download on the</span>
                  <span className="fk-app-text-lg">App Store</span>
                </div>
              </a>
            </section>

          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="fk-footer-bottom">
        <div className="fk-footer-inner fk-footer-bottom-inner">
          <p className="fk-footer-copyright">
            © {currentYear} Picknow. All rights reserved.
          </p>
          <div className="fk-footer-bottom-links">
            <Link to="/PrivacyPolicy" className="fk-footer-bottom-link">Privacy</Link>
            <span className="fk-footer-bottom-sep">·</span>
            <Link to="/terms-and-conditions" className="fk-footer-bottom-link">Terms</Link>
            <span className="fk-footer-bottom-sep">·</span>
            <Link to="/ShippingPolicy" className="fk-footer-bottom-link">Shipping</Link>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;