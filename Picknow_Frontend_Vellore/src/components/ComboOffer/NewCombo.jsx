import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "./NewCombo.css";
import "../HotDeals/HotDeals.css";

const MotionLink = motion(Link);
import { productApi } from "../../APi/productApi";

const getPrimaryImage = (pImage) => {
  if (!pImage) return "";
  if (Array.isArray(pImage) && pImage.length > 0) return pImage[0];
  if (typeof pImage === "string") return pImage;
  return "";
};

const getBestOffer = (variants) => {
  if (!Array.isArray(variants) || variants.length === 0) return 0;
  const offers = variants
    .map((v) => Number(v.offer || 0))
    .filter((n) => !Number.isNaN(n));
  return offers.length ? Math.max(...offers) : 0;
};

const getLowestPrice = (variants) => {
  if (!Array.isArray(variants) || variants.length === 0) return null;
  const prices = variants
    .map((v) => Number(v.price))
    .filter((n) => !Number.isNaN(n) && n > 0);
  if (!prices.length) return null;
  return Math.min(...prices);
};

const NewCombo = () => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadCombos = async () => {
      try {
        setLoading(true);
        const res = await productApi.getProductByType("combo");
        const products = res?.products || [];

        if (!isMounted) return;

        const grouped = products.reduce((acc, p) => {
          const key = p.pName?.trim();

          if (!key) return acc;

          if (!acc[key]) {
            acc[key] = {
              ...p,
              variants: [...(p.variants || [])],
            };
          } else {
            acc[key].variants = acc[key].variants.concat(p.variants || []);
          }

          return acc;
        }, {});

        const normalized = Object.values(grouped).map((p) => {
          const image = getPrimaryImage(p.pImage);
          const bestOffer = getBestOffer(p.variants);
          const lowestPrice = getLowestPrice(p.variants);

          return {
            id: p._id, 
            title: p.pName,
            description: p.pShortDescription || p.pDescription || "",
            image,
            offer: bestOffer,
            price: lowestPrice,
            status: p.pStatus,
            createdAt: p.createdAt || p.updatedAt || p._id,
          };
        });

        normalized.sort((a, b) => {
          const aActive = a.status?.toLowerCase() === "active";
          const bActive = b.status?.toLowerCase() === "active";

          if (aActive !== bActive) return bActive - aActive;

          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        setCombos(normalized);
      } catch (e) {
        setError(e?.message || "Failed to load combos");
      } finally {
        setLoading(false);
      }
    };

    loadCombos();

    return () => {
      isMounted = false;
    };
  }, [] );

  const shimmerItems = useMemo(() => new Array(4).fill(0), []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <section className="new-combo-section">
      <div className="container">
        <div className="nc-header">
          <h2 className="nc-title">
            Our New <span>Combos</span>
          </h2>
          <p className="nc-subtitle">
            Curated bundles, better value, irresistible picks.
          </p>
        </div>

        {loading && (
          <div className="row g-4 justify-content-center">
            {shimmerItems.map((_, i) => (
              <div key={i} className="col-12 col-sm-6 col-md-4 col-lg-3">
                <div className="shimmer h-100">
                  <div className="shimmer-block" />
                  <div className="shimmer-line w-70 mt-3" />
                  <div className="shimmer-line w-40" />
                  <div className="shimmer-line w-50 mb-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && <div className="nc-error">{error}</div>}

        {!loading && !error && combos.length === 0 && (
          <div className="nc-empty">
            No combos available right now. Check back soon!
          </div>
        )}

        {!loading && !error && combos.length > 0 && (
          <motion.div
            className="row g-4 justify-content-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
          >
            {combos.map((c) => {
              const isInactive = c.status && c.status.toLowerCase() !== "active";
              const CardComponent = isInactive ? motion.div : MotionLink;
              const cardProps = isInactive ? {} : { to: `/product/${c.id}` };

              return (
                <motion.div key={c.id} className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex" variants={itemVariants}>
                  <CardComponent
                    {...cardProps}
                    className={`hd-card w-100 text-decoration-none ${isInactive ? "inactive-product" : ""}`}
                  >
                    <div className="hd-card-head">
                      {c.offer > 0 && (
                        <span className="hd-badge">-{c.offer}%</span>
                      )}

                      {isInactive && (
                        <span className="hd-badge coming-soon">
                          Coming Soon
                        </span>
                      )}

                      <div className="hd-thumb">
                        {c.image ? (
                          <img
                            loading="lazy"
                            alt={c.title}
                            title={c.title}
                            src={c.image}
                            className={`hd-image ${isInactive ? "grayscale" : ""}`}
                          />
                        ) : (
                          <div className="nc-image-fallback">Combo</div>
                        )}
                      </div>
                    </div>

                    <div className="hd-card-body">
                      <h3 className="hd-name" title={c.title}>
                        {c.title}
                      </h3>

                      <div className="hd-price-row flex-end mt-auto">
                        {isInactive ? (
                          <span className="hd-price coming-soon-text">
                            Stay Tuned
                          </span>
                        ) : c.price ? (
                          <span className="hd-price">₹{c.price}</span>
                        ) : (
                          <span className="hd-price">View options</span>
                        )}
                      </div>
                    </div>
                  </CardComponent>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default NewCombo;
