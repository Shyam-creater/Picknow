import React, { useEffect, useMemo, useState } from "react";
import { FaFilter, FaTimes, FaHeart, FaRegHeart } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../../APi/axiosInstance";
import { transformImageUrl } from "../../APi/utils";
import { productApi } from "../../APi/productApi";
import { cartApi } from "../../APi/cartApi";
import { useSnackbar } from "notistack";
import { addToWishlist } from "../../APi/userApi";
import ProductCard from "../ProductPage/ProductCard";
import "./search-results.css";

const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

const SearchResults = () => {
  const queryParams = useQuery();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState({
    products: [],
    combos: [],
    categories: [],
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    limit: 12,
  });
  const [priceMap, setPriceMap] = useState({}); // cache: productId -> { price, previousPrice, offer }
  const [variantsMap, setVariantsMap] = useState({}); // productId -> [variants]
  const [selectedVariant, setSelectedVariant] = useState({}); // productId -> variantId
  const [addingMap, setAddingMap] = useState({}); // productId -> boolean
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState({}); // productId -> boolean

  const query = queryParams.get("query") || "";
  const type = (queryParams.get("type") || "all").toLowerCase();
  const pType = queryParams.get("pType") || "";
  const category = queryParams.get("category") || "";
  const page = Number(queryParams.get("page") || 1);
  const limit = Number(queryParams.get("limit") || 12);
  const sort = queryParams.get("sort") || "relevance";
  // Accept both `brands` (comma-separated) and legacy `brand` (single) query params
  const brandsParamRaw = queryParams.get("brands") || queryParams.get("brand") || "";
  const brandsParam = Array.isArray(brandsParamRaw)
    ? brandsParamRaw.join(",")
    : String(brandsParamRaw);
  const selectedBrands = useMemo(
    () =>
      brandsParam
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
    [brandsParam]
  );

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError("");
      // When requesting products (or all), ask backend for a larger page size to retrieve all
      const effectiveLimit =
        type === "products" || type === "all" ? 500 : limit;
      const { data } = await axiosInstance.get("/search", {
        params: {
          query,
          type,
          pType,
          category,
          page,
          limit: effectiveLimit,
          sort,
        },
      });
      setResults(data.results || { products: [], combos: [], categories: [] });
      setPagination(
        data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalResults: 0,
          limit,
        }
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, type, pType, category, page, limit, sort]);

  // Fetch authoritative prices (and previous/offer) from product API for the listed products
  useEffect(() => {
    const loadPrices = async () => {
      if (!results?.products || results.products.length === 0) return;
      try {
        const ids = results.products.map((p) => p?._id).filter(Boolean);
        const newMap = { ...priceMap };
        const pendingIds = ids.filter(
          (id) => typeof newMap[id] === "undefined"
        );
        if (pendingIds.length === 0) return;

        const requests = pendingIds.map(async (id) => {
          try {
            const variantsRes = await productApi.getProductVariants(id);
            let price;
            let previousPrice;
            let offer;
            const variants = variantsRes?.data || variantsRes?.variants || (Array.isArray(variantsRes) ? variantsRes : []);
            const activeVariants = variants.filter(
              (v) => v && (v.status === "active" || v.status === "Active")
            );
            // store variants for selector
            if (activeVariants.length > 0) {
              newVariantsMap[id] = activeVariants;
            } else if (variants.length > 0) {
              newVariantsMap[id] = variants; // fallback to all
            }
            if (variants.length > 0) {
              const active = activeVariants;
              if (active.length > 0) {
                const activeWithPrice = active
                  .map((v) => ({
                    price: Number(v?.price) || Number.POSITIVE_INFINITY,
                    previousPrice: Number(v?.previousPrice) || undefined,
                    offer: Number(v?.offer) || undefined,
                  }))
                  .filter((v) => Number.isFinite(v.price));
                if (activeWithPrice.length > 0) {
                  activeWithPrice.sort((a, b) => a.price - b.price);
                  price = activeWithPrice[0].price;
                  previousPrice = activeWithPrice[0].previousPrice;
                  offer = activeWithPrice[0].offer;
                }
              }
            }
            if (typeof price === "undefined" || price === Infinity) {
              const productRes = await productApi.getProductById(id);
              price = Number(productRes?.product?.pPrice) || 0;
              previousPrice =
                Number(productRes?.product?.pPreviousPrice) || undefined;
              offer = Number(productRes?.product?.pOffer) || undefined;
            } else {
              // If gathered from variants but missing prev/offer, try product fallback for those fields
              try {
                if (
                  typeof previousPrice === "undefined" ||
                  typeof offer === "undefined"
                ) {
                  const productRes = await productApi.getProductById(id);
                  if (typeof previousPrice === "undefined")
                    previousPrice =
                      Number(productRes?.product?.pPreviousPrice) || undefined;
                  if (typeof offer === "undefined")
                    offer = Number(productRes?.product?.pOffer) || undefined;
                }
              } catch (_) {}
            }
            newMap[id] = { price, previousPrice, offer };
          } catch (_) {
            // leave undefined to fallback to search response price
          }
        });

        await Promise.allSettled(requests);
        setPriceMap(newMap);
        setVariantsMap((prev) => ({ ...prev, ...newVariantsMap }));
      } catch (_) {
        // ignore; fallback will apply
      }
    };

    // prepare variants holder
    const newVariantsMap = {};
    loadPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results?.products]);

  // Derive available brands from current results for filter UI
  useEffect(() => {
    try {
      const items = (results?.products || [])
        .map((p) => p?.pBrand)
        .filter(Boolean);
      const unique = Array.from(new Set(items)).sort((a, b) =>
        String(a).localeCompare(String(b))
      );
      setAvailableBrands(unique);
    } catch (_) {
      setAvailableBrands([]);
    }
  }, [results?.products]);

  const updateBrandsParam = (brand, isChecked) => {
    const set = new Set(selectedBrands);
    if (isChecked) set.add(brand);
    else set.delete(brand);
    const next = Array.from(set);
    updateParam("brands", next.length ? next.join(",") : "");
  };

  const getEffectivePrice = (p) => {
    const has = priceMap?.[p?._id];
    if (has && typeof has.price !== "undefined") return Number(has.price) || 0;
    return Number(p?.pPrice) || 0;
  };

  const sortItems = (arr) => {
    if (!Array.isArray(arr)) return [];
    if (sort === "price-asc")
      return [...arr].sort(
        (a, b) => getEffectivePrice(a) - getEffectivePrice(b)
      );
    if (sort === "price-desc")
      return [...arr].sort(
        (a, b) => getEffectivePrice(b) - getEffectivePrice(a)
      );
    return arr; // relevance: keep order from backend
  };

  const filterByBrands = (arr) => {
    if (!Array.isArray(arr) || selectedBrands.length === 0) return arr;
    return arr.filter((p) => p && selectedBrands.includes(String(p.pBrand)));
  };

  // Resolve the currently chosen variant (explicitly selected or the first option)
  const getChosenVariant = (product) => {
    const variants = variantsMap?.[product?._id] || [];
    if (!Array.isArray(variants) || variants.length === 0) return null;
    const chosenId = selectedVariant?.[product?._id] || variants[0]?._id;
    return variants.find((v) => v && v._id === chosenId) || null;
  };

  // Helper function to get variant display value from attributes or fallback to properties
  const getVariantDisplayValue = (variant) => {
    if (!variant) return "Variant";
    
    // Try attributes first (new schema)
    if (variant.attributes) {
      if (variant.attributes.size) return variant.attributes.size;
      if (variant.attributes.color) return variant.attributes.color;
      if (variant.attributes.weight) return variant.attributes.weight;
    }
    
    // Fallback to direct properties (old schema)
    if (variant.size) return variant.size;
    if (variant.value) return variant.value;
    if (variant.variantValue) return variant.variantValue;
    
    return "Variant";
  };

  // Sort helpers for variant dropdowns (ascending). Handles numeric weights/sizes like "250g", "1 kg", "0.5kg", "500 ml".
  const getVariantSortType = (variant) => {
    if (!variant) return "other";
    const attrs = variant.attributes || {};
    if (attrs.weight) return "weight";
    if (attrs.size) return "size";
    if (attrs.color) return "color";
    // old schema fallback
    if (variant.type) return String(variant.type).toLowerCase();
    return "other";
  };

  const normalizeNumberWithUnit = (raw) => {
    const s = String(raw ?? "").trim().toLowerCase();
    if (!s) return null;
    const m = s.match(/(\d+(?:\.\d+)?)\s*([a-z]+)?/i);
    if (!m) return null;
    const num = Number(m[1]);
    if (!Number.isFinite(num)) return null;
    const unit = (m[2] || "").toLowerCase();
    return { num, unit, raw: s };
  };

  const toComparableBaseUnit = (parsed, type) => {
    if (!parsed) return null;
    const { num, unit } = parsed;
    // weights
    if (type === "weight") {
      if (unit === "kg") return num * 1000;
      if (unit === "g" || unit === "gm" || unit === "gms") return num;
      // sometimes weight is provided without unit but still numeric; treat as grams
      if (!unit) return num;
      return null;
    }
    // sizes (often ml/l or numeric packs)
    if (type === "size") {
      if (unit === "l" || unit === "lt" || unit === "ltr" || unit === "litre" || unit === "liter")
        return num * 1000;
      if (unit === "ml") return num;
      // plain numeric sizes like "1", "2", "10"
      if (!unit) return num;
      return null;
    }
    return null;
  };

  const compareVariantDisplayAsc = (a, b) => {
    const typeA = getVariantSortType(a);
    const typeB = getVariantSortType(b);
    // if both are same known type, try numeric sort
    if (typeA === typeB && (typeA === "weight" || typeA === "size")) {
      const aDisp = getVariantDisplayValue(a);
      const bDisp = getVariantDisplayValue(b);
      const aParsed = normalizeNumberWithUnit(aDisp);
      const bParsed = normalizeNumberWithUnit(bDisp);
      const aVal = toComparableBaseUnit(aParsed, typeA);
      const bVal = toComparableBaseUnit(bParsed, typeB);
      if (typeof aVal === "number" && typeof bVal === "number" && Number.isFinite(aVal) && Number.isFinite(bVal)) {
        if (aVal !== bVal) return aVal - bVal;
      }
      return String(aDisp).localeCompare(String(bDisp));
    }
    // colors (and mixed types) sort lexicographically
    const aDisp = getVariantDisplayValue(a);
    const bDisp = getVariantDisplayValue(b);
    return String(aDisp).localeCompare(String(bDisp));
  };

  const getSortedVariantsForProduct = (productId) => {
    const list = variantsMap?.[productId];
    if (!Array.isArray(list)) return [];
    return [...list].sort(compareVariantDisplayAsc);
  };

  // Compute current/previous/offer considering the chosen variant when present
  const getDisplayedPrices = (product) => {
    const chosen = getChosenVariant(product);
    if (chosen) {
      const current = Number(chosen.price);
      const previous =
        typeof chosen.previousPrice !== "undefined"
          ? Number(chosen.previousPrice)
          : undefined;
      const offer =
        typeof chosen.offer !== "undefined"
          ? Number(chosen.offer)
          : undefined;
      return { current, previous, offer };
    }
    const has = priceMap?.[product?._id];
    const current =
      typeof has?.price !== "undefined" ? Number(has.price) : Number(product?.pPrice) || 0;
    const previous =
      typeof has?.previousPrice !== "undefined"
        ? Number(has.previousPrice)
        : typeof product?.pPreviousPrice !== "undefined"
        ? Number(product.pPreviousPrice)
        : undefined;
    const offer =
      typeof has?.offer !== "undefined"
        ? Number(has.offer)
        : typeof product?.pOffer !== "undefined"
        ? Number(product.pOffer)
        : undefined;
    return { current, previous, offer };
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
    document.body.style.overflow = !isFilterOpen ? "hidden" : "auto";
  };

  const closeFilter = () => {
    setIsFilterOpen(false);
    document.body.style.overflow = "auto";
  };

  const updateParam = (key, value) => {
    const params = new URLSearchParams(window.location.search);
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === "all"
    ) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    navigate(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    navigate(`/search?${params.toString()}`);
  };

  const handleWishlistAction = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setWishlistLoading(prev => ({ ...prev, [productId]: true }));
      const response = await addToWishlist(productId);
      if (response.success) {
        enqueueSnackbar("Added to Wishlist", { variant: "success" });
        // Notify navbar to update counts
        window.dispatchEvent(new Event("wishlistUpdated"));
      }
    } catch (err) {
      if (err?.message?.includes("Unauthorized") || err?.message?.includes("login") || err?.message?.includes("Session expired")) {
        enqueueSnackbar("Please login to manage wishlist", { variant: "warning" });
        window.dispatchEvent(new Event("openLogin"));
      } else {
        enqueueSnackbar(err?.message || "Failed to add to wishlist", { variant: "error" });
      }
    } finally {
      setWishlistLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const isCombos = type === "combos";
  const displayedProducts = sortItems(filterByBrands(results?.products || []));
  const displayedCombos = sortItems(results?.combos || []);

  const getNormalizedCategories = () => {
    if (!Array.isArray(results?.categories)) return [];
    try {
      const mapped = results.categories
        .map((c) => {
          if (c == null) return null;
          if (typeof c === "string") return { key: c, value: c, label: c };
          if (typeof c === "number")
            return { key: String(c), value: String(c), label: String(c) };
          const key =
            c._id || c.id || c.slug || c.name || c.title || JSON.stringify(c);
          const label =
            c.name || c.cName || c.title || c.slug || c.label || String(key);
          const value =
            c.slug || c.name || c.cName || c.id || c._id || String(label);
          return {
            key: String(key),
            value: String(value),
            label: String(label),
          };
        })
        .filter(Boolean);
      // de-duplicate by value
      const seen = new Set();
      const unique = [];
      for (const item of mapped) {
        if (!seen.has(item.value)) {
          seen.add(item.value);
          unique.push(item);
        }
      }
      return unique;
    } catch (_) {
      return [];
    }
  };

  return (
    <div className="product-layout">
      {/* Filter Overlay */}
      <div
        className={`overlay ${isFilterOpen ? "open" : ""}`}
        onClick={closeFilter}
      />

      {/* Sidebar - lightweight filters for search */}
      <div className={`filter-sidebar ${isFilterOpen ? "open" : ""}`}>
        <div className="sidebar">
          <h4><FaFilter size={16} /> Filters</h4>

          {/* Category Filter */}
          {Array.isArray(results?.categories) &&
            results.categories.length > 0 && (
              <div className="sidebar-section">
                <span className="filter-title">Category</span>
                <select
                  value={category || ""}
                  onChange={(e) => updateParam("category", e.target.value)}
                  className="category-dropdown"
                >
                  <option value="">All Categories</option>
                  {getNormalizedCategories().map((c) => (
                    <option key={c.key} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

          {/* Brands Filter */}
          {availableBrands.length > 0 && (
            <div className="sidebar-section">
              <span className="filter-title">Brands</span>
              <div className="brand-list-modern">
                {availableBrands.map((b) => (
                  <label key={b} className="brand-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(b)}
                      onChange={(e) => updateBrandsParam(b, e.target.checked)}
                    />
                    <span>{b}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Sort Filter */}
          <div className="sidebar-section">
            <span className="filter-title">Sort by</span>
            <select
              value={sort}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="sort-select"
            >
              <option value="relevance">Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

          <button onClick={clearFilters} className="reset-filters-btn">
             Reset All
          </button>
        </div>
      </div>

      <div className="products-container">
        <div className="products-header">
          <button className="mobile-toggle" onClick={toggleFilter}>
            {isFilterOpen ? (
              <>
                <FaTimes className="filter-icon" />
                <span>Close</span>
              </>
            ) : (
              <>
                <FaFilter className="filter-icon" />
                <span>Filter</span>
              </>
            )}
          </button>
          <span className="products-count">
            {loading
              ? "Loading..."
              : `Found ${pagination.totalResults} items ${
                  query ? `for "${query}"` : ""
                }`}
          </span>
        </div>

        <div className={`products-grid ${loading ? "loading" : ""}`}>
          {loading ? (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Loading results...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <h3>Error</h3>
              <p>{error}</p>
            </div>
          ) : isCombos ? (
            displayedCombos?.length ? (
              displayedCombos.map((c) => (
                <a
                  key={c._id}
                  href={`/combo/${c._id}`}
                  className="product-card"
                >
                  <div className="product-image-container">
                    <img
                      src={transformImageUrl(c.ccImage)}
                      alt={c.ccName}
                      className="product-image"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/placeholder.jpg";
                      }}
                    />
                  </div>
                  <div className="product-info">
                    <div className="price-rating-row">
                      <div className="price-section">
                        <span className="current-price">
                          ₹{(c.ccPrice || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <h3 className="product-name">{c.ccName}</h3>
                  </div>
                </a>
              ))
            ) : (
              <div className="empty-state">
                <h3>No combos found</h3>
                <p>Try adjusting your search keywords</p>
              </div>
            )
          ) : displayedProducts?.length ? (
            displayedProducts.map((p) => (
              <ProductCard 
                key={p._id} 
                product={{
                  ...p,
                  variants: variantsMap[p._id] || p.variants,
                  price: priceMap[p._id]?.price || p.pPrice,
                  previousPrice: priceMap[p._id]?.previousPrice || p.pPreviousPrice,
                  offer: priceMap[p._id]?.offer || p.pOffer
                }}
                onAddToCartSuccess={() => {
                  // Optional: Refresh any global state if needed, 
                  // but ProductCard already handles its own 'isAdded' state
                }}
              />
            ))
          ) : (
            <div className="empty-state">
              <h3>No products found</h3>
              <p>Try adjusting your filters or search criteria</p>
            </div>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div
            className="pagination-controls"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              padding: "16px 0",
            }}
          >
            <button
              onClick={() => updateParam("page", String(Math.max(1, page - 1)))}
              disabled={page <= 1}
              className={`pagination-button prev-page ${
                page <= 1 ? "disabled" : ""
              }`}
              aria-label="Previous page"
              title="Previous page"
            >
              ⟨
            </button>
            <span className="pagination-number active">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                updateParam(
                  "page",
                  String(Math.min(pagination.totalPages, page + 1))
                )
              }
              disabled={page >= pagination.totalPages}
              className={`pagination-button next-page ${
                page >= pagination.totalPages ? "disabled" : ""
              }`}
              aria-label="Next page"
              title="Next page"
            >
              ⟩
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
