import { comboModel } from "../models/combo.js";
import productModel from "../models/Product.js";
import mongoose from "mongoose";
import { deleteFiles, getFullPath } from "../utils/fileUtils.js";
import path from 'path';

// Create new combo
export const createCombo = async (req, res) => {
    try {
        // Ensure user is admin
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
            return res.status(403).json({
                success: false,
                message: "Only admins can create combos",
                userRole: req.user?.role || 'none'
            });
        }

        const {
            ccName,
            ccDescription,
            ccPrice,    
            ccOffer,
            ccQuantity,
            ccStatus,
            products: inputProducts
        } = req.body;

        console.log('Received request body:', req.body);
        console.log('Input products:', inputProducts);

        // Parse products if it's a string
        let parsedProducts = inputProducts;
        if (typeof inputProducts === 'string') {
            try {
                parsedProducts = JSON.parse(inputProducts);
            } catch (e) {
                console.error('Error parsing products:', e);
                return res.status(400).json({
                    success: false,
                    message: "Invalid products format",
                    error: e.message
                });
            }
        }
        
        // Ensure parsedProducts is an array
        if (!Array.isArray(parsedProducts)) {
            return res.status(400).json({
                success: false,
                message: "Products must be an array",
                received: typeof parsedProducts
            });
        }
        
        console.log('Parsed products:', parsedProducts);

        // Validate required fields
        if (!ccName || !ccDescription || !ccPrice || !ccQuantity || !parsedProducts) {
            return res.status(400).json({
                success: false,
                message: "All fields are required.",
                received: {
                    ccName,
                    ccDescription,
                    ccPrice,
                    ccQuantity,
                    products: parsedProducts
                }
            });
        }

        // Extract product IDs and validate products exist
        const productIds = parsedProducts.map(p => p.product);
        const foundProducts = await productModel.find({ _id: { $in: productIds } });

        if (foundProducts.length !== productIds.length) {
            return res.status(400).json({
                success: false,
                message: "One or more products not found.",
                foundProducts: foundProducts.length,
                requestedProducts: productIds.length,
                productIds: productIds,
                foundProductIds: foundProducts.map(p => p._id)
            });
        }

        // Validate variant data
        for (const product of parsedProducts) {
            if (product.variant) {
                if (!product.variant.size || !product.variant.type) {
                    return res.status(400).json({
                        success: false,
                        message: "Variant size and type are required for all products with variants.",
                        product: product.product
                    });
                }
                
                // Validate variant type enum
                const validTypes = ['size', 'color', 'weight'];
                if (!validTypes.includes(product.variant.type)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid variant type. Must be one of: size, color, weight",
                        product: product.product,
                        variantType: product.variant.type
                    });
                }
            }
        }

        // Prepare combo data with product & variant quantity
        var comboData = {
            ccName,
            ccDescription,
            ccPrice: Number(ccPrice),
            ccOffer: Number(ccOffer || 0),
            ccQuantity: Number(ccQuantity),
            ccStatus: ccStatus || 'active',
            ccProducts: parsedProducts.map(p => ({
                product: p.product,
                quantity: Number(p.quantity) || 1, // Product quantity
                variant: p.variant ? {
                    _id: p.variant._id,
                    size: p.variant.size,
                    type: p.variant.type,
                    price: p.variant.price
                    } : null
            }))
        };

        console.log('Create - Combo data to save:', comboData);

        if (req.file) {
            comboData.ccImage = req.file.path;
            console.log('Image uploaded:', req.file.path);
        }

        console.log('Attempting to create combo with data:', JSON.stringify(comboData, null, 2));
        const combo = await comboModel.create(comboData);

        res.status(201).json({
            success: true,
            message: "Combo created successfully.",
            combo
        });
    } catch (error) {
        console.error("Error creating combo:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get all combos
export const getAllCombos = async (req, res) => {
    try {
        const combos = await comboModel.aggregate([
            {
                '$lookup': {
                    'from': 'products',
                    'localField': 'ccProducts.product',
                    'foreignField': '_id',
                    'as': 'products'
                }
            },
            {
                '$lookup': {
                    'from': 'productvariants',
                    'localField': 'ccProducts.variant._id',
                    'foreignField': '_id',
                    'as': 'variants'
                }
            },
            {
                '$addFields': {
                    'ccProducts': {
                        '$map': {
                            'input': '$ccProducts',
                            'as': 'product',
                            'in': {
                                '$mergeObjects': [
                                    {
                                        '$arrayElemAt': [
                                            {
                                                '$filter': {
                                                    'input': '$products',
                                                    'as': 'p',
                                                    'cond': { '$eq': ['$$p._id', '$$product.product'] }
                                                }
                                            },
                                            0
                                        ]
                                    },
                                    {
                                        'quantity': '$$product.quantity'
                                    },
                                    {
                                        'variant': {
                                            '$arrayElemAt': [
                                                {
                                                    '$filter': {
                                                        'input': '$variants',
                                                        'as': 'v',
                                                        'cond': { '$eq': ['$$v._id', '$$product.variant._id'] }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                '$project': {
                    'products': 0,
                    'variants': 0
                }
            }
        ]).exec();
        
        res.status(200).json(combos);
    } catch (error) {
        console.error('Error fetching combos:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching combos',
            error: error.message 
        });
    }
};


// Get combo by ID
export const getComboById = async (req, res) => {
    try {
        // const combo = await comboModel.findById(req.params.id).populate('ccProducts');
       
       
        const combos = await comboModel.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
            {
                '$lookup': {
                    'from': 'products',
                    'localField': 'ccProducts.product',
                    'foreignField': '_id',
                    'as': 'products'
                }
            },
            {
                '$lookup': {
                    'from': 'productvariants',
                    'localField': 'ccProducts.variant._id',
                    'foreignField': '_id',
                    'as': 'variants'
                }
            },
            {
                '$addFields': {
                    'ccProducts': {
                        '$map': {
                            'input': '$ccProducts',
                            'as': 'product',
                            'in': {
                                '$mergeObjects': [
                                    {
                                        '$arrayElemAt': [
                                            {
                                                '$filter': {
                                                    'input': '$products',
                                                    'as': 'p',
                                                    'cond': { '$eq': ['$$p._id', '$$product.product'] }
                                                }
                                            },
                                            0
                                        ]
                                    },
                                    {
                                        'quantity': '$$product.quantity'
                                    },
                                    {
                                        'variant': {
                                            '$arrayElemAt': [
                                                {
                                                    '$filter': {
                                                        'input': '$variants',
                                                        'as': 'v',
                                                        'cond': { '$eq': ['$$v._id', '$$product.variant._id'] }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                '$project': {
                    'products': 0,
                    'variants': 0
                }
            }
        ]).exec();
       
        if (!combos) {
            return res.status(404).json({
                success: false,
                message: "Combo not found"
            });
        }
        res.status(200).json({
            success: true,
            combo: combos[0]
        });
    } catch (error) {
        console.error("Error fetching combo:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching combo"
        });
    }
};

// Get products by combo ID
export const getProductsByCombo = async (req, res) => {
    try {
        const combo = await comboModel.findById(req.params.id)
            .populate({
                path: 'ccProducts',
                select: 'pName pDescription pPrice pImage pQuantity pOffer pStatus' // Select only needed fields
            });

        if (!combo) {
            return res.status(404).json({
                success: false,
                message: "Combo not found"
            });
        }

        // Filter out inactive products
        const activeProducts = combo.ccProducts.filter(product => product.pStatus === 'active');

        res.status(200).json({
            success: true,
            combo: {
                _id: combo._id,
                name: combo.ccName,
                description: combo.ccDescription,
                price: combo.ccPrice,
                offer: combo.ccOffer,
                image: combo.ccImage,
                quantity: combo.ccQuantity,
                status: combo.ccStatus
            },
            products: activeProducts
        });
    } catch (error) {
        console.error("Error fetching combo products:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching combo products"
        });
    }
};

// Update combo
export const updateCombo = async (req, res) => {
    try {
        // Ensure user is admin
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
            return res.status(403).json({ message: "Only admins can update combos" });
        }

        const combo = await comboModel.findById(req.query.id);
        if (!combo) {
            return res.status(404).json({ message: "Combo not found" });
        }

        const {
            ccName,
            ccDescription,
            ccPrice,
            ccOffer,
            ccQuantity,
            ccStatus,
            products: inputProducts,
            ccImage
        } = req.body;

        console.log('Update - Received request body:', req.body);
        console.log('Update - Input products:', inputProducts);

        // Validate required fields
        if (!ccName || !ccDescription || !ccPrice || !ccQuantity || !inputProducts) {
            return res.status(400).json({
                message: "Missing required fields",
                received: {
                    ccName,
                    ccDescription,
                    ccPrice,
                    ccQuantity,
                    products: inputProducts
                }
            });
        }

        // Parse products if it's a string
        let parsedProducts = inputProducts;
        if (typeof inputProducts === 'string') {
            try {
                parsedProducts = JSON.parse(inputProducts);
            } catch (e) {
                console.error("Error parsing products:", e);
                return res.status(400).json({
                    message: "Invalid products format",
                    received: inputProducts
                });
            }
        }

        // Extract product IDs and validate products exist
        const productIds = parsedProducts.map(p => p.product);
        const foundProducts = await productModel.find({ _id: { $in: productIds } });

        if (foundProducts.length !== productIds.length) {
            const foundIds = foundProducts.map(p => p._id.toString());
            const missingIds = productIds.filter(id => !foundIds.includes(id.toString()));

            return res.status(400).json({
                message: "One or more products not found",
                found: foundProducts.length,
                requested: productIds.length,
                requestedIds: productIds,
                foundProductIds: foundIds,
                missingIds: missingIds
            });
        }

        // Validate variant data
        for (const product of parsedProducts) {
            if (product.variant) {
                if (!product.variant._id || !product.variant.size || !product.variant.type) {
                    return res.status(400).json({
                        success: false,
                        message: "Variant ID, size and type are required for all products with variants.",
                        product: product.product
                    });
                }
            }
        }

        // Update combo fields with product & variant quantity
        combo.ccName = ccName;
        combo.ccDescription = ccDescription;
        combo.ccPrice = Number(ccPrice);
        combo.ccOffer = Number(ccOffer || 0);
        combo.ccQuantity = Number(ccQuantity);
        combo.ccStatus = ccStatus || combo.ccStatus;
        combo.ccProducts = parsedProducts.map(p => ({
            product: p.product,
            quantity: Number(p.quantity) || 1, // Product quantity
            variant: p.variant ? {
                _id: p.variant._id,
                size: p.variant.size,
                type: p.variant.type,
                price: p.variant.price || 0
            } : null
        }));

        console.log('Update - Combo data to save:', combo.ccProducts);

        // Update images if provided
        if (ccImage && ccImage.length > 0) {
            combo.ccImage = ccImage[0];
        }

        await combo.save();

        // Fetch the updated combo with populated data
        const updatedCombo = await comboModel.aggregate([
            { $match: { _id: combo._id } },
            {
                '$lookup': {
                    'from': 'products',
                    'localField': 'ccProducts.product',
                    'foreignField': '_id',
                    'as': 'products'
                }
            },
            {
                '$lookup': {
                    'from': 'productvariants',
                    'localField': 'ccProducts.variant._id',
                    'foreignField': '_id',
                    'as': 'variants'
                }
            },
            {
                '$addFields': {
                    'ccProducts': {
                        '$map': {
                            'input': '$ccProducts',
                            'as': 'product',
                            'in': {
                                '$mergeObjects': [
                                    {
                                        '$arrayElemAt': [
                                            {
                                                '$filter': {
                                                    'input': '$products',
                                                    'as': 'p',
                                                    'cond': { '$eq': ['$$p._id', '$$product.product'] }
                                                }
                                            },
                                            0
                                        ]
                                    },
                                    {
                                        'quantity': '$$product.quantity'
                                    },
                                    {
                                        'variant': {
                                            '$arrayElemAt': [
                                                {
                                                    '$filter': {
                                                        'input': '$variants',
                                                        'as': 'v',
                                                        'cond': { '$eq': ['$$v._id', '$$product.variant._id'] }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                '$project': {
                    'products': 0,
                    'variants': 0
                }
            }
        ]).exec();

        res.status(200).json({
            success: true,
            message: "Combo updated successfully",
            combo: combo
        });

    } catch (error) {
        console.error("Error updating combo:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const deleteCombo = async (req, res) => {
    try {
        // Ensure user is admin
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
            return res.status(403).json({ message: "Only admins can delete combos" });
        }

        const combo = await comboModel.findById(req.query.id);
        if (!combo) {
            return res.status(404).json({ message: "Combo not found" });
        }

        // Delete the combo from database
        await combo.deleteOne({ _id: req.query.id });

        res.status(200).json({ message: "Combo deleted successfully" });
    } catch (error) {
        console.error("Error deleting combo:", error);
        res.status(500).json({ message: "Internal server error", "error": error });
    }
};