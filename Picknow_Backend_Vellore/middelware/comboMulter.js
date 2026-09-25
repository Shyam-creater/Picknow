import multer from "multer";
import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs";

const __dirname = path.resolve();



// Create uploads/combo directory if it doesn't exist
const comboUploadPath = path.join(__dirname, "/uploads/combo");
if (!fs.existsSync(comboUploadPath)) {
  fs.mkdirSync(comboUploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, comboUploadPath);
  },
  filename(req, file, cb) {
    const id = uuid();
    const extension = file.originalname.split(".").pop();
    const filename = `combo_${id}.${extension}`;

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

// Middleware for handling combo file uploads
export const uploadComboFiles = upload.array("ccImage", 5); // Allow up to 5 images

// Error handling middleware for multer
export const handleComboMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum is 5 files' });
    }
    return res.status(400).json({ message: err.message });
  }
  next(err);
}; 