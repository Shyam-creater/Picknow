import productModel from "../models/Product.js";
import { comboModel } from "../models/combo.js";
import { categoryModel } from "../models/Category.js";

// Main search function with enhanced filtering and sorting
export const search = async (req, res) => {
    try {
        const {
            query,
            type = 'all',
            pType, // optional product type filter (e.g., 'product', 'voucher', etc.)
            category,
            minPrice,
            maxPrice,
            brand,           // Added brand filter
            inStock,         // Added stock filter
            sort = 'relevance',
            page = 1,
            limit = 10,
            comboLimit // optional: allow overriding combos page-size for type=all
        } = req.query;

        // Enhanced search conditions
        const searchQuery = {
            $and: [
                query ? {
                    $or: [
                        { pName: { $regex: query, $options: 'i' } },
                        { pDescription: { $regex: query, $options: 'i' } },
                        { pShortDescription: { $regex: query, $options: 'i' } },
                        { pBrand: { $regex: query, $options: 'i' } }
                    ]
                } : {},
                // Stock filter
                inStock === 'true' ? { pStock: { $gt: 0 } } : {},
                // Brand filter
                brand ? { pBrand: brand } : {},
                // Active products only
                { pStatus: { $regex: new RegExp("^(active|Out of Stock)$", "i") } }
            ]
        };

        // Price range filter
        if (minPrice || maxPrice) {
            searchQuery.$and.push({
                pPrice: {
                    ...(minPrice && { $gte: Number(minPrice) }),
                    ...(maxPrice && { $lte: Number(maxPrice) })
                }
            });
        }

        // Category filter
        if (category) {
            searchQuery.$and.push({ pCategory: category });
        }

        // Product type filter (only applies to products collection)
        if (pType && pType.toLowerCase() !== 'all' && pType.toLowerCase() !== 'combo' && pType.toLowerCase() !== 'combos') {
            searchQuery.$and.push({ pType });
        }

        // Enhanced sort options
        let sortOptions = {};
        switch (sort) {
            case 'price_asc':
                sortOptions = { pPrice: 1 };
                break;
            case 'price_desc':
                sortOptions = { pPrice: -1 };
                break;
            case 'newest':
                sortOptions = { createdAt: -1 };
                break;
            case 'bestselling':
                sortOptions = { pSold: -1 };
                break;
            case 'rating':
                sortOptions = { 'averageRating': -1 };
                break;
            case 'name_asc':
                sortOptions = { pName: 1 };
                break;
            case 'name_desc':
                sortOptions = { pName: -1 };
                break;
            default:
                sortOptions = { _id: -1 };
        }

        // Pagination
        const skip = (page - 1) * limit;

        // Execute search based on type
        let results = {};
        let facets = {};

        switch (type.toLowerCase()) {
            case 'products':
                results.products = await searchProducts(searchQuery, sortOptions, skip, limit);
                facets = await getProductFacets(searchQuery);
                break;

            case 'combos':
                results.combos = await searchCombos(query, sortOptions, skip, limit);
                // No product facets when viewing combos only
                break;

            case 'all':
            default:
                // For combined search, return full set of combos up to a larger cap
                // Use an independent limit for combos so all matches are visible
                const combosPageSize = Number(comboLimit) || 50;
                const [products, combos, categories] = await Promise.all([
                    searchProducts(searchQuery, sortOptions, skip, limit),
                    searchCombos(query, sortOptions, 0, combosPageSize),
                    searchCategories(query, skip, limit)
                ]);
                results = { products, combos, categories };
                facets = await getProductFacets(searchQuery);
                break;
        }

        // Get total counts
        const totalCounts = await getTotalCounts(type, searchQuery, query);

        res.status(200).json({
            success: true,
            results,
            facets,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(totalCounts.total / limit),
                totalResults: totalCounts.total,
                limit: Number(limit)
            },
            filters: {
                appliedFilters: {
                    type,
                    pType: pType || undefined,
                    category,
                    minPrice,
                    maxPrice,
                    brand,
                    inStock,
                    sort
                }
            }
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error performing search',
            error: error.message
        });
    }
};

// Enhanced product search with ratings and stock info
async function searchProducts(searchQuery, sortOptions, skip, limit) {
    const products = await productModel.find(searchQuery)
        .populate('pCategory', 'cName')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);

    return products.map(product => {
        const totalRatings = product.pRatingsReviews.length;
        const avgRating = totalRatings > 0
            ? product.pRatingsReviews.reduce((sum, item) => sum + Number(item.rating), 0) / totalRatings
            : 0;

        return {
            ...product.toObject(),
            averageRating: Number(avgRating.toFixed(1)),
            totalReviews: totalRatings,
            inStock: product.pStock > 0
        };
    });
}

// Get faceted search results
async function getProductFacets(searchQuery) {
    const facets = await productModel.aggregate([
        { $match: searchQuery },
        {
            $facet: {
                brands: [
                    { $group: { _id: "$pBrand", count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ],
                categories: [
                    { $group: { _id: "$pCategory", count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ],
                priceRanges: [
                    {
                        $bucket: {
                            groupBy: "$pPrice",
                            boundaries: [0, 100, 500, 1000, 5000, Infinity],
                            default: "Other",
                            output: { count: { $sum: 1 } }
                        }
                    }
                ]
            }
        }
    ]);

    return facets[0];
}

// Helper function to search combos
async function searchCombos(query, sortOptions, skip, limit) {
    const searchQuery = query ? {
        $or: [
            { ccName: { $regex: query, $options: 'i' } },
            { ccDescription: { $regex: query, $options: 'i' } }
        ]
    } : {};

    return await comboModel.find(searchQuery)
        .populate('ccProducts')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);
}

// Helper function to search categories
async function searchCategories(query, skip, limit) {
    const searchQuery = query ? {
        $or: [
            { cName: { $regex: query, $options: 'i' } },
            { cDescription: { $regex: query, $options: 'i' } }
        ]
    } : {};

    return await categoryModel.find(searchQuery)
        .skip(skip)
        .limit(limit);
}

// Helper function to get total counts
async function getTotalCounts(type, searchQuery, query) {
    let counts = {
        products: 0,
        combos: 0,
        categories: 0,
        total: 0
    };

    switch (type.toLowerCase()) {
        case 'products':
            counts.products = await productModel.countDocuments(searchQuery);
            counts.total = counts.products;
            break;

        case 'combos':
            const comboQuery = query ? {
                $or: [
                    { ccName: { $regex: query, $options: 'i' } },
                    { ccDescription: { $regex: query, $options: 'i' } }
                ]
            } : {};
            counts.combos = await comboModel.countDocuments(comboQuery);
            counts.total = counts.combos;
            break;

        case 'categories':
            const categoryQuery = query ? {
                $or: [
                    { cName: { $regex: query, $options: 'i' } },
                    { cDescription: { $regex: query, $options: 'i' } }
                ]
            } : {};
            counts.categories = await categoryModel.countDocuments(categoryQuery);
            counts.total = counts.categories;
            break;

        case 'all':
        default:
            counts.products = await productModel.countDocuments(searchQuery);
            counts.combos = await comboModel.countDocuments({
                $or: [
                    { ccName: { $regex: query || '', $options: 'i' } },
                    { ccDescription: { $regex: query || '', $options: 'i' } }
                ]
            });
            counts.categories = await categoryModel.countDocuments({
                $or: [
                    { cName: { $regex: query || '', $options: 'i' } },
                    { cDescription: { $regex: query || '', $options: 'i' } }
                ]
            });
            counts.total = counts.products + counts.combos + counts.categories;
            break;
    }

    return counts;
}

// Enhanced autocomplete suggestions
export const getSearchSuggestions = async (req, res) => {
    try {
        const { query, limit = 5 } = req.query;

        if (!query || query.length < 2) {
            return res.status(200).json({
                success: true,
                suggestions: []
            });
        }

        const [products, combo, brands, categories] = await Promise.all([
            productModel.find({
                pName: { $regex: query, $options: 'i' },
                // pType: "product",
                pStatus: "active"
            })
                .select('pName pCategory pBrand pPrice pPreviousPrice pOffer pImage')
                .limit(limit),
            comboModel.find({
                ccName: { $regex: query, $options: 'i' },
                ccStatus: "active"
            })
                .select('ccName ccCategory ccBrand ccPrice ccImage')
                .limit(limit),
            productModel.distinct('pBrand', {
                pBrand: { $regex: query, $options: 'i' }
            }),

            categoryModel.find({
                cName: { $regex: query, $options: 'i' }
            })
                .select('cName')
                .limit(3)
        ]);

        const suggestions = {
            products: products.map(p => ({
                type: 'product',
                id: p._id,
                name: p.pName,
                category: p.pCategory,
                brand: p.pBrand,
                price: p.pPrice,
                previousPrice: p.pPreviousPrice,
                offer: p.pOffer,
                image: p.pImage[0]
            })),
            combo: combo.map(p => ({
                type: 'combo',
                id: p._id,
                name: p.ccName,
                category: p.ccCategory,
                brand: p.ccBrand,
                price: p.ccPrice,
                image: p.ccImage
            })),
            brands: brands.map(b => ({
                type: 'brand',
                name: b
            })),
            categories: categories.map(c => ({
                type: 'category',
                name: c.cName
            }))
        };

        res.status(200).json({
            success: true,
            suggestions
        });

    } catch (error) {
        console.error('Suggestion error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting suggestions',
            error: error.message
        });
    }
};