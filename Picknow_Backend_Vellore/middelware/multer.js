import multer from "multer";
import { v4 as uuid } from "uuid";
import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";
import dotenv from "dotenv";

dotenv.config();

// Configure S3 Client
export const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

// Configure Multer Storage with S3
const storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_BUCKET_NAME,
  acl: "public-read",
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    const id = uuid();
    const extension = file.originalname.split(".").pop();
    cb(null, `${id}.${extension}`);
  },
});

// Create multer upload instance
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and MP4 are allowed."));
    }
  }
});

// Middleware for handling file uploads
export const uploadFiles = (req, res, next) => {
  upload.array("pImage", 15)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    // In multer-s3, file objects have a `location` property containing the S3 URL
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        file.path = file.location; // Map location to path for compatibility with existing code
      });
    }
    next();
  });
};

/**
 * Delete images from S3
 * @param {string[]} urls Array of S3 URLs to delete
 */
export const deleteImageFromS3 = async (urls) => {
  if (!urls || urls.length === 0) return;

  const objectsToDelete = urls.map(url => {
    // Extract the key from the URL
    // Assumes URL format: https://bucket-name.s3.region.amazonaws.com/key
    const key = url.split('/').pop();
    return { Key: key };
  });

  const command = new DeleteObjectsCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Delete: {
      Objects: objectsToDelete,
      Quiet: false,
    },
  });

  try {
    const response = await s3.send(command);
    console.log('Successfully deleted objects from S3:', response);
    return response;
  } catch (err) {
    console.error('Error deleting objects from S3:', err);
    throw err;
  }
};

// Error handling middleware for multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum is 15 files' });
    }
    return res.status(400).json({ message: err.message });
  }
  next(err);
};