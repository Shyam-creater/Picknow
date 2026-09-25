import React, { useState } from 'react';
import './ReturnRefundPolicy.css';
import {
  FaCalendarAlt, FaInfoCircle, FaShieldAlt, FaCheckCircle,
  FaExclamationTriangle, FaCreditCard, FaTruck, FaUndo,
  FaGlobe, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaTimesCircle, FaExchangeAlt, FaMoneyBillWave
} from 'react-icons/fa';

const sections = [
  { id: 1, icon: FaCheckCircle,    title: 'Eligibility for Returns' },
  { id: 2, icon: FaTimesCircle,    title: 'Non-Returnable Items' },
  { id: 3, icon: FaMoneyBillWave,  title: 'Refund Process' },
  { id: 4, icon: FaExchangeAlt,    title: 'Replacement / Exchange' },
  { id: 5, icon: FaUndo,           title: 'Cancellations' },
  { id: 6, icon: FaTruck,          title: 'Shipping Costs' },
  { id: 7, icon: FaInfoCircle,     title: 'How to Initiate a Return' },
  { id: 8, icon: FaPhone,          title: 'Contact Us' },
];

const ReturnRefundPolicy = () => {
  const [activeSection, setActiveSection] = useState(null);

  const scrollTo = (id) => {
    const el = document.getElementById(`rr-section-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  return (
    <div className="rr-page">

      {/* ── Hero ── */}
      <div className="rr-hero">
        <div className="rr-hero-inner">
          <div className="rr-hero-badge">
            <FaUndo />
            <span>Vairaa Wealth Pvt Ltd</span>
          </div>
          <h1 className="rr-hero-title">Cancellation & Refund Policy</h1>
          <p className="rr-hero-sub">
            We want you to be completely satisfied. Here's everything you need to know
            about returns, refunds, and cancellations.
          </p>
          <div className="rr-hero-meta">
            <span className="rr-meta-chip">
              <FaCalendarAlt /> Last Updated: December 2024
            </span>
            <span className="rr-meta-chip">
              <FaCheckCircle /> 7-Day Return Window
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats Strip ── */}
      <div className="rr-stats-strip">
        <div className="rr-stats-inner">
          <div className="rr-stat">
            <span className="rr-stat-value">7 Days</span>
            <span className="rr-stat-label">Return Window</span>
          </div>
          <div className="rr-stat-divider" />
          <div className="rr-stat">
            <span className="rr-stat-value">5–7 Days</span>
            <span className="rr-stat-label">Refund Processing</span>
          </div>
          <div className="rr-stat-divider" />
          <div className="rr-stat">
            <span className="rr-stat-value">Free</span>
            <span className="rr-stat-label">Return Pickup (Defective)</span>
          </div>
          <div className="rr-stat-divider" />
          <div className="rr-stat">
            <span className="rr-stat-value">Original</span>
            <span className="rr-stat-label">Refund to Payment Source</span>
          </div>
        </div>
      </div>

      <div className="rr-body">
        <div className="rr-layout">

          {/* ── Sidebar TOC ── */}
          <aside className="rr-toc">
            <div className="rr-toc-card">
              <h3 className="rr-toc-title">Table of Contents</h3>
              <ul className="rr-toc-list">
                {sections.map((s) => (
                  <li key={s.id}>
                    <button
                      className={`rr-toc-btn ${activeSection === s.id ? 'active' : ''}`}
                      onClick={() => scrollTo(s.id)}
                    >
                      <span className="rr-toc-num">{s.id}.</span>
                      <span>{s.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Help Card */}
            <div className="rr-help-card">
              <div className="rr-help-icon"><FaPhone /></div>
              <p className="rr-help-title">Need Help?</p>
              <p className="rr-help-sub">Contact us to initiate a return or refund</p>
              <a href="mailto:support@picknow.in" className="rr-help-btn">
                Email Support
              </a>
              <a href="tel:+917092770118" className="rr-help-phone">
                +91 7092770118
              </a>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="rr-main">

            {/* Notice */}
            <div className="rr-notice">
              <div className="rr-notice-icon"><FaExclamationTriangle /></div>
              <p>
                At <strong>Picknow.in</strong>, operated by <strong>Vairaa Wealth Pvt Ltd</strong>,
                we want you to be completely satisfied with your purchase. By shopping with us,
                you agree to the terms below.
              </p>
            </div>

            {/* Section 1 — Eligibility */}
            <div className="rr-section" id="rr-section-1">
              <div className="rr-section-header">
                <div className="rr-section-icon"><FaCheckCircle /></div>
                <h2 className="rr-section-title">1. Eligibility for Returns</h2>
              </div>
              <div className="rr-section-body">
                <p>You may request a return if:</p>
                <ul className="rr-list rr-list-check">
                  <li>The product delivered is <strong>defective, damaged, or incorrect.</strong></li>
                  <li>The product does not match the <strong>description on our website.</strong></li>
                  <li>The product is eligible under our returnable items list.</li>
                </ul>

                <div className="rr-eligibility-grid">
                  <div className="rr-eligibility-card">
                    <span className="rr-eligibility-label">Return Window</span>
                    <span className="rr-eligibility-value">Within 7 days of delivery</span>
                  </div>
                  <div className="rr-eligibility-card">
                    <span className="rr-eligibility-label">Condition</span>
                    <span className="rr-eligibility-value">Unused, original packaging</span>
                  </div>
                  <div className="rr-eligibility-card">
                    <span className="rr-eligibility-label">Required</span>
                    <span className="rr-eligibility-value">Tags, invoice & accessories</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 — Non-Returnable */}
            <div className="rr-section" id="rr-section-2">
              <div className="rr-section-header">
                <div className="rr-section-icon red"><FaTimesCircle /></div>
                <h2 className="rr-section-title">2. Non-Returnable Items</h2>
              </div>
              <div className="rr-section-body">
                <p>Certain categories of items are <strong>not eligible for return,</strong> including:</p>
                <div className="rr-nonreturn-grid">
                  {[
                    { emoji: '🥗', label: 'Perishable goods', sub: 'Food, groceries' },
                    { emoji: '🧴', label: 'Personal care', sub: 'Hygiene products' },
                    { emoji: '👙', label: 'Innerwear', sub: 'Intimate wear' },
                    { emoji: '🎨', label: 'Custom items', sub: 'Made-to-order' },
                    { emoji: '💾', label: 'Digital products', sub: 'Downloads' },
                  ].map((item, i) => (
                    <div key={i} className="rr-nonreturn-item">
                      <span className="rr-nonreturn-emoji">{item.emoji}</span>
                      <div>
                        <strong>{item.label}</strong>
                        <span>{item.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rr-info-box warning">
                  <FaExclamationTriangle />
                  <span>This list is not exhaustive. Product-specific return eligibility is shown on the product page.</span>
                </div>
              </div>
            </div>

            {/* Section 3 — Refund Process */}
            <div className="rr-section" id="rr-section-3">
              <div className="rr-section-header">
                <div className="rr-section-icon"><FaMoneyBillWave /></div>
                <h2 className="rr-section-title">3. Refund Process</h2>
              </div>
              <div className="rr-section-body">
                <div className="rr-refund-steps">
                  <div className="rr-refund-step">
                    <div className="rr-refund-step-num">1</div>
                    <div className="rr-refund-step-text">
                      <strong>Return Received</strong>
                      <span>We receive and inspect the returned product</span>
                    </div>
                  </div>
                  <div className="rr-refund-arrow">→</div>
                  <div className="rr-refund-step">
                    <div className="rr-refund-step-num">2</div>
                    <div className="rr-refund-step-text">
                      <strong>Approval</strong>
                      <span>You are notified of approval or rejection</span>
                    </div>
                  </div>
                  <div className="rr-refund-arrow">→</div>
                  <div className="rr-refund-step">
                    <div className="rr-refund-step-num">3</div>
                    <div className="rr-refund-step-text">
                      <strong>Refund Initiated</strong>
                      <span>Credited to original payment within 5–7 days</span>
                    </div>
                  </div>
                </div>
                <div className="rr-info-box">
                  <FaInfoCircle />
                  <span>Processing time may vary depending on your bank or payment provider.</span>
                </div>
              </div>
            </div>

            {/* Section 4 — Replacement */}
            <div className="rr-section" id="rr-section-4">
              <div className="rr-section-header">
                <div className="rr-section-icon"><FaExchangeAlt /></div>
                <h2 className="rr-section-title">4. Replacement / Exchange</h2>
              </div>
              <div className="rr-section-body">
                <ul className="rr-list">
                  <li>If you receive a <strong>damaged or incorrect product</strong>, we will arrange for a replacement (subject to stock availability).</li>
                  <li>If replacement is not available, a <strong>full refund</strong> will be issued.</li>
                </ul>
                <div className="rr-info-box success">
                  <FaCheckCircle />
                  <span>Replacement orders are dispatched within 2–3 business days after return pickup.</span>
                </div>
              </div>
            </div>

            {/* Section 5 — Cancellations */}
            <div className="rr-section" id="rr-section-5">
              <div className="rr-section-header">
                <div className="rr-section-icon"><FaUndo /></div>
                <h2 className="rr-section-title">5. Cancellations</h2>
              </div>
              <div className="rr-section-body">
                <div className="rr-cancel-cards">
                  <div className="rr-cancel-card allowed">
                    <div className="rr-cancel-card-icon">✓</div>
                    <div>
                      <strong>Before Shipment</strong>
                      <p>Orders can be cancelled anytime before they are shipped. Full refund will be processed.</p>
                    </div>
                  </div>
                  <div className="rr-cancel-card restricted">
                    <div className="rr-cancel-card-icon">✕</div>
                    <div>
                      <strong>After Shipment</strong>
                      <p>Orders cannot be cancelled once shipped. You may return the item after delivery.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6 — Shipping Costs */}
            <div className="rr-section" id="rr-section-6">
              <div className="rr-section-header">
                <div className="rr-section-icon"><FaTruck /></div>
                <h2 className="rr-section-title">6. Shipping Costs</h2>
              </div>
              <div className="rr-section-body">
                <ul className="rr-list">
                  <li>Return shipping charges are <strong>borne by Picknow</strong> in case of wrong or defective products.</li>
                  <li>For other return reasons (e.g., change of mind), shipping costs may be <strong>deducted from the refund.</strong></li>
                </ul>
              </div>
            </div>

            {/* Section 7 — How to Initiate */}
            <div className="rr-section" id="rr-section-7">
              <div className="rr-section-header">
                <div className="rr-section-icon"><FaInfoCircle /></div>
                <h2 className="rr-section-title">7. How to Initiate a Return</h2>
              </div>
              <div className="rr-section-body">
                <div className="rr-steps">
                  <div className="rr-step">
                    <div className="rr-step-num">1</div>
                    <div className="rr-step-content">
                      <strong>Contact Support</strong>
                      <span>Email <a href="mailto:support@picknow.in">support@picknow.in</a> within the eligible return period.</span>
                    </div>
                  </div>
                  <div className="rr-step">
                    <div className="rr-step-num">2</div>
                    <div className="rr-step-content">
                      <strong>Share Details</strong>
                      <span>Provide your Order ID, invoice copy, and reason for return.</span>
                    </div>
                  </div>
                  <div className="rr-step">
                    <div className="rr-step-num">3</div>
                    <div className="rr-step-content">
                      <strong>Return Arranged</strong>
                      <span>We will arrange pickup or guide you on return shipment.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 8 — Contact */}
            <div className="rr-section" id="rr-section-8">
              <div className="rr-section-header">
                <div className="rr-section-icon"><FaPhone /></div>
                <h2 className="rr-section-title">8. Contact Us</h2>
              </div>
              <div className="rr-section-body">
                <p className="rr-contact-intro">
                  For return, refund, or cancellation queries, reach our Customer Support Team:
                </p>
                <div className="rr-contact-card">
                  <div className="rr-contact-brand">
                    <strong>Customer Support Team</strong>
                    <span>Vairaa Wealth Pvt Ltd – Picknow</span>
                  </div>
                  <div className="rr-contact-grid">
                    <a href="https://picknow.in" target="_blank" rel="noopener noreferrer" className="rr-contact-item">
                      <div className="rr-contact-item-icon"><FaGlobe /></div>
                      <div>
                        <span className="rr-contact-label">Website</span>
                        <span className="rr-contact-value">picknow.in</span>
                      </div>
                    </a>
                    <a href="tel:+917092770118" className="rr-contact-item">
                      <div className="rr-contact-item-icon"><FaPhone /></div>
                      <div>
                        <span className="rr-contact-label">Phone</span>
                        <span className="rr-contact-value">+91 7092770118</span>
                      </div>
                    </a>
                    <a href="mailto:support@picknow.in" className="rr-contact-item">
                      <div className="rr-contact-item-icon"><FaEnvelope /></div>
                      <div>
                        <span className="rr-contact-label">Email</span>
                        <span className="rr-contact-value">support@picknow.in</span>
                      </div>
                    </a>
                    <div className="rr-contact-item">
                      <div className="rr-contact-item-icon"><FaMapMarkerAlt /></div>
                      <div>
                        <span className="rr-contact-label">Address</span>
                        <span className="rr-contact-value">34, TM Nagar, Mattuthavani, Madurai, TN - 625107</span>
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

export default ReturnRefundPolicy;