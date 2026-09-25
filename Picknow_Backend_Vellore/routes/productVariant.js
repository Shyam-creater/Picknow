import express from 'express';
import {
  createProductVariants,
  getProductVariants,
  getVariantById,
  updateProductVariant,
  deleteProductVariant
} from '../controllers/ProductVariant.js';
import { isVendorAuth, isVerifiedVendor } from '../middelware/isVendorAuth.js';
import { isAdminAuth, isAdmin } from '../middelware/isAdminAuth.js';

const router = express.Router();

// Admin routes (protected)
router.post('/create', isAdminAuth, isAdmin, createProductVariants);
router.put('/update/:variantId', isAdminAuth, isAdmin, updateProductVariant);
router.delete('/delete/:variantId', isAdminAuth, isAdmin, deleteProductVariant);

// Vendor routes (protected)
router.post('/vendor/create', isVendorAuth, isVerifiedVendor, createProductVariants);
router.put('/vendor/update/:variantId', isVendorAuth, isVerifiedVendor, updateProductVariant);
router.delete('/vendor/delete/:variantId', isVendorAuth, isVerifiedVendor, deleteProductVariant);

// Public routes (accessible to all users)
router.get('/product/:productId', getProductVariants);
router.get('/:variantId', getVariantById);

export default router;