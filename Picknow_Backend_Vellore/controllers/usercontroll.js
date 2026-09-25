import { User } from "../models/User.js";
import Product from "../models/Product.js";
import { Order } from "../models/order.js";
import { WalletTransaction } from "../models/wallet.js";
import { shipfeeModelSchema } from "../models/shipfee.js"
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sendMail from "../middelware/sendmail.js";
import { generateEmailTemplate } from "../utils/emailTemplates.js";
import axios from "axios";
import qs from 'qs';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


export const checkmobile = async (req, res, next) => {
  const { contact } = req.body;

  if (!contact) {
    return res.status(400).json({ message: "Contact number is required" });
  }

  // Exact match search for performance and accuracy
  let user = await User.findOne({ contact });
  if (user) {
    return res.status(400).json({ message: "Mobile number already in use" });
  } else {
    next();
  }
}
export const checkBalance = async (req, res) => {
  const user = await User.findById(req.user._id).select("walletBalance");
  if (user) {
    return res.status(200).json({ data: user });
  } else {
    return res.status(400).json({ message: "No such user found!" });
  }
}

// New User Registration
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, contact } = req.body;

    // Field validation
    if (!name || !email || !password || !contact) {
      return res.status(400).json({ message: "Please provide all required fields (name, email, password, contact)" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Email already in use" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000);
    user = new User({
      name,
      email,
      password: hashedPassword,
      contact,
      isVerified: false,
    });
    const a = await user.save();
    const activationToken = jwt.sign(
      { userId: user._id, otp },
      process.env.ACTIVATION_SECRET,
      { expiresIn: "1m" }
    );

    const emailData = {
      to: email,
      subject: "Welcome to PICKNOW - Email Verification",
      html: generateEmailTemplate({
        title: "Welcome to Picknow!",
        greetingName: name || email,
        mainContent: "Thank you for registering. Please verify your account using the code below.",
        otpBox: {
          title: "Verification Code",
          code: otp,
          footer: "This code expires in 1 minute",
          instructions: "Enter this code to verify your account."
        },
        portalName: "User Portal",
        portalSubtitle: "Account Verification"
      }),
    };
    sendMail(emailData);

    return res.status(200).json({
      message: "OTP sent to your email",
      activationToken,
    });
  } catch (error) {
    console.error("Error during user registration:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Verify OTP
export const verifyUser = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!req.headers.authorization) {
      return res
        .status(401)
        .json({ message: "Authorization token is missing" });
    }

    const activationToken = req.headers.authorization.split(" ")[1];

    if (!activationToken) {
      return res
        .status(401)
        .json({ message: "Invalid authorization token format" });
    }

    // Verify the activation token
    let decoded;
    try {
      decoded = jwt.verify(activationToken, process.env.ACTIVATION_SECRET);
    } catch (err) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Check OTP
    if (parseInt(decoded.otp, 10) !== parseInt(otp, 10)) {
      return res.status(400).json({ message: "Invalid OTP. Please try again" });
    }

    // Find and verify the user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isVerified = true;
    await user.save();

    return res.status(200).json({ message: "User verification successful" });
  } catch (error) {
    console.error("Error during OTP verification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for email:", email);

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found");
      return res.status(400).json({ message: "Wrong email or password" });
    }

    console.log("User verification status:", user.isVerified);

    // Check if user is verified
    if (!user.isVerified) {
      console.log("User not verified");
      return res
        .status(400)
        .json({ message: "Please verify your account first" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Invalid password");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("Login successful");

    // Generate token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15d",
    });

    // Exclude password from response
    const { password: _, ...userDetails } = user.toObject();

    return res.status(200).json({
      message: `Welcome ${user.name}`, 
      token,
      user: userDetails,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// User Profile
export const myProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Change Password
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Validate input
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both old and new passwords are required",
      });
    }

    // Get user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update User
// Update Logged-in User
export const updateUser = async (req, res) => {
  try {
    const { name, email, contact } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,   // ✅ use authenticated user
      { name, email, contact },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User details updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Error updating user details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete Logged-in User Account
export const deleteMyAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Optional: You could also delete related data like orders, reviews, etc. here if needed.
    // For now, we will just delete the user document.
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user account:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// Resend OTP
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`email----246-----,usercontroll------>`, email);

    // Validate email
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const activationToken = jwt.sign(
      { userId: user._id, otp },
      process.env.ACTIVATION_SECRET,
      { expiresIn: "5m" }
    );

    // Send email
    const emailData = {
      to: email,
      subject: "Account Verification - PICKNOW",
      html: generateEmailTemplate({
        title: "New Verification Code",
        greetingName: user.name || user.email,
        mainContent: "You have requested a new verification code. Please find it below.",
        otpBox: {
          title: "Verification Code",
          code: otp,
          footer: "This code expires in 5 minutes",
          instructions: "Enter this code to verify your account."
        },
        portalName: "User Portal",
        portalSubtitle: "Account Verification"
      }),
    };
    await sendMail(emailData);

    return res.status(200).json({
      message: "New OTP sent to your email",
      activationToken,
    });
  } catch (error) {
    console.error("Error during OTP resend:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 30 * 60000); // 30 minutes

    // Save reset token and expiry to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Send reset token email
    const emailData = {
      to: email,
      subject: "Password Reset Request - PICKNOW",
      html: generateEmailTemplate({
        title: "Password Reset Request",
        greetingName: user.name || user.email,
        mainContent: "We received a request to reset your password. Use the code below to proceed.",
        otpBox: {
          title: "Reset Code",
          code: resetToken,
          footer: "This code expires in 30 minutes",
          instructions: "Enter this code to reset your password. If you didn't request this, ignore this email."
        },
        portalName: "User Portal",
        portalSubtitle: "Security Alert"
      }),
    };
    await sendMail(emailData);

    return res.status(200).json({
      message: "Password reset instructions sent to your email",
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    // Find user by email and valid reset token
    const user = await User.findOne({
      email,
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token fields
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Error in reset password:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Add new address
export const addAddress = async (req, res) => {
  try {
    const { type, street, city, state, pincode, country, isDefault, name, mobile } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If this is the first address or isDefault is true, handle default status
    if (isDefault || user.addresses.length === 0) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    const newAddress = {
      type,
      name,
      mobile,
      street,
      city,
      state,
      pincode,
      country: country || "India",
      isDefault: isDefault || user.addresses.length === 0,
    };

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      address: newAddress,
    });
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({
      success: false,
      message: "Error adding address",
    });
  }
};

// Update address
export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const updateData = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Handle default address changes
    if (updateData.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    Object.assign(user.addresses[addressIndex], updateData);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address: user.addresses[addressIndex],
    });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({
      success: false,
      message: "Error updating address",
    });
  }
};

// Delete address
export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    // If deleting default address, make the first remaining address default
    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting address",
    });
  }
};

// Get all addresses
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("addresses");
    res.status(200).json({
      success: true,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching addresses",
    });
  }
};

// Set default address
export const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === addressId;
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Default address updated successfully",
    });
  } catch (error) {
    console.error("Error setting default address:", error);
    res.status(500).json({
      success: false,
      message: "Error setting default address",
    });
  }
};

// Add to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { variantId } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Find user and check if product with same variant is already in wishlist
    const user = await User.findById(userId);
    const alreadyInWishlist = user.wishlist.some(
      (item) =>
        item.product.toString() === productId &&
        (!variantId || item.variantId?.toString() === variantId)
    );

    if (alreadyInWishlist) {
      return res.status(400).json({
        success: false,
        message: "Product variant already in wishlist",
      });
    }

    // Add to wishlist with variant
    user.wishlist.push({
      product: productId,
      variantId: variantId || null,
    });
    await user.save();

    res.status(200).json({
      success: true,
      message: "Product added to wishlist",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding to wishlist",
    });
  }
};

// Remove from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { variantId } = req.query;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Find user and remove product with specific variant from wishlist
    const user = await User.findById(userId);
    user.wishlist = user.wishlist.filter(
      (item) =>
        !(
          item.product.toString() === productId &&
          (!variantId || item.variantId?.toString() === variantId)
        )
    );
    await user.save();

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing from wishlist",
    });
  }
};

// Get user's wishlist
export const getWishlist = async (req, res) => {
  if (req.user) {
    try {
      const userId = req.user._id;

      const user = await User.findById(userId)
        .populate({
          path: "wishlist.product",
          select:
            "pName pShortDescription pPrice pPreviousPrice pOffer pImage pStock pBrand variants",
        })
        .populate({
          path: "wishlist.variantId",
          select: "size type stock price previousPrice offer status",
        });

      // Filter out any wishlist items where the product is null or undefined
      const validWishlistItems = user.wishlist.filter((item) => item.product);

      const wishlistProducts = validWishlistItems.map((item) => ({
        _id: item.product._id,
        pName: item.product.pName,
        pShortDescription: item.product.pShortDescription,
        pPrice: item.variantId ? item.variantId.price : item.product.pPrice,
        pPreviousPrice: item.variantId ? item.variantId.previousPrice : item.product.pPreviousPrice,
        pOffer: item.variantId ? item.variantId.offer : item.product.pOffer,
        pImage: item.product.pImage[0],
        pStock: item.variantId ? item.variantId.stock : item.product.pStock,
        pBrand: item.product.pBrand,
        inStock: item.variantId
          ? item.variantId.stock > 0
          : item.product.pStock > 0,
        variantId: item.variantId?._id,
        variant: item.variantId,
        addedAt: item.addedAt,
      }));

      res.status(200).json({
        success: true,
        count: wishlistProducts.length,
        products: wishlistProducts,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching wishlist",
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};

// Add to save for later
export const addToSaveForLater = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { variantId } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Find user and check if product with same variant is already in saveForLater
    const user = await User.findById(userId);
    const alreadySaved = user.saveForLater.some(
      (item) =>
        item.product.toString() === productId &&
        (!variantId || item.variantId?.toString() === variantId)
    );

    if (alreadySaved) {
      return res.status(400).json({
        success: false,
        message: "Product variant already in Save for Later",
      });
    }

    // Add to saveForLater with variant
    user.saveForLater.push({
      product: productId,
      variantId: variantId || null,
    });
    await user.save();

    res.status(200).json({
      success: true,
      message: "Product added to Save for Later",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding to Save for Later",
    });
  }
};

// Remove from save for later
export const removeFromSaveForLater = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { variantId } = req.query;
    const userId = req.user._id;

    console.log("Removing from Save for Later:", { productId, variantId, userId });

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Find user and remove product with specific variant from saveForLater
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const initialLength = user.saveForLater.length;
    user.saveForLater = user.saveForLater.filter(
      (item) => {
        if (!item.product) return true; // Keep items with no product (shouldn't happen but safe)
        const isProductMatch = item.product.toString() === productId;

        // If no variantId is provided in request, match all variants of that product
        // If variantId is provided, match exactly
        const isVariantMatch = !variantId ||
          variantId === "null" ||
          variantId === "undefined" ||
          (item.variantId && item.variantId.toString() === variantId);

        return !(isProductMatch && isVariantMatch);
      }
    );

    console.log(`Removed ${initialLength - user.saveForLater.length} item(s). New count: ${user.saveForLater.length}`);

    await user.save();

    res.status(200).json({
      success: true,
      message: "Product removed from Save for Later",
    });
  } catch (error) {
    console.error("Error in removeFromSaveForLater:", error);
    res.status(500).json({
      success: false,
      message: "Error removing from Save for Later",
    });
  }
};

// Get user's save for later items
export const getSaveForLater = async (req, res) => {
  if (req.user) {
    try {
      const userId = req.user._id;
      console.log("Fetching Save for Later for user:", userId);

      const user = await User.findById(userId)
        .populate({
          path: "saveForLater.product",
          select:
            "pName pShortDescription pPrice pPreviousPrice pOffer pImage pStock pBrand variants",
        })
        .populate({
          path: "saveForLater.variantId",
          select: "size type stock price previousPrice offer status",
        });

      // Filter out any items where the product is null or undefined
      const validSavedItems = user.saveForLater.filter((item) => item.product);

      const savedProducts = validSavedItems.map((item) => ({
        _id: item.product._id,
        pName: item.product.pName,
        pShortDescription: item.product.pShortDescription,
        pPrice: item.variantId ? item.variantId.price : item.product.pPrice,
        pPreviousPrice: item.variantId ? item.variantId.previousPrice : item.product.pPreviousPrice,
        pOffer: item.variantId ? item.variantId.offer : item.product.pOffer,
        pImage: item.product.pImage[0],
        pStock: item.variantId ? item.variantId.stock : item.product.pStock,
        pBrand: item.product.pBrand,
        inStock: item.variantId
          ? item.variantId.stock > 0
          : item.product.pStock > 0,
        variantId: item.variantId?._id,
        variant: item.variantId,
        addedAt: item.addedAt,
      }));

      res.status(200).json({
        success: true,
        count: savedProducts.length,
        products: savedProducts,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching Save for Later items",
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};

// Get all users (admin access)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .sort({ createdAt: -1 });

    // Add order statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toObject();

        // Get order statistics from Order model (assuming you have one)
        const orderStats = await Order.aggregate([
          { $match: { userId: user._id } },
          {
            $group: {
              _id: null,
              ordersCount: { $sum: 1 },
              totalSpent: { $sum: "$totalAmount" },
            },
          },
        ]);

        return {
          ...userObj,
          ordersCount: orderStats[0]?.ordersCount || 0,
          totalSpent: orderStats[0]?.totalSpent || 0,
        };
      })
    );

    return res.status(200).json({
      success: true,
      users: usersWithStats,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const getUsers = async (req, res) => {
  try {
    var userdata = await User.aggregate([
      {
        '$match': {
          '_id': req.params.userId
        }
      }, {
        '$project': {
          'password': 0,
          'resetPasswordToken': 0,
          'resetPasswordExpires': 0
        }
      }, {
        '$lookup': {
          'from': 'wallettransactions',
          'let': {
            'userId': '$_id'
          },
          'pipeline': [
            {
              '$match': {
                '$expr': {
                  '$eq': [
                    '$userId', '$$userId'
                  ]
                }
              }
            }, {
              '$sort': {
                '_id': -1
              }
            }
          ],
          'as': 'wallettranscations'
        }
      }, {
        '$lookup': {
          'from': 'orders',
          'let': {
            'userId': '$_id'
          },
          'pipeline': [
            {
              '$match': {
                '$expr': {
                  '$eq': [
                    '$user', '$$userId'
                  ]
                }
              }
            }, {
              '$sort': {
                '_id': -1
              }
            }
          ],
          'as': 'orderdata'
        }
      }
    ])
    return res.status(200).json({
      success: true,
      userdata
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Delete user (admin access)
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete user's orders (if any)
    await Order.deleteMany({ userId });

    // Delete user's addresses and wishlist items
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Add Money with Code & Pass
export const addMoneyWithCodePass = async (req, res) => {
  try {
    const { code, pass, amount } = req.body;
    const userId = req.user._id;
    const userData = userId ? await User.findById(userId) : null;

    // // First validate the voucher
    // if (amount >= 1) {
    //   let data = JSON.stringify({
    //     voucher: code,
    //     pin: pass,
    //   });

    //   let config = {
    //     method: "post",
    //     maxBodyLength: Infinity,
    //     url: "https://kaitworld.com/public/api/kaitReceiptCheck",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     data: data,
    //   };

    //   const server_output = await axios.request(config);

    //   if (server_output.data.status === "error") {
    //     return res.status(400).json({
    //       success: false,
    //       message:
    //         "Voucher Code or PIN Seems to be Wrong, Please try with another one",
    //     });
    //   }

    //   if (
    //     server_output.data.status === "success" &&
    //     +server_output.data.balance < +amount
    //   ) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "No Sufficient Balance in the Voucher",
    //     });
    //   }
    // }

    // If validation passes, redeem the voucher
    if (amount >= 1) {


      let data = qs.stringify({
        'voucher': code.trim().toString(),
        'pin': pass.trim().toString(),
        'comment': `Picknow wallet topup ${userData.email}`,
        'order': `WALLET_${Date.now()}`,
        'amount': amount
      });

      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api.kaitcoin.org/voucher/redeem',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: data
      };

      // axios.request(config)
      //   .then((response) => {
      //     console.log(JSON.stringify(response.data));
      //   })
      //   .catch((error) => {
      //     console.log(error);
      //   });


      // let data = JSON.stringify({
      //   voucher: code,
      //   pin: pass,
      //   comment: `Picknow wallet topup ${userData.email}`,
      //   order: `WALLET_${Date.now()}`,
      //   amount: amount,
      // });

      // let config = {
      //   method: "post",
      //   maxBodyLength: Infinity,
      //   url: "https://kaitworld.com/public/api/kaitReceipt",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   data: data,
      // };

      const server_output = await axios.request(config);

      console.log(`server_output.data.status----952-----,usercontroll------>`, server_output.data.status);
      console.log(`server_output.data.status----952-----,usercontroll------>`, server_output.data);

      if (server_output.data.status === "error") {
        return res.status(400).json({
          success: false,
          message:
            "Voucher Code or PIN Seems to be Wrong, Please try with another one",
        });
      }

      // If redemption successful, add money to user's wallet
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Add money to wallet
      user.walletBalance = (user.walletBalance || 0) + parseFloat(amount);
      await user.save();

      // Add transaction record
      const transaction = new WalletTransaction({
        userId,
        amount: parseFloat(amount),
        type: "credit",
        description: `Added via voucher code ${code}`,
        status: "completed",
      });
      await transaction.save();

      return res.status(200).json({
        success: true,
        message: "Money added to wallet successfully",
        balance: user.walletBalance,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid amount",
    });
  } catch (error) {
    console.error("Error in addMoneyWithCodePass:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error
    });
  }
};

//get the addmoneywithcodepass
export const getAddMoneyWithCodePass = async (req, res) => {
  try {
    // Ensure userId exists from auth middleware
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not logged in",
      });
    }

    // Fetch only the wallet balance from the user document
    const user = await User.findById(userId).select("walletBalance");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Respond with balance
    return res.status(200).json({
      success: true,
      walletBalance: parseFloat(user.walletBalance || 0),
    });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const gettranscations = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not logged in",
      });
    }
    const user = await User.findById(userId).select("walletBalance");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    var transactions = await WalletTransaction.find({ userId: userId })
      .sort({ createdAt: -1 })
      .select("amount type description status createdAt")
      .lean();

    return res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


//get global transaction history
export const getAllUsersTransactions = async (req, res) => {
  try {
    // Get query parameters for filtering and pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get filter parameters
    const { userId, type, status, startDate, endDate } = req.query;

    // Build filter object
    const filter = {};

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format"
        });
      }
      // For find/count, mongoose can cast string to ObjectId, but for aggregation we will cast explicitly
      filter.userId = userId;
    }

    if (type && ['credit', 'debit'].includes(type)) {
      filter.type = type;
    }

    if (status && ['pending', 'completed', 'failed'].includes(status)) {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start)) {
          filter.createdAt.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end)) {
          // Include the entire end day
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }
      // If createdAt ended up empty, remove it
      if (Object.keys(filter.createdAt).length === 0) {
        delete filter.createdAt;
      }
    }

    // Get total count for pagination
    const totalTransactions = await WalletTransaction.countDocuments(filter);

    // Get transactions with pagination and populate user details
    const transactions = await WalletTransaction.find(filter)
      .populate({
        path: 'userId',
        select: 'name email contact'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate pagination info
    const totalPages = Math.ceil(totalTransactions / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Calculate summary statistics
    // Prepare match filter for aggregation with proper ObjectId casting
    const matchFilter = { ...filter };
    if (matchFilter.userId && typeof matchFilter.userId === 'string') {
      matchFilter.userId = new mongoose.Types.ObjectId(matchFilter.userId);
    }

    const summaryStats = await WalletTransaction.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalCredit: {
            $sum: {
              $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0]
            }
          },
          totalDebit: {
            $sum: {
              $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0]
            }
          },
          totalTransactions: { $sum: 1 },
          completedTransactions: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          pendingTransactions: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          },
          failedTransactions: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const stats = summaryStats[0] || {
      totalCredit: 0,
      totalDebit: 0,
      totalTransactions: 0,
      completedTransactions: 0,
      pendingTransactions: 0,
      failedTransactions: 0
    };

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: page,
          totalPages,
          totalTransactions,
          hasNextPage,
          hasPrevPage,
          limit
        },
        summary: {
          totalCredit: stats.totalCredit,
          totalDebit: stats.totalDebit,
          netAmount: stats.totalCredit - stats.totalDebit,
          totalTransactions: stats.totalTransactions,
          completedTransactions: stats.completedTransactions,
          pendingTransactions: stats.pendingTransactions,
          failedTransactions: stats.failedTransactions
        }
      }
    });
  } catch (error) {
    console.error("Error fetching all users transactions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const getdeliveryinfo = async (req, res) => {
  var data = await shipfeeModelSchema.find({}).exec();
  return res.status(200).json({
    success: true,
    data
  });
}

export const updatedeliveryinfo = async (req, res) => {
  const state = req.params.state;
  if (state) {
    var data = await shipfeeModelSchema.updateOne({ state }, {
      $set: req.body
    }).exec();
    return res.status(200).json({
      success: true,
      data
    });
  } else {
    return res.status(400).json({
      success: false,
      message: "State required"
    });
  }
}

export const createDeliveryInfo = async (req, res) => {
  const requiredFields = [
    { key: 'state', message: 'state is required' },
    { key: 'productdeliveryfee', message: 'productdeliveryfee is required' },
    { key: 'combodeliveryfee', message: 'combodeliveryfee is required' },
    { key: 'above500_deliveryfee', message: 'above500_deliveryfee is required' },
    // { key: 'above_1kg_deliveryfee', message: 'above_1kg_deliveryfee is required' }
  ];

  for (const field of requiredFields) {
    if (req.body[field.key] == undefined) {
      return res.status(400).json({
        success: false,
        message: field.message
      });
    }
  }

  try {
    const data = await shipfeeModelSchema.create(req.body);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating delivery info',
      error: error.message
    });
  }
};
// Google Login Handler
export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Google ID token is required" });
    }

    // Verify the token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if not exists
      user = new User({
        name,
        email,
        googleId,
        isVerified: true, // Google accounts are pre-verified
        avatar: picture,
        // Since it's a social login, we don't have a local password.
        // We can set a random password or leave it empty if the model allows.
        password: await bcrypt.hash(Math.random().toString(36).slice(-10), 10),
      });
      await user.save();
    } else {
      // Update existing user with googleId if missing
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true;
        await user.save();
      }
    }

    // Generate JWT token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15d",
    });

    const { password: _, ...userDetails } = user.toObject();

    return res.status(200).json({
      message: `Welcome ${user.name}`,
      token,
      user: userDetails,
    });
  } catch (error) {
    console.error("Error during Google login:", error);
    return res.status(500).json({ message: "Google authentication failed" });
  }
};
