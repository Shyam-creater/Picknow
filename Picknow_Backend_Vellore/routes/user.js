import express, { Router } from "express";
import {
  loginUser,
  myProfile,
  registerUser,
  verifyUser,
  updateUser,
  changePassword,
  resendOtp,
  forgotPassword,
  resetPassword,
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  getAllUsers,
  deleteUser,
  addMoneyWithCodePass,
  getAddMoneyWithCodePass,
  gettranscations,
  getAllUsersTransactions,
  getdeliveryinfo,
  updatedeliveryinfo,
  createDeliveryInfo,
  getUsers,
  checkmobile,
  checkBalance,
  deleteMyAccount,
  addToSaveForLater,
  removeFromSaveForLater,
  getSaveForLater,
  googleLogin
} from "../controllers/usercontroll.js";

import { isAuth } from "../middelware/isAuth.js";
import { isAdminAuth } from "../middelware/isAdminAuth.js";
import { isAdmin } from "../middelware/isAdminAuth.js";

const router = express.Router();

// Public routes (no authentication required)
router.post("/user/register", checkmobile, registerUser);
router.post("/user/verify", verifyUser);
router.post("/user/login", loginUser);
router.post("/user/resend-otp", resendOtp);
router.post("/user/forgot-password", forgotPassword);
router.post("/user/reset-password", resetPassword);
router.post("/user/google/login", googleLogin);

// Protected routes (require authentication)
router.get("/user/profile", isAuth, myProfile);
router.put("/user/update", isAuth, updateUser);
router.put("/user/change-password", isAuth, changePassword);
router.delete("/user/profile/delete", isAuth, deleteMyAccount);

// Address routes
router.post("/user/address", isAuth, addAddress);
router.get("/user/addresses", isAuth, getAddresses);
router.put("/user/address/:addressId", isAuth, updateAddress);
router.delete("/user/address/:addressId", isAuth, deleteAddress);
router.put("/user/address/:addressId/default", isAuth, setDefaultAddress);

router.get("/user/balance", isAuth, checkBalance);


// Wishlist routes (protected)
router.post("/user/wishlist/:productId", isAuth, addToWishlist);
router.delete("/user/wishlist/:productId", isAuth, removeFromWishlist);
router.get("/user/wishlist", isAuth, getWishlist);

// Save for Later routes (protected)
router.post("/user/saveforlater/:productId", isAuth, addToSaveForLater);
router.delete("/user/saveforlater/:productId", isAuth, removeFromSaveForLater);
router.get("/user/saveforlater", isAuth, getSaveForLater);

//wallet routes
router.post("/user/add-money-with-code-pass", isAuth, addMoneyWithCodePass);
router.get("/user/wallet/balance", isAuth, getAddMoneyWithCodePass);
router.get("/user/wallet/transactions", isAuth, gettranscations);
router.get("/user/transactions/all", isAdminAuth, isAdmin, getAllUsersTransactions);

// Delivery routes (public)
router.get("/delivery", getdeliveryinfo);
router.put("/delivery/:state", updatedeliveryinfo);
router.post("/delivery", createDeliveryInfo);

// Admin routes — MUST be last because /user/:userId is a catch-all parameter
router.get("/user/all", isAdminAuth, isAdmin, getAllUsers);
router.get("/user/:userId", isAdminAuth, isAdmin, getUsers);
router.put("/user/:userId", isAdminAuth, isAdmin, updateUser);
router.delete("/user/:userId", isAdminAuth, isAdmin, deleteUser);



export default router;

