// import React from 'react';
// import { Heart } from 'lucide-react';
// import './BestSellingProduct.css';

// const BestSelling = ({ products, setSelectedProductId, setCurrentPage }) => {
//   const ProductCard = ({ product }) => (
//     <div className="product-card-parent">
//       <div className="product-card">
//         <div className="product-content-box">
//           <div className="product-image-container">
//             <img src={product.image} alt={product.name} className="product-image" />
//             <button className="favorite-button">
//               <Heart className="icon" />
//             </button>
//           </div>
//           <h3 className="product-name">{product.name}</h3>
//           <p className="product-weight">{product.weight}</p>
//           <div className="price-container">
//             <span className="current-price">₹{product.price}</span>
//             {product.originalPrice && (
//               <span className="original-price">₹{product.originalPrice}</span>
//             )}
//           </div>
//           <button 
//             onClick={() => {
//               setSelectedProductId(product.id);
//               setCurrentPage('detail');
//             }}
//             className="view-product-button"
//           >
//             View Product
//           </button>
//         </div>
//         <div className="product-date-box">
//           <span className="month">BEST</span>
//           <span className="date">★</span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="best-selling">
//       <h2 className="section-title">Best Selling Products</h2>
//       <div className="products-grid">
//         {products.map(product => (
//           <ProductCard key={product.id} product={product} />
//         ))}
//       </div>
//     </div>
//   );
// };

// export default BestSelling;