import { Vendor } from "../models/vendor.js";
import jwt from "jsonwebtoken";
import { Order } from "../models/order.js";
import  productModel  from "../models/Product.js";
import { generateRegistrationToken } from "./vendorRegistrationController.js";
import sendMail from "../middelware/sendmail.js";
import { generateEmailTemplate } from "../utils/emailTemplates.js";

// Register new vendor
export const registerVendor = async (req, res) => {
    try {
        const {
            displayName,
            email,
            password,
            contact,
            address,
            aadharNumber,
            panNumber,
            gstNumber,
            fssaiNumber,
            bankAccountNumber,
            ifscCode
        } = req.body;

        // Check if vendor already exists
        const existingVendor = await Vendor.findOne({ email });
        if (existingVendor) {
            return res.status(400).json({ message: "Vendor with this email already exists" });
        }

        // Check if required files are uploaded
        if (!req.files || !req.files.aadharDocument || !req.files.panDocument || !req.files.gstDocument) {
            return res.status(400).json({ message: "Please upload all required documents" });
        }

        // Check for duplicate document numbers
        const duplicateAadhar = await Vendor.findOne({ "documents.aadhar.number": aadharNumber });
        if (duplicateAadhar) {
            return res.status(400).json({ message: "Aadhar number already registered" });
        }

        const duplicatePan = await Vendor.findOne({ "documents.pan.number": panNumber });
        if (duplicatePan) {
            return res.status(400).json({ message: "PAN number already registered" });
        }

        const duplicateGst = await Vendor.findOne({ "documents.gst.number": gstNumber });
        if (duplicateGst) {
            return res.status(400).json({ message: "GST number already registered" });
        }

        const duplicateFssai = await Vendor.findOne({ "documents.fssai.number": fssaiNumber });
        if (duplicateFssai) {
            return res.status(400).json({ message: "FSSAI number already registered" });
        }

        const duplicateAccount = await Vendor.findOne({ "bankDetails.accountNumber": bankAccountNumber });
        if (duplicateAccount) {
            return res.status(400).json({ message: "Bank account number already registered" });
        }

        // Create new vendor
        const vendor = new Vendor({
            displayName,
            email,
            password, // Storing password as raw text as requested
            contact,
            address,
            documents: {
                aadhar: {
                    number: aadharNumber,
                    document: req.files.aadharDocument[0].filename
                },
                pan: {
                    number: panNumber,
                    document: req.files.panDocument[0].filename
                },
                gst: {
                    number: gstNumber,
                    document: req.files.gstDocument[0].filename
                },
                fssai: {
                    number: fssaiNumber,
                    document: req.files.fssaiDocument ? req.files.fssaiDocument[0].filename : undefined
                }
            },
            bankDetails: {
                accountNumber: bankAccountNumber,
                ifscCode
            }
        });

        await vendor.save();

        res.status(201).json({
            message: "Vendor registration successful. Please wait for admin approval.",
            vendor: {
                id: vendor._id,
                displayName: vendor.displayName,
                email: vendor.email,
                status: vendor.status
            }
        });
    } catch (error) {
        console.error("Vendor registration error:", error);
        res.status(500).json({ message: "Registration failed", error: error.message });
    }
};

// Vendor Login
export const loginVendor = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const vendor = await Vendor.findOne({ email });
        if (!vendor) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Direct password comparison since we're storing raw passwords
        if (password !== vendor.password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Handle incomplete registration
        if (vendor.registrationStep < 5) {
            const token = generateRegistrationToken(vendor._id);
            return res.status(200).json({
                message: "Registration incomplete",
                incomplete: true,
                vendor: {
                    id: vendor._id,
                    vendorName: vendor.vendorName,
                    email: vendor.email,
                    registrationStep: vendor.registrationStep
                },
                token
            });
        }

        // Check admin approval status
        if (vendor.adminApproval.status === 'pending') {
            return res.status(200).json({ 
                message: "Your registration is still pending admin approval.",
                vendor: {
                    adminApproval: vendor.adminApproval
                }
            });
        }

        if (vendor.adminApproval.status === 'rejected') {
            return res.status(200).json({ 
                message: "Your registration has been rejected.",
                vendor: {
                    adminApproval: vendor.adminApproval
                }
            });
        }

        // Check vendor status
        if (!vendor.isVerified) {
            return res.status(200).json({ 
                message: "Account is not verified. Please contact admin.", 
                unverified: true,
                vendor: {
                    id: vendor._id,
                    vendorName: vendor.vendorName,
                    email: vendor.email
                }
            });
        }

        if (vendor.status !== 'active') {
            return res.status(200).json({ 
                message: `Account is ${vendor.status}. Please contact admin.`, 
                inactive: true,
                vendor: {
                    id: vendor._id,
                    vendorName: vendor.vendorName,
                    email: vendor.email
                }
            });
        }

        const token = vendor.generateAuthToken();

        res.status(200).json({
            message: "Login successful",
            vendor: {
                id: vendor._id,
                vendorName: vendor.vendorName,
                email: vendor.email,
                status: vendor.status,
                isVerified: vendor.isVerified,
                adminApproval: vendor.adminApproval
            },
            token
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed" });
    }
};

// Get vendor profile
export const getVendorProfile = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.user.id).select('-password');
        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }
        res.status(200).json({ vendor });
    } catch (error) {
        console.error("Error fetching vendor profile:", error);
        res.status(500).json({ message: "Failed to fetch vendor profile" });
    }
};

// Update vendor profile
export const updateVendorProfile = async (req, res) => {
    try {
        const { displayName, contact, address } = req.body;
        
        const vendor = await Vendor.findById(req.user.id);
        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        // Update basic information
        if (displayName) vendor.displayName = displayName;
        if (contact) vendor.contact = contact;
        if (address) vendor.address = address;

        // Handle document updates if files are provided
        if (req.files) {
            if (req.files.aadharDocument) {
                vendor.documents.aadhar.document = req.files.aadharDocument[0].filename;
            }
            if (req.files.panDocument) {
                vendor.documents.pan.document = req.files.panDocument[0].filename;
            }
            if (req.files.gstDocument) {
                vendor.documents.gst.document = req.files.gstDocument[0].filename;
            }
            if (req.files.fssaiDocument) {
                vendor.documents.fssai.document = req.files.fssaiDocument[0].filename;
            }
        }

        await vendor.save();

        res.status(200).json({
            message: "Profile updated successfully",
            vendor: {
                id: vendor._id,
                displayName: vendor.displayName,
                email: vendor.email,
                contact: vendor.contact,
                address: vendor.address
            }
        });
    } catch (error) {
        console.error("Error updating vendor profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
};

// Admin Only Controllers

// Get all vendors (Admin only)
export const getAllVendors = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        }

        const vendors = await Vendor.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        // Transform document URLs for all vendors
        vendors.forEach(vendor => {
            if (vendor.documents) {
                Object.keys(vendor.documents).forEach(docType => {
                    if (vendor.documents[docType]?.document) {
                        // Ensure the URL is properly formatted
                        const docUrl = vendor.documents[docType].document;
                        if (!docUrl.startsWith('http')) {
                            vendor.documents[docType].document = `${process.env.CLOUDINARY_URL || 'https://res.cloudinary.com/dnwxrqvth/'}${docUrl}`;
                        }
                    }
                });
            }
        });

        res.status(200).json({
            count: vendors.length,
            vendors
        });
    } catch (error) {
        console.error("Error fetching vendors:", error);
        res.status(500).json({ message: "Failed to fetch vendors" });
    }
};

// Get vendor by ID (Admin only)
export const getVendorById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Fetching vendor with ID:', id);
        
        const vendor = await Vendor.findById(id)
            .select('-password')
            .lean();

        if (!vendor) {
            console.log('Vendor not found for ID:', id);
            return res.status(404).json({ message: "Vendor not found" });
        }

        // Transform document URLs
        if (vendor.documents) {
            Object.keys(vendor.documents).forEach(docType => {
                if (vendor.documents[docType]?.document) {
                    // Ensure the URL is properly formatted
                    const docUrl = vendor.documents[docType].document;
                    if (!docUrl.startsWith('http')) {
                        vendor.documents[docType].document = `${process.env.CLOUDINARY_URL || 'https://res.cloudinary.com/dnwxrqvth/'}${docUrl}`;
                    }
                }
            });
        }
        
        console.log('Found vendor:', vendor.vendorName);
        res.status(200).json({ vendor });
    } catch (error) {
        console.error("Error fetching vendor:", error);
        res.status(500).json({ message: "Failed to fetch vendor details" });
    }
};

// Update vendor status (Admin only)
export const updateVendorStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminApprovalStatus, adminMessage, status } = req.body;
        
        console.log('Updating vendor status:', { id, adminApprovalStatus, adminMessage, status });

        const vendor = await Vendor.findById(id);
        if (!vendor) {
            console.log('Vendor not found for ID:', id);
            return res.status(404).json({ message: "Vendor not found" });
        }

        // Update admin approval status if provided
        if (adminApprovalStatus) {
            vendor.adminApproval = {
                status: adminApprovalStatus,
                message: adminMessage || 
                    (adminApprovalStatus === 'approved' ? 
                        'Your registration has been approved. You can now start using your account.' :
                        adminApprovalStatus === 'rejected' ? 
                        'Your registration has been rejected. Please contact support for more information.' :
                        'Your registration is under review.'),
                updatedAt: new Date()
            };

            // If approved, set status to active and isVerified to true
            if (adminApprovalStatus === 'approved') {
                vendor.status = 'active';
                vendor.isVerified = true;

                // Send Approval Email
                try {
                    await sendMail({
                        to: vendor.email,
                        subject: "Registration Approved - Welcome to Picknow Vendor Program!",
                        html: generateEmailTemplate({
                            title: "Congratulations!<br>Your account has been approved.",
                            greetingName: vendor.vendorName,
                            mainContent: "We are pleased to inform you that your registration for the Picknow Vendor Program has been approved. You can now log in to your dashboard to manage your products and orders.",
                            portalName: "Vendor Partner Portal",
                            portalSubtitle: "Account Approval",
                            supportEmail: "vendors@picknow.in"
                        })
                    });
                    console.log('Approval email sent to vendor:', vendor.email);
                } catch (emailError) {
                    console.error('Failed to send approval email:', emailError);
                    // We don't fail the entire process if email fails, but we log it
                }
            } else if (adminApprovalStatus === 'rejected') {
                vendor.status = 'inactive';
                vendor.isVerified = false;

                // Optional: Send Rejection Email
                try {
                    await sendMail({
                        to: vendor.email,
                        subject: "Update on your Registration - Picknow Vendor Program",
                        html: generateEmailTemplate({
                            title: "Registration Update",
                            greetingName: vendor.vendorName,
                            mainContent: `Thank you for your interest in Picknow. After reviewing your application, we regret to inform you that your registration could not be approved at this time.<br><br><strong>Reason:</strong> ${adminMessage || 'Incomplete documentation or information.'}`,
                            portalName: "Vendor Partner Portal",
                            portalSubtitle: "Account Status",
                            supportEmail: "vendors@picknow.in"
                        })
                    });
                    console.log('Rejection email sent to vendor:', vendor.email);
                } catch (emailError) {
                    console.error('Failed to send rejection email:', emailError);
                }
            }
        }

        // Update vendor status if provided
        if (status) {
            vendor.status = status;
        }

        await vendor.save();
        console.log('Vendor status updated successfully:', vendor.vendorName);

        res.status(200).json({
            message: "Vendor status updated successfully",
            vendor: {
                id: vendor._id,
                vendorName: vendor.vendorName,
                email: vendor.email,
                status: vendor.status,
                isVerified: vendor.isVerified,
                adminApproval: vendor.adminApproval
            }
        });
    } catch (error) {
        console.error("Error updating vendor status:", error);
        res.status(500).json({ message: "Failed to update vendor status" });
    }
};

// Delete vendor (Admin only)
export const deleteVendor = async (req, res) => {
    try {
        const { id } = req.params;
        const vendor = await Vendor.findByIdAndDelete(id);
        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }
        res.status(200).json({ message: "Vendor deleted successfully" });
    } catch (error) {
        console.error("Error deleting vendor:", error);
        res.status(500).json({ message: "Failed to delete vendor" });
    }
}; 

// // Add product by vendor
// export const addProductByVendor = async (req, res) => {
//     try {
//         const token = req.headers.authorization?.split(" ")[1];
//         if (!token) {
//             return res.status(401).json({ message: "Authorization token is required" });
//         }

//         const decoded = verifyRegistrationToken(token);
//         const vendor = await Vendor.findById(decoded.vendorId);

//         if (!vendor) {
//             return res.status(404).json({ message: "Vendor not found" });
//         }

//         const { pName, pShortDescription, pDescription, pPrice, pQuantity, pStock, pOffer, pTax, pStatus, pBrand } = req.body;

//         // Validate business type and product category
//         if (vendor.businessInfo.businessType !== req.body.businessType ||
//             vendor.businessInfo.productCategory !== req.body.productCategory) {
//             return res.status(400).json({ message: "Business type or product category does not match vendor registration" });
//         }

//         // Validate required fields
//         if (!pName || !pShortDescription || !pDescription || !pPrice || !pQuantity || !pStock || !pOffer || !pTax || !pStatus || !pBrand) {
//             return res.status(400).json({ message: "All fields are required." });
//         }

//         // Validate numeric fields
//         if (isNaN(pPrice) || pPrice <= 0) {
//             return res.status(400).json({ message: "Price must be a positive number." });
//         }
//         if (isNaN(pStock) || pStock < 0) {
//             return res.status(400).json({ message: "Stock must be a non-negative number." });
//         }
//         if (isNaN(pTax) || pTax < 0) {
//             return res.status(400).json({ message: "Tax must be a non-negative number." });
//         }

//         // Validate image upload
//         if (!req.files || req.files.length === 0) {
//             return res.status(400).json({ message: "Please upload at least one image." });
//         }

//         const Images = req.files.map(file => file.path);

//         // Create product data object
//         const productData = {
//             pName,
//             pShortDescription,
//             pDescription,
//             pCategory: vendor.businessInfo.productCategory,
//             pPrice: Number(pPrice),
//             pQuantity,
//             pStock: Number(pStock),
//             pImage: Images,
//             pOffer,
//             pTax: Number(pTax),
//             pStatus,
//             pBrand,
//             pSold: 0,
//             createdBy: vendor.vendorName
//         };

//         // Save product to database
//         const product = await productModel.create(productData);

//         res.status(201).json({
//             message: "Product added successfully.",
//             product
//         });
//     } catch (error) {
//         console.error("Error adding product:", error);
//         res.status(500).json({ message: "Failed to add product", error: error.message });
//     }
// };

// // Update product by vendor
// export const updateProductByVendor = async (req, res) => {
//     try {
//         const token = req.headers.authorization?.split(" ")[1];
//         if (!token) {
//             return res.status(401).json({ message: "Authorization token is required" });
//         }

//         const decoded = verifyRegistrationToken(token);
//         const vendor = await Vendor.findById(decoded.vendorId);

//         if (!vendor) {
//             return res.status(404).json({ message: "Vendor not found" });
//         }

//         const { productId } = req.params;
//         const product = await productModel.findById(productId);

//         if (!product || product.createdBy !== vendor.vendorName) {
//             return res.status(404).json({ message: "Product not found or unauthorized" });
//         }

//         const { pName, pShortDescription, pDescription, pPrice, pQuantity, pStock, pOffer, pTax, pStatus, pBrand } = req.body;

//         // Update fields if provided
//         if (pName) product.pName = pName;
//         if (pShortDescription) product.pShortDescription = pShortDescription;
//         if (pDescription) product.pDescription = pDescription;
//         if (pPrice) product.pPrice = Number(pPrice);
//         if (pQuantity) product.pQuantity = pQuantity;
//         if (pStock) product.pStock = Number(pStock);
//         if (pOffer) product.pOffer = pOffer;
//         if (pTax) product.pTax = Number(pTax);
//         if (pStatus) product.pStatus = pStatus;
//         if (pBrand) product.pBrand = pBrand;

//         // Handle image updates
//         if (req.files && req.files.length > 0) {
//             product.pImage = req.files.map(file => file.path);
//         }

//         await product.save();

//         res.status(200).json({
//             success: true,
//             message: "Product updated successfully",
//             product
//         });
//     } catch (error) {
//         console.error("Error updating product:", error);
//         res.status(500).json({ message: "Failed to update product", error: error.message });
//     }
// };

// // Delete product by vendor
// export const deleteProductByVendor = async (req, res) => {
//     try {
//         const token = req.headers.authorization?.split(" ")[1];
//         if (!token) {
//             return res.status(401).json({ message: "Authorization token is required" });
//         }

//         const decoded = verifyRegistrationToken(token);
//         const vendor = await Vendor.findById(decoded.vendorId);

//         if (!vendor) {
//             return res.status(404).json({ message: "Vendor not found" });
//         }

//         const { productId } = req.params;
//         const product = await productModel.findById(productId);

//         if (!product || product.createdBy !== vendor.vendorName) {
//             return res.status(404).json({ message: "Product not found or unauthorized" });
//         }

//         await product.remove();

//         res.status(200).json({
//             success: true,
//             message: "Product deleted successfully"
//         });
//     } catch (error) {
//         console.error("Error deleting product:", error);
//         res.status(500).json({ message: "Failed to delete product", error: error.message });
//     }
// };

// // Get products by vendor
// export const getProductsByVendor = async (req, res) => {
//     try {
//         const token = req.headers.authorization?.split(" ")[1];
//         if (!token) {
//             return res.status(401).json({ message: "Authorization token is required" });
//         }

//         const decoded = verifyRegistrationToken(token);
//         const vendor = await Vendor.findById(decoded.vendorId);

//         if (!vendor) {
//             return res.status(404).json({ message: "Vendor not found" });
//         }

//         const products = await productModel.find({ createdBy: vendor.vendorName });

//         res.status(200).json({
//             success: true,
//             count: products.length,
//             products
//         });
//     } catch (error) {
//         console.error("Error fetching products:", error);
//         res.status(500).json({ message: "Failed to fetch products", error: error.message });
//     }
// };


//get orders by vendor's product 

// Get vendor dashboard statistics
export const getVendorDashboard = async (req, res) => {
    try {
        const vendorId = req.user.id;
        
        // Get current date and last month's date
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Get yesterday's date
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        // Get total sales for current month
        const currentMonthSales = await Order.aggregate([
            {
                $match: {
                    'items.product': { $in: await getVendorProducts(vendorId) },
                    createdAt: { $gte: thisMonth },
                    orderStatus: { $in: ['CONFIRMED', 'DELIVERED', 'SHIPPED', 'DISPATCHED'] },
                    paymentStatus: { $in: ['PAID', 'COMPLETED'] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$finalAmount' }
                }
            }
        ]);

        // Get total sales for last month
        const lastMonthSales = await Order.aggregate([
            {
                $match: {
                    'items.product': { $in: await getVendorProducts(vendorId) },
                    createdAt: { $gte: lastMonth, $lt: thisMonth },
                    orderStatus: { $in: ['CONFIRMED', 'DELIVERED', 'SHIPPED', 'DISPATCHED'] },
                    paymentStatus: { $in: ['PAID', 'COMPLETED'] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$finalAmount' }
                }
            }
        ]);

        // Calculate sales growth
        const currentSales = currentMonthSales[0]?.total || 0;
        const previousSales = lastMonthSales[0]?.total || 0;
        const salesGrowth = previousSales === 0 ? 100 : ((currentSales - previousSales) / previousSales) * 100;

        // Calculate revenue (after 15% deduction)
        const revenue = currentSales * 0.85; // 85% of total sales

        // Get total orders
        const totalOrders = await Order.countDocuments({
            'items.product': { $in: await getVendorProducts(vendorId) },
            orderStatus: { $in: ['CONFIRMED', 'DELIVERED', 'SHIPPED', 'DISPATCHED'] }
        });

        // Get last month's orders
        const lastMonthOrders = await Order.countDocuments({
            'items.product': { $in: await getVendorProducts(vendorId) },
            createdAt: { $gte: lastMonth, $lt: thisMonth },
            orderStatus: { $in: ['CONFIRMED', 'DELIVERED', 'SHIPPED', 'DISPATCHED'] }
        });

        // Calculate order growth
        const orderGrowth = lastMonthOrders === 0 ? 100 : ((totalOrders - lastMonthOrders) / lastMonthOrders) * 100;

        // Get pending orders
        const pendingOrders = await Order.countDocuments({
            'items.product': { $in: await getVendorProducts(vendorId) },
            orderStatus: 'ORDER PLACED'
        });

        // Get yesterday's pending orders
        const yesterdayPendingOrders = await Order.countDocuments({
            'items.product': { $in: await getVendorProducts(vendorId) },
            orderStatus: 'ORDER PLACED',
            createdAt: { $lt: yesterday }
        });

        // Get total products
        const totalProducts = await productModel.countDocuments({ vendorId });

        // Get recent orders
        const recentOrders = await Order.find({
            'items.product': { $in: await getVendorProducts(vendorId) }
        })
        .populate('user', 'name')
        .sort('-createdAt')
        .limit(5)
        .select('_id user finalAmount orderStatus createdAt');

        // Get top selling products
        const topProducts = await Order.aggregate([
            {
                $match: {
                    'items.product': { $in: await getVendorProducts(vendorId) },
                    orderStatus: { $in: ['CONFIRMED', 'DELIVERED', 'SHIPPED', 'DISPATCHED'] }
                }
            },
            {
                $unwind: '$items'
            },
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $unwind: '$productDetails'
            },
            {
                $project: {
                    _id: 1,
                    name: '$productDetails.pName',
                    unitsSold: '$totalSold',
                    revenue: '$totalRevenue'
                }
            },
            {
                $sort: { unitsSold: -1 }
            },
            {
                $limit: 4
            }
        ]);

        res.status(200).json({
            stats: {
                totalSales: currentSales,
                revenue: revenue,
                salesGrowth: salesGrowth.toFixed(1),
                totalOrders,
                orderGrowth: orderGrowth.toFixed(1),
                pendingOrders,
                pendingOrdersChange: pendingOrders - yesterdayPendingOrders,
                totalProducts
            },
            recentOrders: recentOrders.map(order => ({
                orderId: order._id,
                customer: order.user.name,
                amount: order.finalAmount,
                status: order.orderStatus,
                date: order.createdAt
            })),
            topProducts: topProducts.map(product => ({
                productId: product._id,
                name: product.name,
                unitsSold: product.unitsSold,
                revenue: product.revenue
            }))
        });
    } catch (error) {
        console.error("Error fetching vendor dashboard:", error);
        res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
};

// Helper function to get vendor's product IDs
async function getVendorProducts(vendorId) {
    const products = await productModel.find({ vendorId }).select('_id');
    return products.map(p => p._id);
}
