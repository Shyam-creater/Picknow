import React, { useState } from 'react';
import './PrivacyPolicy.css';
import {
  FaCalendarAlt, FaInfoCircle, FaShieldAlt, FaCheckCircle,
  FaExclamationTriangle, FaUser, FaCreditCard, FaTruck,
  FaUndo, FaGlobe, FaGavel, FaPhone, FaEnvelope,
  FaMapMarkerAlt, FaDatabase, FaLock, FaEye, FaCookieBite
} from 'react-icons/fa';

const sections = [
  { id: 1, icon: FaDatabase,          title: 'Information We Collect' },
  { id: 2, icon: FaInfoCircle,        title: 'How We Use Your Information' },
  { id: 3, icon: FaLock,              title: 'Data Security' },
  { id: 4, icon: FaShieldAlt,         title: 'Data Sharing & Disclosure' },
  { id: 5, icon: FaCalendarAlt,       title: 'Data Retention' },
  { id: 6, icon: FaEye,               title: 'Your Rights' },
  { id: 7, icon: FaCookieBite,        title: 'Cookies & Tracking' },
  { id: 8, icon: FaGlobe,             title: 'International Data Transfers' },
  { id: 9, icon: FaInfoCircle,        title: 'Updates to This Policy' },
  { id: 10, icon: FaPhone,            title: 'Contact Us' },
];

const PrivacyPolicy = () => {
  const [activeSection, setActiveSection] = useState(null);

  const scrollTo = (id) => {
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  return (
    <div className="pp-page">

      {/* ── Hero Header ── */}
      <div className="pp-hero">
        <div className="pp-hero-inner">
          <div className="pp-hero-badge">
            <FaShieldAlt />
            <span>Vairaa Wealth Pvt Ltd</span>
          </div>
          <h1 className="pp-hero-title">Privacy Policy</h1>
          <p className="pp-hero-sub">
            How we collect, use, and protect your personal information at Picknow.
          </p>
          <div className="pp-hero-meta">
            <span className="pp-meta-chip">
              <FaCalendarAlt /> Last Updated: December 2024
            </span>
            <span className="pp-meta-chip">
              <FaGlobe /> Applicable: India & International
            </span>
          </div>
        </div>
      </div>

      <div className="pp-body">
        <div className="pp-layout">

          {/* ── Sidebar TOC ── */}
          <aside className="pp-toc">
            <div className="pp-toc-card">
              <h3 className="pp-toc-title">Table of Contents</h3>
              <ul className="pp-toc-list">
                {sections.map((s) => (
                  <li key={s.id}>
                    <button
                      className={`pp-toc-btn ${activeSection === s.id ? 'active' : ''}`}
                      onClick={() => scrollTo(s.id)}
                    >
                      <span className="pp-toc-num">{s.id}.</span>
                      <span>{s.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="pp-main">

            {/* Notice Banner */}
            <div className="pp-notice">
              <div className="pp-notice-icon">
                <FaExclamationTriangle />
              </div>
              <p>
                At <strong>Vairaa Wealth Pvt Ltd ("Picknow")</strong>, accessible at{' '}
                <a href="https://picknow.in" target="_blank" rel="noopener noreferrer">picknow.in</a>,
                we respect your privacy and are committed to protecting your personal information.
                By accessing or using picknow.in, you agree to the practices outlined in this Privacy Policy.
              </p>
            </div>

            {/* Section 1 */}
            <div className="pp-section" id="section-1">
              <div className="pp-section-header">
                <div className="pp-section-icon"><FaDatabase /></div>
                <h2 className="pp-section-title">1. Information We Collect</h2>
              </div>
              <div className="pp-section-body">
                <p>We may collect the following types of information:</p>
                <ul className="pp-list">
                  <li><strong>Personal Information:</strong> Name, email address, phone number, billing and shipping address.</li>
                  <li><strong>Payment Information:</strong> UPI, wallet payments, credit/debit card details, and other transaction data (processed securely through trusted third-party payment gateways).</li>
                  <li><strong>Order Information:</strong> Products purchased, order history, preferences.</li>
                  <li><strong>Technical Data:</strong> IP address, browser type, device details, operating system, and cookies.</li>
                  <li><strong>Marketing Data:</strong> Information you provide when subscribing to newsletters, offers, or promotions.</li>
                </ul>
                <div className="pp-info-box">
                  <FaInfoCircle />
                  <span>We do not knowingly collect information from individuals under the age of 18.</span>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="pp-section" id="section-2">
              <div className="pp-section-header">
                <div className="pp-section-icon"><FaInfoCircle /></div>
                <h2 className="pp-section-title">2. How We Use Your Information</h2>
              </div>
              <div className="pp-section-body">
                <p>Your data may be used for:</p>
                <ul className="pp-list">
                  <li>Processing and fulfilling orders.</li>
                  <li>Managing secure payments and fraud prevention.</li>
                  <li>Shipping and delivery services.</li>
                  <li>Providing customer support.</li>
                  <li>Sending order updates, offers, and promotional messages (if you opt-in).</li>
                  <li>Improving website experience, products, and services.</li>
                  <li>Legal and regulatory compliance.</li>
                </ul>
              </div>
            </div>

            {/* Section 3 */}
            <div className="pp-section" id="section-3">
              <div className="pp-section-header">
                <div className="pp-section-icon"><FaLock /></div>
                <h2 className="pp-section-title">3. Data Security</h2>
              </div>
              <div className="pp-section-body">
                <div className="pp-cards-grid">
                  <div className="pp-card">
                    <FaCreditCard className="pp-card-icon" />
                    <p>Payment information is handled securely by <strong>PCI-DSS-compliant</strong> payment gateways.</p>
                  </div>
                  <div className="pp-card">
                    <FaLock className="pp-card-icon" />
                    <p>We implement <strong>encryption, firewalls,</strong> and secure servers to protect data.</p>
                  </div>
                  <div className="pp-card">
                    <FaUser className="pp-card-icon" />
                    <p>Access to personal data is restricted to <strong>authorized staff only.</strong></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="pp-section" id="section-4">
              <div className="pp-section-header">
                <div className="pp-section-icon"><FaShieldAlt /></div>
                <h2 className="pp-section-title">4. Data Sharing & Disclosure</h2>
              </div>
              <div className="pp-section-body">
                <p>We <strong>do not sell or rent</strong> personal data. Information may be shared only in these cases:</p>
                <ul className="pp-list">
                  <li><strong>With Service Providers:</strong> Delivery partners, payment processors, IT providers.</li>
                  <li><strong>With Authorities:</strong> To comply with applicable laws, court orders, or government requests.</li>
                  <li><strong>In Business Transfers:</strong> If we undergo a merger, acquisition, or restructuring.</li>
                </ul>
                <div className="pp-info-box success">
                  <FaCheckCircle />
                  <span>All third parties are bound by confidentiality obligations.</span>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="pp-section" id="section-5">
              <div className="pp-section-header">
                <div className="pp-section-icon"><FaCalendarAlt /></div>
                <h2 className="pp-section-title">5. Data Retention</h2>
              </div>
              <div className="pp-section-body">
                <p>We retain your data only as long as necessary to:</p>
                <ul className="pp-list">
                  <li>Complete transactions.</li>
                  <li>Provide customer service.</li>
                  <li>Meet legal, tax, and compliance obligations.</li>
                </ul>
                <p>After this period, data is securely deleted or anonymized.</p>
              </div>
            </div>

            {/* Section 6 */}
            <div className="pp-section" id="section-6">
              <div className="pp-section-header">
                <div className="pp-section-icon"><FaEye /></div>
                <h2 className="pp-section-title">6. Your Rights</h2>
              </div>
              <div className="pp-section-body">
                <p>Depending on your jurisdiction, you may have the right to:</p>
                <ul className="pp-list pp-list-check">
                  <li>Access, correct, or update your information.</li>
                  <li>Request deletion of personal data (subject to legal requirements).</li>
                  <li>Opt out of promotional communications.</li>
                  <li>Restrict or object to certain processing activities.</li>
                  <li>Request data portability (where applicable under law).</li>
                </ul>
                <p>You can exercise these rights by contacting us (details below).</p>
              </div>
            </div>

            {/* Section 7 */}
            <div className="pp-section" id="section-7">
              <div className="pp-section-header">
                <div className="pp-section-icon"><FaCookieBite /></div>
                <h2 className="pp-section-title">7. Cookies & Tracking</h2>
              </div>
              <div className="pp-section-body">
                <p>We use cookies and similar technologies to:</p>
                <ul className="pp-list">
                  <li>Keep your shopping cart active.</li>
                  <li>Remember your preferences.</li>
                  <li>Analyze site usage and improve performance.</li>
                  <li>Provide personalized offers and advertisements.</li>
                </ul>
                <div className="pp-info-box warning">
                  <FaExclamationTriangle />
                  <span>Where legally required, we will request your consent before placing non-essential cookies.</span>
                </div>
              </div>
            </div>

            {/* Section 8 */}
            <div className="pp-section" id="section-8">
              <div className="pp-section-header">
                <div className="pp-section-icon"><FaGlobe /></div>
                <h2 className="pp-section-title">8. International Data Transfers</h2>
              </div>
              <div className="pp-section-body">
                <p>
                  If your information is transferred outside India, we ensure compliance with applicable
                  laws including the <strong>India Digital Personal Data Protection (DPDP) Act 2023</strong>,
                  the <strong>EU GDPR</strong>, and other relevant regulations.
                </p>
              </div>
            </div>

            {/* Section 9 */}
            <div className="pp-section" id="section-9">
              <div className="pp-section-header">
                <div className="pp-section-icon"><FaInfoCircle /></div>
                <h2 className="pp-section-title">9. Updates to This Policy</h2>
              </div>
              <div className="pp-section-body">
                <p>
                  We may revise this Privacy Policy from time to time. Updates will be posted
                  on this page with a new <strong>"Effective Date."</strong>
                </p>
              </div>
            </div>

            {/* Section 10 — Contact */}
            <div className="pp-section pp-contact-section" id="section-10">
              <div className="pp-section-header">
                <div className="pp-section-icon"><FaPhone /></div>
                <h2 className="pp-section-title">10. Contact Us</h2>
              </div>
              <div className="pp-section-body">
                <p className="pp-contact-intro">
                  For any privacy-related queries, reach our Privacy Officer:
                </p>
                <div className="pp-contact-card">
                  <div className="pp-contact-brand">
                    <strong>Privacy Officer</strong>
                    <span>Vairaa Wealth Pvt Ltd – Picknow</span>
                  </div>
                  <div className="pp-contact-grid">
                    <a href="https://picknow.in" target="_blank" rel="noopener noreferrer" className="pp-contact-item">
                      <div className="pp-contact-item-icon"><FaGlobe /></div>
                      <div>
                        <span className="pp-contact-label">Website</span>
                        <span className="pp-contact-value">picknow.in</span>
                      </div>
                    </a>
                    <a href="tel:+917092770118" className="pp-contact-item">
                      <div className="pp-contact-item-icon"><FaPhone /></div>
                      <div>
                        <span className="pp-contact-label">Phone</span>
                        <span className="pp-contact-value">+91 7092770118</span>
                      </div>
                    </a>
                    <a href="mailto:support@picknow.in" className="pp-contact-item">
                      <div className="pp-contact-item-icon"><FaEnvelope /></div>
                      <div>
                        <span className="pp-contact-label">Email</span>
                        <span className="pp-contact-value">support@picknow.in</span>
                      </div>
                    </a>
                    <div className="pp-contact-item">
                      <div className="pp-contact-item-icon"><FaMapMarkerAlt /></div>
                      <div>
                        <span className="pp-contact-label">Address</span>
                        <span className="pp-contact-value">34, TM Nagar, Mattuthavani, Madurai, TN - 625107</span>
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

export default PrivacyPolicy;