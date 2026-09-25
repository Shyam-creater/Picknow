import React, { useState } from 'react';
import './TermsAndConditions.css';
import {
  FaCalendarAlt, FaInfoCircle, FaShieldAlt, FaBook,
  FaCheckCircle, FaExclamationTriangle, FaUser, FaCreditCard,
  FaTruck, FaUndo, FaGlobe, FaGavel, FaPhone, FaEnvelope, FaMapMarkerAlt
} from 'react-icons/fa';

const sections = [
  { id: 1,  icon: FaUser,          title: 'Eligibility' },
  { id: 2,  icon: FaShieldAlt,     title: 'Account Registration' },
  { id: 3,  icon: FaBook,          title: 'Products & Orders' },
  { id: 4,  icon: FaCreditCard,    title: 'Payments' },
  { id: 5,  icon: FaTruck,         title: 'Shipping & Delivery' },
  { id: 6,  icon: FaUndo,          title: 'Returns, Refunds & Cancellations' },
  { id: 7,  icon: FaGlobe,         title: 'Use of Website' },
  { id: 8,  icon: FaShieldAlt,     title: 'Limitation of Liability' },
  { id: 9,  icon: FaGavel,         title: 'Indemnity' },
  { id: 10, icon: FaInfoCircle,    title: 'Changes to Terms' },
  { id: 11, icon: FaGavel,         title: 'Governing Law & Dispute Resolution' },
  { id: 12, icon: FaPhone,         title: 'Contact Us' },
];

const TermsAndConditions = () => {
  const [activeSection, setActiveSection] = useState(null);

  const scrollTo = (id) => {
    const el = document.getElementById(`tc-section-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  return (
    <div className="tc-page">

      {/* ── Hero ── */}
      <div className="tc-hero">
        <div className="tc-hero-inner">
          <div className="tc-hero-badge">
            <FaGavel />
            <span>Vairaa Wealth Pvt Ltd</span>
          </div>
          <h1 className="tc-hero-title">Terms & Conditions</h1>
          <p className="tc-hero-sub">
            Please read these terms carefully before using picknow.in or making any purchases.
          </p>
          <div className="tc-hero-meta">
            <span className="tc-meta-chip">
              <FaCalendarAlt /> Last Updated: December 2024
            </span>
            <span className="tc-meta-chip">
              <FaGlobe /> Jurisdiction: Madurai, Tamil Nadu, India
            </span>
          </div>
        </div>
      </div>

      <div className="tc-body">
        <div className="tc-layout">

          {/* ── Sidebar TOC ── */}
          <aside className="tc-toc">
            <div className="tc-toc-card">
              <h3 className="tc-toc-title">Table of Contents</h3>
              <ul className="tc-toc-list">
                {sections.map((s) => (
                  <li key={s.id}>
                    <button
                      className={`tc-toc-btn ${activeSection === s.id ? 'active' : ''}`}
                      onClick={() => scrollTo(s.id)}
                    >
                      <span className="tc-toc-num">{s.id}.</span>
                      <span>{s.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="tc-main">

            {/* Notice Banner */}
            <div className="tc-notice">
              <div className="tc-notice-icon"><FaExclamationTriangle /></div>
              <p>
                Welcome to <strong>Picknow.in</strong>, operated by <strong>Vairaa Wealth Pvt Ltd</strong>.
                These Terms & Conditions govern your access to and use of our website, services, and purchases.
                By using picknow.in, you agree to comply with these Terms. If you do not agree, please do not use our services.
              </p>
            </div>

            {/* Section 1 — Eligibility */}
            <div className="tc-section" id="tc-section-1">
              <div className="tc-section-header">
                <div className="tc-section-icon"><FaUser /></div>
                <h2 className="tc-section-title">1. Eligibility</h2>
              </div>
              <div className="tc-section-body">
                <ul className="tc-list">
                  <li>You must be at least <strong>18 years old</strong> (or the age of majority in your jurisdiction) to use our platform.</li>
                  <li>By registering, you confirm that all details provided are <strong>accurate and complete.</strong></li>
                </ul>
              </div>
            </div>

            {/* Section 2 — Account Registration */}
            <div className="tc-section" id="tc-section-2">
              <div className="tc-section-header">
                <div className="tc-section-icon"><FaShieldAlt /></div>
                <h2 className="tc-section-title">2. Account Registration</h2>
              </div>
              <div className="tc-section-body">
                <ul className="tc-list">
                  <li>You may need to create an account to shop with us.</li>
                  <li>You are responsible for maintaining the <strong>confidentiality of your account credentials.</strong></li>
                  <li>Any activity under your account will be considered your responsibility.</li>
                </ul>
              </div>
            </div>

            {/* Section 3 — Products & Orders */}
            <div className="tc-section" id="tc-section-3">
              <div className="tc-section-header">
                <div className="tc-section-icon"><FaBook /></div>
                <h2 className="tc-section-title">3. Products & Orders</h2>
              </div>
              <div className="tc-section-body">
                <ul className="tc-list">
                  <li>All products listed on picknow.in are subject to <strong>availability.</strong></li>
                  <li>Prices are subject to change without prior notice.</li>
                  <li>Orders are confirmed only after <strong>successful payment.</strong></li>
                  <li>We reserve the right to cancel or refuse orders in cases of fraud, unauthorized activity, or product unavailability.</li>
                </ul>
              </div>
            </div>

            {/* Section 4 — Payments */}
            <div className="tc-section" id="tc-section-4">
              <div className="tc-section-header">
                <div className="tc-section-icon"><FaCreditCard /></div>
                <h2 className="tc-section-title">4. Payments</h2>
              </div>
              <div className="tc-section-body">
                <ul className="tc-list">
                  <li>Payments must be made via approved methods (credit/debit cards, UPI, wallets, net banking, etc.).</li>
                  <li>All payments are processed securely through <strong>trusted third-party gateways.</strong></li>
                  <li>We are not responsible for delays or failures caused by third-party payment providers.</li>
                </ul>
                <div className="tc-info-box">
                  <FaCheckCircle />
                  <span>All transactions are encrypted and processed through PCI-DSS compliant payment gateways.</span>
                </div>
              </div>
            </div>

            {/* Section 5 — Shipping */}
            <div className="tc-section" id="tc-section-5">
              <div className="tc-section-header">
                <div className="tc-section-icon"><FaTruck /></div>
                <h2 className="tc-section-title">5. Shipping & Delivery</h2>
              </div>
              <div className="tc-section-body">
                <ul className="tc-list">
                  <li>Delivery timelines are <strong>estimates</strong> and may vary due to logistics or unforeseen events.</li>
                  <li>Shipping charges (if applicable) will be displayed at checkout.</li>
                  <li>Risk of loss passes to you upon delivery of the order to the provided address.</li>
                </ul>
              </div>
            </div>

            {/* Section 6 — Returns */}
            <div className="tc-section" id="tc-section-6">
              <div className="tc-section-header">
                <div className="tc-section-icon"><FaUndo /></div>
                <h2 className="tc-section-title">6. Returns, Refunds & Cancellations</h2>
              </div>
              <div className="tc-section-body">
                <ul className="tc-list">
                  <li>Our Return & Refund Policy (available on the website) governs product returns, cancellations, and refunds.</li>
                  <li>Items must be returned in their <strong>original condition and packaging</strong> (where applicable).</li>
                  <li>Certain items (e.g., perishable, personal care, or customized products) may <strong>not be eligible</strong> for returns.</li>
                </ul>
                <div className="tc-info-box warning">
                  <FaExclamationTriangle />
                  <span>Perishable, personal care, and customized products are generally not eligible for return.</span>
                </div>
              </div>
            </div>

            {/* Section 7 — Use of Website */}
            <div className="tc-section" id="tc-section-7">
              <div className="tc-section-header">
                <div className="tc-section-icon"><FaGlobe /></div>
                <h2 className="tc-section-title">7. Use of Website</h2>
              </div>
              <div className="tc-section-body">
                <ul className="tc-list tc-list-cross">
                  <li>You agree <strong>not</strong> to misuse the platform for fraudulent, illegal, or harmful activities.</li>
                  <li>You must <strong>not</strong> attempt to disrupt or hack the website, servers, or security systems.</li>
                  <li>Content on the website (images, logos, product descriptions) is the <strong>intellectual property</strong> of Vairaa Wealth Pvt Ltd and cannot be copied without prior consent.</li>
                </ul>
              </div>
            </div>

            {/* Section 8 — Limitation of Liability */}
            <div className="tc-section" id="tc-section-8">
              <div className="tc-section-header">
                <div className="tc-section-icon"><FaShieldAlt /></div>
                <h2 className="tc-section-title">8. Limitation of Liability</h2>
              </div>
              <div className="tc-section-body">
                <p>Vairaa Wealth Pvt Ltd shall <strong>not be liable</strong> for:</p>
                <ul className="tc-list">
                  <li>Delays in delivery due to third-party logistics.</li>
                  <li>Errors or inaccuracies in product descriptions.</li>
                  <li>Losses arising from misuse of your account credentials.</li>
                  <li>Any indirect, incidental, or consequential damages.</li>
                </ul>
              </div>
            </div>

            {/* Section 9 — Indemnity */}
            <div className="tc-section" id="tc-section-9">
              <div className="tc-section-header">
                <div className="tc-section-icon"><FaGavel /></div>
                <h2 className="tc-section-title">9. Indemnity</h2>
              </div>
              <div className="tc-section-body">
                <p>
                  You agree to indemnify and hold harmless <strong>Vairaa Wealth Pvt Ltd (Picknow)</strong>,
                  its directors, employees, and partners from any claims, damages, or liabilities arising
                  out of your use of the platform or violation of these Terms.
                </p>
              </div>
            </div>

            {/* Section 10 — Changes to Terms */}
            <div className="tc-section" id="tc-section-10">
              <div className="tc-section-header">
                <div className="tc-section-icon"><FaInfoCircle /></div>
                <h2 className="tc-section-title">10. Changes to Terms</h2>
              </div>
              <div className="tc-section-body">
                <p>
                  We may update these Terms from time to time. Changes will be posted on this page
                  with a revised <strong>"Effective Date."</strong> Continued use of the website after
                  changes means you accept the updated Terms.
                </p>
              </div>
            </div>

            {/* Section 11 — Governing Law */}
            <div className="tc-section" id="tc-section-11">
              <div className="tc-section-header">
                <div className="tc-section-icon"><FaGavel /></div>
                <h2 className="tc-section-title">11. Governing Law & Dispute Resolution</h2>
              </div>
              <div className="tc-section-body">
                <ul className="tc-list">
                  <li>These Terms are governed by the <strong>laws of India.</strong></li>
                  <li>In case of disputes, the matter will fall under the jurisdiction of the courts of <strong>Madurai, Tamil Nadu, India.</strong></li>
                </ul>
                <div className="tc-info-box">
                  <FaGavel />
                  <span>Jurisdiction: Courts of Madurai, Tamil Nadu, India.</span>
                </div>
              </div>
            </div>

            {/* Section 12 — Contact */}
            <div className="tc-section" id="tc-section-12">
              <div className="tc-section-header">
                <div className="tc-section-icon"><FaPhone /></div>
                <h2 className="tc-section-title">12. Contact Us</h2>
              </div>
              <div className="tc-section-body">
                <p className="tc-contact-intro">
                  For any queries related to these Terms, reach our Compliance Team:
                </p>
                <div className="tc-contact-card">
                  <div className="tc-contact-brand">
                    <strong>Compliance Team</strong>
                    <span>Vairaa Wealth Pvt Ltd – Picknow</span>
                  </div>
                  <div className="tc-contact-grid">
                    <a href="https://picknow.in" target="_blank" rel="noopener noreferrer" className="tc-contact-item">
                      <div className="tc-contact-item-icon"><FaGlobe /></div>
                      <div>
                        <span className="tc-contact-label">Website</span>
                        <span className="tc-contact-value">picknow.in</span>
                      </div>
                    </a>
                    <a href="tel:+917092770118" className="tc-contact-item">
                      <div className="tc-contact-item-icon"><FaPhone /></div>
                      <div>
                        <span className="tc-contact-label">Phone</span>
                        <span className="tc-contact-value">+91 7092770118</span>
                      </div>
                    </a>
                    <a href="mailto:support@picknow.in" className="tc-contact-item">
                      <div className="tc-contact-item-icon"><FaEnvelope /></div>
                      <div>
                        <span className="tc-contact-label">Email</span>
                        <span className="tc-contact-value">support@picknow.in</span>
                      </div>
                    </a>
                    <div className="tc-contact-item">
                      <div className="tc-contact-item-icon"><FaMapMarkerAlt /></div>
                      <div>
                        <span className="tc-contact-label">Address</span>
                        <span className="tc-contact-value">34, TM Nagar, Mattuthavani, Madurai, TN - 625107</span>
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

export default TermsAndConditions;