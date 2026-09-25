import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const vendorSchema = new mongoose.Schema({
    // Basic Info (Step 1)
    vendorName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    
    // Email Verification (Step 2)
    emailVerified: {
        type: Boolean,
        default: false,
    },
    emailVerificationOTP: {
        code: String,
        expiresAt: Date,
    },
    
    // Business Info (Step 3)
    businessInfo: {
        businessName: {
            type: String,
        },
        businessType: {
            type: String,
        },
        productCategory: {
            type: String,
        },
        // address: {
        //     type: String,
        // },
    },
    
    // Documents (Step 4)
    documents: {
        aadhar: {
            number: {
                type: String,
                sparse: true,
                unique: true,
                default: undefined
            },
            document: {
                type: String,
                default: undefined
            }
        },
        pan: {
            number: {
                type: String,
                sparse: true,
                unique: true,
                default: undefined
            },
            document: {
                type: String,
                default: undefined
            }
        },
        gst: {
            number: {
                type: String,
                sparse: true,
                unique: true,
                default: undefined
            },
            document: {
                type: String,
                default: undefined
            },
            required: {
                type: Boolean,
                default: false,
            }
        },
        fssai: {
            number: {
                type: String,
                sparse: true,
                unique: true,
                default: undefined
            },
            document: {
                type: String,
                default: undefined
            },
            required: {
                type: Boolean,
                default: false,
            }
        }
    },
    
 
    
    // Bank Details (Step 5)
    bankDetails: {
        bankName: {
            type: String,
            default: undefined
        },
        accountNumber: {
            type: String,
            sparse: true,
            unique: true,
            default: undefined
        },
        branch: {
            type: String,
            default: undefined
        },
        accountHolderName: {
            type: String,
            default: undefined
        },
        ifscCode: {
            type: String,
            default: undefined
        }
    },
    
    // Registration Progress
    registrationStep: {
        type: Number,
        default: 1,
        enum: [1, 2, 3, 4, 5],
    },
    
    // Admin Approval Status
    adminApproval: {
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        message: {
            type: String,
            default: 'Your registration is pending admin approval.'
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    
    isVerified: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'inactive', 'suspended'],
        default: 'pending',
    },
    role: {
        type: String,
        default: 'vendor',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

// Method to generate auth token
vendorSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { 
            id: this._id,
            email: this.email,
            role: 'vendor',
            status: this.status,
            isVerified: this.isVerified,
            adminApproval: this.adminApproval.status
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Method to generate OTP
vendorSchema.methods.generateEmailVerificationOTP = function() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.emailVerificationOTP = {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // OTP expires in 10 minutes
    };
    return otp;
};

// Method to verify OTP
vendorSchema.methods.verifyEmailOTP = function(otp) {
    if (!this.emailVerificationOTP || !this.emailVerificationOTP.code) {
        return false;
    }
    
    if (Date.now() > this.emailVerificationOTP.expiresAt) {
        return false;
    }
    
    return this.emailVerificationOTP.code === otp;
};

export const Vendor = mongoose.model("Vendor", vendorSchema); 