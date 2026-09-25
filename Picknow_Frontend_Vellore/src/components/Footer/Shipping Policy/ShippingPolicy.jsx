import React from 'react';
import './ShippingPolicy.css';
import { FaCalendarAlt, FaInfoCircle, FaShieldAlt, FaBook, FaCheckCircle, FaExclamationTriangle, FaUser, FaCreditCard, FaTruck, FaUndo, FaGlobe, FaGavel, FaPhone, FaEnvelope, FaMapMarkerAlt, FaShippingFast, FaRoute, FaClock, FaGlobeAmericas } from 'react-icons/fa';

const ShippingPolicy = () => {
  return (
    <div className="shipping-container">
      <div className="shipping-header">
        <h1>Shipping & Delivery Policy – Picknow.in</h1>
        <div className="shipping-meta">
          <div className="entity-info">
            <FaShieldAlt className="entity-icon" />
            <span className="entity-label">Entity: Vairaa Wealth Pvt Ltd</span>
          </div>
          {/* <div className="last-updated">
            <FaCalendarAlt />
            <span>Last Updated: December 2024</span>
          </div> */}
        </div>
      </div>

      <div className="shipping-content">
        <div className="shipping-notice">
          <div className="notice-icon-wrapper">
            <FaExclamationTriangle />
          </div>
          <p>At Picknow.in, operated by Vairaa Wealth Pvt Ltd, we aim to deliver your orders quickly, safely, and reliably. This Shipping & Delivery Policy explains how we handle shipping, timelines, and related services. By placing an order on picknow.in, you agree to the terms below.</p>
        </div>

        <div className="shipping-section">
          <div className="section-icon">
            <FaGlobeAmericas />
          </div>
          <h2>1. Shipping Locations</h2>
          <ul>
            <li>We currently deliver to most locations across India.</li>
            <li>International delivery may be offered in the future.</li>
          </ul>
        </div>

        <div className="shipping-section">
          <div className="section-icon">
            <FaClock />
          </div>
          <h2>2. Delivery Timelines</h2>
          <ul>
            <li>Orders are usually processed within 24–48 hours after confirmation.</li>
            <li>Standard delivery times vary between 3–7 business days, depending on your location.</li>
            <li>Remote or out-of-service areas may take longer.</li>
            <li>You will receive tracking details via email/SMS once your order is dispatched.</li>
          </ul>
        </div>

        <div className="shipping-section">
          <div className="section-icon">
            <FaCreditCard />
          </div>
          <h2>3. Shipping Charges</h2>
          <ul>
            <li>Shipping charges (if any) will be displayed at checkout before payment.</li>
            <li>We may offer free shipping on eligible orders, as per promotional offers or minimum purchase requirements.</li>
          </ul>
        </div>

        <div className="shipping-section">
          <div className="section-icon">
            <FaRoute />
          </div>
          <h2>4. Order Tracking</h2>
          <ul>
            <li>Once your order is shipped, you will receive a tracking number and courier partner details.</li>
            <li>You can track the status of your order via the "My Orders" section on picknow.in or through the courier's website/app.</li>
          </ul>
        </div>

        <div className="shipping-section">
          <div className="section-icon">
            <FaExclamationTriangle />
          </div>
          <h2>5. Delays in Delivery</h2>
          <p>While we strive for timely delivery, delays may occur due to:</p>
          <ul>
            <li>Courier/logistics issues</li>
            <li>Weather conditions</li>
            <li>Strikes, lockdowns, or other unforeseen events</li>
          </ul>
          <p>In such cases, we will keep you informed and work to resolve the issue promptly.</p>
        </div>

        <div className="shipping-section">
          <div className="section-icon">
            <FaTruck />
          </div>
          <h2>6. Failed Deliveries</h2>
          <ul>
            <li>If delivery fails due to an incorrect address, unavailability of recipient, or refusal of delivery, the order may be returned to us.</li>
            <li>Re-delivery may be attempted, subject to additional shipping charges.</li>
          </ul>
        </div>

        <div className="shipping-section">
          <div className="section-icon">
            <FaGlobe />
          </div>
          <h2>7. International Shipping (If Applicable)</h2>
          <ul>
            <li>For international orders, shipping times and charges may vary based on destination and customs regulations.</li>
            <li>Customs duties/taxes (if any) are the responsibility of the buyer.</li>
          </ul>
        </div>

        <div className="shipping-section contact-section">
          <div className="section-icon">
            <FaPhone />
          </div>
          <h2>8. Contact Us</h2>
          <div className="contact-info">
            <p><strong>For any shipping-related questions, please contact:</strong></p>
            <p><strong>Customer Support Team</strong></p>
            <p><strong>Vairaa Wealth Pvt Ltd – Picknow</strong></p>
            <div className="contact-details">
              <div className="contact-item">
                <FaGlobe />
                <span>Website: <a href="https://picknow.in" target="_blank" rel="noopener noreferrer">https://picknow.in</a></span>
              </div>
              <div className="contact-item">
                <FaEnvelope />
                <span>Email: support@picknow.in</span>
              </div>
              <div className="contact-item">
                <FaPhone />
                <span>Phone: +91 7092770118</span>
              </div>
              <div className="contact-item">
                <FaMapMarkerAlt />
                <span>Address: 34, TM Nagar, Mattuthavani, Madurai, Tamilnadu - 625107</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
