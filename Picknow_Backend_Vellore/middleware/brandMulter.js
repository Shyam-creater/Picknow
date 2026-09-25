import multer from "multer";
import path from "path";
import cloudinary from '../config/cloudinary.js';

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// File filter (only images allowed)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only images (jpeg, jpg, png, webp) are allowed"));
  }
};

// Cloudinary upload function
export const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'brands',
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload stream error:", error);
          return reject(new Error('Error uploading to Cloudinary: ' + error.message));
        }
        resolve(result.secure_url);
      }
    );

    // Write file buffer to the stream
    uploadStream.end(file.buffer);
  });
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});
