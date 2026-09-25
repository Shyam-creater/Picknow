import mongoose from 'mongoose';

const blogsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    metaKeywords: {
        type: String,
        required: false
    },
    metaTitle: {
        type: String,
        required: false
    },
    metaDescription: {
        type: String,
        required: false
    },

    canonicalUrl: {
        type: String,
        required: true
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const Blogs = mongoose.model('blogs', blogsSchema);