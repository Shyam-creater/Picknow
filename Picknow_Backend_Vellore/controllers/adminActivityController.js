import { AdminActivity } from "../models/AdminActivity.js";
import mongoose from "mongoose";

// Get all admin activities with pagination and filters
export const getAdminActivities = async (req, res) => {
    try {
        const { page = 1, limit = 10, action, module, startDate, endDate } = req.query;
        const query = {};

        // Apply filters if provided
        if (action) query.action = action;
        if (module) query.module = module;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const activities = await AdminActivity.find(query)
            .populate('adminId', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const total = await AdminActivity.countDocuments(query);

        return res.status(200).json({
            success: true,
            activities,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Create new admin activity log
export const createAdminActivity = async (req, res) => {
    try {
        const { adminId, action, module, details, userAgent } = req.body;
        
        // Validate required fields
        if (!adminId || !action || !module || !details) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: adminId, action, module, and details are required"
            });
        }

        // Get IP address from request
        const ipAddress = req.headers['x-forwarded-for'] || 
                         req.connection.remoteAddress || 
                         req.socket.remoteAddress || 
                         req.ip || '';

        console.log('Creating admin activity:', { 
            adminId, action, module, details, ipAddress, userAgent
        });

        // Ensure adminId is a valid ObjectId
        const validAdminId = mongoose.Types.ObjectId.isValid(adminId) 
            ? adminId 
            : null;

        if (!validAdminId) {
            console.error('Invalid adminId:', adminId);
            return res.status(400).json({
                success: false,
                message: "Invalid adminId format"
            });
        }

        const activity = new AdminActivity({
            adminId: validAdminId,
            action,
            module,
            details,
            ipAddress,
            userAgent
        });

        const savedActivity = await activity.save();
        console.log('Activity saved successfully:', savedActivity);

        return res.status(201).json({
            success: true,
            message: "Activity logged successfully",
            activity: savedActivity
        });
    } catch (error) {
        console.error('Error creating admin activity:', error);
        return res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Get activity statistics
export const getActivityStats = async (req, res) => {
    try {
        const stats = await AdminActivity.aggregate([
            {
                $group: {
                    _id: {
                        action: "$action",
                        module: "$module"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.module",
                    actions: {
                        $push: {
                            action: "$_id.action",
                            count: "$count"
                        }
                    },
                    totalCount: { $sum: "$count" }
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}; 