import express from 'express';
import { createBrand, getAllBrands, getBrandById, updateBrand, deleteBrand } from '../controllers/BrandCC.js';
import { isAdminAuth, isAdmin } from "../middelware/isAdminAuth.js";
import {upload} from '../middleware/brandMulter.js';

const router = express.Router();

// Admin-only routes
router.post('/create', isAdminAuth,upload.single("logo"), createBrand);
router.put('/update/:id', isAdminAuth, upload.single("logo"), updateBrand);
router.delete('/delete/:id', isAdminAuth,isAdmin, deleteBrand);

// Public routes (can be accessed by anyone)
router.get('/all', getAllBrands);
router.get('/:id', getBrandById);

export default router;