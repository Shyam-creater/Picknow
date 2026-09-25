import { Admin } from "../models/Admin.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Get all admin users
export const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().select('-password');
        return res.status(200).json({
            success: true,
            admins
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Create new admin
export const createAdmin = async (req, res) => {
    try {
        const { name, email, password, role, status } = req.body;

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new admin
        const admin = new Admin({
            name,
            email,
            password: hashedPassword,
            role: role || 'admin',
            status: status || 'active'
        });

        await admin.save();

        // Remove password from response
        const adminResponse = admin.toObject();
        delete adminResponse.password;

        return res.status(201).json({
            success: true,
            message: "Admin created successfully",
            admin: adminResponse
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Update admin
export const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role, status, permissions } = req.body;

        // Check if admin exists
        const admin = await Admin.findById(id);
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // Check if email is being changed and if it's already in use
        if (email && email !== admin.email) {
            const existingAdmin = await Admin.findOne({ email });
            if (existingAdmin) {
                return res.status(400).json({ message: "Email already in use" });
            }
        }

        // Update basic fields
        if (name) admin.name = name;
        if (email) admin.email = email;
        if (role) admin.role = role;
        if (status) admin.status = status;

        // Update permissions if provided
        if (permissions) {
            // Convert permissions to plain object if it's not already
            admin.permissions = typeof permissions === 'object' ? permissions : {};
        }

        // Update password if provided
        if (password) {
            admin.password = await bcrypt.hash(password, 10);
        }

        await admin.save();

        // Remove password from response
        const adminResponse = admin.toObject();
        delete adminResponse.password;

        return res.status(200).json({
            success: true,
            message: "Admin updated successfully",
            admin: adminResponse
        });
    } catch (error) {
        console.error('Update error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete admin
export const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if trying to delete the last super admin
        if (req.body.role === 'super_admin') {
            const superAdmins = await Admin.find({ role: 'super_admin' });
            if (superAdmins.length <= 1) {
                return res.status(400).json({
                    message: "Cannot delete the last super admin"
                });
            }
        }

        const admin = await Admin.findByIdAndDelete(id);
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Admin deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Admin Registration
export const registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if admin already exists
        let existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin Email Already Exists" });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new admin
        const admin = new Admin({ name, email, password: hashedPassword });
        await admin.save();

        res.status(201).json({
            message: "Admin created successfully",
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Admin Login
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check admin email address
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check if admin is active
        if (admin.status === 'inactive') {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive. Please contact super admin."
            });
        }

        // Check password
        const matchPassword = await bcrypt.compare(password, admin.password);
        if (!matchPassword) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate signed token
        const token = jwt.sign(
            {
                _id: admin._id,
                role: admin.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "15d" }
        );

        // Remove password from response
        const adminData = admin.toObject();
        delete adminData.password;

        return res.status(200).json({
            success: true,
            message: `Welcome ${admin.name}`,
            token,
            admin: adminData
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

//Admin Profile
export const myProfile = async (req, res) => {
    try {
        const user = await Admin.findById(req.user._id).select("-password");
        return res.status(200).json({
            admin,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};