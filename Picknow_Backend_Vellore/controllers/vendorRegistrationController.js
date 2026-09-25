import { Vendor } from "../models/vendor.js";
import sendMail from "../middelware/sendmail.js";
import { generateEmailTemplate } from "../utils/emailTemplates.js";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { directories } from "../config/directories.js";

// Generate single registration token that will be used throughout the process
export const generateRegistrationToken = (vendorId) => {
    return jwt.sign(
        { 
            vendorId,
            type: 'registration'
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' } // Extended expiry for entire registration process
    );
};

// Verify registration token
const verifyRegistrationToken = (token) => {
    if (!token) {
        throw new Error('Registration token is missing');
    }
    
    console.log('Verifying registration token:', token.substring(0, 15) + '...');
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', { vendorId: decoded.vendorId, type: decoded.type });
        
        if (decoded.type !== 'registration') {
            console.error('Invalid token type found:', decoded.type);
            throw new Error('Invalid token type');
        }
        return decoded;
    } catch (error) {
        console.error('JWT Verification Error:', error.message);
        if (error.name === 'TokenExpiredError') {
            throw new Error('Registration session expired. Please restart the process.');
        }
        throw new Error('Invalid or expired registration token');
    }
};

// Step 1: Initial Registration
export const initiateRegistration = async (req, res) => {
    try {
        const { vendorName, email, password, phoneNumber } = req.body;

        // Check if vendor already exists
        const existingVendor = await Vendor.findOne({ email });
        if (existingVendor) {
            // If vendor exists but hasn't completed registration
            if (existingVendor.registrationStep < 5) {
                // Generate new OTP
                const otp = existingVendor.generateEmailVerificationOTP();
                await existingVendor.save();

                // Generate registration token
                const registrationToken = generateRegistrationToken(existingVendor._id);

                // Send OTP via email
                const emailData = {
                    to: email,
                    subject: "Email Verification OTP - Picknow Vendor Registration",
                    html: generateEmailTemplate({
                        title: "Welcome back to the<br>Picknow Vendor Program!",
                        greetingName: existingVendor.vendorName,
                        mainContent: "Thank you for continuing your vendor registration with Picknow. To verify your email and proceed with your application, please use the OTP below.",
                        otpBox: {
                            title: "Email Verification OTP",
                            code: otp,
                            footer: "This OTP expires in 10 minutes",
                            instructions: "Enter this OTP on the vendor registration page to continue your application."
                        },
                        portalName: "Vendor Partner Portal",
                        portalSubtitle: "Vendor Registration",
                        supportEmail: "vendors@picknow.in"
                    })
                };

                await sendMail(emailData);

                return res.status(200).json({
                    success: true,
                    message: 'Registration continued. OTP sent to email.',
                    token: registrationToken,
                    registrationStep: existingVendor.registrationStep,
                    emailVerified: existingVendor.emailVerified
                });
            }
            return res.status(400).json({ message: "Vendor with this email already exists" });
        }

        // Create new vendor with initial details
        const vendor = new Vendor({
            vendorName,
            email,
            password,
            phoneNumber,
            registrationStep: 1
        });

        // Generate and save OTP
        const otp = vendor.generateEmailVerificationOTP();
        await vendor.save();

        // Generate registration token
        const registrationToken = generateRegistrationToken(vendor._id);

        // Send OTP via email
        const emailData = {
            to: email,
            subject: "Email Verification OTP - Picknow Vendor Registration",
            html: generateEmailTemplate({
                title: "Welcome to the<br>Picknow Vendor Program!",
                greetingName: vendorName,
                mainContent: "Thank you for registering as a vendor on Picknow. To complete your registration, please use the following OTP:",
                otpBox: {
                    title: "Email Verification OTP",
                    code: otp,
                    footer: "This OTP expires in 10 minutes",
                    instructions: "Enter this OTP on the vendor registration page to continue your application."
                },
                portalName: "Vendor Partner Portal",
                portalSubtitle: "Vendor Registration",
                supportEmail: "vendors@picknow.in"
            })
        };

        await sendMail(emailData);

        // Return success response with token
        return res.status(200).json({
            success: true,
            message: 'Registration initiated successfully. OTP sent to email.',
            token: registrationToken,
            registrationStep: 1,
            emailVerified: false
        });
    } catch (error) {
        console.error('Registration initiation error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to initiate registration'
        });
    }
};

// Step 2: Verify Email OTP
export const verifyEmailOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const authHeader = req.headers.authorization;
        console.log('Received Auth Header in verifyEmailOTP:', authHeader ? 'Present' : 'MISSING');
        
        const token = authHeader?.split(" ")[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: "Registration token is required" 
            });
        }

        if (!otp) {
            return res.status(400).json({ 
                success: false,
                message: "OTP is required" 
            });
        }

        const decoded = verifyRegistrationToken(token);
        const vendor = await Vendor.findById(decoded.vendorId);
        
        if (!vendor) {
            return res.status(404).json({ 
                success: false,
                message: "Vendor not found" 
            });
        }

        // Check if vendor is fully registered
        if (vendor.registrationStep >= 5) {
            return res.status(400).json({ 
                success: false,
                message: "Email already registered",
                isFullyRegistered: true
            });
        }

        if (!vendor.verifyEmailOTP(otp)) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid or expired OTP" 
            });
        }

        vendor.emailVerified = true;
        vendor.registrationStep = 3;  // Set to step 3 after OTP verification
        vendor.emailVerificationOTP = undefined;
        await vendor.save();

        // Check if business info is already filled
        const hasBusinessInfo = vendor.businessInfo && 
                              vendor.businessInfo.businessName && 
                              vendor.businessInfo.businessType && 
                              vendor.businessInfo.productCategory;

        return res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            token,
            vendor: {
                id: vendor._id,
                name: vendor.vendorName,
                email: vendor.email,
                phoneNumber: vendor.phoneNumber,
                emailVerified: vendor.emailVerified,
                registrationStep: vendor.registrationStep
            },
            hasBusinessInfo,
            nextStep: hasBusinessInfo ? 5 : 4 // If business info exists, go to step 5, otherwise step 4
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Invalid OTP'
        });
    }
};

// Resend OTP
export const resendOTP = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        
        if (!token) {
            return res.status(401).json({ message: "Registration token is required" });
        }

        const decoded = verifyRegistrationToken(token);
        const vendor = await Vendor.findById(decoded.vendorId);
        
        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        if (vendor.emailVerified) {
            return res.status(400).json({ message: "Email already verified" });
        }

        // Check if previous OTP was sent within last 1 minute
        const lastOTPTime = vendor.emailVerificationOTP?.expiresAt 
            ? new Date(vendor.emailVerificationOTP.expiresAt).getTime() - (60 * 1000) // OTP expiry is set to 60 seconds
            : 0;
        
        const timeElapsed = Date.now() - lastOTPTime;
        if (timeElapsed < 60000) { // 1 minute in milliseconds
            return res.status(429).json({ 
                message: "Please wait before requesting a new OTP",
                retryAfter: Math.ceil((60000 - timeElapsed) / 1000) // seconds to wait
            });
        }

        // Generate a new OTP
        const newOTP = vendor.generateEmailVerificationOTP();
        await vendor.save();

        // Send new OTP via email
        await sendMail({
            to: vendor.email,
            subject: "New OTP - Picknow Vendor Registration",
            html: generateEmailTemplate({
                title: "New Verification OTP",
                greetingName: vendor.vendorName,
                mainContent: "Your new OTP for email verification is below:",
                otpBox: {
                    title: "Email Verification OTP",
                    code: newOTP,
                    footer: "This OTP expires in 10 minutes",
                    instructions: "Enter this OTP on the vendor registration page to continue your application."
                },
                portalName: "Vendor Partner Portal",
                portalSubtitle: "Vendor Registration",
                supportEmail: "vendors@picknow.in"
            })
        });

        return res.status(200).json({
            success: true,
            message: 'OTP resent successfully'
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to resend OTP'
        });
    }
};

// Step 3: Add Business Information
export const addBusinessInfo = async (req, res) => {
    try {
        const { businessName, businessType, productCategory} = req.body;
        const token = req.headers.authorization?.split(" ")[1];
        
        if (!token) {
            return res.status(401).json({ message: "Registration token is required" });
        }

        // Validate required fields
        if (!businessName || !businessType || !productCategory ) {
            return res.status(400).json({ 
                message: "All business information fields are required",
                required: {
                    businessName: !businessName,
                    businessType: !businessType,
                    productCategory: !productCategory,
                }
            });
        }

        // Note: businessType validation removed to allow frontend legal entity categories

        const decoded = verifyRegistrationToken(token);
        const vendor = await Vendor.findById(decoded.vendorId);

        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        if (!vendor.emailVerified) {
            return res.status(400).json({ message: "Please verify your email first" });
        }

        vendor.businessInfo = {
            businessName,
            businessType: businessType.toLowerCase(),
            productCategory,
        };
       
        // Update registration step to 4 (document upload)
        vendor.registrationStep = 4;
        await vendor.save();

        res.status(200).json({
            success: true,
            message: "Business information added successfully. Please proceed with document upload.",
            token,
            registrationStep: vendor.registrationStep
        });
    } catch (error) {
        console.error("Business info update error:", error);
        res.status(500).json({ message: "Failed to update business information", error: error.message });
    }
};

// Combined Step: Upload Documents and Bank Details
export const uploadDocumentsAndBankDetails = async (req, res) => {
    try {
        const { 
            // Bank Details
            bankName,
            accountNumber,
            branch,
            accountHolderName,
            ifscCode,
            // Document Numbers
            aadharNumber,
            panNumber,
            gstNumber,
            fssaiNumber
        } = req.body;

        const token = req.headers.authorization?.split(" ")[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: "Registration token is required" 
            });
        }

        // Validate required bank details
        if (!bankName || !accountNumber || !accountHolderName || !ifscCode) {
            return res.status(400).json({ 
                success: false,
                message: "All bank details are required",
                required: {
                    bankName: !bankName,
                    accountNumber: !accountNumber,
                    accountHolderName: !accountHolderName,
                    ifscCode: !ifscCode
                }
            });
        }

        // Validate required document numbers
        if (!aadharNumber || !panNumber) {
            return res.status(400).json({ 
                success: false,
                message: "Aadhar and PAN numbers are required",
                required: {
                    aadharNumber: !aadharNumber,
                    panNumber: !panNumber
                }
            });
        }

        const decoded = verifyRegistrationToken(token);
        const vendor = await Vendor.findById(decoded.vendorId);

        if (!vendor) {
            return res.status(404).json({ 
                success: false,
                message: "Vendor not found" 
            });
        }

        // Check if business type is food and FSSAI is required
        const isFoodBusiness = vendor.businessInfo.businessType === 'food' || 
                             vendor.businessInfo.productCategory.toLowerCase().includes('food');

        // Check for duplicate account number
        const duplicateAccount = await Vendor.findOne({ "bankDetails.accountNumber": accountNumber });
        if (duplicateAccount && duplicateAccount._id.toString() !== decoded.vendorId) {
            return res.status(400).json({ 
                success: false,
                message: "Bank account number already registered" 
            });
        }

        // Check for duplicate document numbers
        const duplicateChecks = [
            { field: "documents.aadhar.number", value: aadharNumber, message: "Aadhar number already registered" },
            { field: "documents.pan.number", value: panNumber, message: "PAN number already registered" }
        ];

        if (gstNumber) {
            duplicateChecks.push({ 
                field: "documents.gst.number", 
                value: gstNumber, 
                message: "GST number already registered" 
            });
        }
        if (fssaiNumber) {
            duplicateChecks.push({ 
                field: "documents.fssai.number", 
                value: fssaiNumber, 
                message: "FSSAI number already registered" 
            });
        }

        for (const check of duplicateChecks) {
            const duplicate = await Vendor.findOne({ [check.field]: check.value });
            if (duplicate && duplicate._id.toString() !== decoded.vendorId) {
                return res.status(400).json({ message: check.message });
            }
        }

        // Update vendor status
        vendor.status = 'pending';
        vendor.registrationStep = 5;  // Set to step 5 after completing profile
        vendor.adminApproval = {
            status: 'pending',
            message: 'Your registration is under review. We will notify you once approved.',
            updatedAt: new Date()
        };

        // Update business info if not already set
        if (!vendor.businessInfo) {
            vendor.businessInfo = {
                businessName: vendor.vendorName,
                businessType: 'other',  // Default type
                productCategory: 'general',  // Default category
                registrationDate: new Date(),
                status: 'active'
            };
        }

        // Update bank details with additional validation
        vendor.bankDetails = {
            bankName,
            accountNumber,
            branch: branch || bankName,
            accountHolderName,
            ifscCode,
            verified: false,
            lastUpdated: new Date()
        };

        // Update documents with additional metadata
        vendor.documents = {
            aadhar: {
                number: aadharNumber,
                document: req.cloudinaryUrls.aadharDocument?.[0],
                verified: false,
                uploadedAt: new Date()
            },
            pan: {
                number: panNumber,
                document: req.cloudinaryUrls.panDocument?.[0],
                verified: false,
                uploadedAt: new Date()
            }
        };

        // Handle optional GST document
        if (gstNumber || req.cloudinaryUrls.gstDocument?.[0]) {
            vendor.documents.gst = {
                number: gstNumber,
                document: req.cloudinaryUrls.gstDocument?.[0],
                required: false,
                verified: false,
                uploadedAt: new Date()
            };
        }

        // Handle optional FSSAI document for food businesses
        if (isFoodBusiness) {
            if (!fssaiNumber || !req.files?.fssaiDocument) {
                return res.status(400).json({ 
                    message: "FSSAI document and number are required for food businesses",
                    required: {
                        fssaiNumber: !fssaiNumber,
                        fssaiDocument: !req.files?.fssaiDocument
                    }
                });
            }
            vendor.documents.fssai = {
                number: fssaiNumber,
                document: req.cloudinaryUrls.fssaiDocument?.[0],
                required: true,
                verified: false,
                uploadedAt: new Date()
            };
        }

        await vendor.save();

        // Send email notification about pending approval
        const emailData = {
            to: vendor.email,
            subject: "Registration Submitted - Pending Approval",
            html: generateEmailTemplate({
                title: "Registration Submitted<br>Successfully",
                greetingName: vendor.vendorName,
                mainContent: "Your vendor registration has been successfully submitted and is now pending admin approval. We will review your documents and information shortly.<br><br>You will receive another email notification once your registration is approved. Thank you for choosing Picknow!",
                portalName: "Vendor Partner Portal",
                portalSubtitle: "Vendor Registration",
                supportEmail: "vendors@picknow.in"
            })
        };

        try {
            await sendMail(emailData);
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            // Continue with the response even if email fails
        }

        return res.status(200).json({
            success: true,
            message: "Registration completed successfully. Please wait for admin approval.",
            token,
            adminApproval: vendor.adminApproval,
            registrationStep: vendor.registrationStep,
            uploadedFiles: {
                aadhar: req.cloudinaryUrls.aadharDocument?.[0],
                pan: req.cloudinaryUrls.panDocument?.[0],
                gst: req.cloudinaryUrls.gstDocument?.[0],
                fssai: req.cloudinaryUrls.fssaiDocument?.[0]
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ 
            success: false,
            message: "Failed to complete registration", 
            error: error.message 
        });
    }
};

const vendorLogin = async (req, res) => {
    const { email, password } = req.body;

    // Find vendor by email
    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
    }

    // Check if email is verified
    if (!vendor.isVerified) {
        return res.status(403).json({ message: "Please verify your email first" });
    }

    // Check password and proceed with login
    const isMatch = await vendor.comparePassword(password);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token and respond
    const token = vendor.generateAuthToken();
    res.status(200).json({ token });
};

const verifyEmail = async (req, res) => {
    const { token } = req.params;

    // Find vendor by token and verify email
    const vendor = await Vendor.findOne({ verificationToken: token });
    if (!vendor) {
        return res.status(404).json({ message: "Invalid verification token" });
    }

    vendor.isVerified = true; // Update the verification status
    await vendor.save();

    res.status(200).json({ message: "Email verified successfully" });
};

// Check Registration Progress
export const checkRegistrationProgress = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: "Registration token is required" 
            });
        }

        const decoded = verifyRegistrationToken(token);
        const vendor = await Vendor.findById(decoded.vendorId);
        
        if (!vendor) {
            return res.status(404).json({ 
                success: false,
                message: "Vendor not found" 
            });
        }

        return res.status(200).json({
            success: true,
            registrationStep: vendor.registrationStep,
            emailVerified: vendor.emailVerified,
            token,
            vendor: {
                name: vendor.vendorName,
                email: vendor.email,
                phoneNumber: vendor.phoneNumber
            }
        });
    } catch (error) {
        console.error('Registration progress check error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to check registration progress'
        });
    }
}; 