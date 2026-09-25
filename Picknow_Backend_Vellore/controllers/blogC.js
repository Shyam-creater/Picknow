import { Blogs } from "../models/blogs.js";

import { uploadToCloudinary } from "../middleware/brandMulter.js";
 
//Create a new blog
export const createBlog = async (req, res) => {
    try {
        const { title, description, image, canonicalUrl, metaKeywords, metaTitle, metaDescription } = req.body;
        let imageUrl = null;
        if (req.file) {
            imageUrl = await uploadToCloudinary(req.file);
        }
        const blog = new Blogs({ title, description, image: imageUrl, canonicalUrl, metaKeywords, metaTitle, metaDescription });
        await blog.save();
        res.status(201).json({ message: "Blog created successfully", blog });
  } catch (error) {
    res.status(500).json({ message: "Error creating blog", error: error.message });
  }
};

//Get all blogs
export const getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blogs.find();
        res.status(200).json({ blogs });
    } catch (error) {
        res.status(500).json({ message: "Error getting blogs", error: error.message });
    }
};

//Get a blog by id
export const getBlogById = async (req, res) => {
    try {
        const blog = await Blogs.findById(req.params.id);
        res.status(200).json({ blog });
    } catch (error) {
        res.status(500).json({ message: "Error getting blog", error: error.message });
    }
};

//Update a blog
export const updateBlog = async (req, res) => {
    try {
        const { title, description, canonicalUrl, metaKeywords, metaTitle, metaDescription } = req.body;
        
        // Find the blog first
        const blog = await Blogs.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        // Update text fields
        if (title) blog.title = title;
        if (description) blog.description = description;
        if (canonicalUrl) blog.canonicalUrl = canonicalUrl;
        if (metaKeywords) blog.metaKeywords = metaKeywords;
        if (metaTitle) blog.metaTitle = metaTitle;
        if (metaDescription) blog.metaDescription = metaDescription;    
        // Handle image upload - only update if a new image is provided
        if (req.file) {
            const imageUrl = await uploadToCloudinary(req.file);
            blog.image = imageUrl;
        }

        await blog.save();
        res.status(200).json({ message: "Blog updated successfully", blog });
    } catch (error) {
        res.status(500).json({ message: "Error updating blog", error: error.message });
    }
};
//Get a blog by canonical url
export const getBlogByCanonicalUrl = async (req, res) => {              
    try {
        const blog = await Blogs.findOne({ canonicalUrl: req.params.canonicalUrl });
        res.status(200).json({ blog });
    } catch (error) {
        res.status(500).json({ message: "Error getting blog", error: error.message });
    }
};

//Get a blog by title
export const getBlogByTitle = async (req, res) => {
    try {
        const blog = await Blogs.findOne({ title: req.params.title });  
        res.status(200).json({ blog });
    } catch (error) {
        res.status(500).json({ message: "Error getting blog", error: error.message });
    }
};

//Delete a blog
export const deleteBlog = async (req, res) => {
    try {
        await Blogs.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Blog deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting blog", error: error.message });
    }
};