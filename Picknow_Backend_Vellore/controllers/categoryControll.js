import { categoryModel } from "../models/Category.js";
import mongoose from "mongoose";
import { deleteFile, getFullPath } from "../utils/fileUtils.js";
import productModel from "../models/Product.js";
import path from "path";
import fs from "fs";

//Add new category
export const createCategory = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized Access. Only admin and super admin can perform this action.",
        showPopup: true
      });
    }

    const {
      cName,
      cDescription,
      cStatus,
      parentId
    } = req.body;
    const cImage = req.file.path;
    console.log(cImage)
    console.log("=========req.body=====>", req.body);
    console.log("==============>", cImage);
    // Validate required fields
    if (
      !cName ||
      // !cDescription ||
      !cStatus
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
        showPopup: true
      });
    }

    if (!cImage) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image.",
        showPopup: true
      });
    }

    const product = await categoryModel.create({
      cName,
      cDescription,
      cImage: cImage, // Store just the filename instead of full path
      cStatus,
      parentId: parentId || null
    });

    res.status(201).json({
      success: true,
      message: "Category added successfully.",
      product,
      showPopup: true
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
      showPopup: true
    });
  }
};

// Get all category
export const getAllCategory = async (req, res) => {
  try {
    const categories = await categoryModel.aggregate([
      {
        $lookup: {
          from: 'products',  // The name of your products collection
          let: { categoryName: '$cName' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [
                        { $eq: ["$pCategory", "$$categoryName"] },
                        { $eq: ["$pSubCategory", "$$categoryName"] },
                        {
                          $and: [
                            { $eq: ["$pType", "combo"] },
                            {
                              $or: [
                                { $eq: ["$$categoryName", "All Combo Offers"] },
                                { $ne: [{ $indexOfCP: [{ $toLower: "$pSubCategory" }, { $toLower: { $arrayElemAt: [{ $split: ["$$categoryName", " "] }, 0] } }] }, -1] }
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    { $in: ["$pStatus", ["active", "Out of Stock"]] }
                  ]
                }
              }
            }
          ],
          as: 'products'
        }
      },
      {
        $addFields: {
          products: { $size: '$products' }  // Count number of products
        }
      }
    ]);

    res.status(200).json(categories);
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
      showPopup: true
    });
  }
};


// Get a single category by ID
export const getCategoryById = async (req, res) => {
  try {
    const idParam = req.params.id || req.query.id;
    if (!idParam) {
      return res.status(400).json({ success: false, message: "ID is required" });
    }
    const id = new mongoose.Types.ObjectId(idParam);

    const category = await categoryModel.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
        showPopup: true
      });
    }
    res.status(200).json(category);
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
      showPopup: true
    });
  }
};

import ProductVariant from "../models/ProductVariant.js";

// Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const categoryName = req.params.categoryName || req.params.category;
    let query = {
      pStatus: { $regex: new RegExp("^(active|Out of Stock)$", "i") }
    };

    if (categoryName === "All Combo Offers") {
      query.$or = [
        { pCategory: categoryName },
        { pType: "combo" }
      ];
    } else {
      const firstWord = categoryName.split(' ')[0];
      query.$or = [
        { pCategory: categoryName },
        { pSubCategory: categoryName },
        { 
          $and: [
            { pType: "combo" },
            { pSubCategory: { $regex: new RegExp(`^${firstWord}`, "i") } }
          ]
        }
      ];
    }

    const products = await productModel.find(query)
      .sort({ pCategory: 1 })
      .populate({
        path: 'variants',
        model: 'ProductVariant'
      });

    // Transform images
    const productsWithVariants = products.map((product) => {
      const prodObj = product.toObject();
      return {
        ...prodObj,
        pImage: Array.isArray(prodObj.pImage) ? prodObj.pImage.map((img) => `${img}`) : prodObj.pImage
      };
    });

    res.status(200).json({
      success: true,
      products: productsWithVariants
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
      showPopup: true
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized Access. Only admin and super admin can perform this action.",
        showPopup: true
      });
    }

    const categoryId = req.params.id;
    const { cName, cDescription, cStatus } = req.body;

    console.log(` categoryId ----170-----,categoryControll------>`, categoryId);

    console.log(`req.body----171-----,categoryControll------>`, req.file);

    // Validate required fields
    if (!cName || !cStatus) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
        showPopup: true
      });
    }

    const updateData = {
      cName,
      cDescription,
      cStatus,
    };

    if (req.file?.path) {
      updateData.cImage = req.file.path;
    }

    const updatedCategory = await categoryModel.findByIdAndUpdate(
      categoryId,
      updateData,
      { new: true }
    );


    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
        showPopup: true
      });
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: updatedCategory,
      showPopup: true
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
      showPopup: true
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized Access. Only admin and super admin can perform this action.",
        showPopup: true
      });
    }

    const categoryId = req.params.id;
    const category = await categoryModel.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
        showPopup: true
      });
    }

    // // Delete the image file
    // if (category.cImage) {
    //   const imagePath = getFullPath(`uploads/category/${category.cImage}`);
    //   const deleted = deleteFile(imagePath);
    //   if (!deleted) { 
    //     console.error(`Failed to delete image file: ${imagePath}`);
    //   }
    // }

    // Delete the category from database
    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      showPopup: true
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
      showPopup: true
    });
  }
};

// Get subcategories for a category
export const getSubCategories = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const category = await categoryModel.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
        subCategories: []
      });
    }

    if (category.cName === "All Combo Offers") {
      const allMainCategories = await categoryModel.find({ 
        parentId: null, 
        cName: { $ne: "All Combo Offers" } 
      });
      const virtualSubCategories = allMainCategories.map(c => ({
        _id: c._id,
        name: c.cName,
        image: Array.isArray(c.cImage) ? c.cImage[0] : c.cImage
      }));
      return res.status(200).json({
        success: true,
        subCategories: virtualSubCategories
      });
    }

    res.status(200).json({
      success: true,
      subCategories: category.subCategories || []
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
      subCategories: []
    });
  }
};

// Create subcategory
export const createSubCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const { name, description } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
        showPopup: true
      });
    }

    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
        showPopup: true
      });
    }

    // Create new subcategory with default status
    const newSubCategory = {
      name,
      description,
      status: 'active',
      image: req.file ? req.file.path : null

    };
    console.log(newSubCategory);
    console.log(newSubCategory.image);



    // Add to subcategories array
    category.subCategories.push(newSubCategory);
    await category.save();

    return res.status(201).json({
      success: true,
      message: "Subcategory created successfully",
      subCategory: newSubCategory,
      showPopup: true
    });
  } catch (error) {
    console.error("Error creating subcategory:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create subcategory",
      showPopup: true
    });
  }
};

// Update subcategory
export const updateSubCategory = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized Access",
        showPopup: true
      });
    }

    const { categoryId, subCategoryId } = req.params;
    const { name, description, status } = req.body;

    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
        showPopup: true
      });
    }

    const subCategory = category.subCategories.id(subCategoryId);
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
        showPopup: true
      });
    }

    // Update fields
    if (name) subCategory.name = name;
    if (description) subCategory.description = description;
    if (status) subCategory.status = status;

    // Update image if new one is provided
    if (req.file) {
      const image = req.file.path;
      // Delete old image if exists
      if (subCategory.image) {
        try {
          const oldImagePath = path.join(process.cwd(), 'uploads', 'subcategory', subCategory.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      subCategory.image = image;
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: "Subcategory updated successfully",
      subCategory,
      showPopup: true
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
      showPopup: true
    });
  }
};

// Delete subcategory
export const deleteSubCategory = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized Access",
        showPopup: true
      });
    }

    const { categoryId, subCategoryId } = req.params;
    const category = await categoryModel.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
        showPopup: true
      });
    }

    // Find the subcategory before removing it
    const subCategory = category.subCategories.id(subCategoryId);

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
        showPopup: true
      });
    }

    // Delete main subcategory image if exists
    if (subCategory.image) {
      try {
        const mainImagePath = path.join(process.cwd(), 'uploads', 'subcategory', subCategory.image);
        if (fs.existsSync(mainImagePath)) {
          fs.unlinkSync(mainImagePath);
        }
      } catch (error) {
        console.error('Error deleting subcategory image:', error);
      }
    }

    // Delete nested subcategory images if they exist
    if (subCategory.subCategories && subCategory.subCategories.length > 0) {
      subCategory.subCategories.forEach(nestedSubCat => {
        if (nestedSubCat.image) {
          try {
            const nestedImagePath = path.join(process.cwd(), 'uploads', 'subcategory', nestedSubCat.image);
            if (fs.existsSync(nestedImagePath)) {
              fs.unlinkSync(nestedImagePath);
            }
          } catch (error) {
            console.error('Error deleting nested subcategory image:', error);
          }
        }
      });
    }

    // Remove the subcategory from the array
    category.subCategories = category.subCategories.filter(
      sub => sub._id.toString() !== subCategoryId
    );

    await category.save();

    res.status(200).json({
      success: true,
      message: "Subcategory and associated images deleted successfully",
      showPopup: true
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
      showPopup: true
    });
  }
};

// Add new controller for nested subcategories
export const createNestedSubCategory = async (req, res) => {
  try {
    const { categoryId, parentSubCategoryId } = req.params;
    const { name, description, status } = req.body;
    const image = req.file;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
        showPopup: true
      });
    }

    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
        showPopup: true
      });
    }

    // Find the parent subcategory
    const parentSubCategory = category.subCategories.id(parentSubCategoryId);
    if (!parentSubCategory) {
      return res.status(404).json({
        success: false,
        message: "Parent subcategory not found",
        showPopup: true
      });
    }

    // Create new nested subcategory
    const nestedSubCategory = {
      name,
      description,
      status: status || 'active',
      image: image ? image.filename : null
    };

    // Add to parent subcategory's subCategories array
    if (!parentSubCategory.subCategories) {
      parentSubCategory.subCategories = [];
    }
    parentSubCategory.subCategories.push(nestedSubCategory);

    await category.save();

    return res.status(201).json({
      success: true,
      message: "Nested subcategory created successfully",
      nestedSubCategory,
      showPopup: true
    });
  } catch (error) {
    console.error("Error creating nested subcategory:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create nested subcategory",
      showPopup: true
    });
  }
};

// Add controller to get nested subcategories
export const getNestedSubCategories = async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.params;
    const category = await categoryModel.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
        subCategories: []
      });
    }

    const subCategory = category.subCategories.id(subCategoryId);
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
        subCategories: []
      });
    }

    res.status(200).json({
      success: true,
      subCategories: subCategory.subCategories || []
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
      subCategories: []
    });
  }
};

// Add this new controller for deleting nested subcategories
export const deleteNestedSubCategory = async (req, res) => {
  try {
    const { categoryId, parentSubCategoryId, nestedSubCategoryId } = req.params;

    // Log the IDs to help with debugging
    console.log('Deleting nested subcategory:', {
      categoryId,
      parentSubCategoryId,
      nestedSubCategoryId
    });

    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
        showPopup: true
      });
    }

    // Find the parent subcategory using the correct ID
    const parentSubCategory = category.subCategories.id(parentSubCategoryId);
    if (!parentSubCategory) {
      return res.status(404).json({
        success: false,
        message: "Parent subcategory not found",
        showPopup: true
      });
    }

    // Find and remove the nested subcategory
    const nestedSubCategoryIndex = parentSubCategory.subCategories.findIndex(
      sub => sub._id.toString() === nestedSubCategoryId
    );

    if (nestedSubCategoryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Nested subcategory not found",
        showPopup: true
      });
    }

    // Get the nested subcategory before removing it
    const nestedSubCategory = parentSubCategory.subCategories[nestedSubCategoryIndex];

    // Delete the image if it exists
    if (nestedSubCategory.image) {
      try {
        const imagePath = path.join(process.cwd(), 'uploads', 'subcategory', nestedSubCategory.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    // Remove the nested subcategory
    parentSubCategory.subCategories.splice(nestedSubCategoryIndex, 1);
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Nested subcategory deleted successfully",
      showPopup: true
    });
  } catch (error) {
    console.error("Error deleting nested subcategory:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete nested subcategory",
      showPopup: true
    });
  }
};

// Add this new controller for editing nested subcategories
export const updateNestedSubCategory = async (req, res) => {
  try {
    const { categoryId, parentSubCategoryId, nestedSubCategoryId } = req.params;
    const { name, description, status } = req.body;

    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
        showPopup: true
      });
    }

    const parentSubCategory = category.subCategories.id(parentSubCategoryId);
    if (!parentSubCategory) {
      return res.status(404).json({
        success: false,
        message: "Parent subcategory not found",
        showPopup: true
      });
    }

    const nestedSubCategory = parentSubCategory.subCategories.id(nestedSubCategoryId);
    if (!nestedSubCategory) {
      return res.status(404).json({
        success: false,
        message: "Nested subcategory not found",
        showPopup: true
      });
    }

    // Update the fields
    nestedSubCategory.name = name || nestedSubCategory.name;
    nestedSubCategory.description = description || nestedSubCategory.description;
    nestedSubCategory.status = status || nestedSubCategory.status;

    if (req.file) {
      const image = req.file.path;

      // Delete old image if exists
      if (nestedSubCategory.image) {
        try {
          const oldImagePath = path.join(process.cwd(), 'uploads', 'subcategory', nestedSubCategory.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      nestedSubCategory.image = image;
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Nested subcategory updated successfully",
      nestedSubCategory,
      showPopup: true
    });
  } catch (error) {
    console.error("Error updating nested subcategory:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update nested subcategory",
      showPopup: true
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find();

    // Function to build category tree
    const buildCategoryTree = (items, parentId = null) => {
      const result = [];
      items.forEach(item => {
        if (String(item.parentId) === String(parentId)) {
          const children = buildCategoryTree(items, item._id);
          if (children.length) {
            item = item.toObject();
            item.children = children;
          }
          result.push(item);
        }
      });
      return result;
    };

    const categoryTree = buildCategoryTree(categories);
    res.json(categoryTree);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}