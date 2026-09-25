/**
 * SEO Utility Functions for Picknow
 */

const BASE_URL = "https://www.picknow.in";

/**
 * Generate canonical URL for products
 * @param {string} productId - Product ID
 * @returns {string} Canonical URL for the product
 */
export const getProductCanonicalUrl = (productId) => {
  return `${BASE_URL}/product/${productId}`;
};

/**
 * Generate canonical URL for product listing pages
 * @param {Object} params - Query parameters
 * @returns {string} Canonical URL for the listing page
 */
export const getProductsCanonicalUrl = (params = {}) => {
  const { q, category, subcategory, brand, page } = params;
  const queryParams = new URLSearchParams();
  
  if (q) queryParams.append('q', q);
  if (category) queryParams.append('category', category);
  if (subcategory) queryParams.append('subcategory', subcategory);
  if (brand) queryParams.append('brand', brand);
  if (page && page > 1) queryParams.append('page', page);
  
  const queryString = queryParams.toString();
  return queryString 
    ? `${BASE_URL}/products?${queryString}` 
    : `${BASE_URL}/products`;
};

/**
 * Generate canonical URL for category pages
 * @param {string} category - Category name
 * @returns {string} Canonical URL for the category
 */
export const getCategoryCanonicalUrl = (category) => {
  return `${BASE_URL}/products?category=${encodeURIComponent(category)}`;
};

/**
 * Generate canonical URL for brand pages
 * @param {string} brand - Brand name
 * @returns {string} Canonical URL for the brand
 */
export const getBrandCanonicalUrl = (brand) => {
  return `${BASE_URL}/products?brand=${encodeURIComponent(brand)}`;
};

/**
 * Generate canonical URL for search results
 * @param {string} query - Search query
 * @returns {string} Canonical URL for search results
 */
export const getSearchCanonicalUrl = (query) => {
  return `${BASE_URL}/products?q=${encodeURIComponent(query)}`;
};

/**
 * Generate canonical URL for combo/product detail pages
 * @param {string} productId - Product ID
 * @returns {string} Canonical URL for the combo
 */
export const getComboCanonicalUrl = (productId) => {
  return `${BASE_URL}/product/${productId}`;
};

/**
 * Validate and sanitize URL to prevent injection attacks
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is valid
 */
export const isValidUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'www.picknow.in' || urlObj.hostname === 'picknow.in';
  } catch (error) {
    return false;
  }
};

/**
 * Generate structured data for product (JSON-LD)
 * @param {Object} product - Product object
 * @returns {Object} Structured data object
 */
export const generateProductStructuredData = (product) => {
  if (!product) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.pName || "",
    "description": product.pShortDescription || product.pDescription || "",
    "image": product.pImage || [],
    "brand": {
      "@type": "Brand",
      "name": product.pBrand || ""
    },
    "category": product.pCategory || "",
    "offers": {
      "@type": "Offer",
      "url": getProductCanonicalUrl(product._id),
      "priceCurrency": "INR",
      "price": product.pPrice || product.variants?.[0]?.price || "",
      "availability": product.pStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "PickNow"
      }
    },
    "aggregateRating": product.pRatingsReviews?.length > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": calculateAverageRating(product.pRatingsReviews),
      "reviewCount": product.pRatingsReviews.length
    } : undefined
  };
};

/**
 * Calculate average rating from reviews
 * @param {Array} reviews - Array of review objects
 * @returns {number} Average rating
 */
const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  
  const total = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
  return (total / reviews.length).toFixed(1);
};

/**
 * Generate breadcrumb structured data
 * @param {Array} items - Breadcrumb items
 * @returns {Object} Breadcrumb structured data
 */
export const generateBreadcrumbStructuredData = (items) => {
  if (!items || items.length === 0) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
};

