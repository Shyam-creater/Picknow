import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './Carousel.css';
import dryfruits from '../../assets/Dry_fruits.jpg';
import Nuts from '../../assets/DryFruitss.jpg';
import honey from '../../assets/honeyjar.jpg';
import { useNavigate } from 'react-router-dom';

const carouselData = [
  {
    id: 1,
    image: { src: dryfruits, alt: "Premium Dry Fruits Showcase" },
    title: "Premium Dry Fruits",
    description: "Experience the finest quality natural and organic products tailored for a healthy lifestyle.",
    buttonText: "Shop Collection",
    link: '/products?categoryId=68078a277a4b2413605546fd&subcategoryId=68078ac97a4b241360554785&categoryName=Grocery&subcategoryName=Nutritious+Seeds'
  },
  {
    id: 2,
    image: { src: Nuts, alt: "Fresh Organic Nuts" },
    title: "Fresh & Natural",
    description: "Discover our wide range of fresh, hand-picked nuts full of essential nutrients.",
    buttonText: "Explore Now",
    link: '/product/67d017c368678459d570dbb3'
  },
  {
    id: 3,
    image: { src: honey, alt: "Pure Organic Honey" },
    title: "100% Pure Honey",
    description: "Taste the sweetness of nature with our raw and unfiltered organic honey.",
    buttonText: "Buy Now",
    link: "/product/67d161ef68678459d571251f"
  }
];

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    transition: { type: "tween", duration: 0.8, ease: [0.25, 1, 0.5, 1] }
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    transition: { type: "tween", duration: 0.8, ease: [0.25, 1, 0.5, 1] }
  })
};

const textVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.3, duration: 0.8, ease: "easeOut" }
  }
};

const Carousel = () => {
  const [[page, direction], setPage] = useState([0, 0]);
  const navigate = useNavigate();
  const slideIndex = ((page % carouselData.length) + carouselData.length) % carouselData.length;
  const currentSlide = carouselData[slideIndex];

  const paginate = useCallback((newDirection) => {
    setPage([page + newDirection, newDirection]);
  }, [page]);

  useEffect(() => {
    const autoPlayTimer = setInterval(() => paginate(1), 6000);
    return () => clearInterval(autoPlayTimer);
  }, [paginate]);

  return (
    <div className="carousel-container">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={page}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="carousel-slide"
        >
          <div className="carousel-overlay" />
          <img
            src={currentSlide.image.src}
            alt={currentSlide.image.alt}
            className="carousel-image"
            fetchpriority={slideIndex === 0 ? "high" : "auto"}
            loading={slideIndex === 0 ? "eager" : "lazy"}
          />
        </motion.div>
      </AnimatePresence>

      <div className="carousel-content-wrapper">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            variants={textVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="carousel-text-content"
          >
            <h2 className="carousel-title">
              {currentSlide.title}
            </h2>
            <p className="carousel-description">
              {currentSlide.description}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(currentSlide.link)}
              className="carousel-button"
            >
              {currentSlide.buttonText}
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default memo(Carousel);
