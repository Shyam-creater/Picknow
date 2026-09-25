import React from 'react';
import { motion } from 'framer-motion';
import { FiTruck, FiRotateCcw, FiShield, FiHeadphones } from 'react-icons/fi';

const WhyChooseUs = () => {
  const items = [
    {
      id: 'shipping',
      title: 'Free Shipping',
      desc: 'Free delivery on orders over ₹500',
      Icon: FiTruck,
      color: '#ff5e00' // Primary Orange
    },
    {
      id: 'returns',
      title: 'Easy Returns',
      desc: '7-day hassle-free returns',
      Icon: FiRotateCcw,
      color: '#ff8c00' // Secondary Orange
    },
    {
      id: 'payments',
      title: 'Secure Payments',
      desc: '100% secure payment processing',
      Icon: FiShield,
      color: '#ff7f50' // Coral
    },
    {
      id: 'support',
      title: '24/7 Support',
      desc: 'Round-the-clock customer support',
      Icon: FiHeadphones,
      color: '#ffbf00' // Warm Amber
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <section style={{ padding: '6rem 2rem', position: 'relative', zIndex: 10, background: 'linear-gradient(to bottom, #fffbf9, #ffffff)' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ fontSize: '3.5rem', fontWeight: 800, color: '#2d2a26', marginBottom: '1rem', letterSpacing: '-1px' }}
        >
          Why Choose <span style={{ background: 'linear-gradient(135deg, #ff5e00, #ff8c00, #ff7f50)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Us?</span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          style={{ fontSize: '1.25rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}
        >
          We're committed to providing the absolute best organic shopping experience
        </motion.p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2.5rem', maxWidth: '1280px', margin: '0 auto' }}
      >
        {items.map(({ id, title, desc, Icon, color }) => (
          <motion.article 
            key={id} 
            variants={itemVariants}
            whileHover={{ y: -12, boxShadow: `0 20px 40px -10px ${color}30` }}
            style={{ 
              background: 'rgba(255, 255, 255, 0.9)', 
              backdropFilter: 'blur(20px)',
              border: `1px solid ${color}20`,
              borderRadius: '24px', 
              padding: '3rem 2rem', 
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Subtle background glow */}
            <div style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '100px',
              height: '100px',
              background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />

            <motion.div 
              whileHover={{ rotate: 15, scale: 1.15 }}
              transition={{ duration: 0.3 }}
              style={{ 
                width: '85px', 
                height: '85px', 
                borderRadius: '24px', 
                background: `linear-gradient(135deg, ${color}15, ${color}30)`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '2rem',
                border: `1px solid ${color}40`,
                boxShadow: `0 8px 20px ${color}20`,
                transform: 'rotate(-5deg)'
              }}
            >
              <div style={{ transform: 'rotate(5deg)' }}>
                <Icon size={42} color={color} />
              </div>
            </motion.div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2d2a26', marginBottom: '1rem' }}>{title}</h3>
            <p style={{ color: '#6b7280', lineHeight: 1.6, fontSize: '1.05rem', margin: 0 }}>{desc}</p>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
};

export default WhyChooseUs;