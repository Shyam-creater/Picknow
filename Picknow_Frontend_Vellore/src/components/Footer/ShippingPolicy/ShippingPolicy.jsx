import React, { useState } from 'react';
import './ShippingPolicy.css';
import {
  FaCalendarAlt, FaInfoCircle, FaShieldAlt, FaCheckCircle,
  FaExclamationTriangle, FaCreditCard, FaTruck, FaGlobe,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaShippingFast,
  FaRoute, FaClock, FaGlobeAmericas
} from 'react-icons/fa';

const sections = [
  { id: 1, icon: FaGlobeAmericas, title: 'Shipping Locations' },
  { id: 2, icon: FaClock,         title: 'Delivery Timelines' },
  { id: 3, icon: FaCreditCard,    title: 'Shipping Charges' },
  { id: 4, icon: FaRoute,         title: 'Order Tracking' },
  { id: 5, icon: FaExclamationTriangle, title: 'Delays in Delivery' },
  { id: 6, icon: FaTruck,         title: 'Failed Deliveries' },
  { id: 7, icon: FaGlobe,         title: 'International Shipping' },
  { id: 8, icon: FaPhone,         title: 'Contact Us' },
];

const ShippingPolicy = () => {
  const [activeSection, setActiveSection] = useState(null);

  const scrollTo = (id) => {
    const el = document.getElementById(`sp-section-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  return (
    <div className="sp-page">

      {/* ── Hero ── */}
      <div className="sp-hero">
        <div className="sp-hero-inner">
          <div className="sp-hero-badge">
            <FaTruck />
            <span>Vairaa Wealth Pvt Ltd</span>
          </div>
          <h1 className="sp-hero-title">Shipping & Delivery Policy</h1>
          <p className="sp-hero-sub">
            Everything you need to know about how we deliver your orders safely and on time.
          </p>
          <div className="sp-hero-meta">
            <span className="sp-meta-chip">
              <FaCalendarAlt /> Last Updated: December 2024
            </span>
            <span className="sp-meta-chip">
              <FaGlobeAmericas /> Delivery: Pan India
            </span>
          </div>
        </div>
      </div>

      {/* ── Delivery Stats Strip ── */}
      <div className="sp-stats-strip">
        <div className="sp-stats-inner">
          <div className="sp-stat">
            <span className="sp-stat-value">24–48 hrs</span>
            <span className="sp-stat-label">Order Processing</span>
          </div>
          <div className="sp-stat-divider" />
          <div className="sp-stat">
            <span className="sp-stat-value">3–7 Days</span>
            <span className="sp-stat-label">Standard Delivery</span>
          </div>
          <div className="sp-stat-divider" />
          <div className="sp-stat">
            <span className="sp-stat-value">Pan India</span>
            <span className="sp-stat-label">Delivery Coverage</span>
          </div>
          <div className="sp-stat-divider" />
          <div className="sp-stat">
            <span className="sp-stat-value">Free</span>
            <span className="sp-stat-label">On Eligible Orders</span>
          </div>
        </div>
      </div>

      <div className="sp-body">
        <div className="sp-layout">

          {/* ── Sidebar TOC ── */}
          <aside className="sp-toc">
            <div className="sp-toc-card">
              <h3 className="sp-toc-title">Table of Contents</h3>
              <ul className="sp-toc-list">
                {sections.map((s) => (
                  <li key={s.id}>
                    <button
                      className={`sp-toc-btn ${activeSection === s.id ? 'active' : ''}`}
                      onClick={() => scrollTo(s.id)}
                    >
                      <span className="sp-toc-num">{s.id}.</span>
                      <span>{s.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="sp-main">

            {/* Notice */}
            <div className="sp-notice">
              <div className="sp-notice-icon"><FaExclamationTriangle /></div>
              <p>
                At <strong>Picknow.in</strong>, operated by <strong>Vairaa Wealth Pvt Ltd</strong>,
                we aim to deliver your orders quickly, safely, and reliably. By placing an order on
                picknow.in, you agree to the terms below.
              </p>
            </div>

            {/* Section 1 — Shipping Locations */}
            <div className="sp-section" id="sp-section-1">
              <div className="sp-section-header">
                <div className="sp-section-icon"><FaGlobeAmericas /></div>
                <h2 className="sp-section-title">1. Shipping Locations</h2>
              </div>
              <div className="sp-section-body">
                <div className="sp-highlight-cards">
                  <div className="sp-highlight-card active">
                    <FaCheckCircle className="sp-hcard-icon" />
                    <div>
                      <strong>Pan India Delivery</strong>
                      <p>We currently deliver to most locations across India.</p>
                    </div>
                  </div>
                  <div className="sp-highlight-card">
                    <FaGlobe className="sp-hcard-icon" />
                    <div>
                      <strong>International Delivery</strong>
                      <p>International delivery may be offered in the future.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 — Delivery Timelines */}
            <div className="sp-section" id="sp-section-2">
              <div className="sp-section-header">
                <div className="sp-section-icon"><FaClock /></div>
                <h2 className="sp-section-title">2. Delivery Timelines</h2>
              </div>
              <div className="sp-section-body">
                <div className="sp-timeline">
                  <div className="sp-timeline-step">
                    <div className="sp-timeline-dot" />
                    <div className="sp-timeline-content">
                      <strong>Order Placed</strong>
                      <span>Payment confirmed & order accepted</span>
                    </div>
                  </div>
                  <div className="sp-timeline-step">
                    <div className="sp-timeline-dot" />
                    <div className="sp-timeline-content">
                      <strong>Processing (24–48 hrs)</strong>
                      <span>Order packed & ready for dispatch</span>
                    </div>
                  </div>
                  <div className="sp-timeline-step">
                    <div className="sp-timeline-dot" />
                    <div className="sp-timeline-content">
                      <strong>Dispatched</strong>
                      <span>Tracking number sent via email/SMS</span>
                    </div>
                  </div>
                  <div className="sp-timeline-step last">
                    <div className="sp-timeline-dot success" />
                    <div className="sp-timeline-content">
                      <strong>Delivered (3–7 Business Days)</strong>
                      <span>Varies by location. Remote areas may take longer.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 — Shipping Charges */}
            <div className="sp-section" id="sp-section-3">
              <div className="sp-section-header">
                <div className="sp-section-icon"><FaCreditCard /></div>
                <h2 className="sp-section-title">3. Shipping Charges</h2>
              </div>
              <div className="sp-section-body">
                <ul className="sp-list">
                  <li>Shipping charges (if any) will be displayed at <strong>checkout before payment.</strong></li>
                  <li>We may offer <strong>free shipping</strong> on eligible orders, as per promotional offers or minimum purchase requirements.</li>
                </ul>
                <div className="sp-info-box success">
                  <FaCheckCircle />
                  <span>Shipping charges are always shown transparently at checkout — no hidden fees.</span>
                </div>
              </div>
            </div>

            {/* Section 4 — Order Tracking */}
            <div className="sp-section" id="sp-section-4">
              <div className="sp-section-header">
                <div className="sp-section-icon"><FaRoute /></div>
                <h2 className="sp-section-title">4. Order Tracking</h2>
              </div>
              <div className="sp-section-body">
                <ul className="sp-list">
                  <li>Once your order is shipped, you will receive a <strong>tracking number</strong> and courier partner details.</li>
                  <li>Track your order via the <strong>"My Orders"</strong> section on picknow.in or through the courier's website/app.</li>
                </ul>
                <div className="sp-info-box">
                  <FaInfoCircle />
                  <span>Tracking details are sent to your registered email and phone number after dispatch.</span>
                </div>
              </div>
            </div>

            {/* Section 5 — Delays */}
            <div className="sp-section" id="sp-section-5">
              <div className="sp-section-header">
                <div className="sp-section-icon"><FaExclamationTriangle /></div>
                <h2 className="sp-section-title">5. Delays in Delivery</h2>
              </div>
              <div className="sp-section-body">
                <p>While we strive for timely delivery, delays may occur due to:</p>
                <div className="sp-delay-tags">
                  <span className="sp-delay-tag">Courier / logistics issues</span>
                  <span className="sp-delay-tag">Weather conditions</span>
                  <span className="sp-delay-tag">Strikes or lockdowns</span>
                  <span className="sp-delay-tag">Unforeseen events</span>
                </div>
                <div className="sp-info-box warning">
                  <FaExclamationTriangle />
                  <span>In case of delays, we will keep you informed and work to resolve the issue promptly.</span>
                </div>
              </div>
            </div>

            {/* Section 6 — Failed Deliveries */}
            <div className="sp-section" id="sp-section-6">
              <div className="sp-section-header">
                <div className="sp-section-icon"><FaTruck /></div>
                <h2 className="sp-section-title">6. Failed Deliveries</h2>
              </div>
              <div className="sp-section-body">
                <ul className="sp-list">
                  <li>If delivery fails due to an <strong>incorrect address</strong>, unavailability of recipient, or refusal of delivery, the order may be returned to us.</li>
                  <li>Re-delivery may be attempted, subject to <strong>additional shipping charges.</strong></li>
                </ul>
                <div className="sp-info-box warning">
                  <FaExclamationTriangle />
                  <span>Please ensure your delivery address and contact number are accurate before placing an order.</span>
                </div>
              </div>
            </div>

            {/* Section 7 — International */}
            <div className="sp-section" id="sp-section-7">
              <div className="sp-section-header">
                <div className="sp-section-icon"><FaGlobe /></div>
                <h2 className="sp-section-title">7. International Shipping (If Applicable)</h2>
              </div>
              <div className="sp-section-body">
                <ul className="sp-list">
                  <li>For international orders, shipping times and charges may vary based on <strong>destination and customs regulations.</strong></li>
                  <li>Customs duties/taxes (if any) are the <strong>responsibility of the buyer.</strong></li>
                </ul>
                <div className="sp-info-box warning">
                  <FaExclamationTriangle />
                  <span>International shipping is not currently available. We will notify you when it launches.</span>
                </div>
              </div>
            </div>

            {/* Section 8 — Contact */}
            <div className="sp-section" id="sp-section-8">
              <div className="sp-section-header">
                <div className="sp-section-icon"><FaPhone /></div>
                <h2 className="sp-section-title">8. Contact Us</h2>
              </div>
              <div className="sp-section-body">
                <p className="sp-contact-intro">
                  For any shipping-related questions, reach our Customer Support Team:
                </p>
                <div className="sp-contact-card">
                  <div className="sp-contact-brand">
                    <strong>Customer Support Team</strong>
                    <span>Vairaa Wealth Pvt Ltd – Picknow</span>
                  </div>
                  <div className="sp-contact-grid">
                    <a href="https://picknow.in" target="_blank" rel="noopener noreferrer" className="sp-contact-item">
                      <div className="sp-contact-item-icon"><FaGlobe /></div>
                      <div>
                        <span className="sp-contact-label">Website</span>
                        <span className="sp-contact-value">picknow.in</span>
                      </div>
                    </a>
                    <a href="tel:+917092770118" className="sp-contact-item">
                      <div className="sp-contact-item-icon"><FaPhone /></div>
                      <div>
                        <span className="sp-contact-label">Phone</span>
                        <span className="sp-contact-value">+91 7092770118</span>
                      </div>
                    </a>
                    <a href="mailto:support@picknow.in" className="sp-contact-item">
                      <div className="sp-contact-item-icon"><FaEnvelope /></div>
                      <div>
                        <span className="sp-contact-label">Email</span>
                        <span className="sp-contact-value">support@picknow.in</span>
                      </div>
                    </a>
                    <div className="sp-contact-item">
                      <div className="sp-contact-item-icon"><FaMapMarkerAlt /></div>
                      <div>
                        <span className="sp-contact-label">Address</span>
                        <span className="sp-contact-value">34, TM Nagar, Mattuthavani, Madurai, TN - 625107</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;