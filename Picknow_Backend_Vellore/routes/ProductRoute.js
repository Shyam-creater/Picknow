import express from "express";
import { isAdminAuth, isAdmin } from "../middelware/isAdminAuth.js";
import { uploadFiles } from "../middelware/multer.js";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  fiterProducts,
  getProductById,
  updateProduct,
  getSubcategoryWithMoreThan10Products,
  getAllProductByOffer,
  getNestedSubCategoryWithMoreThan10Products,
  getRelatedProducts,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  getProductsByBrand,
  getProductsByVendorId,
  deleteProductImage,
  getLatestProduct,
  getbrandProduct,
  getProductByType,
  getProductsGroupedByName
} from "../controllers/Products.js";
import { getProductsByCategory } from "../controllers/categoryControll.js";
import { isAuth } from "../middelware/isAuth.js";
import { addRatingAndReview, getProductReviews, deleteReview, getAuthReviews } from "../controllers/Products.js";
import { isVendorAuth, isVerifiedVendor } from "../middelware/isVendorAuth.js";
import Product from "../models/Product.js";
import { categoryModel as Category } from "../models/Category.js";

const router = express.Router();

// Admin routes (protected)
router.post("/admin/product/new", isAdminAuth, isAdmin, uploadFiles, createProduct);
router.get("/admin/product/all", isAdminAuth, isAdmin, getAllProducts);
router.get("/admin/product/", isAdminAuth, isAdmin, getProductById);
router.put("/admin/product/:id", isAdminAuth, isAdmin, uploadFiles, updateProduct);
router.delete("/admin/product/:id", isAdminAuth, isAdmin, deleteProduct);
router.delete("/admin/product/image/:productId", isAdminAuth, isAdmin, deleteProductImage);

// Vendor routes (protected)
router.post("/vendor/product/new", isVendorAuth, isVerifiedVendor, uploadFiles, createProduct);
router.put("/vendor/product/:id", isVendorAuth, isVerifiedVendor, uploadFiles, updateProduct);
router.delete("/vendor/product/:id", isVendorAuth, isVerifiedVendor, deleteProduct);
router.get("/vendor/product/all", isVendorAuth, isVerifiedVendor, getAllProducts);
router.get("/vendor/product/vendorId", isVendorAuth, isVerifiedVendor, getProductsByVendorId);

// Public routes (no authentication required)
router.get("/", getAllProducts);           // Get all products
router.get("/products", getAllProducts);   // Alias: also serve products at /products
router.post("/filterproducts", fiterProducts);           // Get all products
router.get("/product/:id", getProductById);       // Get single product by ID
router.get("/producttype/combo", getProductByType);       // Get single product by ID
router.get("/product/category/:category", getProductsByCategory); // Get products by category
router.post('/product/:productId/reviews', isAuth, uploadFiles, addRatingAndReview);
router.get('/product/:productId/reviews', getProductReviews);
router.get('/product/:productId/canreview', isAuth, getAuthReviews);
router.delete('/product/:productId/reviews/:reviewId', isAuth, deleteReview);
router.get("/products/subcategories/with-more-than-10", getSubcategoryWithMoreThan10Products);
router.get("/products/offer", getAllProductByOffer);
router.get("/products/nested-subcategories/with-more-than-10", getNestedSubCategoryWithMoreThan10Products);
router.get("/products/:productId/related", getRelatedProducts);
router.get("/products/latest", getLatestProduct);
router.post("/products/brand", getbrandProduct);
router.get("/products/group", getProductsGroupedByName);

//brand routes  
router.get("/product/brand/:brand", getProductsByBrand);

// Add route for subcategory products
router.get("/products/subcategory/:subCategoryId", async (req, res) => {
  try {
    const { subCategoryId } = req.params;

    // First get the subcategory name
    const category = await Category.findOne({
      'subCategories._id': subCategoryId
    });

    if (!category) {
      return res.json({ success: true, products: [], message: 'Category not found' });
    }

    // Find the subcategory name
    let subCategoryName = '';
    category.subCategories.forEach(sub => {
      if (sub._id.toString() === subCategoryId) {
        subCategoryName = sub.name;
      }
    });

    if (!subCategoryName) {
      return res.json({ success: true, products: [], message: 'Subcategory not found' });
    }

    // Find products using the name
    const products = await Product.find({
      pSubCategory: subCategoryName,
      pStatus: { $regex: new RegExp("^(active|Out of Stock)$", "i") }
    });

    // Transform product images
    const transformedProducts = products.map(product => ({
      ...product.toObject(),
      pImage: product.pImage.map(img => `${img}`)
    }));

    res.json({
      success: true,
      products: transformedProducts,
      debug: {
        subCategoryId: subCategoryId,
        subCategoryName: subCategoryName,
        matchingProducts: products.length
      }
    });
  } catch (error) {
    console.error('Backend Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.stack
    });
  }
});

// Add this new route for nested subcategory products
router.get("/products/nested-subcategory/:nestedSubCategory", async (req, res) => {
  try {
    const { nestedSubCategory } = req.params;

    // First get the nested subcategory name and parent subcategory name
    const category = await Category.findOne({
      'subCategories.subCategories._id': nestedSubCategory
    });

    if (!category) {
      return res.json({ success: true, products: [], message: 'Category not found' });
    }

    // Find the nested subcategory name and parent subcategory name
    let nestedSubCategoryName = '';
    let parentSubCategoryName = '';
    category.subCategories.forEach(sub => {
      sub.subCategories.forEach(nested => {
        if (nested._id.toString() === nestedSubCategory) {
          nestedSubCategoryName = nested.name;
          parentSubCategoryName = sub.name;
        }
      });
    });

    // Find products that either:
    // 1. Have the nested subcategory name, OR
    // 2. Don't have a nested subcategory name (empty/null) but belong to the parent subcategory
    const products = await Product.find({
      pStatus: { $regex: new RegExp("^(active|Out of Stock)$", "i") },
      $or: [
        { pNestedSubCategory: nestedSubCategoryName },
        {
          $and: [
            { pSubCategory: parentSubCategoryName },
            {
              $or: [
                { pNestedSubCategory: { $exists: false } },
                { pNestedSubCategory: null },
                { pNestedSubCategory: '' },
                { pNestedSubCategory: { $regex: /^\s*$/, $options: 'i' } }
              ]
            }
          ]
        }
      ]
    });

    // console.log('Query results:', {
    //   searchedName: nestedSubCategoryName,
    //   matchingProducts: products.length,
    //   matchingProductDetails: products.map(p => ({
    //     id: p._id,
    //     name: p.pName,
    //     nestedSubCategory: p.pNestedSubCategory
    //   }))
    // });

    // Transform product images
    const transformedProducts = products.map(product => ({
      ...product.toObject(),
      pImage: product.pImage.map(img => `${img}`)
    }));

    res.json({
      success: true,
      products: transformedProducts,
      debug: {
        nestedSubCategoryId: nestedSubCategory,
        nestedSubCategoryName: nestedSubCategoryName,
        matchingProducts: products.length
      }
    });
  } catch (error) {
    console.error('Backend Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.stack
    });
  }
});

router.get("/products/nested-subbrand/:nestedSubCategory/:brand", async (req, res) => {
  try {
    const { nestedSubCategory, brand } = req.params;

    // First get the nested subcategory name and parent subcategory name
    const category = await Category.findOne({
      'subCategories.subCategories._id': nestedSubCategory,

    });

    if (!category) {
      return res.json({ success: true, products: [], message: 'Category not found' });
    }

    // Find the nested subcategory name and parent subcategory name
    let nestedSubCategoryName = '';
    let parentSubCategoryName = '';
    category.subCategories.forEach(sub => {
      sub.subCategories.forEach(nested => {
        if (nested._id.toString() === nestedSubCategory) {
          nestedSubCategoryName = nested.name;
          parentSubCategoryName = sub.name;
        }
      });
    });

    // Find products that either:
    // 1. Have the nested subcategory name, OR
    // 2. Don't have a nested subcategory name (empty/null) but belong to the parent subcategory
    // And match the brand
    const products = await Product.find({
      pBrand: { $regex: brand, $options: 'i' },
      pStatus: { $regex: new RegExp("^(active|Out of Stock)$", "i") },
      $or: [
        { pNestedSubCategory: nestedSubCategoryName },
        {
          $and: [
            { pSubCategory: parentSubCategoryName },
            {
              $or: [
                { pNestedSubCategory: { $exists: false } },
                { pNestedSubCategory: null },
                { pNestedSubCategory: '' },
                { pNestedSubCategory: { $regex: /^\s*$/, $options: 'i' } }
              ]
            }
          ]
        }
      ]
    });


    // Transform product images
    const transformedProducts = products.map(product => ({
      ...product.toObject(),
      pImage: product.pImage.map(img => `${img}`)
    }));

    res.json({
      success: true,
      products: transformedProducts,
      debug: {
        nestedSubCategoryId: nestedSubCategory,
        nestedSubCategoryName: nestedSubCategoryName,
        matchingProducts: products.length
      }
    });
  } catch (error) {
    console.error('Backend Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.stack
    });
  }
});
export default router;