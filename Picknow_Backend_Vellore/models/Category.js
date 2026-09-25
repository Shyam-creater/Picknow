import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    cName: {
        type: String,
        required: true,
    },
    cDescription: {
        type: String,
        // required: true,
    },
    cImage: {
        type: Array,
        required: true,
    },
    cStatus: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        default: null
    },
    subCategories: [{
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        },
        image: {
            type: String,
            default: null
        },
        subCategories: [{
            name: {
                type: String,
                required: true,
            },
            description: {
                type: String,
            },
            status: {
                type: String,
                enum: ['active', 'inactive'],
                default: 'active'
            },
            image: {
                type: String,
                default: null
            }
        }]
    }]
}, { timestamps: true });

export const categoryModel = mongoose.model("category", categorySchema);
