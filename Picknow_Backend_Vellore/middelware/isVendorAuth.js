import jwt from "jsonwebtoken";
import { Vendor } from "../models/vendor.js";

// Vendor Authentication Middleware
export const isVendorAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify that the token belongs to a vendor
        if (decoded.role !== 'vendor') {
            return res.status(403).json({ message: "Invalid token role" });
        }

        const vendor = await Vendor.findById(decoded.id).select("-password");
        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        // Check vendor status and approval
        if (!vendor.isVerified) {
            return res.status(403).json({ message: "Account not verified" });
        }

        if (vendor.status !== 'active') {
            return res.status(403).json({ message: `Account is ${vendor.status}` });
        }

        // Attach vendor and role information to request
        req.user = {
            id: vendor._id,
            role: 'vendor',
            ...vendor._doc
        };
        
        next();
    } catch (error) {
        console.error('Vendor Auth Error:', error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Verify Vendor Status Middleware
export const isVerifiedVendor = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                message: "Authentication required" 
            });
        }

        if (!req.user.isVerified) {
            return res.status(403).json({ 
                message: "Account not verified. Please wait for admin approval." 
            });
        }

        if (req.user.status !== 'active') {
            return res.status(403).json({ 
                message: `Account is ${req.user.status}. Please contact admin.` 
            });
        }

        next();
    } catch (error) {
        console.error('Error in isVerifiedVendor:', error);
        return res.status(500).json({ 
            message: "Error verifying vendor status" 
        });
    }
};

// Check Document Verification Status
export const hasVerifiedDocuments = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                message: "Authentication required" 
            });
        }

        // Check if all required documents are uploaded and verified
        const requiredDocs = ['aadhar', 'pan', 'gst', 'fssai'];
        const missingDocs = requiredDocs.filter(doc => 
            !req.user.documents[doc] || 
            !req.user.documents[doc].number || 
            !req.user.documents[doc].photo || 
            !req.user.documents[doc].document
        );

        if (missingDocs.length > 0) {
            return res.status(403).json({
                message: `Missing or incomplete documents: ${missingDocs.join(', ')}`,
                missingDocs
            });
        }

        next();
    } catch (error) {
        console.error('Error in hasVerifiedDocuments:', error);
        return res.status(500).json({ 
            message: "Error checking document verification status" 
        });
    }
}; 