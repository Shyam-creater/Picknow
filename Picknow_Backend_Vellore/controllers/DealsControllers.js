import mongoose from "mongoose";
import { deals } from "../models/dealsModel.js";
import productModel from "../models/Product.js";
import ProductVariant from "../models/ProductVariant.js";

// deals management
export const adddeals = async (req, res) => {
  try {
   
   
    const { title, content, products, startDate, endDate } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Image is required",
      });
    }

    if (!title || !content || !products || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error:
          "Title, content, products, start date, and end date are required",
      });
    }

    // Validate products array
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one product is required for the deal",
      });
    }

    // Validate each product and its variant
    for (const product of products) {
      if (!product.product || !product.dealPrice || !product.dealDiscount) {
        return res.status(400).json({
          success: false,
          error:
            "Each product must have product ID, deal price, and deal discount",
        });
      }

      // Check if product exists
      const productExists = await productModel.findById(product.product);
      if (!productExists) {
        return res.status(400).json({
          success: false,
          error: `Product with ID ${product.product} not found`,
        });
      }

      // If variant is provided, check if it exists and belongs to the product
      if (product.variant) {
        const variantExists = await ProductVariant.findOne({
          _id: product.variant,
          productId: product.product,
        });
        if (!variantExists) {
          return res.status(400).json({
            success: false,
            error: `Variant with ID ${product.variant} not found for product ${product.product}`,
          });
        }
      }

      // Validate deal price and discount
      if (product.dealPrice < 0) {
        return res.status(400).json({
          success: false,
          error: "Deal price cannot be negative",
        });
      }

      if (product.dealDiscount < 0 || product.dealDiscount > 100) {
        return res.status(400).json({
          success: false,
          error: "Deal discount must be between 0 and 100",
        });
      }
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      return res.status(400).json({
        success: false,
        error: "Start date cannot be in the past",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        error: "End date must be after start date",
      });
    }

    const newDeal = new deals({
      title,
      content,
      image: req.file.path,
      products,
      startDate: start,
      endDate: end,
      status: "active",
    });

    await newDeal.save();

    res.status(201).json({
      success: true,
      message: "Deal added successfully",
      deals: newDeal,
    });
  } catch (error) {
    console.error("Error adding deal:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add deal. Please try again.",
    });
  }
};

// get all deals
export const getAlldeals = async (req, res) => {
  try {
    const allDeals = await deals
      .find()
      .populate({
        path: "products.product",
        select: "pName pImage pStatus pCategory pBrand",
      })
      .populate({
        path: "products.variant",
        select: "size type price stock",
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      deals: allDeals,
    });
  } catch (error) {
    console.error("Error getting deals:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch deals. Please try again.",
    });
  }
};

// get deals by id
export const getdealsById = async (req, res) => {
  try {
    const deal = await deals
      .findById(req.params.dealsId)
      .populate({
        path: "products.product",
        select: "pName pImage pStatus pCategory pBrand",
      })
      .populate({
        path: "products.variant",
        select: "size type price stock",
      });

    if (!deal) {
      return res.status(404).json({
        success: false,
        error: "Deal not found",
      });
    }

    res.json({
      success: true,
      deals: deal,
    });
  } catch (error) {
    console.error("Error getting deal:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch deal. Please try again.",
    });
  }
};

// update deals
export const updatedeals = async (req, res) => {
  try {
    const { title, content, products, startDate, endDate, status } = req.body;
    const updateData = { title, content, products, startDate, endDate, status };

    // If new image is uploaded, update the image path
    if (req.file) {
      updateData.image = req.file.path;
    }

    // Validate products if provided
    if (products) {
      if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
          success: false,
          error: "At least one product is required for the deal",
        });
      }

      for (const product of products) {
        if (!product.product || !product.dealPrice || !product.dealDiscount) {
          return res.status(400).json({
            success: false,
            error:
              "Each product must have product ID, deal price, and deal discount",
          });
        }

        const productExists = await productModel.findById(product.product);
        if (!productExists) {
          return res.status(400).json({
            success: false,
            error: `Product with ID ${product.product} not found`,
          });
        }

        if (product.variant) {
          const variantExists = await ProductVariant.findOne({
            _id: product.variant,
            productId: product.product,
          });
          if (!variantExists) {
            return res.status(400).json({
              success: false,
              error: `Variant with ID ${product.variant} not found for product ${product.product}`,
            });
          }
        }

        if (product.dealPrice < 0) {
          return res.status(400).json({
            success: false,
            error: "Deal price cannot be negative",
          });
        }

        if (product.dealDiscount < 0 || product.dealDiscount > 100) {
          return res.status(400).json({
            success: false,
            error: "Deal discount must be between 0 and 100",
          });
        }
      }
    }

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();

      if (start < now) {
        return res.status(400).json({
          success: false,
          error: "Start date cannot be in the past",
        });
      }

      if (end <= start) {
        return res.status(400).json({
          success: false,
          error: "End date must be after start date",
        });
      }

      updateData.startDate = start;
      updateData.endDate = end;
    }

    // Validate status if provided
    if (status && !["active", "inactive", "expired"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status must be one of: active, inactive, expired",
      });
    }

    const updatedDeal = await deals
      .findByIdAndUpdate(req.params.dealsId, updateData, {
        new: true,
        runValidators: true,
      })
      .populate({
        path: "products.product",
        select: "pName pImage pStatus pCategory pBrand",
      })
      .populate({
        path: "products.variant",
        select: "size type price stock",
      });

    if (!updatedDeal) {
      return res.status(404).json({
        success: false,
        error: "Deal not found",
      });
    }

    res.json({
      success: true,
      message: "Deal updated successfully",
      deals: updatedDeal,
    });
  } catch (error) {
    console.error("Error updating deal:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update deal. Please try again.",
    });
  }
};

// delete deals
export const deletedeals = async (req, res) => {
  try {
    const deal = await deals.findById(req.params.dealsId);

    if (!deal) {
      return res.status(404).json({
        success: false,
        error: "Deal not found",
      });
    }

    await deals.findByIdAndDelete(req.params.dealsId);

    res.json({
      success: true,
      message: "Deal deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting deal:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete deal. Please try again.",
    });
  }
};
