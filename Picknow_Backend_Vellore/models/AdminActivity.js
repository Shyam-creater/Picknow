import mongoose from "mongoose";

const adminActivitySchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['create', 'update', 'delete', 'login', 'logout', 'status_change', 'permission_change']
    },
    module: {
        type: String,
        required: true,
        enum: ['user', 'product', 'category', 'vendor', 'order', 'admin', 'system']
    },
    details: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, { timestamps: true });

export const AdminActivity = mongoose.model("adminActivity", adminActivitySchema); 