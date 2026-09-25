import express from 'express';
import { search, getSearchSuggestions } from '../controllers/searchController.js';

const router = express.Router();

// Search endpoints
router.get('/search', search);
router.get('/search/suggestions', getSearchSuggestions);

export default router;