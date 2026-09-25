import express from 'express';
import {upload} from '../middleware/brandMulter.js';
import { createBlog, getAllBlogs, getBlogById, updateBlog , deleteBlog, getBlogByCanonicalUrl} from '../controllers/blogC.js';
import { isAdminAuth, isAdmin } from "../middelware/isAdminAuth.js";

const router = express.Router();

router.post ('/create', isAdminAuth, isAdmin, upload.single("image"), createBlog);
router.get ('/all', getAllBlogs);
router.get ('/:id', getBlogById);
router.put ('/update/:id', isAdminAuth, isAdmin, upload.single("image"), updateBlog);
router.delete ('/delete/:id', isAdminAuth, isAdmin, deleteBlog);
router.get ('/blog/:canonicalUrl', getBlogByCanonicalUrl);

export default router;