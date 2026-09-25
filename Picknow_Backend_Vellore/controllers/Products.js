import productModel from "../models/Product.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";
import { deleteFiles, getFullPath } from "../utils/fileUtils.js";
import fs from "fs";
import ProductVariant from "../models/ProductVariant.js";
import { Order } from "../models/order.js";
import { deleteImageFromS3 } from "../middelware/multer.js";
import {
  getProductCanonicalUrl,
  generateProductStructuredData,
} from "../utils/seoUtils.js";
import { sendPushNotification } from "../utils/pushNotification.js";

// Add new product
export const createProduct = async (req, res) => {
  try {
    // Check if user exists and has appropriate role
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check if user has appropriate role
    if (
      req.user.role !== "admin" &&
      req.user.role !== "super_admin" &&
      req.user.role !== "vendor"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized Access",
      });
    }

    const {
      pName,
      pShortDescription,
      pDescription,
      pCategory,
      pSubCategory,
      pNestedSubCategory,
      pTax,
      pStatus,
      pBrand,
      pPrice,
      pStock,
      pQuantity,
      pPreviousPrice,
      pOffer,
      pReturn,
      pReturnDays,
      variants,
      pMetaTitle,
      pMetaKeywords,
      pMetaDescription,
      pCanonicalUrl,
      pUrl,
      schemaMarkup,
      pType,
      pis_voucher_50,
      pis_voucher_100,
      freeshipping,
    } = req.body;

    // Check if files were uploaded
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({
        success: false,
        message: "Please upload product images",
      });
    }

    const pImage = req.files.map((file) => file.path);
    console.log("pImage", pImage);

    // Validate required fields
    const requiredFields = {
      pName,
      pShortDescription,
      pDescription,
      pCategory,
      pSubCategory,
      pTax,
      pStatus,
      pBrand,
      pReturn,
      pReturnDays,
      freeshipping,
      pType,
      pis_voucher_50,
      pis_voucher_100,
      pCanonicalUrl,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => value === undefined || value === null || value === "")
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Validate numeric fields
    const numericValidations = [{ value: pTax, field: "Tax", min: 0 }];
    if (pReturn === "yes") {
      numericValidations.push({
        value: pReturnDays,
        field: "Return Days",
        min: 0,
      });
    }
    for (const validation of numericValidations) {
      const num = Number(validation.value);
      if (isNaN(num) || num < validation.min) {
        return res.status(400).json({
          success: false,
          message: `${validation.field} must be a number greater than ${validation.min}`,
        });
      }
    }

    // Create product with user information
    const product = new productModel({
      pName,
      pShortDescription,
      pDescription,
      pCategory,
      pSubCategory,
      pNestedSubCategory,
      pTax,
      pStatus,
      pBrand,
      pPrice: pPrice === "undefined" ? 0 : Number(pPrice || 0),
      pPreviousPrice: pPreviousPrice === "undefined" ? 0 : Number(pPreviousPrice || 0),
      pOffer: pOffer === "undefined" ? 0 : Number(pOffer || 0),
      pStock: pStock === "undefined" ? 0 : Number(pStock || 0),
      pQuantity: pQuantity === "undefined" ? 0 : Number(pQuantity || 0),
      pReturn,
      pReturnDays,
      createdBy: req.user.name,
      vendorId: req.user.role === "vendor" ? req.user._id : req.user._id,
      pImage,
      pType,
      pis_voucher_50,
      pis_voucher_100,
      freeshipping,
      pMetaTitle,
      pMetaKeywords,
      pMetaDescription,
      pCanonicalUrl,
      pUrl,
      schemaMarkup,
    });

    await product.save();

    // If variants are provided, create them
    let createdVariants = [];
    if (variants && Array.isArray(variants) && variants.length > 0) {
      // Validate each variant
      const errors = [];
      variants.forEach((variant, index) => {
        let { size, price } = variant;

        // Handle "undefined" strings from some frontends
        if (price === "undefined") price = 0;
        else price = Number(price);

        if (!size || isNaN(price)) {
          errors.push(`Variant at index ${index}: Missing or invalid price/size`);
          return;
        }
      });

      if (errors.length > 0) {
        // If there are variant errors, delete the created product
        await productModel.findByIdAndDelete(product._id);
        return res.status(400).json({
          success: false,
          message: "Validation errors in variants",
          errors,
        });
      }

      // Add productId to each variant
      const variantsWithProductId = variants.map((variant) => ({
        ...variant,
        productId: product._id,
        type: "size", // Default type
        stock: 0, // Default stock
        totalStock: 0, // Default total stock
        status: "active", // Default status
      }));

      // Find or create product variant document
      let productVariant = await ProductVariant.findOne();
      if (!productVariant) {
        productVariant = new ProductVariant({ variants: [] });
      }

      // Add new variants
      productVariant.variants.push(...variantsWithProductId);
      await productVariant.save();

      // Get only the newly added variants
      createdVariants = productVariant.variants.slice(-variants.length);
    }

    // Create global notification for new product
    try {
      console.log("System: Attempting to create notification for new product:", pName);
      const newNotification = new Notification({
        title: "New Product Arrived! 🔥",
        message: `${pName} is now available on Picknow. Check it out!`,
        type: "PRODUCT",
        link: `/product/${product._id}`,
        metadata: {
          productId: product._id,
          image: product.pImage && product.pImage.length > 0 ? product.pImage[0] : null
        }
      });
      await newNotification.save();
      console.log("System: Notification created successfully for product:", pName);

      // Send push notification to all users with registered tokens
      await sendPushNotification(
        null, // null = broadcast to all users
        "New Product Arrived! 🔥",
        `${pName} is now available on Picknow. Check it out!`,
        { id: newNotification._id.toString(), type: "PRODUCT", productId: product._id.toString() }
      );
    } catch (notifError) {
      console.error("System: Failed to create product notification:", notifError);
    }

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: {
        ...product._doc,
        pImage: product.pImage.map((img) => `${img}`),
      },
      variants: createdVariants,
    });
  } catch (error) {
    console.error("Error in createProduct:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error creating product",
    });
  }
};

// Get all products (public access)
export const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.user && req.user.role === "vendor") {
      // Vendors can only see their own products
      query.vendorId = req.user.id;
    } else if (req.user && (req.user.role === "admin" || req.user.role === "super_admin")) {
      // Admins should see all products, including inactive
    } else {
      // Public users should only see active/out-of-stock products
      query.pStatus = { $regex: new RegExp("^(active|Out of Stock)$", "i") };
    }

    // Get total count for pagination
    const totalProducts = await productModel.countDocuments(query);

    // Get paginated products with variants
    const products = await productModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Fetch variants for all products
    const productsWithVariants = await Promise.all(
      products.map(async (product) => {
        const variants = await ProductVariant.find({ productId: product._id });
        return {
          ...product._doc,
          pImage: product.pImage.map((img) => `${img}`),
          variants: variants,
        };
      }),
    );

    res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      hasNextPage: skip + products.length < totalProducts,
      hasPrevPage: page > 1,
      products: productsWithVariants,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching products",
    });
  }
};

export const fiterProducts = async (req, res) => {
  const result = await productModel.aggregate([
    {
      $lookup: {
        from: "categories",
        let: {
          nestedName: "$pNestedSubCategory",
          subName: "$pSubCategory",
          mainName: "$pCategory",
        },
        pipeline: [
          { $unwind: "$subCategories" },
          { $unwind: "$subCategories.subCategories" },
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$cName", "$$mainName"] },
                  { $eq: ["$subCategories.name", "$$subName"] },
                  {
                    $eq: ["$subCategories.subCategories.name", "$$nestedName"],
                  },
                ],
              },
            },
          },
          {
            $project: {
              _id: "$subCategories.subCategories._id",
              name: "$subCategories.subCategories.name",
            },
          },
        ],
        as: "nestedSubCategoryInfo",
      },
    },
    { $unwind: "$nestedSubCategoryInfo" },
    {
      $group: {
        _id: null,
        nestedSubCategories: { $addToSet: "$nestedSubCategoryInfo" },
      },
    },
    { $project: { _id: 0, nestedSubCategories: 1 } },
  ]);

  const ratingsinfo = await productModel.aggregate([
    {
      $match: {
        pRatingsReviews: {
          $ne: [],
        },
      },
    },
    {
      $project: {
        ratings: {
          $avg: {
            $map: {
              input: "$pRatingsReviews",
              as: "r",
              in: {
                $toDouble: "$$r.rating",
              },
            },
          },
        },
      },
    },
    {
      $group: {
        _id: "$ratings",
        count: {
          $sum: 1,
        },
      },
    },
    {
      $group: {
        _id: null,
        above_4_star: {
          $sum: {
            $cond: [
              {
                $gte: ["$_id", 4],
              },
              "$count",
              0,
            ],
          },
        },
        above_3_star: {
          $sum: {
            $cond: [
              {
                $and: [
                  {
                    $gte: ["$_id", 3],
                  },
                  {
                    $lt: ["$_id", 4],
                  },
                ],
              },
              "$count",
              0,
            ],
          },
        },
        above_2_star: {
          $sum: {
            $cond: [
              {
                $and: [
                  {
                    $gte: ["$_id", 2],
                  },
                  {
                    $lt: ["$_id", 3],
                  },
                ],
              },
              "$count",
              0,
            ],
          },
        },
        above_1_star: {
          $sum: {
            $cond: [
              {
                $and: [
                  {
                    $gte: ["$_id", 1],
                  },
                  {
                    $lt: ["$_id", 2],
                  },
                ],
              },
              "$count",
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        above_4_star: 1,
        above_3_star: 1,
        above_2_star: 1,
        above_1_star: 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    nestedSubCategories: result[0].nestedSubCategories,
    ratingsinfo,
  });
};
export const getProductByType = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    let query = { pType: "combo" };
    if (req.user && req.user.role === "vendor") {
      query.vendorId = req.user.id;
    } else if (
      req.user &&
      (req.user.role === "admin" || req.user.role === "super_admin")
    ) {
      query = {};
    } else {
      query.pStatus = { $regex: new RegExp("^active$", "i") };
    }
    const totalProducts = await productModel.countDocuments(query);
    const products = await productModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    // const productsWithVariants = await Promise.all(products.map(async (product) => {
    //   const variants = await ProductVariant.find({ productId: product._id });
    //   return {
    //     ...product._doc,
    //     pImage: product.pImage.map(img => `${img}`),
    //     variants: variants
    //   };
    // }));
    const productsWithVariants = await productModel
      .aggregate([
        {
          $match: {
            pType: "combo",
          },
        },
        {
          $lookup: {
            from: "productvariants",
            localField: "_id",
            foreignField: "productId",
            as: "variants",
          },
        },
        {
          $sort: {
            "variants[0].price": -1,
          },
        },
      ])
      .exec();

    res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      hasNextPage: skip + products.length < totalProducts,
      hasPrevPage: page > 1,
      products: productsWithVariants,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching products",
    });
  }
};

// Get a single product by ID (public access)
export const getProductById = async (req, res) => {
  try {
    const productId = req.params.id || req.query.id;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const id = new mongoose.Types.ObjectId(productId);
    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Fetch variants for this product
    const variants = await ProductVariant.find({ productId: id }).sort({
      createdAt: -1,
    });

    // Calculate variant statistics
    const variantStats =
      variants.length > 0
        ? {
          totalVariants: variants.length,
          minPrice: Math.min(...variants.map((v) => v.price)),
          maxPrice: Math.max(...variants.map((v) => v.price)),
          totalStock: variants.reduce((sum, v) => sum + v.stock, 0),
          hasOutOfStock: variants.some((v) => v.stock === 0),
        }
        : null;

    // // Generate SEO data
    // const canonicalUrl = getProductCanonicalUrl(product.id);
    // const structuredData = generateProductStructuredData(product.schemaMarkup);

    res.status(200).json({
      success: true,
      product: {
        ...product._doc,
        pImage: product.pImage.map((img) => `${img}`),
        variants,
        variantStats,
      },
      // seo: {
      //   canonicalUrl,
      //   structuredData
      // }
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching product",
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    // Validate product ID
    const productId = req.params.id;
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Get existing product
    const existingProduct = await productModel.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Verify vendor ownership
    if (
      req.user.role === "vendor" &&
      existingProduct.vendorId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this product",
      });
    }

    const {
      pName,
      pShortDescription,
      pDescription,
      pCategory,
      pSubCategory,
      pNestedSubCategory,
      pTax,
      pStatus,
      pBrand,
      pReturn,
      pReturnDays,
      imagesToDelete,
      pMetaTitle,
      pMetaKeywords,
      pMetaDescription,
      pCanonicalUrl,
      pUrl,
      pType,
      pis_voucher_50,
      pis_voucher_100,
      freeshipping,
      schemaMarkup,
    } = req.body;

    // Build update object
    const updateData = {
      ...(pName && { pName }),
      ...(pShortDescription && { pShortDescription }),
      ...(pDescription && { pDescription }),
      ...(pCategory && { pCategory }),
      ...(pSubCategory && { pSubCategory }),
      ...(typeof pNestedSubCategory !== "undefined" && { pNestedSubCategory }),
      ...(typeof pTax !== "undefined" && { pTax: Number(pTax) }),
      ...(pStatus && { pStatus }),
      ...(pBrand && { pBrand }),
      ...(pReturn && { pReturn }),
      ...(pReturnDays && { pReturnDays: Number(pReturnDays) }),
      vendorId: req.user.role === "vendor" ? req.user._id : req.user._id,
      editedBy: req.user.name || "Not edited",
      pType,
      pis_voucher_50,
      pis_voucher_100,
      freeshipping,
      pMetaTitle,
      pMetaKeywords,
      pMetaDescription,
      pCanonicalUrl,
      pUrl,
      schemaMarkup,
    };

    // Handle image updates
    let updatedImages = [...existingProduct.pImage]; // Start with existing images

    // Delete specific images if requested
    if (imagesToDelete) {
      const imagesToDeleteArray = JSON.parse(imagesToDelete);
      imagesToDeleteArray.forEach((filename) => {
        const imagePath = getFullPath(`uploads/${filename}`);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
        updatedImages = updatedImages.filter((img) => img !== filename);
      });
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      const newImageFilenames = req.files.map((file) => file.path);
      updatedImages = [...updatedImages, ...newImageFilenames];
    }

    updateData.pImage = updatedImages;

    // Perform the update
    const updatedProduct = await productModel.findByIdAndUpdate(
      productId,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    // Send detailed response
    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: {
        ...updatedProduct._doc,
        pImage: updatedProduct.pImage.map((img) => `${img}`),
      },
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error updating product",
      error: error.message,
    });
  }
};

// Delete a product by ID
export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
        showPopup: true,
      });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
        showPopup: true,
      });
    }

    // Verify vendor ownership
    if (
      req.user.role === "vendor" &&
      product.vendorId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this product",
        showPopup: true,
      });
    }

    // Delete associated image files
    if (product.pImage && product.pImage.length > 0) {
      const cloudinaryImages = product.pImage.map((filename) => filename);
      await deleteImageFromS3(cloudinaryImages);
    }

    // Delete all variants associated with this product
    await ProductVariant.deleteMany({ productId: product._id });

    // Delete the product from database
    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product and its variants deleted successfully.",
      showPopup: true,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
      showPopup: true,
    });
  }
};

// Add rating and review
export const addRatingAndReview = async (req, res) => {
  try {
    const { productId } = req.params;
    // const { varientId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user._id;
    const id = new mongoose.Types.ObjectId(productId);
    const user_id = new mongoose.Types.ObjectId(userId);
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Validate productId
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }
    // if (!varientId) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Varient ID is required"
    //   })
    // }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user has a DELIVERED order with this product
    const deliveredOrder = await Order.findOne({
      user: userId,
      orderStatus: "DELIVERED",
      items: { $elemMatch: { product: product._id } },
    });

    if (!deliveredOrder) {
      return res.status(403).json({
        success: false,
        message: "You can only review products that have been delivered to you.",
      });
    }

    // Check if user has already reviewed via order.reviewmade or checking reviews array
    if (deliveredOrder.reviewmade) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this purchase.",
      });
    }

    // Check if user has already reviewed
    const existingReview = product.pRatingsReviews.find(
      (r) => r.user.toString() === userId.toString(),
    );

    const uploadedImages = req.files && req.files.length > 0
      ? req.files.map((file) => file.path)
      : [];

    if (existingReview) {
      // Update existing review
      existingReview.rating = rating.toString();
      existingReview.review = review;
      if (uploadedImages.length > 0) {
        existingReview.image = uploadedImages;
      }
      existingReview.createdAt = new Date();
    } else {
      // Add new review
      product.pRatingsReviews.push({
        user: userId,
        rating: rating.toString(),
        review,
        image: uploadedImages,
        createdAt: new Date(),
      });
    }

    await product.save();

    var exists = await Order.findOne({
      items: { $elemMatch: { product: product._id } },
      user: userId,
    });

    console.log(`exists----542-----,Products------>`, exists);

    var esziiis = await Order.updateOne(
      {
        items: { $elemMatch: { product: product._id } },
        user: userId,
      },
      { $set: { reviewmade: true } },
    );

    console.log(`esziiis----549-----,Products------>`, esziiis);

    res.status(200).json({
      success: true,
      message: "Rating and review added successfully",
      product,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error adding rating and review",
    });
  }
};

// Get product ratings and reviews
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    const product = await productModel.findById(productId).populate({
      path: "pRatingsReviews.user",
      select: "name email",
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const totalRatings = product.pRatingsReviews.length;
    const avgRating =
      totalRatings > 0
        ? product.pRatingsReviews.reduce(
          (sum, item) => sum + Number(item.rating),
          0,
        ) / totalRatings
        : 0;

    const response = {
      success: true,
      reviews: product.pRatingsReviews,
      totalReviews: totalRatings,
      averageRating: avgRating.toFixed(1),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in getProductReviews:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reviews",
      error: error.message,
    });
  }
};

export const getAuthReviews = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;
  const product = await productModel.findById(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }
  const exists = await Order.findOne({
    items: { $elemMatch: { product: product._id } },
    user: userId,
    orderStatus: "DELIVERED",
  });

  if (exists) {
    return res.status(200).json({
      success: true,
      canreview: !exists.reviewmade, // Can review if not already reviewed
      message: exists.reviewmade ? "Already reviewed" : "Eligible for review"
    });
  } else {
    return res.status(200).json({
      success: true,
      canreview: false, // Cannot review if not delivered
      message: "Purchase required"
    });
  }
};
// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const userId = req.user._id;

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Find review index
    const reviewIndex = product.pRatingsReviews.findIndex(
      (review) =>
        review._id.toString() === reviewId &&
        review.user.toString() === userId.toString(),
    );

    if (reviewIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Review not found or unauthorized",
      });
    }

    // Remove review
    product.pRatingsReviews.splice(reviewIndex, 1);
    await product.save();

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error deleting review",
    });
  }
};

// Get all products with offer variants
export const getAllProductByOffer = async (req, res) => {
  try {
    // console.log("getAllProductByOffer called with query:", req.query);
    const { minOffer = 1, limit = 20 } = req.query;

    // Find product variants with offers greater than minOffer
    const productVariants = await ProductVariant.find({
      offer: { $gt: Number(minOffer) },
      status: "active",
      stock: { $gt: 0 }, // Only show in-stock variants
    })
      .sort({ offer: -1 }) // Sort by offer percentage in descending order
      .limit(Number(limit));

    // console.log(`Found ${productVariants.length} variants with offers > ${minOffer}%`);

    if (!productVariants || productVariants.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No product variants found with offers greater than " +
          minOffer +
          "%",
      });
    }

    // Get unique product IDs from the variants
    const productIds = [
      ...new Set(productVariants.map((variant) => variant.productId)),
    ];
    // console.log(`Found ${productIds.length} unique products associated with variants`);

    // Fetch the associated products
    const products = await productModel
      .find({
        _id: { $in: productIds },
        pStatus: "active",
      })
      .select("pName pImage pDescription pCategory pBrand");

    // console.log(`Retrieved ${products.length} active products`);

    // Combine product and variant information
    const productsWithOffers = productVariants
      .map((variant) => {
        const product = products.find(
          (p) => p._id.toString() === variant.productId.toString(),
        );
        if (!product) return null;

        return {
          productId: product._id,
          variantId: variant._id,
          pName: product.pName,
          pImage: product.pImage.map((img) => `${img}`),
          pDescription: product.pDescription,
          pCategory: product.pCategory,
          pBrand: product.pBrand,
          size: variant.size,
          type: variant.type,
          price: variant.price,
          previousPrice: variant.previousPrice,
          offer: variant.offer,
          stock: variant.stock,
        };
      })
      .filter(Boolean); // Remove null entries

    // console.log(`Final products with offers: ${productsWithOffers.length}`);

    return res.status(200).json({
      success: true,
      message: "Products with offer variants retrieved successfully",
      count: productsWithOffers.length,
      data: productsWithOffers,
    });
  } catch (error) {
    console.error("Error in getAllProductByOffer:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving products with offers",
      error: error.message,
    });
  }
};

// Get subcategories with more than 10 products
export const getSubcategoryWithMoreThan10Products = async (req, res) => {
  try {
    const subcategories = await productModel.aggregate([
      { $group: { _id: "$pSubCategory", count: { $sum: 1 } } },
      { $match: { count: { $gt: 10 } } },
    ]);

    res.status(200).json({
      success: true,
      subcategories: subcategories,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching subcategories",
    });
  }
};

// Get nested subcategories with more than 10 products
export const getNestedSubCategoryWithMoreThan10Products = async (req, res) => {
  try {
    const nestedSubcategories = await productModel.aggregate([
      { $group: { _id: "$pNestedSubCategory", count: { $sum: 1 } } },
      { $match: { count: { $gt: 10 } } },
    ]);

    res.status(200).json({
      success: true,
      nestedSubcategories: nestedSubcategories,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching nested subcategories",
    });
  }
};

// Get related products by category and nested relationships
export const getRelatedProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 10, includeOutOfStock = false } = req.query;

    // Find the original product
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Find products with exact nested category match
    const exactMatches = await productModel
      .find({
        _id: { $ne: productId },
        pSubCategory: new RegExp('^' + product.pSubCategory + '$', "i"),
        pStatus: "active",
      }).populate('variants').exec()


    // If we need more products, look for secondary matches (subcategory)
    let secondaryMatches = [];
    if (exactMatches.length < limit) {
      const remainingLimit = limit - exactMatches.length;
      const secondaryQuery = {
        _id: { $ne: productId },
        pStatus: "active",
        pSubCategory: product.pSubCategory,
        $and: [{ _id: { $nin: exactMatches.map((p) => p._id) } }],
      };

      if (!includeOutOfStock) {
        secondaryQuery.pStock = { $gt: 0 };
      }

      secondaryMatches = await productModel
        .find(secondaryQuery)
        .populate('variants')
        .limit(Number(remainingLimit));
    }

    // If we still need more products, look for tertiary matches (category and brand)
    let tertiaryMatches = [];
    if (exactMatches.length + secondaryMatches.length < limit) {
      const remainingLimit =
        limit - exactMatches.length - secondaryMatches.length;
      const tertiaryQuery = {
        _id: { $ne: productId },
        pStatus: "active",
        $and: [
          {
            _id: {
              $nin: [...exactMatches, ...secondaryMatches].map((p) => p._id),
            },
          },
          {
            $or: [
              {
                pCategory: product.pCategory,
                pBrand: product.pBrand,
              },
              {
                pCategory: product.pCategory,
              },
            ],
          },
        ],
      };

      if (!includeOutOfStock) {
        tertiaryQuery.pStock = { $gt: 0 };
      }

      tertiaryMatches = await productModel
        .find(tertiaryQuery)
        .populate('variants')
        .limit(Number(remainingLimit));
    }

    // Combine and score all matches
    const allProducts = [
      ...exactMatches,
      ...secondaryMatches,
      ...tertiaryMatches,
    ];
    const scoredProducts = allProducts.map((relatedProduct) => {
      let relevanceScore = 0;
      let matchTypes = [];

      // Scoring based on category hierarchy
      if (relatedProduct.pNestedSubCategory === product.pNestedSubCategory) {
        relevanceScore += 5;
        matchTypes.push("nested_category");
      }
      if (relatedProduct.pSubCategory === product.pSubCategory) {
        relevanceScore += 3;
        matchTypes.push("subcategory");
      }
      if (relatedProduct.pCategory === product.pCategory) {
        relevanceScore += 2;
        matchTypes.push("category");
      }

      // Brand matching
      if (relatedProduct.pBrand === product.pBrand) {
        relevanceScore += 2;
        matchTypes.push("brand");
      }

      // Price range similarity (within 20% range)
      const priceRange = product.pPrice * 0.2;
      if (Math.abs(relatedProduct.pPrice - product.pPrice) <= priceRange) {
        relevanceScore += 1;
        matchTypes.push("price_range");
      }

      // Stock status
      if (relatedProduct.pStock > 0) {
        relevanceScore += 1;
        matchTypes.push("in_stock");
      }

      // Special offers
      if (relatedProduct.pOffer && product.pOffer) {
        relevanceScore += 1;
        matchTypes.push("special_offer");
      }

      return {
        ...relatedProduct._doc,
        relevanceScore,
        matchTypes,
        pImage: relatedProduct.pImage.map((img) => `${img}`),
        relevanceDetails: {
          isExactNestedMatch:
            relatedProduct.pNestedSubCategory === product.pNestedSubCategory,
          isSubCategoryMatch:
            relatedProduct.pSubCategory === product.pSubCategory,
          isCategoryMatch: relatedProduct.pCategory === product.pCategory,
          isBrandMatch: relatedProduct.pBrand === product.pBrand,
          isPriceRangeMatch:
            Math.abs(relatedProduct.pPrice - product.pPrice) <= priceRange,
        },
      };
    });

    // Sort by relevance score
    scoredProducts.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Format the response
    const response = {
      success: true,
      count: scoredProducts.length,
      relatedProducts: scoredProducts.map(
        ({ relevanceScore, matchTypes, relevanceDetails, ...product }) => ({
          ...product,
          isHighlyRelevant: relevanceScore >= 6,
          relevanceScore,
          matchTypes,
          relevanceDetails,
        }),
      ),
    };

    // Add metadata about the matches
    response.metadata = {
      exactNestedMatches: exactMatches.length,
      secondaryMatches: secondaryMatches.length,
      tertiaryMatches: tertiaryMatches.length,
      totalMatches: scoredProducts.length,
      originalProduct: {
        category: product.pCategory,
        subCategory: product.pSubCategory,
        nestedSubCategory: product.pNestedSubCategory,
        brand: product.pBrand,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching related products:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching related products",
      error: error.message,
    });
  }
};

// Add to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if product is already in user's wishlist
    const alreadyInWishlist = product.pWishlist.some(
      (item) => item.user.toString() === userId.toString(),
    );

    if (alreadyInWishlist) {
      return res.status(400).json({
        success: false,
        message: "Product already in wishlist",
      });
    }

    // Add to wishlist
    product.pWishlist.push({ user: userId });
    await product.save();

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
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Remove from wishlist
    product.pWishlist = product.pWishlist.filter(
      (item) => item.user.toString() !== userId.toString(),
    );
    await product.save();

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
  try {
    const userId = req.user._id;

    const products = await productModel
      .find({
        "pWishlist.user": userId,
      })
      .select("pName pShortDescription pPrice pImage pStock pBrand");

    res.status(200).json({
      success: true,
      count: products.length,
      products: products.map((product) => ({
        _id: product._id,
        pName: product.pName,
        pShortDescription: product.pShortDescription,
        pPrice: product.pPrice,
        pImage: product.pImage[0], // Send first image
        pStock: product.pStock,
        pBrand: product.pBrand,
        inStock: product.pStock > 0,
      })),
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching wishlist",
    });
  }
};

//get product by brand
export const getProductsByBrand = async (req, res) => {
  try {
    const { brand } = req.params;
    const {
      sort = "createdAt",
      order = "desc",
      limit = 50,
      page = 1,
      minPrice,
      maxPrice,
      inStock,
    } = req.query;

    // Build query
    const query = { 
      pBrand: brand,
      pStatus: { $regex: new RegExp("^(active|Out of Stock)$", "i") }
    };

    // Add price filter if provided
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.pPrice = {};
      if (minPrice !== undefined) query.pPrice.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.pPrice.$lte = Number(maxPrice);
    }

    // Add stock filter if provided
    if (inStock === "true") {
      query.pStock = { $gt: 0 };
    }

    // Calculate skip value for pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get total count for pagination
    const total = await productModel.countDocuments(query);

    // Get products with sorting and pagination
    const products = await productModel
      .find(query)
      .sort({ [sort]: order === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("variants")
      .populate("pRatingsReviews.user", "name");

    // Calculate average ratings and transform response
    const transformedProducts = products.map((product) => {
      const totalRatings = product.pRatingsReviews.length;
      const avgRating =
        totalRatings > 0
          ? product.pRatingsReviews.reduce(
            (sum, item) => sum + Number(item.rating),
            0,
          ) / totalRatings
          : 0;

      return {
        ...product._doc,
        pImage: product.pImage.map((img) => `${img}`),
        averageRating: avgRating.toFixed(1),
        totalReviews: totalRatings,
      };
    });

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      products: transformedProducts,
      filters: {
        brand,
        minPrice,
        maxPrice,
        inStock,
        sort,
        order,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching products by brand",
      error: error.message,
    });
  }
};

// Get all unique brands with product counts
export const getAllBrands = async (req, res) => {
  try {
    const brandStats = await productModel.aggregate([
      // Only include active and out of stock products
      {
        $match: {
          pStatus: { $regex: new RegExp("^(active|Out of Stock)$", "i") }
        }
      },
      // Group by brand and get stats
      {
        $group: {
          _id: "$pBrand",
          productCount: { $sum: 1 },
          averagePrice: { $avg: "$pPrice" },
          minPrice: { $min: "$pPrice" },
          maxPrice: { $max: "$pPrice" },
          totalStock: { $sum: "$pStock" },
          categories: { $addToSet: "$pCategory" },
        },
      },
      // Sort by product count in descending order
      { $sort: { productCount: -1 } },
      // Project final shape of the data
      {
        $project: {
          _id: 0,
          brand: "$_id",
          productCount: 1,
          averagePrice: { $round: ["$averagePrice", 2] },
          priceRange: {
            min: { $round: ["$minPrice", 2] },
            max: { $round: ["$maxPrice", 2] },
          },
          totalStock: 1,
          categories: 1,
        },
      },
    ]);

    // Get total product count
    const totalProducts = await productModel.countDocuments();

    res.status(200).json({
      success: true,
      count: brandStats.length,
      totalProducts,
      brands: brandStats.map((brand) => ({
        ...brand,
        marketShare:
          ((brand.productCount / totalProducts) * 100).toFixed(2) + "%",
      })),
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching brands",
      error: error.message,
    });
  }
};

export const getProductsByVendorId = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const products = await productModel.find({ vendorId });
    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching products by vendor ID",
      error: error.message,
    });
  }
};

// Delete a single image from a product
export const deleteProductImage = async (req, res) => {
  try {
    const { productId } = req.params;
    const { imageUrl } = req.body;

    if (!productId || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Product ID and image URL are required",
      });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Remove the image URL from the product's image array
    product.pImage = product.pImage.filter((img) => img !== imageUrl);
    await product.save();

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      images: product.pImage,
    });
  } catch (error) {
    console.error("Error deleting product image:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting product image",
      error: error.message,
    });
  }
};

// get latest product
export const getLatestProduct = async (req, res) => {
  try {
    // Disable caching to ensure new products are seen immediately
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const products = await productModel
      .find({
        pType: "product",
        pStatus: "active",
      })
      .sort({ createdAt: -1 })
      .limit(15);

    if (products.length === 0) {
      return res.status(200).json({ success: true, count: 0, products: [] });
    }

    // Optimization: Fetch all variants in one query instead of Promise.all loops
    const productIds = products.map(p => p._id);
    const allVariants = await ProductVariant.find({ productId: { $in: productIds } });

    const productsWithVariants = products.map((product) => {
      const productVariants = allVariants.filter(v => v.productId.toString() === product._id.toString());
      return {
        ...product._doc,
        pImage: product.pImage.map((img) => `${img}`),
        variants: productVariants,
      };
    });

    res.status(200).json({
      success: true,
      count: products.length,
      products: productsWithVariants,
    });
  } catch (error) {
    console.error("System: getLatestProduct error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching latest products",
      error: error.message,
    });
  }
};

export const getbrandProduct = async (req, res) => {
  try {
    if (!req.body.categories) {
      res.status(500).json({
        success: false,
        message: "Category Required",
      });
    } else {
      var brandinfo = await productModel.aggregate([
        {
          $match: {
            pNestedSubCategory: { $regex: req.body.categories, $options: "i" },
            pStatus: { $regex: new RegExp("^(active|Out of Stock)$", "i") }
          },
        },
        {
          $group: {
            _id: "$pBrand",
          },
        },
        {
          $project: {
            name: "$_id",
            _id: 0,
          },
        },
      ]);
      res.status(200).json({
        success: true,
        data: brandinfo,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching latest products",
      error: error.message,
    });
  }
};

export const getProductsGroupedByName = async (req, res) => {
  try {
    const groupedProducts = await productModel.aggregate([
      // 1️⃣ Group products by exact pName
      {
        $group: {
          _id: "$pName",
          productIds: { $push: "$_id" },
          variantIds: { $push: "$variants" },
          products: { $push: "$$ROOT" },
          totalProducts: { $sum: 1 },
        },
      },

      // 2️⃣ Flatten variantIds array
      {
        $addFields: {
          variantIds: {
            $reduce: {
              input: "$variantIds",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] },
            },
          },
        },
      },

      // 3️⃣ Lookup variants
      {
        $lookup: {
          from: "productvariants", // MUST be lowercase plural
          localField: "variantIds",
          foreignField: "_id",
          as: "variants",
        },
      },

      // 4️⃣ Shape final response
      {
        $project: {
          _id: 0,
          pName: "$_id",
          totalProducts: 1,
          // Keep original nested images object for backwards compatibility
          product: {
            pImage: "$products.pImage",
          },
          // Expose productIds and their corresponding image arrays
          productIds: 1,
          productImages: "$products.pImage",
          variants: 1,
        },
      },
      {
        $addFields: {
          color: {
            $setUnion: [
              {
                $map: {
                  input: "$variants",
                  as: "v",
                  in: { $toLower: "$$v.attributes.color" },
                },
              },
            ],
          },
        },
      },
      // 5️⃣ Sort
      {
        $sort: { pName: 1 },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: groupedProducts.length,
      data: groupedProducts,
    });
  } catch (error) {
    console.error("Group Products Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch grouped products",
    });
  }
};
