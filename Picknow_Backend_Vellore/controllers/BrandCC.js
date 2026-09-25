import { Brands } from "../models/Brand.js";
import { uploadToCloudinary } from "../middleware/brandMulter.js";

// Create a new brand
export const createBrand = async (req, res) => {
  try {
    const { name } = req.body;
    
    const existingBrand = await Brands.findOne({ name });
    if (existingBrand) {
      return res.status(400).json({ message: "Brand already exists" });
    }

    let logoUrl = null;
    if (req.file) {
      logoUrl = await uploadToCloudinary(req.file);
    }

    const brand = new Brands({
      name,
      logo: logoUrl,
    });

    await brand.save();
    res.status(201).json({ message: "Brand created successfully", brand });
  } catch (error) {
    res.status(500).json({ message: "Error creating brand", error: error.message });
  }
};

// Get all brands
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brands.find();
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching brands', error: error.message });
  }
};

// Get single brand by ID
export const getBrandById = async (req, res) => {
  try {
    const brand = await Brands.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    res.status(200).json(brand);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching brand', error: error.message });
  }
};

// Update brand
export const updateBrand = async (req, res) => {
  try {
    const { name } = req.body;
    console.log("Updating brand ID:", req.params.id, "with name:", name);
    
    const brand = await Brands.findById(req.params.id);
    if (!brand) {
      console.log("Brand not found for ID:", req.params.id);
      return res.status(404).json({ message: "Brand not found" });
    }

    if (name && name !== brand.name) {
      const existingBrand = await Brands.findOne({ name });
      if (existingBrand) {
        return res.status(400).json({ message: "Brand name already exists" });
      }
    }

    if (name) brand.name = name;
    
    if (req.file) {
      console.log("New logo file detected, uploading to Cloudinary...");
      const logoUrl = await uploadToCloudinary(req.file);
      brand.logo = logoUrl;
    }

    await brand.save();
    console.log("Brand updated successfully");
    res.status(200).json({ message: "Brand updated successfully", brand });
  } catch (error) {
    console.error("CRITICAL ERROR IN UPDATEBRAND:", error);
    res.status(500).json({ 
      message: "Error updating brand", 
      error: error.message,
      stack: error.stack,
      details: error
    });
  }
};

// Delete brand
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brands.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    
    await Brands.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Brand deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting brand', error: error.message });
  }
};