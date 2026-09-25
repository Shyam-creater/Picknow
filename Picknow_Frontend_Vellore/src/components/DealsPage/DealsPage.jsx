import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaTag,
  FaClock,
  FaPercent,
  FaArrowRight,
  FaGift,
} from "react-icons/fa";
import bundleDeals from "../../assets/bundleDeals.jpg";
import ClearanceSale from "../../assets/ClearanceSale.jpg";
import flashSale from "../../assets/flashSale.jpg";
import "./DealsPage.css";
import Heading from "../Heading";

const DealsPage = () => {
  const [copiedCode, setCopiedCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 2000); // Simulating API call delay
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  const deals = [
    {
      id: 1,
      title: "Flash Sale",
      discount: "50% OFF",
      description: "Limited time offer on selected items",
      endTime: "2024-03-31",
      image: flashSale,
      bgColor: "#FFE1E1",
    },
    {
      id: 2,
      title: "Bundle Deals",
      discount: "Buy 2 Get 1",
      description: "Special offers on product bundles",
      endTime: "2024-03-31",
      image: bundleDeals,
      bgColor: "#E1F5FE",
    },
    {
      id: 3,
      title: "Clearance Sale",
      discount: "Up to 70% OFF",
      description: "Massive discounts on clearance items",
      endTime: "2024-03-31",
      image: ClearanceSale,
      bgColor: "#E8F5E9",
    },
  ];

  return (
    <>
      <Heading
        title="Exclusive Deals on Organic Products | PickNow Flash Sales"
        description="Save on your favorites with PickNow’s limited-time offers and flash sales on organic dry fruits, herbal mixes, millet snacks and more shop healthy on a budget!"
        keywords="organic deals India, flash sale organic snacks, discount herbal products, picknow deals, healthy offers India"
      />
      <div className="deals-page">
        <div className="deals-hero">
          <div className="hero-content">
            <h1>Exclusive Deals</h1>
            <p className="hero-subtitle">
              Discover amazing offers and save big!
            </p>
          </div>
        </div>

        <div className="deals-container">
          <div className="section-header">
            <h2>Today's Hot Deals</h2>
          </div>

          <div className="deals-grid">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="deal-card shimmer">
                    <div className="shimmer-image"></div>
                    <div className="shimmer-text shimmer-line"></div>
                    <div className="shimmer-text shimmer-line"></div>
                    <div className="shimmer-text shimmer-line"></div>
                  </div>
                ))
              : deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="deal-card"
                    style={{ backgroundColor: deal.bgColor }}
                  >
                    <div className="deal-content">
                      <h3>{deal.title}</h3>
                      <span className="deal-badge">{deal.discount}</span>
                      <p className="deal-description">{deal.description}</p>
                      <div className="deal-timer">
                        <FaClock />
                        <span>
                          Ends in: {new Date(deal.endTime).toLocaleDateString()}
                        </span>
                      </div>
                      <Link to="/product" className="deal-button">
                        Shop Now <FaArrowRight />
                      </Link>
                    </div>
                    <div className="deal-image">
                      <img src={deal.image} alt={deal.title} />
                    </div>
                  </div>
                ))}
          </div>

          <div className="discount-section">
            <div className="section-header">
              <h2>Special Discounts</h2>
              <p>Exclusive discount codes for extra savings</p>
            </div>
            <div className="discount-grid">
              <div className="discount-card">
                <div className="discount-content">
                  <div className="discount-icon">
                    <FaTag />
                  </div>
                  <div className="discount-details">
                    <h3>20% OFF</h3>
                    <p>Save 20% on your first order</p>
                    <span className="discount-validity">
                      Valid until December 31, 2024
                    </span>
                  </div>
                </div>
                <button
                  className="copy-discount-btn"
                  onClick={() => handleCopyCode("SAVE20")}
                >
                  {copiedCode === "SAVE20" ? "Copied!" : "SAVE20"}
                </button>
              </div>

              <div className="discount-card">
                <div className="discount-content">
                  <div className="discount-icon">
                    <FaGift />
                  </div>
                  <div className="discount-details">
                    <h3>30% OFF</h3>
                    <p>Bundle purchases discount</p>
                    <span className="discount-validity">
                      Valid until December 31, 2024
                    </span>
                  </div>
                </div>
                <button
                  className="copy-discount-btn"
                  onClick={() => handleCopyCode("BUNDLE30")}
                >
                  {copiedCode === "BUNDLE30" ? "Copied!" : "BUNDLE30"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DealsPage;
