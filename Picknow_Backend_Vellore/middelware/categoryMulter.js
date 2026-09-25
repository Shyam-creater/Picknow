import multer from "multer";
import { v4 as uuid } from "uuid";
import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs";
import cloudinary from '../config/cloudinary.js';
import { deleteFile, getFullPath } from "../utils/fileUtils.js";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Use absolute path to ensure correct directory
    const uploadPath = path.join(process.cwd(), "uploads", "category");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename(req, file, cb) {
    const id = uuid();
    const extension = file.originalname.split(".").pop();
    const filename = `${id}.${extension}`;

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

// Middleware for handling single file upload
export const uploadFiles2 = (req, res, next) => {
  try {
    upload.single("cImage")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      // Store the complete file path
      if (req.file) {
        if (req.file.path) {
          const uploadResult = await cloudinaryImageUploadMethod(req.file.path);
          console.log(uploadResult);
          
          fs.unlinkSync(req.file.path)
          req.file.path = uploadResult.secure_url;
          next();
        } else {
          next()
        }

      }else{
        next()
      }
    });
  } catch (error) {
    console.log("==84==>", error)
  }

};

const cloudinaryImageUploadMethod = async file => {

  return new Promise(resolve => {
    cloudinary.uploader.upload(file, (err, res) => {
      if (err) return res.status(500).send("upload image error")
      resolve({
        secure_url: res.secure_url
      })
    }
    )
  })
}


function dsfjksdk(filename) {
  //delete after deleted
  const imagePath = getFullPath(`uploads/category/${filename}`);
  const deleted = deleteFile(imagePath);
  // console.log(deleted);
}


// Error handling middleware for multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB' });
    }
    return res.status(400).json({ message: err.message });
  }
  next(err);
};
