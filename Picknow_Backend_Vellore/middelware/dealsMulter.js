import multer from "multer";
import { v4 as uuid } from "uuid";
import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs";
import cloudinary from '../config/cloudinary.js';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadPath = path.join(process.cwd(), "uploads", "deals");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename(req, file, cb) {
    const id = uuid();
    const extension = file.originalname.split(".").pop();
    const filename = `deal_${id}.${extension}`;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Invalid file type. Only JPEG, PNG, and GIF are allowed.")
      );
    }
    cb(null, filename);
  },
});

// Create multer upload instance
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

// Middleware for handling deals image upload
export const uploadDealsImage = (req, res, next) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ 
        success: false,
        message: err.message 
      });
    }

    if (req.file) {
      try {
        const uploadResult = await cloudinaryImageUploadMethod(req.file.path);
        // Delete the local file after successful upload to Cloudinary
        fs.unlinkSync(req.file.path);
        // Update the file path to the Cloudinary URL
        req.file.path = uploadResult.secure_url;
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return res.status(500).json({ 
          success: false,
          message: 'Failed to upload image to Cloudinary' 
        });
      }
    }
    next();
  });
};

const cloudinaryImageUploadMethod = async file => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(file, (err, res) => {
      if (err) {
        reject(new Error("Failed to upload image to Cloudinary"));
        return;
      }
      resolve({
        secure_url: res.secure_url
      });
    });
  });
};

// Error handling middleware for multer
export const handleDealsMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false,
        message: 'File too large. Maximum size is 5MB' 
      });
    }
    return res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
  next(err);
}; 