import multer from "multer";
import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs";
import { directories } from '../config/directories.js';

// Configure storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = {
        'aadharDocument': ['image/jpeg', 'image/png' , 'application/pdf'],
        'panDocument': ['image/jpeg', 'image/png', 'application/pdf'],
        'gstDocument': ['image/jpeg', 'image/png', 'application/pdf'],
        'fssaiDocument': ['image/jpeg', 'image/png', 'application/pdf'],
        'profileImage': ['image/jpeg', 'image/png'],
        'shopPhotos': ['image/jpeg', 'image/png']
    };

    // Check if the fieldname is allowed and has valid mime type
    if (allowedMimeTypes[file.fieldname] && 
        allowedMimeTypes[file.fieldname].includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type for ${file.fieldname}. Allowed types: ${allowedMimeTypes[file.fieldname].join(', ')}`), false);
    }
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB file size limit
        files: 10 // Maximum number of files
    }
});

// Middleware for handling vendor document uploads
export const uploadVendorDocs = upload.fields([
    { name: 'aadharDocument', maxCount: 1 },
    { name: 'panDocument', maxCount: 1 },
    { name: 'gstDocument', maxCount: 1 },
    { name: 'fssaiDocument', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 },
    { name: 'shopPhotos', maxCount: 5 }
]);

// Middleware for handling single profile image upload
export const uploadVendorProfile = upload.single('profileImage');

// Error handling middleware for multer
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({ 
                    message: 'File too large. Maximum size is 5MB' 
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({ 
                    message: 'Too many files uploaded' 
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({ 
                    message: 'Unexpected file upload. Please check the required document types.' 
                });
            default:
                return res.status(400).json({ 
                    message: err.message 
                });
        }
    }

    if (err) {
        return res.status(400).json({ 
            message: err.message || 'Error processing file upload' 
        });
    }

    next();
};

// Cleanup middleware to remove uploaded files in case of error
export const cleanupOnError = (req, res, next) => {
    res.on('finish', () => {
        if (res.statusCode >= 400 && req.files) {
            Object.values(req.files).forEach(files => {
                files.forEach(file => {
                    // Only attempt to delete if file.path exists
                    if (file.path && typeof file.path === 'string') {
                        fs.unlink(file.path, (err) => {
                            if (err) {
                                console.error('Error deleting file:', err);
                            }
                        });
                    }
                });
            });
        }
    });
    next();
};

// Middleware to validate required documents
export const validateRequiredDocs = (req, res, next) => {
    // Only aadharDocument and panDocument are required. gstDocument and fssaiDocument are optional.
    const requiredDocs = ['aadharDocument', 'panDocument'];
    
    if (!req.files) {
        return res.status(400).json({ 
            message: 'No files uploaded' 
        });
    }

    const missingDocs = requiredDocs.filter(doc => !req.files[doc]);
    
    if (missingDocs.length > 0) {
        return res.status(400).json({ 
            message: `Missing required documents: ${missingDocs.join(', ')}` 
        });
    }

    // Add cloudinaryUrls object to store URLs
    req.cloudinaryUrls = {};
    
    // Process all documents
    Promise.all(
        Object.entries(req.files).map(async ([docType, files]) => {
            if (files && files.length > 0) {
                const uploadPromises = files.map(async (file) => {
                    try {
                        const uploadedFile = await s3ImageUploadMethod(file.buffer, file.originalname, file.mimetype);
                        // Store S3 URL while preserving original file info
                        if (!req.cloudinaryUrls[docType]) {
                            req.cloudinaryUrls[docType] = [];
                        }
                        req.cloudinaryUrls[docType].push(uploadedFile.secure_url);
                    } catch (error) {
                        console.error(`Error uploading ${docType}:`, error);
                        throw new Error(`Failed to upload ${docType}`);
                    }
                });
                await Promise.all(uploadPromises);
            }
        })
    )
    .then(() => {
        next();
    })
    .catch((error) => {
        return res.status(500).json({ 
            success: false,
            message: 'Failed to upload documents',
            error: error.message 
        });
    });
};

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "./multer.js";
import { v4 as uuidv4 } from "uuid";

const s3ImageUploadMethod = async (fileBuffer, originalname, mimetype) => {
    return new Promise(async (resolve, reject) => {
        try {
            const ext = path.extname(originalname);
            const key = `vendor_documents/${uuidv4()}${ext}`;
            
            const uploadParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
                Body: fileBuffer,
                ContentType: mimetype,
                ACL: "public-read"
            };

            await s3.send(new PutObjectCommand(uploadParams));
            
            const secure_url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
            
            resolve({
                secure_url: secure_url,
                public_id: key
            });
        } catch (error) {
            console.error('S3 upload error:', error);
            reject(new Error("Upload to S3 failed"));
        }
    });
};