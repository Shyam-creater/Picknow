import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Rocket, 
  TrendingUp, 
  Settings, 
  ShieldCheck, 
  CreditCard, 
  Clock, 
  UserCheck, 
  Headset, 
  Scale,
  Mail,
  Phone,
  MapPin,
  ArrowRight
} from "lucide-react";
import NavbarVendor from "../NavbarVendor";
import Footer from "../VendorFooter";
import "../styles/LandingPage.css";
import { useNavigate } from "react-router-dom";

const LandingPage = ({ setCurrentPage }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    initial: {},
    whileInView: { transition: { staggerChildren: 0.1 } },
    viewport: { once: true }
  };
const navigate = useNavigate();

  return (
    <div className="vendor-v2-page">
      <NavbarVendor setCurrentPage={setCurrentPage} />
      
      {/* Hero Section */}
      <section className="v2-hero">
        <div className="v2-hero-container">
          <motion.div 
            className="v2-hero-content"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1>
              Scale your business with <span className="gradient-text">PICKNOW</span>
            </h1>
            <p>
              Join India's fastest-growing marketplace. Reach millions of customers 
              and manage your business with our world-class vendor ecosystem.
            </p>
            <div className="v2-hero-actions">
             <button
  className="v2-btn-primary"
  onClick={() => navigate("/vendor/login")}
>
  Start Selling Now
  <ArrowRight size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
</button>
              <button className="v2-btn-secondary" onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })}>
                Learn More
              </button>
            </div>
          </motion.div>

          <motion.div 
            className="v2-stats-grid"
            variants={staggerContainer}
            initial="initial"
            animate="whileInView"
            viewport={{ once: true }}
          >
            {[
              { number: "50K+", label: "Active Vendors" },
              { number: "₹2M+", label: "Monthly Sales" },
              { number: "95%", label: "Seller Success" }
            ].map((stat, i) => (
              <motion.div key={i} className="v2-stat-card" variants={fadeIn}>
                <div className="v2-stat-number">{stat.number}</div>
                <div className="v2-stat-label">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="v2-section" id="about">
        <div className="v2-section-header">
          <motion.h2 {...fadeIn}>Why Choose PICKNOW?</motion.h2>
          <motion.p {...fadeIn}>Powerful tools and vast reach to help your business thrive.</motion.p>
        </div>
        
        <motion.div 
          className="v2-features-grid"
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
        >
          {[
            { 
              icon: <Rocket size={32} />, 
              title: "Expand Your Reach", 
              desc: "Access millions of customers shopping on our platform daily from every corner of India." 
            },
            { 
              icon: <TrendingUp size={32} />, 
              title: "Increase Revenue", 
              desc: "Our vendors report an average 35% increase in sales within just 3 months of joining." 
            },
            { 
              icon: <Settings size={32} />, 
              title: "Smart Management", 
              desc: "Intuitive dashboard to manage inventory, track orders, and analyze performance in real-time." 
            }
          ].map((feature, i) => (
            <motion.div key={i} className="v2-feature-card" variants={fadeIn}>
              <div className="v2-feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Policies Section */}
      <section className="v2-section" style={{ background: '#ffffff', borderRadius: '48px', margin: '0 20px' }}>
        <div className="v2-section-header">
          <motion.h2 {...fadeIn}>Vendor Excellence Policies</motion.h2>
          <motion.p {...fadeIn}>Transparent guidelines designed for mutual growth and trust.</motion.p>
        </div>

        <motion.div 
          className="v2-policies-grid"
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
        >
          {[
            { icon: <ShieldCheck size={20} />, title: "Quality Standards", desc: "Rigorous quality checks to ensure customer delight and maintain high brand reputation." },
            { icon: <CreditCard size={20} />, title: "Fair Commission", desc: "Competitive flat 10% commission structure with zero hidden charges or setup fees." },
            { icon: <Clock size={20} />, title: "Fast Payments", desc: "Automated payment cycles every 15 days directly to your verified bank account." },
            { icon: <UserCheck size={20} />, title: "Verified Trust", desc: "Robust verification process to ensure business legitimacy and marketplace safety." },
            { icon: <Headset size={20} />, title: "24/7 Support", desc: "Dedicated seller support managers available around the clock to assist your growth." },
            { icon: <Scale size={20} />, title: "Fair Disputes", desc: "Transparent resolution system to handle customer concerns with complete neutrality." }
          ].map((policy, i) => (
            <motion.div key={i} className="v2-policy-card" variants={fadeIn}>
              <h3>{policy.icon} {policy.title}</h3>
              <p>{policy.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Steps Section */}
      <section className="v2-section">
        <div className="v2-section-header">
          <motion.h2 {...fadeIn}>Your Journey to Success</motion.h2>
          <motion.p {...fadeIn}>Get your storefront live in four simple steps.</motion.p>
        </div>

        <motion.div 
          className="v2-steps-container"
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
        >
          {[
            { step: "1", title: "Register", desc: "Sign up with your basic business and tax details." },
            { step: "2", title: "Verify", desc: "Upload necessary documents for quick verification." },
            { step: "3", title: "Approval", desc: "Our team reviews and approves your store in 48 hours." },
            { step: "4", title: "Sell", desc: "List your products and start receiving orders instantly." }
          ].map((step, i) => (
            <motion.div key={i} className="v2-step-item" variants={fadeIn}>
              <div className="v2-step-number">{step.step}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Testimonial Section */}
      <section className="v2-testimonial-section">
        <motion.div 
          className="v2-testimonial-card"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="v2-testimonial-quote">
            "Joining PICKNOW was the best business decision I've made. 
            The platform's reach helped my sales double in just 6 months, 
            and the support team is genuinely invested in my success."
          </div>
          <div className="v2-testimonial-author">
            — Sarah J., Founder of Ethos Boutique
          </div>
        </motion.div>
      </section>

      {/* Contact Section */}
      <section className="v2-section" id="contact">
        <div className="v2-contact-wrapper">
          <motion.div className="v2-contact-info" {...fadeIn}>
            <h3>Get in Touch</h3>
            <div className="v2-info-item">
              <Mail className="v2-info-item-icon" />
              <div>
                <h4>Email Support</h4>
                <p>vendors@picknow.in</p>
              </div>
            </div>
            <div className="v2-info-item">
              <Phone className="v2-info-item-icon" />
              <div>
                <h4>Call Center</h4>
                <p>+91 7092770118</p>
              </div>
            </div>
            <div className="v2-info-item">
              <MapPin className="v2-info-item-icon" />
              <div>
                <h4>Office Hours</h4>
                <p>Monday - Friday, 9am - 6pm IST</p>
              </div>
            </div>
          </motion.div>

          <motion.div className="v2-contact-form" {...fadeIn}>
            <div className="v2-form-group">
              <label>Full Name</label>
              <input type="text" className="v2-form-input" placeholder="Enter your name" />
            </div>
            <div className="v2-form-group">
              <label>Email Address</label>
              <input type="email" className="v2-form-input" placeholder="Enter your email" />
            </div>
            <div className="v2-form-group">
              <label>Message</label>
              <textarea className="v2-form-input" rows="4" placeholder="How can we help you?"></textarea>
            </div>
            <button className="v2-btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              Send Inquiry
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
