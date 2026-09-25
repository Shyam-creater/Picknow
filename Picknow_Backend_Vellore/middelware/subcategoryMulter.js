import multer from "multer";
import { v4 as uuid } from "uuid";
import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs";
import { deleteFile, getFullPath } from "../utils/fileUtils.js";
import cloudinary from '../config/cloudinary.js';


const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Use absolute path for subcategory uploads
    const uploadPath = path.join(process.cwd(), "uploads", "subcategory");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
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

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

export const uploadSubcategoryImage = (req, res, next) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (req.file) {
      // const filePath = path.join("uploads", "subcategory", req.file.filename);
      // req.file.path = filePath;
      const filePath = await cloudinaryImageUploadMethod(req.file.path);


      fs.unlinkSync(req.file.path)
      req.file.path = filePath.secure_url;
      // dsfjksdk(req.file.filename)

      // console.log("multer pass", req.file.path);
    }
    next();
  });
};

export const uploadImage = (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (req.file) {
      const filePath = await cloudinaryImageUploadMethod(req.file.path);
      fs.unlinkSync(req.file.path)
      req.file.path = filePath.secure_url;
      res.send({ status: true, data: filePath.secure_url })
    }
  });
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