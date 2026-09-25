import mongoose from "mongoose";
import "./Product.js";  // Import Product model to ensure it's registered

const comboSchema = new mongoose.Schema({
    ccName: {
        type: String,
        required: true,
    },
    ccDescription: {
        type: String,
        required: true,
    },
    ccImage: {
        type: String,
        required: true,
    },
    ccPrice: {
        type: Number,
        required: true,
    },
    ccOffer: {
        type: Number,
        default: 0,
    },
    ccQuantity: {
        type: Number,
        required: true,
    },
    ccStatus: {
        type: String,
        required: true,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    ccProducts: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            default: 1
        },
        variant: {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'productvariants',
                required: false
            },
            size: {
                type: String,
                required: true
            },
            type: {
                type: String,
                required: true,
                enum: ['size', 'color', 'weight']
            },
            price: {
                type: Number,
                required: false
            },
            quantity: {
                type: Number,
                required: false,
                default: 1
            }
        }
    }],
}, { timestamps: true });

export const comboModel = mongoose.model("combos", comboSchema);
export default comboModel;
