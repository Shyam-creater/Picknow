import express from "express";
import { 
    loginVendor, 
    getVendorProfile, 
    updateVendorProfile,
    getAllVendors,
    getVendorById,
    updateVendorStatus,
    deleteVendor,
    getVendorDashboard
} from "../controllers/vendorController.js";

import {
    initiateRegistration,
    verifyEmailOTP,
    addBusinessInfo,
    uploadDocumentsAndBankDetails,
    resendOTP,
    checkRegistrationProgress
} from "../controllers/vendorRegistrationController.js";

import { isVendorAuth, isVerifiedVendor } from "../middelware/isVendorAuth.js";
import { isAdminAuth, isAdmin } from "../middelware/isAdminAuth.js";
import { 
    uploadVendorDocs, 
    uploadVendorProfile, 
    handleUploadError, 
    cleanupOnError, 
    validateRequiredDocs 
} from "../middelware/vendorMulter.js";

const router = express.Router();

// Vendor Registration Routes
router.post('/register/step1', initiateRegistration);
router.post('/register/verify-otp', verifyEmailOTP);
router.post('/register/resend-otp', resendOTP);
router.post('/register/step3', addBusinessInfo);
router.post('/register/complete', uploadVendorDocs, handleUploadError, validateRequiredDocs, cleanupOnError, uploadDocumentsAndBankDetails);
router.get('/register/progress', checkRegistrationProgress);

// Existing routes
router.post("/login", loginVendor);

// Vendor Dashboard
router.get(
    "/dashboard",
    isVendorAuth,
    isVerifiedVendor,
    getVendorDashboard
);

router.get(
    "/profile", 
    isVendorAuth, 
    isVerifiedVendor, 
    getVendorProfile
);

router.patch(
    "/profile",
    isVendorAuth,
    isVerifiedVendor,
    uploadVendorProfile,
    handleUploadError,
    cleanupOnError,
    updateVendorProfile
);

// Admin routes for vendor management
router.get(
    "/", 
    isAdminAuth, 
    isAdmin, 
    getAllVendors
);

router.get(
    "/:id", 
    isAdminAuth, 
    isAdmin, 
    getVendorById
);

router.patch(
    "/:id/status", 
    isAdminAuth, 
    isAdmin, 
    updateVendorStatus
);

router.delete(
    "/:id", 
    isAdminAuth, 
    isAdmin, 
    deleteVendor
);



// // Vendor routes for product management
// router.post("/vendor/product/add", isVendorAuth, isVerifiedVendor, uploadVendorDocs, handleUploadError, cleanupOnError, addProductByVendor);

// router.patch("/vendor/product/:productId", isVendorAuth, isVerifiedVendor, uploadVendorDocs, handleUploadError, cleanupOnError, updateProductByVendor);

// router.delete("/vendor/product/:productId", isVendorAuth, isVerifiedVendor, deleteProductByVendor);

// router.get("/vendor/products", isVendorAuth, isVerifiedVendor, getProductsByVendor);

export default router; 